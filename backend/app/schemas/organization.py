from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class DepartmentBase(BaseModel):
    name: str
    faculty: Optional[str] = None
    description: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    faculty: Optional[str] = None
    description: Optional[str] = None


class DepartmentOut(DepartmentBase):
    id: str = Field(alias="_id")
    created_at: datetime

    class Config:
        populate_by_name = True


class ClassroomBase(BaseModel):
    code: str
    building: Optional[str] = None
    capacity: int = 0
    facilities: List[str] = Field(default_factory=list)


class ClassroomCreate(ClassroomBase):
    pass


class ClassroomUpdate(BaseModel):
    code: Optional[str] = None
    building: Optional[str] = None
    capacity: Optional[int] = None
    facilities: Optional[List[str]] = None


class ClassroomOut(ClassroomBase):
    id: str = Field(alias="_id")
    created_at: datetime

    class Config:
        populate_by_name = True


class NotificationBase(BaseModel):
    user_id: str
    title: str
    message: str
    read: bool = False


class NotificationCreate(NotificationBase):
    pass


class NotificationOut(NotificationBase):
    id: str = Field(alias="_id")
    created_at: datetime

    class Config:
        populate_by_name = True


class AuditLogOut(BaseModel):
    id: str = Field(alias="_id")
    action: str
    actor_id: Optional[str] = None
    actor_role: Optional[str] = None
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    metadata: dict = Field(default_factory=dict)
    created_at: datetime

    class Config:
        populate_by_name = True


class FeedbackBase(BaseModel):
    class_id: str
    rating: float
    comment: str = ""


class FeedbackCreate(FeedbackBase):
    pass


class FeedbackOut(FeedbackBase):
    student_id: str
    id: str = Field(alias="_id")
    created_at: datetime

    class Config:
        populate_by_name = True
