"""
GRAM-X Enterprise Real-Time WebSocket Router
Provides live bidirectional and broadcast channels for Citizens, Workers, Admins, and Collectors.
Supports JWT authentication in query params or initial handshake message, and automated heartbeat ping/pong.
"""

import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from app.services.realtime_manager import realtime_manager

logger = logging.getLogger("gramx.ws")
ws_router = APIRouter()

async def _handle_ws_connection(websocket: WebSocket, channel: str, token: str = None):
    """Common WebSocket connection lifecycle handler with strict RBAC enforcement."""
    user_info = None
    if token:
        user_info = realtime_manager.authenticate_token(token)

    # Role Privilege Validation
    privileged_roles = {
        "admin": ["admin", "super_admin"],
        "district": ["district", "super_admin"],
        "worker": ["worker", "admin", "district", "super_admin"],
        "citizen": ["citizen", "worker", "admin", "district", "super_admin"]
    }

    if channel in privileged_roles and channel != "broadcast":
        required = privileged_roles[channel]
        user_role = user_info.get("role") if user_info else None
        if not user_role or user_role not in required:
            logger.warning(f"Rejected unauthorized WebSocket connection to channel '{channel}' (User role: '{user_role}')")
            await websocket.accept()
            await websocket.send_json({
                "event": "AUTH_ERROR",
                "error": f"Access denied: Role '{user_role or 'anonymous'}' is not authorized for channel '{channel}'."
            })
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    await realtime_manager.connect(websocket, channel=channel, user_info=user_info)
    
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping" or msg.get("event") == "PING":
                    await websocket.send_json({"type": "pong", "event": "PONG", "timestamp": str(msg.get("timestamp"))})
                elif msg.get("type") == "auth" and msg.get("token"):
                    info = realtime_manager.authenticate_token(msg["token"])
                    if info:
                        realtime_manager.socket_meta[websocket]["user_id"] = info.get("user_id")
                        realtime_manager.socket_meta[websocket]["username"] = info.get("username")
                        realtime_manager.socket_meta[websocket]["role"] = info.get("role")
                        await websocket.send_json({"event": "AUTH_SUCCESS", "role": info.get("role")})
            except json.JSONDecodeError:
                if data.strip().lower() == "ping":
                    await websocket.send_text("pong")
    except WebSocketDisconnect:
        realtime_manager.disconnect(websocket)
    except Exception as e:
        logger.debug(f"WebSocket connection closed with error: {e}")
        realtime_manager.disconnect(websocket)



@ws_router.websocket("/ws")
async def websocket_unified_endpoint(
    websocket: WebSocket,
    channel: str = Query("broadcast"),
    token: str = Query(None)
):
    """Unified WebSocket streaming endpoint."""
    await _handle_ws_connection(websocket, channel=channel, token=token)


@ws_router.websocket("/ws/citizen")
async def websocket_citizen_channel(websocket: WebSocket, token: str = Query(None)):
    """Dedicated Citizen role real-time event channel."""
    await _handle_ws_connection(websocket, channel="citizen", token=token)


@ws_router.websocket("/ws/worker")
async def websocket_worker_channel(websocket: WebSocket, token: str = Query(None)):
    """Dedicated Field Worker role real-time event channel."""
    await _handle_ws_connection(websocket, channel="worker", token=token)


@ws_router.websocket("/ws/admin")
async def websocket_admin_channel(websocket: WebSocket, token: str = Query(None)):
    """Dedicated Panchayat Admin role real-time event channel."""
    await _handle_ws_connection(websocket, channel="admin", token=token)


@ws_router.websocket("/ws/collector")
async def websocket_collector_channel(websocket: WebSocket, token: str = Query(None)):
    """Dedicated District Collector executive event channel."""
    await _handle_ws_connection(websocket, channel="district", token=token)


@ws_router.get("/ws/stats")
def get_websocket_stats():
    """Returns observability metrics for real-time WebSocket connection channels."""
    return realtime_manager.get_stats()
