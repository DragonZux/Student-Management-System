from datetime import datetime
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import check_admin_role
from app.core.audit import log_audit_event
from app.db.database import get_database
from app.core.schedule import schedules_conflict
from app.core.security import get_password_hash
from app.routers.notifications import create_notification
from app.schemas.academic import ClassCreate, ClassOut, ClassUpdate, CourseCreate, CourseOut, CourseUpdate
from app.schemas.organization import ClassroomCreate, ClassroomOut, ClassroomUpdate, DepartmentCreate, DepartmentOut, DepartmentUpdate, FeedbackOut, AuditLogOut
from app.schemas.user import UserCreate, UserOut, UserRole, UserUpdate

from fastapi import APIRouter, Depends, HTTPException, Query, Response

router = APIRouter(dependencies=[Depends(check_admin_role)])

# --- Student & Teacher Management ---

@router.post("/users", response_model=UserOut)
async def create_user(user_in: UserCreate):
    db = get_database()
    existing_user = await db.users.find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    user_dict = user_in.model_dump()
    user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
    user_dict["_id"] = str(uuid.uuid4())
    user_dict["created_at"] = datetime.utcnow()

    await db.users.insert_one(user_dict)
    await log_audit_event(
        action="admin.create_user",
        actor_role=UserRole.ADMIN,
        target_type="user",
        target_id=user_dict["_id"],
        metadata={"email": user_dict["email"], "role": user_dict["role"]},
    )
    return user_dict

