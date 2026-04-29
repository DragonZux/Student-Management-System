from collections import defaultdict
from typing import Dict, List
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt

from app.dependencies import check_admin_role, get_current_user
from app.core.audit import log_audit_event
from app.core.config import settings
from app.db.database import get_database
from app.schemas.organization import NotificationCreate, NotificationOut
from datetime import datetime

router = APIRouter(redirect_slashes=False)

active_connections: Dict[str, List[WebSocket]] = defaultdict(list)

async def create_notification(user_id: str, title: str, message: str) -> dict:
    db = get_database()
    notification = NotificationCreate(
        user_id=user_id,
        title=title,
        message=message,
    ).model_dump()
    notification.update({
        "_id": str(uuid.uuid4()),
        "read": False,
        "created_at": datetime.utcnow()
    })
    await db.notifications.insert_one(notification)
    print(f"[notifications] inserted notification {notification['_id']} for user {user_id}")
    await _broadcast_to_user(user_id, {
        "type": "notification",
        "data": {
            "id": notification["_id"],
            "title": title,
            "message": message,
            "created_at": notification["created_at"].isoformat(),
        },
    })
    return notification


async def _broadcast_to_user(user_id: str, payload: dict):
    stale = []
    conns = active_connections.get(user_id, [])
    print(f"[notifications] broadcasting to {user_id}, connections={len(conns)}")
    for ws in conns:
        try:
            await ws.send_json(payload)
            print(f"[notifications] sent payload to websocket for user {user_id}")
        except Exception as e:
            print(f"[notifications] failed sending to websocket for {user_id}: {e}")
            stale.append(ws)
    if stale:
        active_connections[user_id] = [ws for ws in active_connections[user_id] if ws not in stale]

@router.get("")
@router.get("/")
async def get_my_notifications(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=2000),
    user: dict = Depends(get_current_user),
):
    db = get_database()
    query = {"user_id": user["_id"]}
    total = await db.notifications.count_documents(query)
    notifications = await db.notifications.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    normalized = []
    for item in notifications:
        normalized.append(
            {
                "_id": str(item.get("_id", "")),
                "user_id": str(item.get("user_id", user["_id"])),
                "title": item.get("title") or "Thông báo hệ thống",
                "message": item.get("message") or "",
                "read": bool(item.get("read", False)),
                "created_at": item.get("created_at") or datetime.utcnow(),
            }
        )
    return {
        "data": normalized,
        "total": total,
        "skip": skip,
        "limit": limit,
    }

@router.post("/{notification_id}/read")
async def mark_as_read(notification_id: str, user: dict = Depends(get_current_user)):
    db = get_database()
    result = await db.notifications.update_one(
        {"_id": notification_id, "user_id": user["_id"]},
        {"$set": {"read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    await log_audit_event(
        action="notification.mark_read",
        actor_id=user["_id"],
        actor_role=user.get("role"),
        target_type="notification",
        target_id=notification_id,
    )
    return {"status": "success"}
    
@router.post("/mark-all-read")
async def mark_all_as_read(user: dict = Depends(get_current_user)):
    db = get_database()
    await db.notifications.update_many(
        {"user_id": user["_id"], "read": False},
        {"$set": {"read": True}}
    )
    await log_audit_event(
        action="notification.mark_all_read",
        actor_id=user["_id"],
        actor_role=user.get("role"),
        target_type="notification",
        target_id="all",
    )
    return {"status": "success"}


@router.post("/send", dependencies=[Depends(check_admin_role)])
async def send_notification(payload: NotificationCreate):
    notification = await create_notification(user_id=payload.user_id, title=payload.title, message=payload.message)
    await log_audit_event(
        action="admin.send_notification",
        actor_role="admin",
        target_type="notification",
        target_id=notification["_id"],
        metadata={"user_id": payload.user_id},
    )
    return {"message": "Notification sent", "notification_id": notification["_id"]}


@router.websocket("/ws")
async def notifications_ws(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        token_jti = payload.get("jti")
        if not user_id:
            await websocket.close(code=1008)
            return
        if not token_jti:
            await websocket.close(code=1008)
            return
    except JWTError:
        await websocket.close(code=1008)
        return

    # Single-session check: only allow the currently active session
    db = get_database()
    user = await db.users.find_one({"_id": user_id})
    if not user:
        print(f"[WS] Rejecting: User {user_id} not found")
        await websocket.close(code=1008)
        return
        
    if str(user.get("active_jti") or "") != str(token_jti):
        print(f"[WS] Rejecting: JTI mismatch for {user_id}. DB: {user.get('active_jti')}, Token: {token_jti}")
        await websocket.close(code=1008)
        return

    await websocket.accept()
    active_connections[user_id].append(websocket)
    await websocket.send_json({"type": "connected"})

    try:
        while True:
            _ = await websocket.receive_text()
            await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        pass
    finally:
        active_connections[user_id] = [ws for ws in active_connections[user_id] if ws != websocket]
