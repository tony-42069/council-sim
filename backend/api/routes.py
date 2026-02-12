"""
REST API routes for simulation management.
POST /api/simulations — Create and start a new simulation
GET /api/simulations/{id} — Get simulation state
"""

from fastapi import APIRouter, HTTPException, Form, UploadFile, File
from typing import Optional

from backend.models.simulation import SimulationInput
from backend.services.simulation_manager import get_simulation_manager

router = APIRouter(prefix="/api", tags=["simulations"])


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
    state = manager.create_simulation(sim_input)

    return {
        "simulation_id": state.id,
        "status": state.status.value,
        "ws_url": f"/ws/simulation/{state.id}",
    }


@router.get("/simulations/{simulation_id}")
async def get_simulation(simulation_id: str):
    """Get the current state of a simulation."""
    manager = get_simulation_manager()
    state = manager.get_simulation(simulation_id)

    if not state:
        raise HTTPException(status_code=404, detail="Simulation not found")

    return {
        "id": state.id,
        "status": state.status.value,
        "city": state.input.city_name,
        "company": state.input.company_name,
        "personas": state.personas,
        "transcript": state.transcript,
        "analysis": state.analysis,
        "error": state.error,
    }
