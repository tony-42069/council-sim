"""
Agent SDK Orchestrator.
Coordinates all 3 subagents (persona generator, document analyzer, debate analyst)
across the simulation lifecycle. Creates the shared MCP server with custom tools.
"""

from typing import Optional

from claude_agent_sdk import create_sdk_mcp_server

from backend.models.simulation import SimulationInput
from backend.models.persona import Persona
from backend.models.analysis import AnalysisResult
from backend.debate.personas import create_default_personas, PersonaFactory, PERSONA_COLORS
from backend.agents.tools.city_research import research_city_tool
from backend.agents.tools.document_parser import parse_proposal_document_tool
from backend.agents.tools.scoring import compute_approval_score_tool
from backend.agents.persona_agent import generate_personas_with_sdk
from backend.agents.document_agent import analyze_document_with_sdk
from backend.agents.analysis_agent import analyze_debate_with_sdk


class SimulationOrchestrator:
    """
    Coordinates Agent SDK subagents across the simulation lifecycle.

    Three phases:
    1. process_input() — Analyzes documents and researches city context
    2. generate_personas() — Creates realistic debate personas
    3. analyze_debate() — Post-debate analysis with scoring and rebuttals

    Falls back to non-SDK alternatives if any subagent fails.
    """

    def __init__(self, simulation_input: SimulationInput):
        self.input = simulation_input
        self._mcp_server = self._create_mcp_server()

    def _create_mcp_server(self) -> dict:
        """Create the shared MCP server with all custom tools."""
        server = create_sdk_mcp_server(
            name="council-tools",
            version="1.0.0",
            tools=[
                research_city_tool,
                parse_proposal_document_tool,
                compute_approval_score_tool,
            ],
        )
        return {"council-tools": server}

    async def process_input(self, status_callback=None) -> Optional[dict]:
        """
        Phase 1: Analyze uploaded documents and extract structured data.
        Returns extracted proposal data dict, or None if no document provided.
        """
        if not self.input.document_text:
            return None

        if status_callback:
            await status_callback("Analyzing uploaded document...")

        result = await analyze_document_with_sdk(
            document_text=self.input.document_text,
            mcp_server_config=self._mcp_server,
        )

        if result and status_callback:
            await status_callback("Document analysis complete")

        return result

    async def generate_personas(self, status_callback=None) -> list[Persona]:
        """
        Phase 2: Generate realistic debate personas.
        Falls back to default personas if SDK generation fails.
        """
        if status_callback:
            await status_callback("Researching city and generating personas...")

        city = self.input.city_name
        state = self.input.state
        proposal = self.input.proposal_details
        concerns = self.input.concerns
        company = self.input.company_name

        # Try Agent SDK generation
        personas = await generate_personas_with_sdk(
            city_name=city,
            state=state,
            proposal_summary=proposal,
            concerns=concerns,
            mcp_server_config=self._mcp_server,
        )

        if personas:
            # Ensure we have a council member
            has_council = any(p.role.value == "council_member" for p in personas)
            if not has_council:
                personas.append(self._create_default_council_member(city, state, proposal, company))

            if status_callback:
                await status_callback(f"Generated {len(personas)} personas")
            return personas

        # Fallback to default personas
        print("[INFO] Using default personas (SDK generation unavailable)")
        if status_callback:
            await status_callback("Using default personas")

        defaults = create_default_personas(city, proposal, company)
        defaults.append(self._create_default_council_member(city, state, proposal, company))
        return defaults

    async def analyze_debate(self, transcript_text: str, status_callback=None) -> Optional[AnalysisResult]:
        """
        Phase 3: Analyze the completed debate transcript.
        Returns AnalysisResult or None if analysis fails.
        """
        if status_callback:
            await status_callback("Analyzing debate transcript...")

        result = await analyze_debate_with_sdk(
            transcript_text=transcript_text,
            proposal_summary=self.input.proposal_details,
            mcp_server_config=self._mcp_server,
        )

        if result and status_callback:
            await status_callback("Analysis complete")

        return result

    def _create_default_council_member(
        self, city_name: str, state: str, proposal: str, company: str
    ) -> Persona:
        """Create a default council member persona."""
        from backend.models.persona import PersonaRole

        factory = PersonaFactory()
        full_city = f"{city_name}, {state}" if state else city_name

        persona = Persona(
            id="council-member",
            name="Council Member Patricia Hayes",
            role=PersonaRole.COUNCIL_MEMBER,
            age=52,
            occupation="City Council Member, District 3",
            background=(
                f"Former small business owner in {full_city} who ran for council on a "
                "platform of smart growth. Known for asking tough questions of developers. "
                "Has voted both for and against development projects."
            ),
            speaking_style="Direct and probing. Asks specific questions and pushes for concrete answers.",
            primary_concern="Ensuring any development benefits the community and doesn't burden existing residents",
            color=PERSONA_COLORS[PersonaRole.COUNCIL_MEMBER],
        )
        persona.system_prompt = factory.build_system_prompt(persona, full_city, proposal, company)
        return persona
