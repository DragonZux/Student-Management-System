from datetime import datetime
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import check_admin_role, get_current_user, check_teacher_or_admin
from app.api.notifications import create_notification
from app.core.audit import log_audit_event
from app.core.database import get_database
from app.schemas.academic import ExamCreate, ExamOut, ExamUpdate, ExamGrade
from app.schemas.user import UserRole

router = APIRouter()


@router.get("/", response_model=List[ExamOut])
async def list_exams(current_user: dict = Depends(get_current_user)):
    db = get_database()
    query = {}
    if current_user["role"] == UserRole.TEACHER:
        teacher_classes = await db.classes.find({"teacher_id": current_user["_id"]}).to_list(1000)
        query["class_id"] = {"$in": [cls["_id"] for cls in teacher_classes]}
    elif current_user["role"] == UserRole.STUDENT:
        enrolled_classes = await db.enrollments.find({"student_id": current_user["_id"], "status": {"$in": ["enrolled", "completed"]}}).to_list(1000)
        query["class_id"] = {"$in": [enrollment["class_id"] for enrollment in enrolled_classes]}
    return await db.exams.find(query).sort("scheduled_at", -1).to_list(1000)


@router.post("/", response_model=ExamOut)
async def create_exam(payload: ExamCreate, admin: dict = Depends(check_admin_role)):
    db = get_database()
    target_class = await db.classes.find_one({"_id": payload.class_id})
    if not target_class:
        raise HTTPException(status_code=404, detail="Class not found")

    exam = payload.model_dump()
    exam.update({"_id": str(uuid.uuid4()), "created_at": datetime.utcnow()})
    await db.exams.insert_one(exam)
    await log_audit_event(
        action="admin.create_exam",
        actor_id=admin["_id"],
        actor_role=admin["role"],
        target_type="exam",
        target_id=exam["_id"],
        metadata={"class_id": payload.class_id},
    )

    # Notify teacher + enrolled students about new exam
    course = await db.courses.find_one({"_id": target_class.get("course_id")}) if target_class.get("course_id") else None
    course_label = ""
    if course:
        code = course.get("code") or ""
        t = course.get("title") or ""
        course_label = f"{code} - {t}".strip(" -")
    label = course_label or f"Lớp {payload.class_id}"
    scheduled = exam.get("scheduled_at")
    scheduled_text = scheduled.strftime("%Y-%m-%d %H:%M") if hasattr(scheduled, "strftime") else str(scheduled)
    title_text = "Lịch thi mới"
    message = f"Đã tạo lịch thi mới cho {label}. Thời gian: {scheduled_text}."

    teacher_id = target_class.get("teacher_id")
    if teacher_id:
        await create_notification(user_id=teacher_id, title=title_text, message=message)

    enrollments = await db.enrollments.find({"class_id": payload.class_id, "status": {"$in": ["enrolled", "completed"]}}).to_list(5000)
    student_ids = {e.get("student_id") for e in enrollments if e.get("student_id")}
    for sid in student_ids:
        await create_notification(user_id=sid, title=title_text, message=message)
    return exam


@router.patch("/{exam_id}", response_model=ExamOut)
async def update_exam(exam_id: str, payload: ExamUpdate, admin: dict = Depends(check_admin_role)):
    db = get_database()
    current = await db.exams.find_one({"_id": exam_id})
    if not current:
        raise HTTPException(status_code=404, detail="Exam not found")

    updatable = payload.model_dump(exclude_none=True)
    if not updatable:
        return current
    await db.exams.update_one({"_id": exam_id}, {"$set": updatable})
    updated = await db.exams.find_one({"_id": exam_id})
    await log_audit_event(
        action="admin.update_exam",
        actor_id=admin["_id"],
        actor_role=admin["role"],
        target_type="exam",
        target_id=exam_id,
        metadata={"fields": list(updatable.keys())},
    )

    # Notify teacher + enrolled students about exam update (schedule/room/etc.)
    target_class = await db.classes.find_one({"_id": updated.get("class_id")}) if updated and updated.get("class_id") else None
    if target_class:
        course = await db.courses.find_one({"_id": target_class.get("course_id")}) if target_class.get("course_id") else None
        course_label = ""
        if course:
            code = course.get("code") or ""
            t = course.get("title") or ""
            course_label = f"{code} - {t}".strip(" -")
        label = course_label or f"Lớp {updated.get('class_id')}"
        scheduled = updated.get("scheduled_at")
        scheduled_text = scheduled.strftime("%Y-%m-%d %H:%M") if hasattr(scheduled, "strftime") else str(scheduled)
        title_text = "Cập nhật lịch thi"
        message = f"Lịch thi của {label} vừa được cập nhật. Thời gian: {scheduled_text}."

        teacher_id = target_class.get("teacher_id")
        if teacher_id:
            await create_notification(user_id=teacher_id, title=title_text, message=message)

        enrollments = await db.enrollments.find({"class_id": updated.get("class_id"), "status": {"$in": ["enrolled", "completed"]}}).to_list(5000)
        student_ids = {e.get("student_id") for e in enrollments if e.get("student_id")}
        for sid in student_ids:
            await create_notification(user_id=sid, title=title_text, message=message)
    return updated


