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
    """Direct Anthropic API fallback when Agent SDK analysis fails. Always uses Opus."""
    prompt = f"""Analyze this city council debate transcript about a data center proposal.

TRANSCRIPT:
{transcript_text[:15000]}

PROPOSAL:
{proposal_summary[:3000]}

Return ONLY a JSON object with this exact structure:
{{
  "approval_score": <number 0-100>,
  "approval_label": "Likely Denied" | "Uncertain" | "Likely Approved" | "Strong Approval",
  "approval_reasoning": "2-3 sentences explaining the score",
  "key_arguments": [
    {{"side": "opposition" or "petitioner", "argument": "specific argument", "strength": "strong" | "moderate" | "weak", "relevant_data": "data cited"}}
  ],
  "recommended_rebuttals": [
    {{"concern": "specific concern", "rebuttal": "recommended response", "supporting_data": "stats to cite", "effectiveness": "high" | "moderate" | "low"}}
  ],
  "strongest_opposition_point": "single strongest resident argument",
  "weakest_opposition_point": "weakest resident argument",
  "overall_assessment": "3-4 sentences of strategic advice"
}}

Include 3-5 key arguments from each side and 3-5 rebuttals. Be specific, cite moments from the transcript."""

    try:
        model = settings.analysis_model
        print(f"[INFO] Fallback analysis using model: {model}")
        response = await client.messages.create(
            model=model,
            max_tokens=3000,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text
        start = text.find("{")
        end = text.rfind("}") + 1
        if start == -1 or end == 0:
            return None

        data = json.loads(text[start:end])

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

        return AnalysisResult(
            approval_score=float(data.get("approval_score", 50)),
            approval_label=data.get("approval_label", "Uncertain"),
            approval_reasoning=data.get("approval_reasoning", ""),
            key_arguments=key_arguments,
            recommended_rebuttals=rebuttals,
            strongest_opposition_point=data.get("strongest_opposition_point", ""),
            weakest_opposition_point=data.get("weakest_opposition_point", ""),
            overall_assessment=data.get("overall_assessment", ""),
        )
    except Exception as e:
        print(f"[ERROR] Fallback analysis failed: {e}")
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

        # --- Phase 0: Document Analysis ---
        await stream.send_status(simulation_id, "Initializing simulation...")

        if state.input.document_text:
            await stream.send_status(simulation_id, "Analyzing uploaded document...")
            doc_data = await orchestrator.process_input(
                status_callback=lambda msg: stream.send_status(simulation_id, msg),
            )
            if doc_data:
                await stream.send_status(simulation_id, "Document analysis complete")

        # --- Phase 1.5: Community Research (time-boxed, non-blocking) ---
        await stream.send_status(simulation_id, "Researching real community sentiment...")
        try:
            research = await asyncio.wait_for(
                orchestrator.research_community(
                    status_callback=lambda msg: stream.send_status(simulation_id, msg),
                ),
                timeout=50,  # Hard cap at 50s total for research
            )
            if research:
                await stream.send_status(
                    simulation_id,
                    f"Found {len(research.real_quotes)} real community quotes",
                )
        except (asyncio.TimeoutError, Exception) as e:
            print(f"[WARN] Community research failed/timed out (non-fatal): {e}")
            await stream.send_status(simulation_id, "Community research skipped — continuing...")

        # --- Phase 1: Persona Generation ---
        await manager.update_status(simulation_id, SimulationStatus.GENERATING_PERSONAS)
        await stream.send_status(simulation_id, "Generating personas...")

        personas = await orchestrator.generate_personas(
            status_callback=lambda msg: stream.send_status(simulation_id, msg),
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
        await stream.send_status(simulation_id, "Analyzing debate results...")

        transcript_text = engine.get_transcript().get_full_text()
        analysis_result = None

        # Attempt 1: Agent SDK analysis with Opus (90s timeout)
        try:
            analysis_result = await asyncio.wait_for(
                orchestrator.analyze_debate(
                    transcript_text=transcript_text,
                    status_callback=lambda msg: stream.send_status(simulation_id, msg),
                ),
                timeout=90,
            )
        except (asyncio.TimeoutError, Exception) as e:
            print(f"[WARN] Agent SDK analysis failed: {e}")

        # Attempt 2: Direct Opus API fallback (90s timeout)
        if not analysis_result:
            print("[INFO] Trying direct Opus fallback analysis...")
            await stream.send_status(simulation_id, "Finalizing analysis...")
            try:
                analysis_result = await asyncio.wait_for(
                    _fallback_analysis(
                        client, transcript_text, state.input.proposal_details, settings,
                    ),
                    timeout=90,
                )
            except (asyncio.TimeoutError, Exception) as e:
                print(f"[WARN] Opus fallback analysis failed: {e}")

        if analysis_result:
            analysis_dict = analysis_result.model_dump()
            await manager.set_analysis(simulation_id, analysis_dict)
            await stream.send_analysis(simulation_id, analysis_dict)
        else:
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
