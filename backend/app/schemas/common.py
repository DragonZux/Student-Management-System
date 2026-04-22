from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List


class Profile(BaseModel):
    full_name: str
    email: EmailStr
    department: Optional[str] = None
    status: Optional[str] = None
    is_active: bool = True


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None


class ScheduleSlot(BaseModel):
    day: str
    start: str
    end: str


class Schedule(BaseModel):
    slots: List[ScheduleSlot] = Field(default_factory=list)
