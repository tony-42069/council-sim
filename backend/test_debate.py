"""
CLI test runner for the debate engine.
Runs a full debate simulation in the terminal with streaming output.

Usage:
    cd backend
    python test_debate.py
"""

import asyncio
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import anthropic
from dotenv import load_dotenv

from backend.models.simulation import SimulationInput, SimulationState
from backend.models.persona import Persona, PersonaRole
from backend.models.debate import DebatePhase
from backend.debate.personas import create_default_personas, PersonaFactory, PERSONA_COLORS
from backend.debate.engine import DebateEngine

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

# ANSI colors for terminal output
COLORS = {
    "moderator": "\033[94m",     # Blue
    "petitioner": "\033[92m",    # Green
    "resident": "\033[91m",      # Red
    "council_member": "\033[96m", # Cyan
    "phase": "\033[93m",         # Yellow
    "reset": "\033[0m",
}

RESIDENT_COLORS = ["\033[91m", "\033[93m", "\033[95m", "\033[35m"]  # Red, Yellow, Magenta, Dark Magenta
resident_color_map: dict[str, str] = {}
resident_color_idx = 0


def get_persona_color(persona_id: str, role: str) -> str:
    """Get ANSI color for a persona."""
    global resident_color_idx
    if role == "resident":
        if persona_id not in resident_color_map:
            resident_color_map[persona_id] = RESIDENT_COLORS[resident_color_idx % len(RESIDENT_COLORS)]
            resident_color_idx += 1
        return resident_color_map[persona_id]
    return COLORS.get(role, COLORS["reset"])


async def run_test_debate():
    """Run a full debate simulation with the Novi, Michigan test scenario."""

    # Check for API key
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not set. Create a .env file in the project root.")
        sys.exit(1)

    print(f"\n{COLORS['phase']}{'='*70}")
    print("  COUNCIL SIMULATOR - Test Debate")
    print(f"  Novi, Michigan - Data Center Public Hearing")
    print(f"{'='*70}{COLORS['reset']}\n")

    # Create test scenario
    sim_input = SimulationInput(
        city_name="Novi",
        state="MI",
        company_name="Great Lakes Data Systems",
        proposal_details=(
            "A proposed 150,000 square foot data center on 12 acres near Wixom Road. "
            "The facility would include a 30MW power capacity, closed-loop water cooling, "
            "and generate approximately $3.2 million in annual property tax revenue. "
            "The project would create 45 permanent jobs and 800 construction jobs over "
            "an 18-month build period."
        ),
        concerns=["water usage", "power grid strain", "property values", "traffic"],
    )

    simulation = SimulationState(input=sim_input)

    # Create default personas (including council member for Q&A)
    personas = create_default_personas(
        city_name=sim_input.city_name,
        proposal_details=sim_input.proposal_details,
        company_name=sim_input.company_name,
    )

    # Add a council member persona
    factory = PersonaFactory()
    council_member = Persona(
        id="council-member",
        name="Council Member Patricia Hayes",
        role=PersonaRole.COUNCIL_MEMBER,
        age=52,
        occupation="City Council Member, District 3",
        background="Former small business owner who ran for council on a platform of smart growth. Known for asking tough questions of developers. Has voted both for and against development projects.",
        speaking_style="Direct and probing. Asks specific questions and pushes for concrete answers.",
        primary_concern="Ensuring any development benefits the community and doesn't burden existing residents",
        color=PERSONA_COLORS[PersonaRole.COUNCIL_MEMBER],
    )
    council_member.system_prompt = factory.build_system_prompt(
        council_member, sim_input.city_name, sim_input.proposal_details, sim_input.company_name
    )
    personas.append(council_member)

    # Create Anthropic client
    client = anthropic.AsyncAnthropic(api_key=api_key)

    # Define callbacks
    async def on_phase_change(phase: DebatePhase, description: str):
        print(f"\n{COLORS['phase']}{'─'*60}")
        print(f"  Phase: {phase.value.upper().replace('_', ' ')} — {description}")
        print(f"{'─'*60}{COLORS['reset']}\n")

    async def on_speaking_start(turn_id: str, persona: Persona, phase: DebatePhase):
        color = get_persona_color(persona.id, persona.role.value)
        print(f"{color}[{persona.name} ({persona.role.value})]:{COLORS['reset']} ", end="", flush=True)

    async def on_token(turn_id: str, token: str, persona_id: str):
        print(token, end="", flush=True)

    async def on_speaking_end(turn_id: str, persona_id: str, full_text: str):
        print("\n")

    # Create and run the engine
    engine = DebateEngine(
        client=client,
        simulation=simulation,
        personas=personas,
        on_phase_change=on_phase_change,
        on_speaking_start=on_speaking_start,
        on_token=on_token,
        on_speaking_end=on_speaking_end,
    )

    print("Starting debate simulation...\n")

    try:
        turns = await engine.run_debate()
        print(f"\n{COLORS['phase']}{'='*70}")
        print(f"  DEBATE COMPLETE — {len(turns)} turns across 5 phases")
        print(f"{'='*70}{COLORS['reset']}\n")
    except Exception as e:
        print(f"\n\nERROR: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(run_test_debate())
