from pydantic import BaseModel, Field
from typing import Optional, List

class CourseBase(BaseModel):
    code: str = Field(..., example="CS101")
    name: Optional[str] = None
    title: str
    description: Optional[str] = None
    credits: int
    department_id: Optional[str] = None
    prerequisites: List[str] = []

class CourseCreate(CourseBase):
    pass

class CourseOut(CourseBase):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True
