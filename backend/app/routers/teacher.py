from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.dependencies import get_current_user, check_teacher_role
from app.routers.notifications import create_notification
from app.core.audit import log_audit_event
from app.db.database import get_database
from app.schemas.academic import AssignmentCreate, AttendanceCreate, AttendanceOut, AttendanceRecord, ExamGrade
from app.schemas.organization import FeedbackOut
from app.schemas.user import UserRole
from datetime import datetime
import uuid

router = APIRouter(dependencies=[Depends(check_teacher_role)])


@router.get("/dashboard-summary")
async def get_teacher_dashboard_summary(teacher: dict = Depends(check_teacher_role)):
    db = get_database()
    classes = await db.classes.find({"teacher_id": teacher["_id"]}).to_list(1000)
    class_ids = [item["_id"] for item in classes]
    course_ids = {item.get("course_id") for item in classes if item.get("course_id")}
    courses = await db.courses.find({"_id": {"$in": list(course_ids)}}).to_list(1000) if course_ids else []
    course_by_id = {item["_id"]: item for item in courses}

    assignments = await db.assignments.find({"class_id": {"$in": class_ids}}).to_list(2000) if class_ids else []
    assignment_ids = [item["_id"] for item in assignments]
    submissions = await db.submissions.find({"assignment_id": {"$in": assignment_ids}}).to_list(5000) if assignment_ids else []
    enrollments = await db.enrollments.find({"class_id": {"$in": class_ids}}).to_list(5000) if class_ids else []
    feedback_count = await db.feedback.count_documents({"class_id": {"$in": class_ids}}) if class_ids else 0

    submission_map = {}
    for submission in submissions:
        submission_map.setdefault(submission["assignment_id"], []).append(submission)

    pending_grading = 0
    for assignment in assignments:
        pending_grading += len(submission_map.get(assignment["_id"], []))

    graded_count = sum(1 for item in enrollments if item.get("grade") is not None)
    completion_rate = round((graded_count / len(enrollments)) * 100, 2) if enrollments else 0

    today_idx = datetime.utcnow().weekday()
    day_labels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    today_label = day_labels[today_idx]
    today_classes = []
    for cls in classes:
        for slot in cls.get("schedule", []):
            if slot.get("day") == today_label:
                course = course_by_id.get(cls.get("course_id"))
                today_classes.append(
                    {
                        "class_id": cls["_id"],
                        "course_code": course.get("code") if course else None,
                        "course_title": course.get("title") if course else None,
                        "room": cls.get("room"),
                        "start": slot.get("start"),
                        "end": slot.get("end"),
                    }
                )
    today_classes.sort(key=lambda item: str(item.get("start") or ""))

    return {
        "total_classes": len(classes),
        "total_assignments": len(assignments),
        "pending_grading": pending_grading,
        "feedback_count": feedback_count,
        "graded_count": graded_count,
        "enrollment_count": len(enrollments),
        "completion_rate": completion_rate,
        "today": today_label,
        "today_classes": today_classes,
    }

@router.get("/my-classes")
async def list_my_classes(teacher: dict = Depends(check_teacher_role)):
    db = get_database()
    classes = await db.classes.find({"teacher_id": teacher["_id"]}).to_list(1000)
    course_ids = {c.get("course_id") for c in classes if c.get("course_id")}
    courses = await db.courses.find({"_id": {"$in": list(course_ids)}}).to_list(1000) if course_ids else []
    course_by_id = {c["_id"]: c for c in courses}
    for cls in classes:
        crs = course_by_id.get(cls.get("course_id"))
        cls["course_code"] = crs.get("code") if crs else None
        cls["course_title"] = crs.get("title") if crs else None
    return classes

@router.get("/classes/{class_id}/students")
async def list_class_students(class_id: str, teacher: dict = Depends(check_teacher_role)):
    db = get_database()
    target_class = await db.classes.find_one({"_id": class_id, "teacher_id": teacher["_id"]})
    if not target_class:
        raise HTTPException(status_code=403, detail="You do not teach this class")
    enrollments = await db.enrollments.find({"class_id": class_id}).to_list(1000)
    student_ids = [e["student_id"] for e in enrollments]
    students = await db.users.find({"_id": {"$in": student_ids}}).to_list(1000) if student_ids else []
    student_by_id = {s["_id"]: s for s in students}
    items = []
    for e in enrollments:
        s = student_by_id.get(e["student_id"])
        items.append({
            "enrollment": e,
            "student": {
                "_id": s.get("_id") if s else e["student_id"],
                "full_name": s.get("full_name") if s else None,
                "email": s.get("email") if s else None,
                "department": s.get("department") if s else None,
            } if s else None,
        })
    return items

@router.get("/assignments")
async def list_my_assignments(teacher: dict = Depends(check_teacher_role)):
    db = get_database()
    classes = await db.classes.find({"teacher_id": teacher["_id"]}).to_list(1000)
    class_ids = [c["_id"] for c in classes]
    return await db.assignments.find({"class_id": {"$in": class_ids}}).sort("created_at", -1).to_list(1000) if class_ids else []

@router.get("/attendance/{class_id}")
async def list_attendance(class_id: str, teacher: dict = Depends(check_teacher_role)):
    db = get_database()
    target_class = await db.classes.find_one({"_id": class_id, "teacher_id": teacher["_id"]})
    if not target_class:
        raise HTTPException(status_code=403, detail="You do not teach this class")
    return await db.attendance.find({"class_id": class_id}).sort("date", -1).to_list(200)

