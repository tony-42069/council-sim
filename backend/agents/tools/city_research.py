"""
Custom MCP tool: City Research
Structures city research queries for the persona generator agent.
"""

from claude_agent_sdk import tool


@tool(
    "research_city",
    "Research a city's demographics, economy, infrastructure, and recent controversies "
    "related to development projects. Returns structured research prompt for the agent "
    "to use with WebSearch.",
    {
        "type": "object",
        "properties": {
            "city_name": {"type": "string", "description": "Name of the city"},
            "state": {"type": "string", "description": "State abbreviation"},
            "focus_areas": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Areas to focus research on",
            },
        },
        "required": ["city_name", "state"],
    },
)
async def research_city_tool(args: dict) -> dict:
    """Structure a city research request."""
    city = args["city_name"]
    state = args["state"]
    focus = args.get("focus_areas", [
        "population and demographics",
        "major employers and economy",
        "water supply infrastructure",
        "power grid capacity",
        "recent development controversies",
        "school districts near potential sites",
    ])

    research_text = f"""Research {city}, {state} for the following:

Key Information Needed:
{chr(10).join(f'- {area}' for area in focus)}

Additional Context:
- Look for any recent data center or large development proposals
- Note any NIMBY opposition or community pushback
- Find specific neighborhood names, roads, and landmarks
- Identify the city council composition if possible

Format findings as structured facts that can be used to create realistic
city council meeting personas."""

    return {
        "content": [{"type": "text", "text": research_text}],
    }
