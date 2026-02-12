"""
Core debate engine. Orchestrates the 5-phase city council meeting simulation.
Manages turn order, persona selection, context flow, and streaming callbacks.
"""

import uuid
from typing import Callable, Awaitable
import anthropic

from backend.models.simulation import SimulationState
from backend.models.persona import Persona, PersonaRole
from backend.models.debate import DebateTurn, DebatePhase
from backend.debate.transcript import Transcript
from backend.debate.turns import stream_debate_turn


class DebateEngine:
    """
    Manages the full lifecycle of a city council debate simulation.

    Phases:
        1. Opening: Moderator opens, petitioner presents proposal
        2. Public Comment: Residents raise concerns (one turn each)
        3. Rebuttal: Petitioner addresses all concerns
        4. Council Q&A: Council member questions both sides
        5. Deliberation: Summary and advisory vote
    """

    def __init__(
        self,
        client: anthropic.AsyncAnthropic,
        simulation: SimulationState,
        personas: list[Persona],
        on_phase_change: Callable[[DebatePhase, str], Awaitable[None]],
        on_speaking_start: Callable[[str, Persona, DebatePhase], Awaitable[None]],
        on_token: Callable[[str, str, str], Awaitable[None]],  # turn_id, token, persona_id
        on_speaking_end: Callable[[str, str, str], Awaitable[None]],  # turn_id, persona_id, full_text
    ):
        self.client = client
        self.simulation = simulation
        self.personas = {p.id: p for p in personas}
        self.personas_list = personas

        # Callbacks
        self.on_phase_change = on_phase_change
        self.on_speaking_start = on_speaking_start
        self.on_token = on_token
        self.on_speaking_end = on_speaking_end

        # Transcript
        self.transcript = Transcript(
            proposal_summary=simulation.input.proposal_details,
            city_context=f"{simulation.input.city_name}, {simulation.input.state}" if simulation.input.state else simulation.input.city_name,
        )

    def _get_persona_by_role(self, role: PersonaRole) -> Persona | None:
        """Get the first persona with a given role."""
        for p in self.personas_list:
            if p.role == role:
                return p
        return None

    def _get_personas_by_role(self, role: PersonaRole) -> list[Persona]:
        """Get all personas with a given role."""
        return [p for p in self.personas_list if p.role == role]

    async def _run_turn(self, persona: Persona, phase: DebatePhase) -> DebateTurn:
        """Execute a single debate turn for a persona."""
        turn_id = str(uuid.uuid4())

        # Notify: speaking started
        await self.on_speaking_start(turn_id, persona, phase)

        # Build context
        messages, system_prompt = self.transcript.build_context_for_turn(persona, phase)

        # Stream the turn
        async def token_callback(token: str):
            await self.on_token(turn_id, token, persona.id)

        full_text = await stream_debate_turn(
            client=self.client,
            persona=persona,
            messages=messages,
            system_prompt=system_prompt,
            on_token=token_callback,
        )

        # Create turn record
        turn = DebateTurn(
            id=turn_id,
            phase=phase,
            persona_id=persona.id,
            persona_name=persona.name,
            persona_role=persona.role.value,
            content=full_text,
        )

        # Add to transcript
        self.transcript.add_turn(turn)

        # Notify: speaking ended
        await self.on_speaking_end(turn_id, persona.id, full_text)

        return turn

    async def run_debate(self) -> list[DebateTurn]:
        """Execute the full 5-phase debate. Returns all turns."""
        all_turns = []

        # Phase 1: Opening
        turns = await self._run_opening_phase()
        all_turns.extend(turns)

        # Phase 2: Public Comment
        turns = await self._run_public_comment_phase()
        all_turns.extend(turns)

        # Phase 3: Rebuttal
        turns = await self._run_rebuttal_phase()
        all_turns.extend(turns)

        # Phase 4: Council Q&A
        turns = await self._run_council_qa_phase()
        all_turns.extend(turns)

        # Phase 5: Deliberation
        turns = await self._run_deliberation_phase()
        all_turns.extend(turns)

        return all_turns

    async def _run_opening_phase(self) -> list[DebateTurn]:
        """Phase 1: Moderator opens meeting, petitioner presents proposal."""
        phase = DebatePhase.OPENING
        self.transcript.set_phase(phase)
        await self.on_phase_change(phase, "The meeting is called to order")
        turns = []

        # Moderator opens
        moderator = self._get_persona_by_role(PersonaRole.MODERATOR)
        if moderator:
            turn = await self._run_turn(moderator, phase)
            turns.append(turn)

        # Petitioner presents
        petitioner = self._get_persona_by_role(PersonaRole.PETITIONER)
        if petitioner:
            turn = await self._run_turn(petitioner, phase)
            turns.append(turn)

        return turns

    async def _run_public_comment_phase(self) -> list[DebateTurn]:
        """Phase 2: Each resident raises their specific concern."""
        phase = DebatePhase.PUBLIC_COMMENT
        self.transcript.set_phase(phase)
        await self.on_phase_change(phase, "The floor is open for public comment")
        turns = []

        residents = self._get_personas_by_role(PersonaRole.RESIDENT)
        for resident in residents:
            turn = await self._run_turn(resident, phase)
            turns.append(turn)

        return turns

    async def _run_rebuttal_phase(self) -> list[DebateTurn]:
        """Phase 3: Petitioner addresses the concerns raised."""
        phase = DebatePhase.REBUTTAL
        self.transcript.set_phase(phase)
        await self.on_phase_change(phase, "The petitioner may now respond to public comments")
        turns = []

        petitioner = self._get_persona_by_role(PersonaRole.PETITIONER)
        if petitioner:
            turn = await self._run_turn(petitioner, phase)
            turns.append(turn)

        return turns

    async def _run_council_qa_phase(self) -> list[DebateTurn]:
        """Phase 4: Council member asks probing questions."""
        phase = DebatePhase.COUNCIL_QA
        self.transcript.set_phase(phase)
        await self.on_phase_change(phase, "Council members may now ask questions")
        turns = []

        council = self._get_persona_by_role(PersonaRole.COUNCIL_MEMBER)
        petitioner = self._get_persona_by_role(PersonaRole.PETITIONER)

        if council:
            # Council asks questions
            turn = await self._run_turn(council, phase)
            turns.append(turn)

            # Petitioner responds
            if petitioner:
                turn = await self._run_turn(petitioner, phase)
                turns.append(turn)

            # Council follow-up
            turn = await self._run_turn(council, phase)
            turns.append(turn)

            # Petitioner final response
            if petitioner:
                turn = await self._run_turn(petitioner, phase)
                turns.append(turn)

        return turns

    async def _run_deliberation_phase(self) -> list[DebateTurn]:
        """Phase 5: Summary and advisory vote."""
        phase = DebatePhase.DELIBERATION
        self.transcript.set_phase(phase)
        await self.on_phase_change(phase, "The council will now deliberate")
        turns = []

        # Moderator summarizes
        moderator = self._get_persona_by_role(PersonaRole.MODERATOR)
        if moderator:
            turn = await self._run_turn(moderator, phase)
            turns.append(turn)

        # Council member gives assessment and vote
        council = self._get_persona_by_role(PersonaRole.COUNCIL_MEMBER)
        if council:
            turn = await self._run_turn(council, phase)
            turns.append(turn)

        return turns

    def get_transcript(self) -> Transcript:
        """Get the full transcript object."""
        return self.transcript
