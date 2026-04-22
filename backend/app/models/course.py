from pydantic import BaseModel, Field
from typing import Optional, List

class CourseInDB(BaseModel):
    id: str = Field(alias="_id")
    code: str
    title: str
    description: Optional[str] = None
    credits: int
    prerequisites: List[str] = []

    class Config:
        populate_by_name = True
