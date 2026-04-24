from datetime import datetime
from typing import Any, Dict, Optional
import uuid

from app.db.database import get_database


async def log_audit_event(
    action: str,
    actor_id: Optional[str] = None,
    actor_role: Optional[str] = None,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    db = get_database()
    event = {
        "_id": str(uuid.uuid4()),
        "action": action,
        "actor_id": actor_id,
        "actor_role": actor_role,
        "target_type": target_type,
        "target_id": target_id,
        "metadata": metadata or {},
        "created_at": datetime.utcnow(),
    }
    await db.audit_logs.insert_one(event)
