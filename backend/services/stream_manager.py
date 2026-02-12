"""
WebSocket stream manager.
Handles connection tracking and message broadcasting for real-time debate streaming.
"""

import json
import asyncio
from typing import Any

from fastapi import WebSocket


class StreamManager:
    """
    Manages WebSocket connections and broadcasts messages for simulations.

    Each simulation_id maps to a set of connected WebSocket clients.
    Messages are broadcast to all clients watching a given simulation.
    Disconnected clients are cleaned up automatically.
    """

    def __init__(self):
        self._connections: dict[str, set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, simulation_id: str, websocket: WebSocket):
        """Register a WebSocket connection for a simulation."""
        await websocket.accept()
        async with self._lock:
            if simulation_id not in self._connections:
                self._connections[simulation_id] = set()
            self._connections[simulation_id].add(websocket)

    async def disconnect(self, simulation_id: str, websocket: WebSocket):
        """Remove a WebSocket connection."""
        async with self._lock:
            if simulation_id in self._connections:
                self._connections[simulation_id].discard(websocket)
                if not self._connections[simulation_id]:
                    del self._connections[simulation_id]

    async def broadcast(self, simulation_id: str, message_type: str, payload: dict[str, Any]):
        """Broadcast a typed message to all clients watching a simulation."""
        message = json.dumps({"type": message_type, "payload": payload})

        if simulation_id not in self._connections:
            return

        dead_connections = set()
        for ws in self._connections.get(simulation_id, set()):
            try:
                await ws.send_text(message)
            except Exception:
                dead_connections.add(ws)

        # Clean up dead connections
        if dead_connections:
            async with self._lock:
                if simulation_id in self._connections:
                    self._connections[simulation_id] -= dead_connections

    # Convenience methods matching the WebSocket protocol

    async def send_phase_change(self, simulation_id: str, phase: str, description: str):
        """Broadcast a phase change event."""
        await self.broadcast(simulation_id, "phase_change", {
            "phase": phase,
            "description": description,
        })

    async def send_persona_intro(self, simulation_id: str, persona_data: dict):
        """Broadcast a persona introduction."""
        await self.broadcast(simulation_id, "persona_intro", persona_data)

    async def send_speaking_start(
        self, simulation_id: str, turn_id: str,
        persona_id: str, persona_name: str, phase: str,
    ):
        """Broadcast that a persona has started speaking."""
        await self.broadcast(simulation_id, "speaking_start", {
            "turn_id": turn_id,
            "persona_id": persona_id,
            "persona_name": persona_name,
            "phase": phase,
        })

    async def send_token(self, simulation_id: str, turn_id: str, token: str, persona_id: str):
        """Broadcast a single streamed token."""
        await self.broadcast(simulation_id, "token", {
            "turn_id": turn_id,
            "token": token,
            "persona_id": persona_id,
        })

    async def send_speaking_end(
        self, simulation_id: str, turn_id: str, persona_id: str, full_text: str,
    ):
        """Broadcast that a persona has finished speaking."""
        await self.broadcast(simulation_id, "speaking_end", {
            "turn_id": turn_id,
            "persona_id": persona_id,
            "full_text": full_text,
        })

    async def send_analysis(self, simulation_id: str, analysis: dict):
        """Broadcast the post-debate analysis results."""
        await self.broadcast(simulation_id, "analysis", analysis)

    async def send_status(self, simulation_id: str, message: str, progress: float | None = None):
        """Broadcast a status update."""
        payload: dict[str, Any] = {"message": message}
        if progress is not None:
            payload["progress"] = progress
        await self.broadcast(simulation_id, "status", payload)

    async def send_error(self, simulation_id: str, message: str, phase: str | None = None):
        """Broadcast an error."""
        payload: dict[str, Any] = {"message": message}
        if phase is not None:
            payload["phase"] = phase
        await self.broadcast(simulation_id, "error", payload)

    async def send_complete(self, simulation_id: str):
        """Broadcast simulation completion."""
        await self.broadcast(simulation_id, "complete", {
            "simulation_id": simulation_id,
        })

    def has_connections(self, simulation_id: str) -> bool:
        """Check if any clients are connected for a simulation."""
        return bool(self._connections.get(simulation_id))


# Global singleton
_stream_manager: StreamManager | None = None


def get_stream_manager() -> StreamManager:
    """Get or create the global stream manager."""
    global _stream_manager
    if _stream_manager is None:
        _stream_manager = StreamManager()
    return _stream_manager
