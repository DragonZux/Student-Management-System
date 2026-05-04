from fastapi import APIRouter, Depends, HTTPException, Query
from app.dependencies import check_admin_role, get_current_user, check_teacher_or_admin
from app.routers.notifications import create_notification
from app.core.audit import log_audit_event
from app.db.database import get_database
from app.schemas.academic import ExamCreate, ExamOut, ExamUpdate, ExamGrade
from app.schemas.user import UserRole
from datetime import datetime
import uuid

router = APIRouter()

@router.get("")
async def list_exams(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=2000),
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    query = {}
    if current_user["role"] == UserRole.TEACHER:
        teacher_classes = await db.classes.find({"teacher_id": current_user["_id"]}).to_list(1000)
        query["class_id"] = {"$in": [cls["_id"] for cls in teacher_classes]}
    elif current_user["role"] == UserRole.STUDENT:
        enrolled_classes = await db.enrollments.find({"student_id": current_user["_id"], "status": {"$in": ["enrolled", "completed"]}}).to_list(1000)
        query["class_id"] = {"$in": [enrollment["class_id"] for enrollment in enrolled_classes]}
    
    total = await db.exams.count_documents(query)
    exams = await db.exams.find(query).sort("scheduled_at", -1).skip(skip).limit(limit).to_list(limit)

    # Enrich with class/course info
    class_ids = list({e["class_id"] for e in exams if e.get("class_id")})
    if class_ids:
        classes = await db.classes.find({"_id": {"$in": class_ids}}).to_list(len(class_ids))
        class_map = {c["_id"]: c for c in classes}
        
        course_ids = list({c["course_id"] for c in classes if c.get("course_id")})
        if course_ids:
            courses = await db.courses.find({"_id": {"$in": course_ids}}).to_list(len(course_ids))
            course_map = {c["_id"]: c for c in courses}
            
            for e in exams:
                cls = class_map.get(e.get("class_id"))
                if cls:
                    crs = course_map.get(cls.get("course_id"))
                    if crs:
                        e["class_name"] = crs.get("title", "Unknown Subject")
                        e["course_code"] = crs.get("code")
                    else:
                        e["class_name"] = cls.get("room", "Unknown Class")
                        e["course_code"] = None
                else:
                    e["class_name"] = "Unknown"

    return {
        "data": exams,
        "total": total,
        "skip": skip,
        "limit": limit,
    }

@router.post("", response_model=ExamOut)
async def create_exam(payload: ExamCreate, current_user: dict = Depends(check_teacher_or_admin)):
    db = get_database()
    exam = payload.model_dump()
    exam.update({"_id": str(uuid.uuid4()), "created_at": datetime.utcnow()})
    await db.exams.insert_one(exam)
    
    # Notify enrolled students
    enrolled = await db.enrollments.find({"class_id": payload.class_id, "status": "enrolled"}).to_list(1000)
    for enrollment in enrolled:
        # Fixed: create_notification takes (user_id, title, message)
        await create_notification(
            user_id=enrollment["student_id"],
            title="Kỳ thi mới được tạo",
            message=f"Kỳ thi '{payload.title}' đã được lên lịch vào {payload.scheduled_at}"
        )
    
    await log_audit_event(
        action="exam.create",
        actor_id=current_user["_id"],
        actor_role=current_user["role"],
        target_type="exam",
        target_id=exam["_id"]
    )
    return exam

@router.put("/{exam_id}", response_model=ExamOut)
async def update_exam(exam_id: str, payload: ExamUpdate, current_user: dict = Depends(check_teacher_or_admin)):
    db = get_database()
    update_data = payload.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    
    result = await db.exams.update_one({"_id": exam_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    updated = await db.exams.find_one({"_id": exam_id})
    await log_audit_event(
        action="exam.update",
        actor_id=current_user["_id"],
        actor_role=current_user["role"],
        target_type="exam",
        target_id=exam_id
    )
    return updated

@router.delete("/{exam_id}")
async def delete_exam(exam_id: str, current_user: dict = Depends(check_teacher_or_admin)):
    db = get_database()
    result = await db.exams.delete_one({"_id": exam_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    await log_audit_event(
        action="exam.delete",
        actor_id=current_user["_id"],
        actor_role=current_user["role"],
        target_type="exam",
        target_id=exam_id
    )
    return {"message": "Exam deleted successfully"}

@router.post("/{exam_id}/grades")
async def record_exam_grade(exam_id: str, payload: ExamGrade, current_user: dict = Depends(check_teacher_or_admin)):
    db = get_database()
    exam = await db.exams.find_one({"_id": exam_id})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    grades = exam.get("grades", [])
    # Remove existing grade for same student if any
    grades = [grade for grade in grades if grade.get("student_id") != payload.student_id]
    
    new_grade = payload.model_dump()
    new_grade["graded_at"] = datetime.utcnow()
    new_grade["teacher_id"] = current_user["_id"]
    grades.append(new_grade)
    
    await db.exams.update_one({"_id": exam_id}, {"$set": {"grades": grades}})
    
    await create_notification(
        user_id=payload.student_id,
        title="Đã có điểm thi",
        message=f"Bạn đã nhận được điểm cho kỳ thi '{exam.get('title')}': {payload.score}"
    )
    
    await log_audit_event(
        action="exam.grade",
        actor_id=current_user["_id"],
        actor_role=current_user["role"],
        target_type="exam",
        target_id=exam_id,
        metadata={"student_id": payload.student_id, "score": payload.score}
    )
    return {"message": "Grade recorded successfully"}

@router.post("/{exam_id}/submit")
async def record_exam_submission(exam_id: str, payload: dict, student: dict = Depends(get_current_user)):
    db = get_database()
    exam = await db.exams.find_one({"_id": exam_id})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    submissions = exam.get("submissions", [])
    # Check if student already submitted
    existing = next((s for s in submissions if s.get("student_id") == student["_id"]), None)
    
    submission = {
        "student_id": student["_id"],
        "content": payload.get("content"),
        "submitted_at": datetime.utcnow()
    }
    
    if existing:
        # Update existing submission
        for i, s in enumerate(submissions):
            if s.get("student_id") == student["_id"]:
                submissions[i] = submission
                break
    else:
        submissions.append(submission)
        
    await db.exams.update_one({"_id": exam_id}, {"$set": {"submissions": submissions}})
    
    await log_audit_event(
        action="exam.submit",
        actor_id=student["_id"],
        actor_role=student["role"],
        target_type="exam",
        target_id=exam_id
    )
    return {"message": "Submission received successfully"}
