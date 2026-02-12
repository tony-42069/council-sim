"""
Custom MCP tool: Document Parser
Extracts structured data from uploaded proposal text or city council agenda documents.
"""

from claude_agent_sdk import tool


@tool(
    "parse_proposal_document",
    "Extract structured information from a data center proposal document or "
    "city council agenda text. Returns key facts organized by category.",
    {
        "type": "object",
        "properties": {
            "document_text": {
                "type": "string",
                "description": "Raw text from the uploaded document",
            },
            "document_type": {
                "type": "string",
                "enum": ["proposal", "agenda", "environmental_report", "other"],
                "description": "Type of document being parsed",
            },
        },
        "required": ["document_text"],
    },
)
async def parse_proposal_document_tool(args: dict) -> dict:
    """Parse a proposal document and return structured data."""
    text = args["document_text"]
    doc_type = args.get("document_type", "proposal")

    extraction_prompt = f"""Analyze this {doc_type} document and extract the following information.
If a field is not mentioned, say "Not specified."

DOCUMENT TEXT:
{text[:5000]}

EXTRACT:
1. FACILITY SPECIFICATIONS:
   - Size (square footage)
   - Power capacity (MW)
   - Water usage estimates
   - Location/address
   - Number of buildings

2. ECONOMIC IMPACT:
   - Permanent jobs created
   - Construction jobs
   - Annual tax revenue
   - Capital investment amount

3. ENVIRONMENTAL CONSIDERATIONS:
   - Cooling technology type
   - Water recycling percentage
   - Noise mitigation plans
   - Renewable energy commitments

4. COMMUNITY COMMITMENTS:
   - Community benefit agreements
   - Local hiring commitments
   - Infrastructure improvements offered
   - Educational or community programs

5. TIMELINE:
   - Construction start date
   - Expected completion
   - Phasing plan

Format as structured facts."""

    return {
        "content": [{"type": "text", "text": extraction_prompt}],
    }
