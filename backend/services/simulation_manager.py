"""
In-memory simulation state manager.
Creates, stores, retrieves, and updates simulation state.
Launches background tasks for simulation execution.
"""

import asyncio
from typing import Optional

from backend.models.simulation import SimulationInput, SimulationState, SimulationStatus


class SimulationManager:
    """
    Manages all active simulations in memory.

    Thread-safe access to simulation state via asyncio locks.
    Each simulation gets a unique ID and progresses through
    status transitions as the orchestrator and debate engine run.
    """

    def __init__(self):
        self._simulations: dict[str, SimulationState] = {}
        self._locks: dict[str, asyncio.Lock] = {}
        self._tasks: dict[str, asyncio.Task] = {}

    def create_simulation(self, sim_input: SimulationInput) -> SimulationState:
        """Create a new simulation and return its state."""
        state = SimulationState(input=sim_input)
        self._simulations[state.id] = state
        self._locks[state.id] = asyncio.Lock()
        return state

    def get_simulation(self, simulation_id: str) -> Optional[SimulationState]:
        """Get simulation state by ID."""
        return self._simulations.get(simulation_id)

    async def update_status(self, simulation_id: str, status: SimulationStatus):
        """Update the status of a simulation."""
        state = self._simulations.get(simulation_id)
        if state:
            async with self._locks[simulation_id]:
                state.status = status

    async def update_personas(self, simulation_id: str, personas: list[dict]):
        """Store generated personas in simulation state."""
        state = self._simulations.get(simulation_id)
        if state:
            async with self._locks[simulation_id]:
                state.personas = personas

    async def add_transcript_turn(self, simulation_id: str, turn: dict):
        """Append a debate turn to the transcript."""
        state = self._simulations.get(simulation_id)
        if state:
            async with self._locks[simulation_id]:
                state.transcript.append(turn)

    async def set_analysis(self, simulation_id: str, analysis: dict):
        """Store the post-debate analysis result."""
        state = self._simulations.get(simulation_id)
        if state:
            async with self._locks[simulation_id]:
                state.analysis = analysis

    async def set_error(self, simulation_id: str, error: str):
        """Mark simulation as errored with a message."""
        state = self._simulations.get(simulation_id)
        if state:
            async with self._locks[simulation_id]:
                state.status = SimulationStatus.ERROR
                state.error = error

    def register_task(self, simulation_id: str, task: asyncio.Task):
        """Register a background task for a simulation."""
        self._tasks[simulation_id] = task

    def get_task(self, simulation_id: str) -> Optional[asyncio.Task]:
        """Get the background task for a simulation."""
        return self._tasks.get(simulation_id)

    def list_simulations(self) -> list[dict]:
        """List all simulations with basic info."""
        return [
            {
                "id": s.id,
                "status": s.status.value,
                "city": s.input.city_name,
                "company": s.input.company_name,
            }
            for s in self._simulations.values()
        ]


# Global singleton
_manager: Optional[SimulationManager] = None


def get_simulation_manager() -> SimulationManager:
    """Get or create the global simulation manager."""
    global _manager
    if _manager is None:
        _manager = SimulationManager()
    return _manager
