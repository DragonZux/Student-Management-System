from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class EnrollmentBase(BaseModel):
    student_id: str
    class_id: str
    status: str = "enrolled"

class EnrollmentCreate(EnrollmentBase):
    pass

class EnrollmentOut(EnrollmentBase):
    id: str = Field(alias="_id")
    grade: Optional[float] = None
    teacher_comments: Optional[str] = None
    enrolled_at: datetime
    graded_at: Optional[datetime] = None
    withdrawn_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
