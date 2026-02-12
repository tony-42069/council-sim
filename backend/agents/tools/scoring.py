"""
Custom MCP tool: Approval Score Calculator
Computes a weighted approval likelihood score from debate factors.
"""

from claude_agent_sdk import tool


@tool(
    "compute_approval_score",
    "Calculate the likelihood of city council approval based on debate factors. "
    "Uses a weighted scoring formula to produce a 0-100 score.",
    {
        "type": "object",
        "properties": {
            "petitioner_argument_quality": {
                "type": "number",
                "minimum": 0,
                "maximum": 10,
                "description": "Quality of petitioner's arguments (0-10)",
            },
            "opposition_strength": {
                "type": "number",
                "minimum": 0,
                "maximum": 10,
                "description": "Strength of opposition arguments (0-10)",
            },
            "council_receptiveness": {
                "type": "number",
                "minimum": 0,
                "maximum": 10,
                "description": "How receptive the council member appeared (0-10)",
            },
            "economic_benefit_clarity": {
                "type": "number",
                "minimum": 0,
                "maximum": 10,
                "description": "How clearly economic benefits were communicated (0-10)",
            },
            "environmental_mitigation": {
                "type": "number",
                "minimum": 0,
                "maximum": 10,
                "description": "Quality of environmental mitigation responses (0-10)",
            },
            "community_benefit_offered": {
                "type": "number",
                "minimum": 0,
                "maximum": 10,
                "description": "Strength of community benefit commitments (0-10)",
            },
        },
        "required": ["petitioner_argument_quality", "opposition_strength"],
    },
)
async def compute_approval_score_tool(args: dict) -> dict:
    """Calculate weighted approval score."""
    weights = {
        "petitioner_argument_quality": 0.25,
        "opposition_strength": -0.20,
        "council_receptiveness": 0.20,
        "economic_benefit_clarity": 0.15,
        "environmental_mitigation": 0.10,
        "community_benefit_offered": 0.10,
    }

    raw_score = 50.0  # baseline
    factors = {}

    for factor, weight in weights.items():
        value = args.get(factor, 5.0)
        factors[factor] = value
        raw_score += (value - 5.0) * weight * 10

    score = max(0.0, min(100.0, raw_score))

    # Determine label
    if score >= 71:
        label = "Likely Approved"
    elif score >= 51:
        label = "Uncertain - Leaning Approve"
    elif score >= 31:
        label = "Uncertain - Leaning Deny"
    else:
        label = "Likely Denied"

    result = (
        f"APPROVAL SCORE: {score:.1f}/100\n"
        f"LABEL: {label}\n\n"
        f"Factor Breakdown:\n"
    )
    for factor, value in factors.items():
        weight = weights[factor]
        impact = (value - 5.0) * weight * 10
        direction = "+" if impact >= 0 else ""
        result += f"  {factor}: {value}/10 (weight: {weight:+.2f}, impact: {direction}{impact:.1f})\n"

    return {
        "content": [{"type": "text", "text": result}],
    }
