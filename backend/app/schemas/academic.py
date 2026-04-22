from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field

from app.schemas.common import ScheduleSlot


class CoursePrerequisite(BaseModel):
    course_code: str
    prerequisite_code: str


class CourseBase(BaseModel):
    code: str
    name: Optional[str] = None
    title: str
    description: Optional[str] = None
    credits: int
    department_id: Optional[str] = None
    prerequisites: List[str] = Field(default_factory=list)


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    credits: Optional[int] = None
    department_id: Optional[str] = None
    prerequisites: Optional[List[str]] = None


class CourseOut(CourseBase):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True


class ClassBase(BaseModel):
    course_id: str
    teacher_id: str
    semester: str
    capacity: int
    year: Optional[int] = None
    room: str
    schedule: List[ScheduleSlot] = Field(default_factory=list)


class ClassCreate(ClassBase):
    pass


class ClassUpdate(BaseModel):
    course_id: Optional[str] = None
    teacher_id: Optional[str] = None
    semester: Optional[str] = None
    capacity: Optional[int] = None
    year: Optional[int] = None
    room: Optional[str] = None
    schedule: Optional[List[ScheduleSlot]] = None


class ClassOut(ClassBase):
    id: str = Field(alias="_id")
    current_enrollment: int = 0

    class Config:
        populate_by_name = True


class Grade(BaseModel):
    value: Optional[float] = None
    teacher_comments: Optional[str] = None
    graded_at: Optional[datetime] = None


class Withdrawal(BaseModel):
    withdrawn_at: Optional[datetime] = None
    reason: Optional[str] = None


class EnrollmentBase(BaseModel):
    student_id: str
    class_id: str
    status: str = "enrolled"


class EnrollmentCreate(EnrollmentBase):
    pass


class EnrollmentUpdate(BaseModel):
    status: Optional[str] = None
    grade: Optional[float] = None
    teacher_comments: Optional[str] = None
    withdrawn_at: Optional[datetime] = None


class EnrollmentOut(EnrollmentBase):
    id: str = Field(alias="_id")
    grade: Optional[float] = None
    teacher_comments: Optional[str] = None
    enrolled_at: datetime
    graded_at: Optional[datetime] = None
    withdrawn_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


class AssignmentBase(BaseModel):
    class_id: str
    title: str
    description: str
    deadline: datetime


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    class_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None


class AssignmentOut(AssignmentBase):
    id: str = Field(alias="_id")
    created_at: datetime

    class Config:
        populate_by_name = True


class SubmissionBase(BaseModel):
    assignment_id: str
    student_id: str
    content: str
    status: str = "submitted"


class SubmissionCreate(SubmissionBase):
    pass


class SubmissionOut(SubmissionBase):
    id: str = Field(alias="_id")
    submitted_at: datetime

    class Config:
        populate_by_name = True


class ExamGrade(BaseModel):
    student_id: str
    score: float
    comments: Optional[str] = None
    graded_at: Optional[datetime] = None


class ExamSubmission(BaseModel):
    student_id: str
    content: str
    submitted_at: datetime


class ExamBase(BaseModel):
    class_id: str
    title: str
    description: Optional[str] = None
    scheduled_at: datetime
    duration_minutes: int
    max_score: float = 100.0
    grades: List[ExamGrade] = Field(default_factory=list)
    submissions: List[ExamSubmission] = Field(default_factory=list)


class ExamCreate(ExamBase):
    pass


class ExamUpdate(BaseModel):
    class_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    max_score: Optional[float] = None
    grades: Optional[List[ExamGrade]] = None
    submissions: Optional[List[ExamSubmission]] = None


class ExamOut(ExamBase):
    id: str = Field(alias="_id")
    created_at: datetime

    class Config:
        populate_by_name = True


class AttendanceRecord(BaseModel):
    student_id: str
    status: str
    check_in_time: Optional[datetime] = None


class AttendanceBase(BaseModel):
    class_id: str
    date: str
    records: List[AttendanceRecord] = Field(default_factory=list)


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceOut(AttendanceBase):
    id: str = Field(alias="_id")
    recorded_at: datetime

    class Config:
        populate_by_name = True
