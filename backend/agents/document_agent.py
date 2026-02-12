"""
Agent SDK subagent: Document Analyzer
Processes uploaded proposal text and extracts structured data.
"""

import json
import asyncio
from typing import Optional

from claude_agent_sdk import query, ClaudeAgentOptions, AssistantMessage, ResultMessage, TextBlock


DOCUMENT_ANALYSIS_PROMPT = """Analyze this data center proposal document and extract key information.

Use the parse_proposal_document tool to structure the data, then provide a comprehensive summary.

DOCUMENT TEXT:
{document_text}

After using the tool, return a JSON object with these fields:
{{
  "facility_size_sqft": number or null,
  "power_capacity_mw": number or null,
  "water_usage_gallons_per_day": number or null,
  "location": "string or null",
  "permanent_jobs": number or null,
  "construction_jobs": number or null,
  "annual_tax_revenue": number or null,
  "capital_investment": number or null,
  "cooling_technology": "string or null",
  "water_recycling_pct": number or null,
  "noise_mitigation": "string or null",
  "renewable_energy": "string or null",
  "community_commitments": ["list of commitments"],
  "construction_timeline": "string or null",
  "key_facts": ["list of important facts for debate"],
  "summary": "2-3 sentence executive summary"
}}

Return ONLY the JSON object. No other text.
"""


async def analyze_document_with_sdk(
    document_text: str,
    mcp_server_config: dict,
    timeout_seconds: int = 45,
) -> Optional[dict]:
    """
    Use the Agent SDK to analyze a proposal document.

    Returns structured data dict, or None on failure.
    """
    if not document_text or len(document_text.strip()) < 50:
        return None

    prompt = DOCUMENT_ANALYSIS_PROMPT.format(
        document_text=document_text[:20000]  # Cap for context window
    )

    try:
        result_text = ""

        async def _run_query():
            nonlocal result_text
            async for message in query(
                prompt=prompt,
                options=ClaudeAgentOptions(
                    model="claude-sonnet-4-5-20250929",  # Sonnet for speed
                    max_turns=5,
                    max_budget_usd=0.50,
                    permission_mode="bypassPermissions",
                    mcp_servers=mcp_server_config,
                    allowed_tools=[
                        "mcp__council-tools__parse_proposal_document",
                    ],
                ),
            ):
                if isinstance(message, (AssistantMessage, ResultMessage)):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            result_text += block.text

        await asyncio.wait_for(_run_query(), timeout=timeout_seconds)

        # Parse JSON response
        return _parse_document_response(result_text)

    except asyncio.TimeoutError:
        print(f"[WARN] Document analysis timed out after {timeout_seconds}s")
        return None
    except Exception as e:
        print(f"[WARN] Document analysis failed: {e}")
        return None


def _parse_document_response(text: str) -> Optional[dict]:
    """Parse the SDK response into a structured dict."""
    try:
        start = text.find("{")
        end = text.rfind("}") + 1
        if start == -1 or end == 0:
            return None

        json_str = text[start:end]
        data = json.loads(json_str)
        return data if isinstance(data, dict) else None

    except (json.JSONDecodeError, TypeError):
        return None
