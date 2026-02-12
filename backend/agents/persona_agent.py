"""
Agent SDK subagent: Persona Generator
Uses Claude Agent SDK to research a city and generate realistic debate personas.
Falls back to default personas if the SDK call fails or times out.
"""

import json
import asyncio
from typing import Optional

from claude_agent_sdk import query, ClaudeAgentOptions, AssistantMessage, ResultMessage, TextBlock

from backend.models.persona import Persona, PersonaRole, PersonaArchetype
from backend.debate.personas import create_default_personas, PersonaFactory, PERSONA_COLORS, RESIDENT_COLORS


PERSONA_GENERATION_PROMPT = """You are an expert in municipal politics and community dynamics. Your task is to create realistic personas for a city council meeting simulation about a data center proposal.

CITY: {city_name}, {state}
PROPOSAL: {proposal_summary}
COMMUNITY CONCERNS: {concerns}

First, use the research_city tool to learn about this city's demographics, economy, and infrastructure. Then create the following personas:

1. A MODERATOR (city council chairperson) - neutral, procedural
2. A PETITIONER (data center company representative) - professional, data-driven
3. Three RESIDENTS with DIFFERENT concerns and DIFFERENT personalities:
   - One CONCERNED PARENT type (worried about children/schools/safety)
   - One ENVIRONMENTAL ACTIVIST type (worried about water/power/environment)
   - One PROPERTY OWNER type (worried about home values/noise/neighborhood)

For each persona, provide a JSON object with these fields:
- id: unique string id (e.g., "moderator", "petitioner", "resident-1")
- name: realistic full name for someone in {city_name}
- role: "moderator", "petitioner", or "resident"
- archetype: null for moderator/petitioner, or "concerned_parent", "environmental_activist", "property_owner" for residents
- age: realistic age
- occupation: relevant to their role
- background: 2-3 sentences about who they are, referencing local details
- speaking_style: how they talk at meetings
- primary_concern: their #1 concern (specific to this proposal)
- secondary_concerns: list of 1-2 additional concerns
- intensity: 1-10 how strongly they feel

Return ONLY a JSON array of 5 persona objects. No other text.

IMPORTANT:
- Make names and backgrounds PLAUSIBLE for {city_name}, {state}
- Reference specific local features (road names, schools, neighborhoods) when possible
- Each resident must have a UNIQUE primary concern
- Vary speaking styles dramatically
"""


async def generate_personas_with_sdk(
    city_name: str,
    state: str,
    proposal_summary: str,
    concerns: list[str],
    mcp_server_config: dict,
    timeout_seconds: int = 60,
) -> Optional[list[Persona]]:
    """
    Use the Agent SDK to generate realistic debate personas.

    Returns None if the SDK call fails, allowing caller to fall back to defaults.
    """
    prompt = PERSONA_GENERATION_PROMPT.format(
        city_name=city_name,
        state=state,
        proposal_summary=proposal_summary,
        concerns=", ".join(concerns) if concerns else "general community impact",
    )

    try:
        result_text = ""

        async def _run_query():
            nonlocal result_text
            async for message in query(
                prompt=prompt,
                options=ClaudeAgentOptions(
                    model="claude-opus-4-6-20250610",
                    max_turns=10,
                    max_budget_usd=1.00,
                    permission_mode="bypassPermissions",
                    mcp_servers=mcp_server_config,
                    allowed_tools=[
                        "mcp__council-tools__research_city",
                        "WebSearch",
                        "WebFetch",
                    ],
                ),
            ):
                if isinstance(message, (AssistantMessage, ResultMessage)):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            result_text += block.text

        await asyncio.wait_for(_run_query(), timeout=timeout_seconds)

        # Parse the JSON response
        return _parse_persona_response(result_text, city_name, state, proposal_summary)

    except asyncio.TimeoutError:
        print(f"[WARN] Persona generation timed out after {timeout_seconds}s")
        return None
    except Exception as e:
        print(f"[WARN] Persona generation failed: {e}")
        return None


def _parse_persona_response(
    text: str, city_name: str, state: str, proposal_summary: str
) -> Optional[list[Persona]]:
    """Parse the SDK response into Persona objects."""
    try:
        # Find JSON array in the response
        start = text.find("[")
        end = text.rfind("]") + 1
        if start == -1 or end == 0:
            return None

        json_str = text[start:end]
        personas_data = json.loads(json_str)

        if not isinstance(personas_data, list) or len(personas_data) < 3:
            return None

        personas = []
        factory = PersonaFactory()
        resident_idx = 0

        for i, data in enumerate(personas_data):
            role_str = data.get("role", "resident")
            role = PersonaRole(role_str) if role_str in [r.value for r in PersonaRole] else PersonaRole.RESIDENT

            archetype = None
            if data.get("archetype"):
                try:
                    archetype = PersonaArchetype(data["archetype"])
                except ValueError:
                    pass

            # Assign color
            if role == PersonaRole.MODERATOR:
                color = PERSONA_COLORS[PersonaRole.MODERATOR]
            elif role == PersonaRole.PETITIONER:
                color = PERSONA_COLORS[PersonaRole.PETITIONER]
            elif role == PersonaRole.COUNCIL_MEMBER:
                color = PERSONA_COLORS[PersonaRole.COUNCIL_MEMBER]
            else:
                color = RESIDENT_COLORS[resident_idx % len(RESIDENT_COLORS)]
                resident_idx += 1

            persona = Persona(
                id=data.get("id", f"persona-{i}"),
                name=data.get("name", f"Persona {i}"),
                role=role,
                archetype=archetype,
                age=data.get("age"),
                occupation=data.get("occupation", ""),
                background=data.get("background", ""),
                speaking_style=data.get("speaking_style", ""),
                primary_concern=data.get("primary_concern", ""),
                secondary_concerns=data.get("secondary_concerns", []),
                intensity=data.get("intensity", 6),
                color=color,
            )

            # Build system prompt
            persona.system_prompt = factory.build_system_prompt(
                persona,
                f"{city_name}, {state}" if state else city_name,
                proposal_summary,
            )

            personas.append(persona)

        return personas if len(personas) >= 3 else None

    except (json.JSONDecodeError, KeyError, TypeError) as e:
        print(f"[WARN] Failed to parse persona JSON: {e}")
        return None