@router.get("/submissions/{assignment_id}")
async def list_assignment_submissions(assignment_id: str, teacher: dict = Depends(check_teacher_role)):
    db = get_database()
    assignment = await db.assignments.find_one({"_id": assignment_id})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    target_class = await db.classes.find_one({"_id": assignment["class_id"], "teacher_id": teacher["_id"]})
    if not target_class:
        raise HTTPException(status_code=403, detail="You do not teach this class")
    submissions = await db.submissions.find({"assignment_id": assignment_id}).sort("submitted_at", -1).to_list(1000)
    return submissions

# --- Attendance ---

@router.post("/attendance/{class_id}")
async def record_attendance(
    class_id: str,
    date: str, # Format YYYY-MM-DD
    records: List[AttendanceRecord], # List of embedded attendance records
    teacher: dict = Depends(check_teacher_role)
):
    db = get_database()
    # Check if class belongs to teacher
    target_class = await db.classes.find_one({"_id": class_id, "teacher_id": teacher["_id"]})
    if not target_class:
        raise HTTPException(status_code=403, detail="You do not teach this class")
    
    attendance_record = AttendanceCreate(
        class_id=class_id,
        date=date,
        records=records,
    ).model_dump()
    attendance_record.update({
        "_id": f"{class_id}_{date}",
        "recorded_at": datetime.utcnow(),
    })
    
    await db.attendance.replace_one({"_id": attendance_record["_id"]}, attendance_record, upsert=True)
    await log_audit_event(
        action="teacher.record_attendance",
        actor_id=teacher["_id"],
        actor_role=teacher["role"],
        target_type="class",
        target_id=class_id,
        metadata={"attendance_id": attendance_record["_id"]},
    )
    return {"message": "Attendance recorded successfully"}

# --- Assignments ---

@router.post("/assignments/{class_id}")
async def create_assignment(
    class_id: str,
    title: str,
    description: str,
    deadline: datetime,
    teacher: dict = Depends(check_teacher_role)
):
    db = get_database()
    target_class = await db.classes.find_one({"_id": class_id, "teacher_id": teacher["_id"]})
    if not target_class:
        raise HTTPException(status_code=403, detail="You do not teach this class")
    
    assignment = AssignmentCreate(
        class_id=class_id,
        title=title,
        description=description,
        deadline=deadline,
    ).model_dump()
    assignment.update({
        "_id": str(uuid.uuid4()),
        "created_at": datetime.utcnow()
    })
    
    await db.assignments.insert_one(assignment)
    await log_audit_event(
        action="teacher.create_assignment",
        actor_id=teacher["_id"],
        actor_role=teacher["role"],
        target_type="assignment",
        target_id=assignment["_id"],
        metadata={"class_id": class_id},
    )

    # Notify enrolled students about the new assignment
    enrollments = await db.enrollments.find({"class_id": class_id, "status": {"$in": ["enrolled", "completed"]}}).to_list(5000)
    student_ids = {e.get("student_id") for e in enrollments if e.get("student_id")}
    course = await db.courses.find_one({"_id": target_class.get("course_id")}) if target_class.get("course_id") else None
    course_label = ""
    if course:
        code = course.get("code") or ""
        t = course.get("title") or ""
        course_label = f"{code} - {t}".strip(" -")
    label = course_label or f"Lớp {class_id}"
    deadline_text = deadline.strftime("%Y-%m-%d %H:%M")
    message = f"Có bài tập mới trong {label}. Hạn nộp: {deadline_text}."

    for sid in student_ids:
        await create_notification(
            user_id=sid,
            title=f"Bài tập mới: {title}",
            message=message,
        )
    return assignment

# --- Grading ---

@router.post("/grade/{enrollment_id}")
async def grade_student(
    enrollment_id: str,
    grade: float,
    comments: str = None,
    teacher: dict = Depends(check_teacher_role)
):
    db = get_database()
    # Find enrollment and check if teacher teaches that class
    enrollment = await db.enrollments.find_one({"_id": enrollment_id})
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    target_class = await db.classes.find_one({"_id": enrollment["class_id"], "teacher_id": teacher["_id"]})
    if not target_class:
        raise HTTPException(status_code=403, detail="You do not teach this student's class")
    
    await db.enrollments.update_one(
        {"_id": enrollment_id},
        {"$set": {
            "grade": grade, 
            "teacher_comments": comments, 
            "graded_at": datetime.utcnow(),
            "status": "completed"
        }}
    )
    await log_audit_event(
        action="teacher.grade_student",
        actor_id=teacher["_id"],
        actor_role=teacher["role"],
        target_type="enrollment",
        target_id=enrollment_id,
        metadata={"grade": grade},
    )

    # Notify student that final grade has been updated
    student_id = enrollment.get("student_id")
    if student_id:
        cls = await db.classes.find_one({"_id": enrollment.get("class_id")}) if enrollment.get("class_id") else None
        course = await db.courses.find_one({"_id": cls.get("course_id")}) if cls and cls.get("course_id") else None
        course_label = ""
        if course:
            code = course.get("code") or ""
            t = course.get("title") or ""
            course_label = f"{code} - {t}".strip(" -")
        title_text = "Cập nhật điểm tổng kết"
        msg = f"Điểm tổng kết của bạn đã được cập nhật"
        if course_label:
            msg += f" cho học phần {course_label}"
        msg += f": {grade}."
        await create_notification(user_id=student_id, title=title_text, message=msg)
    
    return {"message": "Grade updated successfully"}

@router.get("/feedback/{class_id}", response_model=List[FeedbackOut])
async def view_class_feedback(class_id: str, teacher: dict = Depends(check_teacher_role)):
    db = get_database()
    target_class = await db.classes.find_one({"_id": class_id, "teacher_id": teacher["_id"]})
    if not target_class:
        raise HTTPException(status_code=403, detail="You do not teach this class")
    return await db.feedback.find({"class_id": class_id}).sort("created_at", -1).to_list(1000)
