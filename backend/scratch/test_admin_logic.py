
import asyncio
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"

class ClassroomUpdate(BaseModel):
    code: Optional[str] = None
    capacity: Optional[int] = None

async def test():
    payload = ClassroomUpdate(code="A1", capacity=30)
    updatable = payload.model_dump(exclude_none=True)
    print(f"Updatable: {updatable}")
    print(f"Fields: {list(updatable.keys())}")
    
    # Mocking log_audit_event logic
    event = {
        "action": "test",
        "actor_role": UserRole.ADMIN, # This is the potential issue
        "metadata": {"fields": list(updatable.keys())}
    }
    print(f"Event: {event}")
    
    # In a real app, Motor would handle this. 
    # But let's see if we can identify anything else.

if __name__ == "__main__":
    asyncio.run(test())
