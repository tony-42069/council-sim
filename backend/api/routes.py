"""
REST API routes for simulation management.
POST /api/simulations — Create and start a new simulation
GET /api/simulations/{id} — Get simulation state
"""

import io

from fastapi import APIRouter, HTTPException, Form, UploadFile, File
from typing import Optional

from backend.models.simulation import SimulationInput
from backend.services.simulation_manager import get_simulation_manager


def _extract_pdf_text(content: bytes, max_pages: int = 30) -> str | None:
    """Extract text from PDF bytes using pdfplumber.

    For large PDFs, extracts the first chunk of pages plus samples
    from the middle and end to capture key sections.
    """
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            total = len(pdf.pages)
            if total <= max_pages:
                pages = [page.extract_text() or "" for page in pdf.pages]
            else:
                # First 15 pages (intro, overview, specs)
                # Middle 5 pages (details)
                # Last 5 pages (commitments, conclusions)
                indices = list(range(15))
                mid = total // 2
                indices += list(range(mid - 2, mid + 3))
                indices += list(range(total - 5, total))
                indices = sorted(set(i for i in indices if 0 <= i < total))
                pages = []
                for i in indices:
                    text = pdf.pages[i].extract_text() or ""
                    if text:
                        pages.append(f"[Page {i+1}/{total}]\n{text}")
            text = "\n\n".join(pages).strip()
            return text if text else None
    except Exception:
        return None

router = APIRouter(prefix="/api", tags=["simulations"])


@router.post("/extract-document")
async def extract_document(
    document: UploadFile = File(...),
):
    """
    Upload a PDF and extract structured fields for auto-filling the simulation form.
    Uses Claude to intelligently parse city, company, proposal details, and concerns.
    """
    import anthropic
    from backend.config import get_settings

    settings = get_settings()

    if not document or not document.filename:
        raise HTTPException(status_code=400, detail="No document provided")

    try:
        content = await document.read()
        if document.filename.lower().endswith(".pdf"):
            text = _extract_pdf_text(content)
        else:
            text = content.decode("utf-8", errors="replace")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read document")

    if not text or len(text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Document appears empty or too short")

    # Use Claude to extract structured fields
    extraction_prompt = f"""Analyze this document about a data center proposal and extract the following fields.
Return ONLY a JSON object — no other text.

DOCUMENT TEXT:
{text[:25000]}

Return this exact JSON structure:
{{
  "city_name": "city or township name (e.g. 'Van Buren Township')",
  "state": "two-letter state code (e.g. 'MI')",
  "company_name": "name of the company proposing the data center",
  "proposal_details": "A comprehensive 3-5 paragraph summary of the proposal including: facility size/specs, location details, power capacity, water usage, jobs created, tax revenue, environmental mitigations, and any community commitments. Include specific numbers and facts from the document.",
  "concerns": ["list of concern IDs from: water, power, noise, traffic, property, environmental — include ALL that are mentioned or relevant"]
}}

Be thorough in the proposal_details — include every specific fact, number, and commitment mentioned. This text will be used to drive a realistic AI debate simulation."""

    try:
        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        response = await client.messages.create(
            model=settings.fast_model,
            max_tokens=2000,
            messages=[{"role": "user", "content": extraction_prompt}],
        )

        import json
        resp_text = response.content[0].text
        start = resp_text.find("{")
        end = resp_text.rfind("}") + 1
        if start == -1 or end == 0:
            raise HTTPException(status_code=500, detail="Could not parse extraction result")

        data = json.loads(resp_text[start:end])
        return data

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid JSON from extraction")
    except anthropic.APIError as e:
        raise HTTPException(status_code=500, detail=f"AI extraction failed: {str(e)}")


@router.post("/simulations")
async def create_simulation(
    city_name: str = Form(...),
    state: str = Form(default=""),
    company_name: str = Form(default=""),
    proposal_details: str = Form(...),
    concerns: str = Form(default=""),
    document: Optional[UploadFile] = File(default=None),
):
    """
    Create a new simulation.

    Accepts form data with optional document upload.
    Returns the simulation ID and WebSocket URL for streaming.
    """
    # Parse concerns from comma-separated string
    concern_list = [c.strip() for c in concerns.split(",") if c.strip()] if concerns else []

    # Extract document text if uploaded
    document_text = None
    if document and document.filename:
        try:
            content = await document.read()
            if document.filename.lower().endswith(".pdf"):
                document_text = _extract_pdf_text(content)
            else:
                document_text = content.decode("utf-8", errors="replace")
        except Exception:
            pass  # Document extraction is best-effort

    sim_input = SimulationInput(
        city_name=city_name,
        state=state,
        company_name=company_name,
        proposal_details=proposal_details,
        concerns=concern_list,
        document_text=document_text,
    )

    manager = get_simulation_manager()
    sim_state = manager.create_simulation(sim_input)

    return {
        "simulation_id": sim_state.id,
        "status": sim_state.status.value,
        "ws_url": f"/ws/simulation/{sim_state.id}",
    }


@router.get("/simulations/{simulation_id}")
async def get_simulation(simulation_id: str):
    """Get the current state of a simulation."""
    manager = get_simulation_manager()
    sim_state = manager.get_simulation(simulation_id)

    if not sim_state:
        raise HTTPException(status_code=404, detail="Simulation not found")

    return {
        "id": sim_state.id,
        "status": sim_state.status.value,
        "city": sim_state.input.city_name,
        "company": sim_state.input.company_name,
        "personas": sim_state.personas,
        "transcript": sim_state.transcript,
        "analysis": sim_state.analysis,
        "error": sim_state.error,
    }
