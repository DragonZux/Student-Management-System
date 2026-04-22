from pydantic import BaseModel, Field
from typing import List

class ClassInDB(BaseModel):
    id: str = Field(alias="_id")
    course_id: str
    teacher_id: str
    semester: str
    capacity: int
    current_enrollment: int = 0
    room: str
    schedule: List[dict]

    class Config:
        populate_by_name = True
