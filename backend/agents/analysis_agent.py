"""
Agent SDK subagent: Debate Analyst
Analyzes completed debate transcripts and generates scoring, arguments, and rebuttals.
"""

import json
from typing import Optional

from claude_agent_sdk import query, ClaudeAgentOptions, AssistantMessage, ResultMessage, TextBlock

from backend.models.analysis import AnalysisResult, ArgumentSummary, RecommendedRebuttal


DEBATE_ANALYSIS_PROMPT = """You are a political strategy consultant specializing in municipal approval processes for large infrastructure projects, particularly data centers.

Analyze this city council debate transcript and provide a comprehensive assessment.

TRANSCRIPT:
{transcript_text}

PROPOSAL:
{proposal_summary}

INSTRUCTIONS:
1. First, use the compute_approval_score tool to calculate a quantitative score. Rate each factor 0-10 based on the debate:
   - petitioner_argument_quality: How well did the petitioner make their case?
   - opposition_strength: How strong were the resident opposition arguments?
   - council_receptiveness: How receptive was the council member?
   - economic_benefit_clarity: Were economic benefits clearly communicated?
   - environmental_mitigation: Were environmental concerns adequately addressed?
   - community_benefit_offered: Were community benefit commitments strong?

2. Then provide your full analysis as a JSON object:
{{
  "approval_score": <number from tool>,
  "approval_label": "Likely Denied" | "Uncertain" | "Likely Approved" | "Strong Approval",
  "approval_reasoning": "2-3 sentences explaining the score",
  "key_arguments": [
    {{
      "side": "opposition" or "petitioner",
      "argument": "the specific argument made",
      "strength": "strong" | "moderate" | "weak",
      "relevant_data": "any data or facts cited"
    }}
  ],
  "recommended_rebuttals": [
    {{
      "concern": "the specific NIMBY concern",
      "rebuttal": "the recommended response for a real meeting",
      "supporting_data": "specific stats or commitments to cite",
      "effectiveness": "high" | "moderate" | "low"
    }}
  ],
  "strongest_opposition_point": "the single strongest argument from residents",
  "weakest_opposition_point": "the weakest or most easily rebutted resident argument",
  "overall_assessment": "3-4 sentences of strategic advice for the petitioner"
}}

Return ONLY the JSON object after using the scoring tool. No other text.
Be SPECIFIC — cite moments from the transcript. The petitioner should be able to use your recommendations in a REAL city council meeting.
"""


async def analyze_debate_with_sdk(
    transcript_text: str,
    proposal_summary: str,
    mcp_server_config: dict,
) -> Optional[AnalysisResult]:
    """
    Use the Agent SDK to analyze a completed debate transcript.

    Returns an AnalysisResult, or None on failure.
    No hard timeout — let the agent finish its work.
    """
    prompt = DEBATE_ANALYSIS_PROMPT.format(
        transcript_text=transcript_text[:12000],  # Cap for context window
        proposal_summary=proposal_summary,
    )

    try:
        result_text = ""

        async for message in query(
            prompt=prompt,
            options=ClaudeAgentOptions(
                model="claude-opus-4-6",  # Opus for deep analysis
                max_turns=10,
                max_budget_usd=2.00,
                permission_mode="bypassPermissions",
                mcp_servers=mcp_server_config,
                allowed_tools=[
                    "mcp__council-tools__compute_approval_score",
                ],
            ),
        ):
            if isinstance(message, (AssistantMessage, ResultMessage)):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        result_text += block.text

        return _parse_analysis_response(result_text)

    except Exception as e:
        print(f"[WARN] Debate analysis failed: {e}")
        return None


def _parse_analysis_response(text: str) -> Optional[AnalysisResult]:
    """Parse the SDK response into an AnalysisResult."""
    try:
        start = text.find("{")
        end = text.rfind("}") + 1
        if start == -1 or end == 0:
            return None

        json_str = text[start:end]
        data = json.loads(json_str)

        # Build AnalysisResult from parsed data
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

    except (json.JSONDecodeError, TypeError, KeyError) as e:
        print(f"[WARN] Failed to parse analysis JSON: {e}")
        return None
