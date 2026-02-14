"""
WebSocket endpoint for real-time debate streaming.
Connects client to a simulation and streams debate events.
"""

import json
import asyncio

import anthropic
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.config import get_settings, Settings
from backend.models.simulation import SimulationStatus
from backend.models.persona import Persona
from backend.models.debate import DebatePhase
from backend.models.analysis import AnalysisResult, ArgumentSummary, RecommendedRebuttal
from backend.agents.orchestrator import SimulationOrchestrator
from backend.debate.engine import DebateEngine
from backend.services.simulation_manager import get_simulation_manager
from backend.services.stream_manager import get_stream_manager

router = APIRouter()


async def _fallback_analysis(
    client: anthropic.AsyncAnthropic,
    transcript_text: str,
    proposal_summary: str,
    settings: Settings,
) -> AnalysisResult | None:
    """Direct Anthropic API analysis. Primary method — simple and reliable."""
    # Cap transcript to avoid overwhelming the model
    transcript_capped = transcript_text[:10000]
    proposal_capped = proposal_summary[:2000]

    prompt = f"""You are a political strategy consultant. Analyze this city council debate transcript about a data center proposal.

TRANSCRIPT:
{transcript_capped}

PROPOSAL:
{proposal_capped}

Respond with ONLY a valid JSON object (no markdown, no explanation before or after). Use this exact structure:

{{
  "approval_score": 62,
  "approval_label": "Uncertain",
  "approval_reasoning": "The petitioner made strong economic arguments but failed to adequately address water and environmental concerns raised by residents.",
  "key_arguments": [
    {{"side": "opposition", "argument": "Water consumption threatens local aquifer", "strength": "strong", "relevant_data": "600,000 gallons per day cited"}},
    {{"side": "petitioner", "argument": "Closed-loop cooling recycles 95% of water", "strength": "moderate", "relevant_data": "Industry standard data"}}
  ],
  "recommended_rebuttals": [
    {{"concern": "Water usage impact", "rebuttal": "Commission an independent water study before the next hearing", "supporting_data": "GLWA capacity assessment", "effectiveness": "high"}}
  ],
  "strongest_opposition_point": "No independent environmental impact study has been conducted",
  "weakest_opposition_point": "Speculation about nuclear power without evidence",
  "overall_assessment": "The petitioner should commission independent studies on water and environmental impact before the next hearing. Address specific concerns raised by Dr. Okafor with data rather than promises."
}}

Include 4-6 key_arguments (mix of both sides) and 3-5 recommended_rebuttals. Be specific — reference actual statements from the transcript."""

    try:
        model = settings.analysis_model
        print(f"[INFO] Direct analysis using model: {model}, transcript length: {len(transcript_capped)}")
        response = await client.messages.create(
            model=model,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text
        print(f"[INFO] Analysis response length: {len(text)} chars")

        # Find JSON in response
        start = text.find("{")
        end = text.rfind("}") + 1
        if start == -1 or end == 0:
            print(f"[ERROR] No JSON found in analysis response. First 200 chars: {text[:200]}")
            return None

        json_text = text[start:end]
        data = json.loads(json_text)

        key_arguments = [
            ArgumentSummary(**arg)
            for arg in data.get("key_arguments", [])
            if isinstance(arg, dict)
        ]
        rebuttals = [
            RecommendedRebuttal(**reb)
            for reb in data.get("recommended_rebuttals", [])
            if isinstance(reb, dict)
        ]

        result = AnalysisResult(
            approval_score=float(data.get("approval_score", 50)),
            approval_label=data.get("approval_label", "Uncertain"),
            approval_reasoning=data.get("approval_reasoning", ""),
            key_arguments=key_arguments,
            recommended_rebuttals=rebuttals,
            strongest_opposition_point=data.get("strongest_opposition_point", ""),
            weakest_opposition_point=data.get("weakest_opposition_point", ""),
            overall_assessment=data.get("overall_assessment", ""),
        )
        print(f"[INFO] Analysis parsed successfully: score={result.approval_score}, args={len(key_arguments)}, rebuttals={len(rebuttals)}")
        return result

    except json.JSONDecodeError as e:
        print(f"[ERROR] Analysis JSON parse failed: {e}")
        print(f"[ERROR] Raw text (first 500): {text[:500] if 'text' in dir() else 'N/A'}")
        return None
    except Exception as e:
        print(f"[ERROR] Analysis failed: {type(e).__name__}: {e}")
        return None


async def run_simulation(simulation_id: str):
    """
    Execute the full simulation pipeline as a background task.

    Flow:
    1. Process uploaded documents (Agent SDK)
    2. Generate personas (Agent SDK)
    3. Run the 5-phase debate (Anthropic API streaming)
    4. Analyze the completed debate (Agent SDK)
    5. Broadcast results and completion
    """
    manager = get_simulation_manager()
    stream = get_stream_manager()
    settings = get_settings()

    state = manager.get_simulation(simulation_id)
    if not state:
        return

    try:
        # Create orchestrator for Agent SDK operations
        orchestrator = SimulationOrchestrator(state.input)

        # Helper to send agent-aware status
        async def agent_status(msg: str, agent_id: str = "", agent_state: str = ""):
            payload: dict = {"message": msg}
            if agent_id:
                payload["agent_id"] = agent_id
            if agent_state:
                payload["agent_status"] = agent_state
            await stream.broadcast(simulation_id, "status", payload)

        # --- Phase 0: Document Analysis ---
        await agent_status("Initializing AI agents...", "document_analyzer", "idle")

        if state.input.document_text:
            await agent_status("Analyzing uploaded document...", "document_analyzer", "active")
            doc_data = await orchestrator.process_input(
                status_callback=lambda msg: agent_status(msg, "document_analyzer", "active"),
            )
            if doc_data:
                await agent_status("Document analysis complete — extracted key facts", "document_analyzer", "complete")
            else:
                await agent_status("Document processed", "document_analyzer", "complete")
        else:
            await agent_status("No document uploaded — skipping", "document_analyzer", "complete")

        # --- Phase 1.5: Community Research (time-boxed, non-blocking) ---
        await agent_status("Researching real community sentiment...", "community_research", "active")
        try:
            research = await asyncio.wait_for(
                orchestrator.research_community(
                    status_callback=lambda msg: agent_status(msg, "community_research", "active"),
                ),
                timeout=50,  # Hard cap at 50s total for research
            )
            if research:
                await agent_status(
                    f"Found {len(research.real_quotes)} real community quotes — opposition: {research.opposition_strength}",
                    "community_research", "complete",
                )
            else:
                await agent_status("Community research complete", "community_research", "complete")
        except (asyncio.TimeoutError, Exception) as e:
            print(f"[WARN] Community research failed/timed out (non-fatal): {e}")
            await agent_status("Community research timed out — continuing", "community_research", "complete")

        # --- Phase 1: Persona Generation ---
        await manager.update_status(simulation_id, SimulationStatus.GENERATING_PERSONAS)
        await agent_status("Generating realistic debate personas...", "persona_generator", "active")

        personas = await orchestrator.generate_personas(
            status_callback=lambda msg: agent_status(msg, "persona_generator", "active"),
        )

        # Store personas in state
        persona_dicts = [
            {
                "id": p.id,
                "name": p.name,
                "role": p.role.value,
                "archetype": p.archetype.value if p.archetype else None,
                "age": p.age,
                "occupation": p.occupation,
                "background": p.background,
                "speaking_style": p.speaking_style,
                "primary_concern": p.primary_concern,
                "color": p.color,
            }
            for p in personas
        ]
        await manager.update_personas(simulation_id, persona_dicts)

        # Send persona intros to clients
        for pd in persona_dicts:
            await stream.send_persona_intro(simulation_id, pd)

        await agent_status(f"Generated {len(personas)} personas — ready to debate", "persona_generator", "complete")

        # --- Phase 2: Run Debate ---
        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

        # Create callbacks that bridge DebateEngine → StreamManager
        async def on_phase_change(phase: DebatePhase, description: str):
            await manager.update_status(simulation_id, SimulationStatus(phase.value))
            await stream.send_phase_change(simulation_id, phase.value, description)

        async def on_speaking_start(turn_id: str, persona: Persona, phase: DebatePhase):
            await stream.send_speaking_start(
                simulation_id, turn_id, persona.id, persona.name, phase.value,
            )

        async def on_token(turn_id: str, token: str, persona_id: str):
            await stream.send_token(simulation_id, turn_id, token, persona_id)

        async def on_speaking_end(turn_id: str, persona_id: str, full_text: str):
            await stream.send_speaking_end(simulation_id, turn_id, persona_id, full_text)
            # Also store in simulation state
            await manager.add_transcript_turn(simulation_id, {
                "turn_id": turn_id,
                "persona_id": persona_id,
                "full_text": full_text,
            })

        engine = DebateEngine(
            client=client,
            simulation=state,
            personas=personas,
            on_phase_change=on_phase_change,
            on_speaking_start=on_speaking_start,
            on_token=on_token,
            on_speaking_end=on_speaking_end,
        )

        await engine.run_debate()

        # --- Phase 3: Post-Debate Analysis ---
        await manager.update_status(simulation_id, SimulationStatus.ANALYSIS)
        await agent_status("Debate Analyst is reading the full transcript...", "debate_analyst", "active")

        transcript_text = engine.get_transcript().get_full_text()
        analysis_result = None

        # Send progressive analysis status messages
        async def analysis_progress(msg: str):
            await agent_status(msg, "debate_analyst", "active")

        # Attempt 1: Agent SDK analysis with Opus (primary — showcases multi-agent system)
        await analysis_progress("Agent is scoring arguments and computing approval likelihood...")
        try:
            analysis_result = await orchestrator.analyze_debate(
                transcript_text=transcript_text,
                status_callback=lambda msg: analysis_progress(msg),
            )
            if analysis_result:
                print(f"[INFO] Agent SDK analysis succeeded: score={analysis_result.approval_score}")
            else:
                print("[WARN] Agent SDK analysis returned None")
        except Exception as e:
            print(f"[WARN] Agent SDK analysis failed: {type(e).__name__}: {e}")

        # Attempt 2: Direct Opus API fallback (safety net only)
        if not analysis_result:
            print("[INFO] Falling back to direct Opus API...")
            await analysis_progress("Finalizing analysis...")
            try:
                analysis_result = await _fallback_analysis(
                    client, transcript_text, state.input.proposal_details, settings,
                )
                if analysis_result:
                    print(f"[INFO] Direct Opus fallback succeeded: score={analysis_result.approval_score}")
            except Exception as e:
                print(f"[WARN] Direct Opus fallback failed: {type(e).__name__}: {e}")

        if analysis_result:
            await agent_status("Analysis complete — preparing results", "debate_analyst", "complete")
            analysis_dict = analysis_result.model_dump()
            await manager.set_analysis(simulation_id, analysis_dict)
            await stream.send_analysis(simulation_id, analysis_dict)
        else:
            await agent_status("Analysis could not be completed", "debate_analyst", "complete")
            print("[WARN] All analysis methods failed — no results to show")

        # --- Complete ---
        await manager.update_status(simulation_id, SimulationStatus.COMPLETE)
        await stream.send_complete(simulation_id)

    except Exception as e:
        print(f"[ERROR] Simulation {simulation_id} failed: {e}")
        await manager.set_error(simulation_id, str(e))
        await stream.send_error(simulation_id, f"Simulation failed: {str(e)}")


@router.websocket("/ws/simulation/{simulation_id}")
async def websocket_endpoint(websocket: WebSocket, simulation_id: str):
    """
    WebSocket endpoint for streaming a simulation.

    On first connection, starts the simulation as a background task.
    Subsequent connections join the existing stream.
    """
    manager = get_simulation_manager()
    stream = get_stream_manager()

    print(f"[WS] Connection request for simulation {simulation_id}")

    # Verify simulation exists
    state = manager.get_simulation(simulation_id)
    if not state:
        print(f"[WS] Simulation {simulation_id} not found, rejecting")
        await websocket.close(code=4004, reason="Simulation not found")
        return

    # Connect client
    await stream.connect(simulation_id, websocket)
    print(f"[WS] Client connected to simulation {simulation_id}")

    # Start simulation if not already running
    existing_task = manager.get_task(simulation_id)
    if existing_task is None or existing_task.done():
        print(f"[WS] Starting simulation task for {simulation_id}")
        task = asyncio.create_task(run_simulation(simulation_id))
        manager.register_task(simulation_id, task)

    try:
        # Keep connection alive — listen for client messages (none expected, but keeps WS open)
        while True:
            try:
                await websocket.receive_text()
            except WebSocketDisconnect:
                print(f"[WS] Client disconnected from {simulation_id}")
                break
    finally:
        await stream.disconnect(simulation_id, websocket)
