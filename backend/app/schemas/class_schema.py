from pydantic import BaseModel, Field
from typing import List, Optional

class ClassBase(BaseModel):
    course_id: str
    teacher_id: str
    semester: str
    capacity: int
    year: Optional[int] = None
    room: str
    schedule: List[dict]

class ClassCreate(ClassBase):
    pass

class ClassOut(ClassBase):
    id: str = Field(alias="_id")
    current_enrollment: int = 0

    class Config:
        populate_by_name = True
