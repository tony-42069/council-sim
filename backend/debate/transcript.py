"""
Transcript accumulator and context manager for debate turns.
Manages the shared context window that flows between agents during the debate.
"""

from backend.models.debate import DebateTurn, DebatePhase
from backend.models.persona import Persona, PersonaRole


PHASE_DESCRIPTIONS = {
    DebatePhase.OPENING: "Opening Statements",
    DebatePhase.PUBLIC_COMMENT: "Public Comment Period",
    DebatePhase.REBUTTAL: "Petitioner Rebuttal",
    DebatePhase.COUNCIL_QA: "Council Questions & Answers",
    DebatePhase.DELIBERATION: "Deliberation & Vote",
}

# Phase-specific instructions appended to each persona's turn context
PHASE_INSTRUCTIONS = {
    DebatePhase.OPENING: {
        PersonaRole.MODERATOR: "Open the meeting. State the agenda: a public hearing on the proposed data center. Introduce the format: petitioner presentation, public comment, rebuttal, council questions, and deliberation. Be brief and procedural.",
        PersonaRole.PETITIONER: "Present your proposal to the council and residents. Cover: what you're proposing, key benefits (jobs, tax revenue), and your commitment to the community. Be compelling but concise. This is your opening — make it count.",
    },
    DebatePhase.PUBLIC_COMMENT: {
        PersonaRole.RESIDENT: "This is your chance to address the council. Speak your concern clearly and personally. Reference your life in this city. Be specific — vague complaints are easy to dismiss. You have 3-5 sentences.",
    },
    DebatePhase.REBUTTAL: {
        PersonaRole.PETITIONER: "Address the specific concerns raised by the residents. Respond to each person's points with data and concrete commitments. Be empathetic — acknowledge their feelings while providing factual rebuttals. Don't be defensive.",
    },
    DebatePhase.COUNCIL_QA: {
        PersonaRole.COUNCIL_MEMBER: "Ask pointed questions that the residents would want answered. Push for specifics — numbers, timelines, guarantees. Challenge vague promises. You represent all constituents.",
        PersonaRole.PETITIONER: "Answer the council member's questions directly and specifically. If you don't know something, say so. Offer to provide additional documentation or studies.",
    },
    DebatePhase.DELIBERATION: {
        PersonaRole.MODERATOR: "Summarize the key points raised during the hearing. Note the strongest arguments from both sides. Do NOT give your personal opinion — summarize fairly.",
        PersonaRole.COUNCIL_MEMBER: "State your assessment based on what you've heard. What concerns remain unaddressed? What commitments do you want formalized? Give your advisory recommendation — approve, deny, or table with conditions.",
    },
}


class Transcript:
    """
    Accumulates debate turns and builds context for each persona's turn.
    Manages the shared meeting memory across all participants.
    """

    def __init__(self, proposal_summary: str, city_context: str):
        self.proposal_summary = proposal_summary
        self.city_context = city_context
        self.turns: list[DebateTurn] = []
        self.current_phase: DebatePhase = DebatePhase.OPENING

    def add_turn(self, turn: DebateTurn) -> None:
        """Add a completed turn to the transcript."""
        self.turns.append(turn)

    def set_phase(self, phase: DebatePhase) -> None:
        """Update the current phase."""
        self.current_phase = phase

    def build_context_for_turn(self, persona: Persona, phase: DebatePhase) -> tuple[list[dict], str]:
        """
        Build the messages array and system prompt for a persona's next turn.

        Returns:
            (messages, system_prompt) tuple ready for the Anthropic API
        """
        system_prompt = persona.system_prompt

        # Build the meeting context as the user message
        meeting_context = self._build_meeting_context(persona, phase)

        messages = [{"role": "user", "content": meeting_context}]

        return messages, system_prompt

    def _build_meeting_context(self, persona: Persona, phase: DebatePhase) -> str:
        """Build the full meeting context for a turn."""
        parts = []

        # Meeting setup
        parts.append(f"MEETING CONTEXT: Public hearing on a proposed data center in {self.city_context}")
        parts.append(f"PROPOSAL: {self.proposal_summary}")
        parts.append("")

        # What has happened so far
        if self.turns:
            parts.append("WHAT HAS BEEN SAID SO FAR IN THIS MEETING:")
            for turn in self.turns:
                parts.append(f"  {turn.persona_name} ({turn.persona_role}): {self._truncate(turn.content, 300)}")
            parts.append("")
        else:
            parts.append("This is the beginning of the meeting. No one has spoken yet.")
            parts.append("")

        # Current phase context
        parts.append(f"CURRENT PHASE: {PHASE_DESCRIPTIONS.get(phase, phase.value)}")

        # Phase-specific instructions
        role_instructions = PHASE_INSTRUCTIONS.get(phase, {})
        instruction = role_instructions.get(persona.role)
        if instruction:
            parts.append(f"YOUR INSTRUCTIONS: {instruction}")

        parts.append("")
        parts.append(f"Speak now as {persona.name}. Stay in character. Be specific and grounded.")

        return "\n".join(parts)

    def get_full_text(self) -> str:
        """Get the full transcript as formatted text."""
        lines = []
        current_phase = None

        for turn in self.turns:
            if turn.phase != current_phase:
                current_phase = turn.phase
                phase_name = PHASE_DESCRIPTIONS.get(turn.phase, turn.phase.value)
                lines.append(f"\n--- {phase_name} ---\n")

            lines.append(f"{turn.persona_name} ({turn.persona_role}):")
            lines.append(f"  {turn.content}")
            lines.append("")

        return "\n".join(lines)

    def to_markdown(self, city_name: str = "", personas: list[Persona] | None = None) -> str:
        """Export the full transcript as a markdown document."""
        md = []
        md.append("# Council Simulator - Meeting Transcript")
        md.append("")

        if city_name:
            md.append(f"**City:** {city_name}")
        md.append(f"**Proposal:** {self.proposal_summary}")
        md.append("")

        if personas:
            md.append("## Participants")
            for p in personas:
                md.append(f"- **{p.name}** — {p.role.value} ({p.occupation})")
            md.append("")

        md.append("## Transcript")
        md.append(self.get_full_text())

        return "\n".join(md)

    @staticmethod
    def _truncate(text: str, max_length: int) -> str:
        """Truncate text for context window management."""
        if len(text) <= max_length:
            return text
        return text[:max_length - 3] + "..."