@router.get("/users")
async def get_users(
    role: Optional[UserRole] = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100)
):
    db = get_database()
    query = {"role": role} if role else {}
    projection = {"hashed_password": 0}
    
    total = await db.users.count_documents(query)
    users = await db.users.find(query, projection).skip(skip).limit(limit).to_list(limit)
    
    return {
        "data": users,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/users/{role}")
async def get_users_by_role(
    role: UserRole,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100)
):
    db = get_database()
    query = {"role": role}
    projection = {"hashed_password": 0}
    
    total = await db.users.count_documents(query)
    users = await db.users.find(query, projection).skip(skip).limit(limit).to_list(limit)
    
    return {
        "data": users,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/dashboard-stats")
async def get_dashboard_stats(response: Response):
    db = get_database()
    counts = await db.users.aggregate([
        {"$group": {"_id": "$role", "count": {"$sum": 1}}}
    ]).to_list(None)
    
    stats = {item["_id"]: item["count"] for item in counts}
    stats["courses"] = await db.courses.count_documents({})
    stats["departments"] = await db.departments.count_documents({})
    
    response.headers["Cache-Control"] = "no-cache, must-revalidate"
    return stats

@router.get("/quick-data")
async def get_admin_quick_data(role: Optional[UserRole] = Query(None)):
    """Lightweight endpoint for fast dashboard summaries"""
    db = get_database()
    query = {"role": role} if role else {}
    
    # Get total count
    total = await db.users.count_documents(query)
    
    # Get a tiny preview (limit 5)
    projection = {"hashed_password": 0}
    users = await db.users.find(query, projection).limit(5).to_list(5)
    
    return {
        "total": total,
        "preview": users
    }

@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(user_id: str, user_in: UserUpdate):
    db = get_database()
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_in.model_dump(exclude_none=True)
    if "email" in update_data:
        existing = await db.users.find_one({"email": update_data["email"], "_id": {"$ne": user_id}})
        if existing:
            raise HTTPException(status_code=400, detail="Email already exists")
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    if not update_data:
        return user

    await db.users.update_one({"_id": user_id}, {"$set": update_data})
    updated = await db.users.find_one({"_id": user_id})
    await log_audit_event(
        action="admin.update_user",
        actor_role=UserRole.ADMIN,
        target_type="user",
        target_id=user_id,
        metadata={"fields": list(update_data.keys())},
    )
    return updated

@router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    db = get_database()
    result = await db.users.delete_one({"_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    await log_audit_event(
        action="admin.delete_user",
        actor_role=UserRole.ADMIN,
        target_type="user",
        target_id=user_id,
    )
    return {"message": "User deleted successfully"}

# --- Course Management ---

@router.post("/courses", response_model=CourseOut)
async def create_course(course: CourseCreate):
    db = get_database()
    existing = await db.courses.find_one({"code": course.code})
    if existing:
        raise HTTPException(status_code=400, detail="Course code already exists")

    if course.prerequisites:
        prereq_count = await db.courses.count_documents({"code": {"$in": course.prerequisites}})
        if prereq_count != len(set(course.prerequisites)):
            raise HTTPException(status_code=400, detail="One or more prerequisite course codes do not exist")

    course_dict = course.model_dump()
    course_dict["_id"] = str(uuid.uuid4())
    await db.courses.insert_one(course_dict)
    await log_audit_event(
        action="admin.create_course",
        actor_role=UserRole.ADMIN,
        target_type="course",
        target_id=course_dict["_id"],
        metadata={"code": course_dict["code"]},
    )
    return course_dict

@router.get("/courses")
async def list_courses(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100)
):
    db = get_database()
    total = await db.courses.count_documents({})
    courses = await db.courses.find().skip(skip).limit(limit).to_list(limit)
    return {
        "data": courses,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.patch("/courses/{course_id}", response_model=CourseOut)
async def update_course(course_id: str, payload: CourseUpdate):
    db = get_database()
    current = await db.courses.find_one({"_id": course_id})
    if not current:
        raise HTTPException(status_code=404, detail="Course not found")

    updatable = payload.model_dump(exclude_none=True)
    if not updatable:
        return current

    if "code" in updatable and updatable["code"] != current["code"]:
        code_exists = await db.courses.find_one({"code": updatable["code"], "_id": {"$ne": course_id}})
        if code_exists:
            raise HTTPException(status_code=400, detail="Course code already exists")

    if "prerequisites" in updatable:
        prereqs = updatable["prerequisites"] or []
        effective_code = updatable.get("code", current["code"])
        if effective_code in prereqs:
            raise HTTPException(status_code=400, detail="A course cannot require itself as prerequisite")
        prereq_count = await db.courses.count_documents({"code": {"$in": prereqs}})
        if prereq_count != len(set(prereqs)):
            raise HTTPException(status_code=400, detail="One or more prerequisite course codes do not exist")

    await db.courses.update_one({"_id": course_id}, {"$set": updatable})
    updated = await db.courses.find_one({"_id": course_id})
    await log_audit_event(
        action="admin.update_course",
        actor_role=UserRole.ADMIN,
        target_type="course",
        target_id=course_id,
        metadata={"fields": list(updatable.keys())},
    )
    return updated

@router.delete("/courses/{course_id}")
async def delete_course(course_id: str):
    db = get_database()
    linked_classes = await db.classes.count_documents({"course_id": course_id})
    if linked_classes > 0:
        raise HTTPException(status_code=400, detail="Cannot delete course with existing classes")
    result = await db.courses.delete_one({"_id": course_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    await log_audit_event(
        action="admin.delete_course",
        actor_role=UserRole.ADMIN,
        target_type="course",
        target_id=course_id,
    )
    return {"message": "Course deleted successfully"}

# --- Class Management ---

async def _assert_class_no_conflict(
    db,
    *,
    class_id: Optional[str],
    teacher_id: str,
    room: str,
    semester: str,
    schedule: List[dict],
):
    query = {"semester": semester, "$or": [{"teacher_id": teacher_id}, {"room": room}]}
    if class_id:
        query["_id"] = {"$ne": class_id}
    candidate_classes = await db.classes.find(query).to_list(1000)
    for existing in candidate_classes:
        if not schedules_conflict(existing.get("schedule", []), schedule):
            continue
        if existing.get("teacher_id") == teacher_id:
            raise HTTPException(status_code=400, detail="Schedule conflict: teacher has another class at this time")
        if existing.get("room") == room:
            raise HTTPException(status_code=400, detail="Schedule conflict: room is occupied at this time")

@router.post("/classes", response_model=ClassOut)
async def create_class(class_data: ClassCreate):
    db = get_database()
    # Check if course exists
    course = await db.courses.find_one({"_id": class_data.course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if teacher exists and is a teacher
    teacher = await db.users.find_one({"_id": class_data.teacher_id, "role": UserRole.TEACHER})
    if not teacher:
        raise HTTPException(status_code=400, detail="Valid Teacher not found")

    await _assert_class_no_conflict(
        db,
        class_id=None,
        teacher_id=class_data.teacher_id,
        room=class_data.room,
        semester=class_data.semester,
        schedule=class_data.schedule,
    )

    class_dict = class_data.model_dump()
    class_dict["_id"] = str(uuid.uuid4())
    class_dict["current_enrollment"] = 0
    
    await db.classes.insert_one(class_dict)
    await log_audit_event(
        action="admin.create_class",
        actor_role=UserRole.ADMIN,
        target_type="class",
        target_id=class_dict["_id"],
        metadata={"course_id": class_dict["course_id"], "teacher_id": class_dict["teacher_id"], "room": class_dict["room"]},
    )
    return class_dict

@router.get("/classes")
async def list_classes(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100)
):
    db = get_database()
    total = await db.classes.count_documents({})
    classes = await db.classes.find().skip(skip).limit(limit).to_list(limit)
    return {
        "data": classes,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.patch("/classes/{class_id}", response_model=ClassOut)
async def update_class(class_id: str, payload: ClassUpdate):
    db = get_database()
    current = await db.classes.find_one({"_id": class_id})
    if not current:
        raise HTTPException(status_code=404, detail="Class not found")

    updatable = payload.model_dump(exclude_none=True)
    if not updatable:
        return current

    next_teacher = updatable.get("teacher_id", current["teacher_id"])
    next_room = updatable.get("room", current["room"])
    next_semester = updatable.get("semester", current["semester"])
    next_schedule = updatable.get("schedule", current.get("schedule", []))
    if "teacher_id" in updatable:
        teacher = await db.users.find_one({"_id": next_teacher, "role": UserRole.TEACHER})
        if not teacher:
            raise HTTPException(status_code=400, detail="Valid Teacher not found")

    if "capacity" in updatable and updatable["capacity"] < current.get("current_enrollment", 0):
        raise HTTPException(status_code=400, detail="Capacity cannot be lower than current enrollment")

    await _assert_class_no_conflict(
        db,
        class_id=class_id,
        teacher_id=next_teacher,
        room=next_room,
        semester=next_semester,
        schedule=next_schedule,
    )

    await db.classes.update_one({"_id": class_id}, {"$set": updatable})
    updated = await db.classes.find_one({"_id": class_id})
    await log_audit_event(
        action="admin.update_class",
        actor_role=UserRole.ADMIN,
        target_type="class",
        target_id=class_id,
        metadata={"fields": list(updatable.keys())},
    )
    return updated

@router.delete("/classes/{class_id}")
async def delete_class(class_id: str):
    db = get_database()
    active_enrollments = await db.enrollments.count_documents({"class_id": class_id, "status": "enrolled"})
    if active_enrollments > 0:
        raise HTTPException(status_code=400, detail="Cannot delete class with active enrollments")

    result = await db.classes.delete_one({"_id": class_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Class not found")
    await log_audit_event(
        action="admin.delete_class",
        actor_role=UserRole.ADMIN,
        target_type="class",
        target_id=class_id,
    )
    return {"message": "Class deleted successfully"}

# --- Departments / Faculties ---

@router.post("/departments", response_model=DepartmentOut)
async def create_department(payload: DepartmentCreate):
    db = get_database()
    existing = await db.departments.find_one({"name": payload.name})
    if existing:
        raise HTTPException(status_code=400, detail="Department already exists")

    department = {
        "_id": str(uuid.uuid4()),
        "name": payload.name,
        "faculty": payload.faculty,
        "description": payload.description,
        "created_at": datetime.utcnow(),
    }
    await db.departments.insert_one(department)
    await log_audit_event(
        action="admin.create_department",
        actor_role=UserRole.ADMIN,
        target_type="department",
        target_id=department["_id"],
    )
    return department

@router.get("/departments", response_model=List[dict])
async def list_departments(response: Response):
    db = get_database()
    response.headers["Cache-Control"] = "public, max-age=300"
    return await db.departments.find().to_list(1000)

@router.patch("/departments/{department_id}", response_model=DepartmentOut)
async def update_department(department_id: str, payload: DepartmentUpdate):
    db = get_database()
    updatable = payload.model_dump(exclude_none=True)
    if not updatable:
        dept = await db.departments.find_one({"_id": department_id})
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found")
        return dept

    if "name" in updatable:
        conflict = await db.departments.find_one({"name": updatable["name"], "_id": {"$ne": department_id}})
        if conflict:
            raise HTTPException(status_code=400, detail="Department name already exists")

    result = await db.departments.update_one({"_id": department_id}, {"$set": updatable})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Department not found")
    updated = await db.departments.find_one({"_id": department_id})
    await log_audit_event(
        action="admin.update_department",
        actor_role=UserRole.ADMIN,
        target_type="department",
        target_id=department_id,
        metadata={"fields": list(updatable.keys())},
    )
    return updated

@router.delete("/departments/{department_id}")
async def delete_department(department_id: str):
    db = get_database()
    result = await db.departments.delete_one({"_id": department_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Department not found")
    await log_audit_event(
        action="admin.delete_department",
        actor_role=UserRole.ADMIN,
        target_type="department",
        target_id=department_id,
    )
    return {"message": "Department deleted successfully"}

# --- Classrooms / Infrastructure ---

@router.post("/classrooms", response_model=ClassroomOut)
async def create_classroom(payload: ClassroomCreate):
    db = get_database()
    existing = await db.classrooms.find_one({"code": payload.code})
    if existing:
        raise HTTPException(status_code=400, detail="Classroom code already exists")

    classroom = {
        "_id": str(uuid.uuid4()),
        "code": payload.code,
        "building": payload.building,
        "capacity": payload.capacity,
        "facilities": payload.facilities,
        "created_at": datetime.utcnow(),
    }
    await db.classrooms.insert_one(classroom)
    await log_audit_event(
        action="admin.create_classroom",
        actor_role=UserRole.ADMIN,
        target_type="classroom",
        target_id=classroom["_id"],
    )
    return classroom

@router.get("/classrooms")
async def list_classrooms(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100)
):
    db = get_database()
    total = await db.classrooms.count_documents({})
    rooms = await db.classrooms.find().skip(skip).limit(limit).to_list(limit)
    return {
        "data": rooms,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.patch("/classrooms/{classroom_id}", response_model=ClassroomOut)
async def update_classroom(classroom_id: str, payload: ClassroomUpdate):
    db = get_database()
    updatable = payload.model_dump(exclude_none=True)
    if not updatable:
        room = await db.classrooms.find_one({"_id": classroom_id})
        if not room:
            raise HTTPException(status_code=404, detail="Classroom not found")
        return room

    if "code" in updatable:
        code_exists = await db.classrooms.find_one({"code": updatable["code"], "_id": {"$ne": classroom_id}})
        if code_exists:
            raise HTTPException(status_code=400, detail="Classroom code already exists")

    result = await db.classrooms.update_one({"_id": classroom_id}, {"$set": updatable})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Classroom not found")
    updated = await db.classrooms.find_one({"_id": classroom_id})
    await log_audit_event(
        action="admin.update_classroom",
        actor_role=UserRole.ADMIN,
        target_type="classroom",
        target_id=classroom_id,
        metadata={"fields": list(updatable.keys())},
    )
    return updated

@router.delete("/classrooms/{classroom_id}")
async def delete_classroom(classroom_id: str):
    db = get_database()
    result = await db.classrooms.delete_one({"_id": classroom_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Classroom not found")
    await log_audit_event(
        action="admin.delete_classroom",
        actor_role=UserRole.ADMIN,
        target_type="classroom",
        target_id=classroom_id,
    )
    return {"message": "Classroom deleted successfully"}

# --- Audit Logs ---

@router.get("/audit-logs")
async def list_audit_logs(
    action: Optional[str] = None, 
    actor_id: Optional[str] = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200)
):
    db = get_database()
    query = {}
    if action:
        query["action"] = action
    if actor_id:
        query["actor_id"] = actor_id
    
    total = await db.audit_logs.count_documents(query)
    logs = await db.audit_logs.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return {
        "data": logs,
        "total": total,
        "skip": skip,
        "limit": limit
    }

# --- Feedback/Survey (admin visibility) ---

# --- Withdrawal Requests Management ---

@router.get("/withdrawal-requests")
async def list_withdrawal_requests(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100)
):
    db = get_database()
    query = {"status": "withdrawal_pending"}
    total = await db.enrollments.count_documents(query)
    requests = await db.enrollments.find(query).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with student and class/course info
    enriched = []
    for req in requests:
        student = await db.users.find_one({"_id": req["student_id"]})
        cls = await db.classes.find_one({"_id": req["class_id"]})
        course = await db.courses.find_one({"_id": cls["course_id"]}) if cls else None
        
        enriched.append({
            "enrollment_id": req["_id"],
            "student_name": student.get("full_name") if student else "Unknown",
            "student_email": student.get("email") if student else "Unknown",
            "course_code": course.get("code") if course else "Unknown",
            "course_title": course.get("title") if course else "Unknown",
            "reason": req.get("withdrawal_reason"),
            "requested_at": req.get("withdrawal_requested_at"),
            "class_id": req["class_id"]
        })
    return {
        "data": enriched,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.post("/withdrawal-requests/{enrollment_id}/approve")
async def approve_withdrawal(enrollment_id: str):
    db = get_database()
    enrollment = await db.enrollments.find_one({"_id": enrollment_id, "status": "withdrawal_pending"})
    if not enrollment:
        raise HTTPException(status_code=404, detail="Withdrawal request not found or already processed")
    cls = await db.classes.find_one({"_id": enrollment["class_id"]})
    
    # 1. Update enrollment status to withdrawn
    await db.enrollments.update_one(
        {"_id": enrollment_id},
        {"$set": {"status": "withdrawn", "withdrawn_at": datetime.utcnow()}}
    )
    
    # 2. Decrement class current_enrollment
    await db.classes.update_one(
        {"_id": enrollment["class_id"]},
        {"$inc": {"current_enrollment": -1}}
    )
    
    await log_audit_event(
        action="admin.approve_withdrawal",
        actor_role=UserRole.ADMIN,
        target_type="enrollment",
        target_id=enrollment_id,
        metadata={"student_id": enrollment["student_id"], "class_id": enrollment["class_id"]},
    )
    
    # 3. Notify student (Optional but good)
    await create_notification(
        user_id=enrollment["student_id"],
        title="Yêu cầu rút học phần đã được phê duyệt",
        message="Yêu cầu rút học phần của bạn đã được phê duyệt thành công.",
    )

    teacher_id = cls.get("teacher_id") if cls else None
    if teacher_id:
        await create_notification(
            user_id=teacher_id,
            title="Yêu cầu rút học phần đã được phê duyệt",
            message=f"Một yêu cầu rút học phần của sinh viên đã được phê duyệt cho lớp {enrollment['class_id']}.",
        )
    
    return {"message": "Withdrawal approved successfully"}

@router.post("/withdrawal-requests/{enrollment_id}/reject")
async def reject_withdrawal(enrollment_id: str, payload: dict):
    db = get_database()
    enrollment = await db.enrollments.find_one({"_id": enrollment_id, "status": "withdrawal_pending"})
    if not enrollment:
        raise HTTPException(status_code=404, detail="Withdrawal request not found or already processed")
    cls = await db.classes.find_one({"_id": enrollment["class_id"]})
    
    reason = payload.get("reason", "Yêu cầu không được chấp nhận bởi quản trị viên.")
    
    # Set status back to enrolled
    await db.enrollments.update_one(
        {"_id": enrollment_id},
        {"$set": {"status": "enrolled"}}
    )
    
    await log_audit_event(
        action="admin.reject_withdrawal",
        actor_role=UserRole.ADMIN,
        target_type="enrollment",
        target_id=enrollment_id,
        metadata={"student_id": enrollment["student_id"], "reason": reason},
    )
    
    # Notify student
    await create_notification(
        user_id=enrollment["student_id"],
        title="Yêu cầu rút học phần bị từ chối",
        message=f"Yêu cầu rút học phần của bạn bị từ chối. Lý do: {reason}",
    )

    teacher_id = cls.get("teacher_id") if cls else None
    if teacher_id:
        await create_notification(
            user_id=teacher_id,
            title="Yêu cầu rút học phần bị từ chối",
            message=f"Một yêu cầu rút học phần của sinh viên đã bị từ chối cho lớp {enrollment['class_id']}. Lý do: {reason}",
        )
    
    return {"message": "Withdrawal request rejected"}