@router.post("/{exam_id}/grades")
async def record_exam_grade(exam_id: str, payload: ExamGrade, teacher: dict = Depends(check_teacher_or_admin)):
    db = get_database()
    exam = await db.exams.find_one({"_id": exam_id})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    target_class = await db.classes.find_one({"_id": exam["class_id"], "teacher_id": teacher["_id"]})
    if teacher["role"] == UserRole.TEACHER and not target_class:
        raise HTTPException(status_code=403, detail="You do not teach this class")

    grades = exam.get("grades", [])
    grades = [grade for grade in grades if grade.get("student_id") != payload.student_id]
    grade_item = payload.model_dump()
    grade_item["graded_at"] = grade_item.get("graded_at") or datetime.utcnow()
    grades.append(grade_item)
    await db.exams.update_one({"_id": exam_id}, {"$set": {"grades": grades}})
    await log_audit_event(
        action="exam.record_grade",
        actor_id=teacher["_id"],
        actor_role=teacher["role"],
        target_type="exam",
        target_id=exam_id,
        metadata={"student_id": payload.student_id, "score": payload.score},
    )

    # Notify the student about their exam score
    target_class = await db.classes.find_one({"_id": exam.get("class_id")}) if exam.get("class_id") else None
    course = await db.courses.find_one({"_id": target_class.get("course_id")}) if target_class and target_class.get("course_id") else None
    course_label = ""
    if course:
        code = course.get("code") or ""
        t = course.get("title") or ""
        course_label = f"{code} - {t}".strip(" -")
    label = course_label or f"Lớp {exam.get('class_id')}"
    await create_notification(
        user_id=payload.student_id,
        title="Có điểm thi mới",
        message=f"Điểm thi của bạn cho {label} đã được cập nhật: {payload.score}.",
    )
    return {"message": "Exam grade recorded"}


@router.post("/{exam_id}/submit")
async def record_exam_submission(exam_id: str, payload: dict, student: dict = Depends(get_current_user)):
    db = get_database()
    exam = await db.exams.find_one({"_id": exam_id})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # 1. Check enrollment
    enrollment = await db.enrollments.find_one({"student_id": student["_id"], "class_id": exam["class_id"]})
    if not enrollment:
        raise HTTPException(status_code=403, detail="You are not enrolled in the class for this exam")

    # 2. Check timing (optional but recommended)
    # scheduled_at = exam["scheduled_at"]
    # ... logic to check if current time is within duration ...

    content = payload.get("content")
    if not content or not str(content).strip():
        raise HTTPException(status_code=400, detail="Submission content cannot be empty")

    submission = {
        "student_id": student["_id"],
        "content": str(content).strip(),
        "submitted_at": datetime.utcnow()
    }

    # Add to submissions list (remove previous if exists)
    submissions = exam.get("submissions", [])
    submissions = [s for s in submissions if s.get("student_id") != student["_id"]]
    submissions.append(submission)
    
    await db.exams.update_one({"_id": exam_id}, {"$set": {"submissions": submissions}})
    
    await log_audit_event(
        action="student.submit_exam",
        actor_id=student["_id"],
        actor_role=student["role"],
        target_type="exam",
        target_id=exam_id,
        metadata={"content_length": len(submission["content"])},
    )
    
    return {"message": "Exam submitted successfully"}


@router.delete("/{exam_id}")
async def delete_exam(exam_id: str, admin: dict = Depends(check_admin_role)):
    db = get_database()
    exam = await db.exams.find_one({"_id": exam_id})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    result = await db.exams.delete_one({"_id": exam_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Exam not found")
    await log_audit_event(
        action="admin.delete_exam",
        actor_id=admin["_id"],
        actor_role=admin["role"],
        target_type="exam",
        target_id=exam_id,
    )
    return {"message": "Exam deleted successfully"}