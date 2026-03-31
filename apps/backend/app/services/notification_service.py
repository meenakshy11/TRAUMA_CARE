import json
import asyncio
from typing import Optional, Set
from fastapi import WebSocket
import uuid

# In-memory WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: str = "command"):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = set()
        self.active_connections[channel].add(websocket)

    def disconnect(self, websocket: WebSocket, channel: str = "command"):
        if channel in self.active_connections:
            self.active_connections[channel].discard(websocket)

    async def broadcast(self, message: dict, channel: str = "command"):
        if channel not in self.active_connections:
            return
        data = json.dumps(message)
        dead = set()
        for ws in self.active_connections[channel]:
            try:
                await ws.send_text(data)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.active_connections[channel].discard(ws)

    async def broadcast_ambulance_location(
        self, ambulance_id: str, lat: float, lon: float, status: str
    ):
        await self.broadcast({
            "type": "AMBULANCE_LOCATION",
            "ambulance_id": ambulance_id,
            "lat": lat,
            "lon": lon,
            "status": status,
        })

    async def broadcast_incident_status(self, incident_id: str, status: str, incident_number: str):
        await self.broadcast({
            "type": "INCIDENT_STATUS",
            "incident_id": incident_id,
            "incident_number": incident_number,
            "status": status,
        })

    async def broadcast_new_incident(self, incident: dict):
        await self.broadcast({"type": "NEW_INCIDENT", "incident": incident})

    async def broadcast_hospital_update(self, hospital_id: str, icu_available: int, ed_current: int):
        await self.broadcast({
            "type": "HOSPITAL_UPDATE",
            "hospital_id": hospital_id,
            "icu_available": icu_available,
            "ed_current": ed_current,
        })

    async def broadcast_pre_arrival_alert(self, hospital_id: str, triage_color: str,
                                           eta_minutes: float, incident_id: str):
        await self.broadcast({
            "type": "PRE_ARRIVAL_ALERT",
            "hospital_id": hospital_id,
            "triage_color": triage_color,
            "eta_minutes": eta_minutes,
            "incident_id": incident_id,
        }, channel=f"hospital_{hospital_id}")


manager = ConnectionManager()
