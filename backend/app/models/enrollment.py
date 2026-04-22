from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class EnrollmentInDB(BaseModel):
    id: str = Field(alias="_id")
    student_id: str
    class_id: str
    status: str = "enrolled"
    grade: Optional[float] = None
    teacher_comments: Optional[str] = None
    enrolled_at: datetime = Field(default_factory=datetime.utcnow)
    graded_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
