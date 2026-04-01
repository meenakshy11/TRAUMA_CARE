from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.services.notification_service import manager
from app.core.security import decode_token

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/command")
async def command_center_ws(websocket: WebSocket, token: str = Query(...)):
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001)
        return
    await manager.connect(websocket, "command")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "command")


@router.websocket("/ws/hospital/{hospital_id}")
async def hospital_ws(websocket: WebSocket, hospital_id: str, token: str = Query(...)):
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001)
        return
    channel = f"hospital_{hospital_id}"
    await manager.connect(websocket, channel)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)


@router.websocket("/ws/incident/{incident_id}")
async def incident_ws(websocket: WebSocket, incident_id: str, token: str = Query(...)):
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001)
        return
    channel = f"incident_{incident_id}"
    await manager.connect(websocket, channel)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)
