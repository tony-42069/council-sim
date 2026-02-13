"""
Agent SDK subagent: Community Research Agent
Searches the web for real resident sentiment, news articles, and public comments
about a specific data center proposal or similar projects in the area.
Grounds the simulation in actual community concerns and real quotes.
"""

import json
import asyncio
from typing import Optional
from dataclasses import dataclass, field, asdict

from claude_agent_sdk import query, ClaudeAgentOptions, AssistantMessage, ResultMessage, TextBlock


@dataclass
class CommunityResearchResult:
    """Structured result from community sentiment research."""
    real_quotes: list[dict] = field(default_factory=list)
    # Each: {"source": str, "quote": str, "sentiment": "support"|"oppose"|"neutral", "concern_category": str}
    key_concerns: list[str] = field(default_factory=list)
    local_context: str = ""
    sentiment_summary: str = ""
    opposition_strength: str = ""  # "strong", "moderate", "weak", "unknown"
    notable_facts: list[str] = field(default_factory=list)


COMMUNITY_RESEARCH_PROMPT = """You are a community research analyst preparing for a city council meeting simulation. Your job is to find REAL public sentiment about data center proposals in or near {city_name}, {state}.

PROPOSAL CONTEXT: {proposal_summary}
KNOWN CONCERNS: {concerns}

RESEARCH TASK:
Use WebSearch extensively to find:

1. **Local news articles** about this specific data center proposal or similar ones in {city_name}, {state}
   - Search: "{city_name} data center proposal"
   - Search: "{city_name} {state} data center opposition"
   - Search: "{city_name} planning commission data center"

2. **Public comments and resident reactions**
   - Search: "{city_name} residents data center concerns"
   - Search: "{city_name} data center community meeting"
   - Search: "data center opposition {state}" for state-wide sentiment

3. **Local context that affects the debate**
   - Search: "{city_name} {state} water supply issues"
   - Search: "{city_name} {state} property values trends"
   - Search: "{city_name} development controversies"

4. **Similar data center debates in nearby communities**
   - Search: "data center moratorium {state}"
   - Search: "data center NIMBY opposition Michigan" (or relevant state)

Use WebFetch to read the full text of the most relevant articles you find.

After researching, return ONLY a JSON object with this structure:
{{
  "real_quotes": [
    {{
      "source": "source description (e.g., 'resident at Jan 14 planning meeting' or 'Detroit Free Press article')",
      "quote": "actual or closely paraphrased quote from a real person",
      "sentiment": "support" | "oppose" | "neutral",
      "concern_category": "water" | "power" | "noise" | "traffic" | "property" | "environmental" | "jobs" | "other"
    }}
  ],
  "key_concerns": [
    "specific concern raised by real residents with local details"
  ],
  "local_context": "2-3 paragraphs about the city, its demographics, recent development issues, water/power infrastructure, and how this proposal fits into the local political landscape",
  "sentiment_summary": "1-2 sentences summarizing the overall community mood",
  "opposition_strength": "strong" | "moderate" | "weak" | "unknown",
  "notable_facts": [
    "specific verifiable facts about the city relevant to this debate (population, water system, school proximity, etc.)"
  ]
}}

IMPORTANT:
- Find at least 3-5 real quotes if possible
- If you can't find coverage of THIS specific proposal, find coverage of similar data center debates in the same state
- Include specific local details (school names, road names, neighborhoods, water authorities)
- Note if there's a moratorium movement or organized opposition group
- Be honest about what you found vs. what you inferred"""


async def research_community_sentiment(
    city_name: str,
    state: str,
    proposal_summary: str,
    concerns: list[str],
    mcp_server_config: dict,
    timeout_seconds: int = 45,
) -> Optional[CommunityResearchResult]:
    """
    Use the Agent SDK to research real community sentiment about a data center proposal.

    Returns CommunityResearchResult with real quotes and local context,
    or None if research fails/times out.
    """
    prompt = COMMUNITY_RESEARCH_PROMPT.format(
        city_name=city_name,
        state=state,
        proposal_summary=proposal_summary[:3000],
        concerns=", ".join(concerns) if concerns else "general community impact",
    )

    try:
        result_text = ""

        async def _run_query():
            nonlocal result_text
            async for message in query(
                prompt=prompt,
                options=ClaudeAgentOptions(
                    model="claude-opus-4-6",
                    max_turns=15,
                    max_budget_usd=2.00,
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

        return _parse_research_response(result_text)

    except asyncio.TimeoutError:
        print(f"[WARN] Community research timed out after {timeout_seconds}s")
        return None
    except Exception as e:
        print(f"[WARN] Community research failed: {e}")
        return None


def _parse_research_response(text: str) -> Optional[CommunityResearchResult]:
    """Parse the SDK response into a CommunityResearchResult."""
    try:
        start = text.find("{")
        end = text.rfind("}") + 1
        if start == -1 or end == 0:
            return None

        json_str = text[start:end]
        data = json.loads(json_str)

        return CommunityResearchResult(
            real_quotes=data.get("real_quotes", []),
            key_concerns=data.get("key_concerns", []),
            local_context=data.get("local_context", ""),
            sentiment_summary=data.get("sentiment_summary", ""),
            opposition_strength=data.get("opposition_strength", "unknown"),
            notable_facts=data.get("notable_facts", []),
        )

    except (json.JSONDecodeError, KeyError, TypeError) as e:
        print(f"[WARN] Failed to parse community research JSON: {e}")
        return None
