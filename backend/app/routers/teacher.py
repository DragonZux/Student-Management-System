from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List
from app.dependencies import get_current_user, check_teacher_role
from app.routers.notifications import create_notification
from app.core.audit import log_audit_event
from app.db.database import get_database
from app.schemas.academic import AssignmentCreate, AttendanceCreate, AttendanceOut, AttendanceRecord, ExamGrade
from app.schemas.organization import FeedbackOut
from app.schemas.user import UserRole
from datetime import datetime, timezone
import uuid

router = APIRouter(dependencies=[Depends(check_teacher_role)], redirect_slashes=False)


@router.get("/dashboard-summary")
async def get_teacher_dashboard_summary(teacher: dict = Depends(check_teacher_role)):
    db = get_database()
    classes = await db.classes.find({"teacher_id": teacher["_id"]}).to_list(1000)
    class_ids = [item["_id"] for item in classes]
    course_ids = {item.get("course_id") for item in classes if item.get("course_id")}
    courses = await db.courses.find({"_id": {"$in": list(course_ids)}}).to_list(1000) if course_ids else []
    course_by_id = {item["_id"]: item for item in courses}

    # Use exams instead of assignments
    exams = await db.exams.find({"class_id": {"$in": class_ids}}).to_list(2000) if class_ids else []
    
    pending_grading = 0
    for exam in exams:
        submissions = exam.get("submissions", [])
        # We consider grading "pending" if there are submissions but not all have been processed (this is a simple heuristic)
        # For a better metric, we'd need to compare enrollment counts with submission grades
        # But for now, let's just count total submissions in exams that might need review
        pending_grading += len(submissions)

    enrollments = await db.enrollments.find({"class_id": {"$in": class_ids}}).to_list(5000) if class_ids else []
    feedback_count = await db.feedback.count_documents({"class_id": {"$in": class_ids}}) if class_ids else 0

    graded_count = sum(1 for item in enrollments if item.get("grade") is not None)
    completion_rate = round((graded_count / len(enrollments)) * 100, 2) if enrollments else 0

    today_idx = datetime.now(timezone.utc).weekday()
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
        "total_assignments": len(exams), # Return exams count as 'assignments' for UI compatibility
        "pending_grading": pending_grading,
        "feedback_count": feedback_count,
        "graded_count": graded_count,
        "enrollment_count": len(enrollments),
        "completion_rate": completion_rate,
        "today": today_label,
        "today_classes": today_classes,
    }

@router.get("")
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
async def list_class_students(
    class_id: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=2000),
    teacher: dict = Depends(check_teacher_role),
):
    db = get_database()
    target_class = await db.classes.find_one({"_id": class_id, "teacher_id": teacher["_id"]})
    if not target_class:
        raise HTTPException(status_code=403, detail="You do not teach this class")
    query = {"class_id": class_id}
    total = await db.enrollments.count_documents(query)
    enrollments = await db.enrollments.find(query).skip(skip).limit(limit).to_list(limit)
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
    return {
        "data": items,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


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
        "recorded_at": datetime.now(timezone.utc),
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

@router.get("/attendance/{class_id}")
async def list_attendance(class_id: str, teacher: dict = Depends(check_teacher_role)):
    db = get_database()
    target_class = await db.classes.find_one({"_id": class_id, "teacher_id": teacher["_id"]})
    if not target_class:
        raise HTTPException(status_code=403, detail="You do not teach this class")
    return await db.attendance.find({"class_id": class_id}).sort("date", -1).to_list(200)

# --- Grading ---

@router.post("/grade/{enrollment_id}")
async def grade_student(
    enrollment_id: str,
    grade: float = None, # Legacy final grade
    score_attendance: float = None,
    score_midterm: float = None,
    score_final: float = None,
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
    
    # Get course weights if possible
    cls = await db.classes.find_one({"_id": enrollment["class_id"]})
    course = await db.courses.find_one({"_id": cls.get("course_id")}) if cls else None
    
    weights = None
    if course:
        weights = {
            "attendance": course.get("weight_attendance", 0.1),
            "midterm": course.get("weight_midterm", 0.3),
            "final": course.get("weight_final", 0.6)
        }

    from app.core.grading import calculate_enrollment_grade, map_score_to_letter
    
    # Get current enrollment data to preserve existing scores
    att = score_attendance if score_attendance is not None else enrollment.get("score_attendance")
    mid = score_midterm if score_midterm is not None else enrollment.get("score_midterm")
    fin = score_final if score_final is not None else enrollment.get("score_final")
    
    update_data = {
        "score_attendance": att,
        "score_midterm": mid,
        "score_final": fin,
        "teacher_comments": comments or enrollment.get("teacher_comments"),
        "graded_at": datetime.now(timezone.utc),
        "grading_weights": weights
    }

    # Calculate final grade only if ALL components are present
    if fin is not None and att is not None and mid is not None:
        calc_result = calculate_enrollment_grade(att, mid, fin, weights)
        final_info = calc_result["result"]
        update_data.update({
            "grade": final_info["point_4"],
            "score_10": final_info["score_10"],
            "letter_grade": final_info["letter"],
            "is_passed": final_info["is_passed"],
            "status": "completed"
        })
    elif grade is not None:
        # Legacy support
        final_info = map_score_to_letter(grade)
        update_data.update({
            "grade": final_info["point_4"],
            "score_10": final_info["score_10"],
            "letter_grade": final_info["letter"],
            "is_passed": final_info["is_passed"],
            "status": "completed"
        })
    
    await db.enrollments.update_one({"_id": enrollment_id}, {"$set": update_data})
    
    await log_audit_event(
        action="teacher.grade_student",
        actor_id=teacher["_id"],
        actor_role=teacher["role"],
        target_type="enrollment",
        target_id=enrollment_id,
        metadata={"midterm": score_midterm, "final": score_final},
    )

    # Notify student only on final grade
    if fin is not None or grade is not None:
        student_id = enrollment.get("student_id")
        if student_id:
            # (Notification logic remains similar but safe)
            await create_notification(
                user_id=student_id, 
                title="CẬP NHẬT ĐIỂM TỔNG KẾT", 
                message=f"Điểm tổng kết của bạn đã được chốt.",
                link="/student/grades"
            )
    
    return {"message": "Grade updated successfully"}

@router.get("/feedback/{class_id}")
async def view_class_feedback(
    class_id: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=2000),
    teacher: dict = Depends(check_teacher_role),
):
    db = get_database()
    target_class = await db.classes.find_one({"_id": class_id, "teacher_id": teacher["_id"]})
    if not target_class:
        raise HTTPException(status_code=403, detail="You do not teach this class")
    query = {"class_id": class_id}
    total = await db.feedback.count_documents(query)
    items = await db.feedback.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    for f in items:
        created_at = f.get("created_at")
        if created_at and isinstance(created_at, datetime) and created_at.tzinfo is None:
            f["created_at"] = created_at.replace(tzinfo=timezone.utc)

    return {
        "data": items,
        "total": total,
        "skip": skip,
        "limit": limit,
    }
