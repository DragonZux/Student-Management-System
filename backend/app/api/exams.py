from datetime import datetime
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import check_admin_role, get_current_user, check_teacher_or_admin
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
async def create_exam(payload: ExamCreate, teacher: dict = Depends(check_teacher_or_admin)):
    db = get_database()
    target_class = await db.classes.find_one({"_id": payload.class_id})
    if not target_class:
        raise HTTPException(status_code=404, detail="Class not found")
    if teacher["role"] == UserRole.TEACHER and target_class.get("teacher_id") != teacher["_id"]:
        raise HTTPException(status_code=403, detail="You do not teach this class")

    exam = payload.model_dump()
    exam.update({"_id": str(uuid.uuid4()), "created_at": datetime.utcnow()})
    await db.exams.insert_one(exam)
    await log_audit_event(
        action="teacher.create_exam",
        actor_id=teacher["_id"],
        actor_role=teacher["role"],
        target_type="exam",
        target_id=exam["_id"],
        metadata={"class_id": payload.class_id},
    )
    return exam


@router.patch("/{exam_id}", response_model=ExamOut)
async def update_exam(exam_id: str, payload: ExamUpdate, teacher: dict = Depends(check_teacher_or_admin)):
    db = get_database()
    current = await db.exams.find_one({"_id": exam_id})
    if not current:
        raise HTTPException(status_code=404, detail="Exam not found")
    if teacher["role"] == UserRole.TEACHER:
        target_class = await db.classes.find_one({"_id": current["class_id"], "teacher_id": teacher["_id"]})
        if not target_class:
            raise HTTPException(status_code=403, detail="You do not teach this class")

    updatable = payload.model_dump(exclude_none=True)
    if not updatable:
        return current
    await db.exams.update_one({"_id": exam_id}, {"$set": updatable})
    updated = await db.exams.find_one({"_id": exam_id})
    await log_audit_event(
        action="exam.update",
        actor_id=teacher["_id"],
        actor_role=teacher["role"],
        target_type="exam",
        target_id=exam_id,
        metadata={"fields": list(updatable.keys())},
    )
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
    return {"message": "Exam grade recorded"}


@router.delete("/{exam_id}")
async def delete_exam(exam_id: str, teacher: dict = Depends(check_teacher_or_admin)):
    db = get_database()
    result = await db.exams.delete_one({"_id": exam_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Exam not found")
    await log_audit_event(
        action="exam.delete",
        actor_id=teacher["_id"],
        actor_role=teacher["role"],
        target_type="exam",
        target_id=exam_id,
    )
    return {"message": "Exam deleted successfully"}