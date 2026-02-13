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
from backend.agents.community_research_agent import research_community_sentiment, CommunityResearchResult


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
        self._community_research: Optional[CommunityResearchResult] = None

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

    async def research_community(self, status_callback=None) -> Optional[CommunityResearchResult]:
        """
        Phase 1.5: Research real community sentiment about the proposal.
        Uses WebSearch to find actual news articles, resident quotes, and local context.
        """
        if status_callback:
            await status_callback("Researching real community sentiment...")

        result = await research_community_sentiment(
            city_name=self.input.city_name,
            state=self.input.state,
            proposal_summary=self.input.proposal_details,
            concerns=self.input.concerns,
            mcp_server_config=self._mcp_server,
        )

        if result:
            self._community_research = result
            if status_callback:
                quote_count = len(result.real_quotes)
                await status_callback(
                    f"Found {quote_count} real community quotes — opposition: {result.opposition_strength}"
                )
        else:
            if status_callback:
                await status_callback("Community research unavailable — using general context")

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

            # Inject community research into persona system prompts
            self._inject_community_research(personas)

            if status_callback:
                await status_callback(f"Generated {len(personas)} personas")
            return personas

        # Fallback to default personas
        print("[INFO] Using default personas (SDK generation unavailable)")
        if status_callback:
            await status_callback("Using default personas")

        defaults = create_default_personas(city, proposal, company)
        defaults.append(self._create_default_council_member(city, state, proposal, company))
        # Inject community research into defaults too
        self._inject_community_research(defaults)
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

    def _inject_community_research(self, personas: list[Persona]) -> None:
        """Inject real community research data into persona system prompts."""
        if not self._community_research:
            return

        research = self._community_research

        # Build context block from real quotes
        quotes_text = ""
        if research.real_quotes:
            opposition_quotes = [q for q in research.real_quotes if q.get("sentiment") == "oppose"]
            support_quotes = [q for q in research.real_quotes if q.get("sentiment") == "support"]

            if opposition_quotes:
                quotes_text += "\n\nREAL RESIDENT QUOTES (from actual community members):\n"
                for q in opposition_quotes[:5]:
                    quotes_text += f'- "{q.get("quote", "")}" — {q.get("source", "local resident")}\n'

            if support_quotes:
                quotes_text += "\nSUPPORTIVE QUOTES:\n"
                for q in support_quotes[:3]:
                    quotes_text += f'- "{q.get("quote", "")}" — {q.get("source", "local resident")}\n'

        facts_text = ""
        if research.notable_facts:
            facts_text = "\n\nVERIFIED LOCAL FACTS:\n"
            for fact in research.notable_facts[:8]:
                facts_text += f"- {fact}\n"

        context_text = ""
        if research.local_context:
            context_text = f"\n\nLOCAL CONTEXT:\n{research.local_context}"

        sentiment_text = ""
        if research.sentiment_summary:
            sentiment_text = f"\n\nCOMMUNITY SENTIMENT: {research.sentiment_summary}"
            sentiment_text += f"\nOpposition strength: {research.opposition_strength}"

        # Inject into each persona's system prompt
        from backend.models.persona import PersonaRole

        for persona in personas:
            if not persona.system_prompt:
                continue

            if persona.role == PersonaRole.RESIDENT:
                # Residents get opposition quotes and local facts
                addendum = "\n\n--- REAL COMMUNITY RESEARCH ---"
                addendum += "Use these real quotes and facts to ground your arguments in reality."
                addendum += " Reference specific local details when possible."
                addendum += " You may paraphrase real resident concerns in your own voice."
                addendum += quotes_text + facts_text + context_text
                persona.system_prompt += addendum

            elif persona.role == PersonaRole.PETITIONER:
                # Petitioner gets sentiment summary to calibrate response
                addendum = "\n\n--- REAL COMMUNITY RESEARCH ---"
                addendum += "Be aware of the actual community mood and address real concerns."
                addendum += sentiment_text + facts_text
                if opposition_quotes := [q for q in research.real_quotes if q.get("sentiment") == "oppose"][:3]:
                    addendum += "\n\nKEY REAL CONCERNS TO ADDRESS:\n"
                    for q in opposition_quotes:
                        addendum += f'- {q.get("concern_category", "general")}: "{q.get("quote", "")}"\n'
                persona.system_prompt += addendum

            elif persona.role == PersonaRole.COUNCIL_MEMBER:
                # Council member gets full picture
                addendum = "\n\n--- REAL COMMUNITY RESEARCH ---"
                addendum += "You are aware of real community sentiment from news and public forums."
                addendum += sentiment_text + facts_text
                persona.system_prompt += addendum

            elif persona.role == PersonaRole.MODERATOR:
                # Moderator gets context only
                if research.local_context:
                    persona.system_prompt += f"\n\nLOCAL CONTEXT: {research.local_context[:500]}"

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
