from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from typing import List
from app.dependencies import get_current_user, check_student_role
from app.routers.notifications import create_notification
from app.core.audit import log_audit_event
from app.db.database import get_database
from app.schemas.academic import AttendanceOut, EnrollmentOut, SubmissionCreate
from app.schemas.organization import FeedbackCreate, FeedbackOut
from app.schemas.user import UserRole
from datetime import datetime
import uuid

router = APIRouter(dependencies=[Depends(check_student_role)])


async def _fetch_classes_by_ids(db, class_ids):
    unique_ids = list({class_id for class_id in class_ids if class_id})
    if not unique_ids:
        return {}
    classes = await db.classes.find({"_id": {"$in": unique_ids}}).to_list(len(unique_ids))
    return {item["_id"]: item for item in classes}


async def _fetch_courses_by_ids(db, course_ids):
    unique_ids = list({course_id for course_id in course_ids if course_id})
    if not unique_ids:
        return {}
    courses = await db.courses.find({"_id": {"$in": unique_ids}}).to_list(len(unique_ids))
    return {item["_id"]: item for item in courses}


def _build_simple_pdf(lines: List[str]) -> bytes:
    escaped = [line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)") for line in lines]
    content = ["BT", "/F1 10 Tf", "50 800 Td"]
    for idx, line in enumerate(escaped):
        if idx == 0:
            content.append(f"({line}) Tj")
        else:
            content.append("0 -14 Td")
            content.append(f"({line}) Tj")
    content.append("ET")
    stream_text = "\n".join(content).encode("latin-1", "replace")

    objects = []
    objects.append(b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj")
    objects.append(b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj")
    objects.append(b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj")
    objects.append(f"4 0 obj << /Length {len(stream_text)} >> stream\n".encode("latin-1") + stream_text + b"\nendstream endobj")
    objects.append(b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj")

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for obj in objects:
        offsets.append(len(pdf))
        pdf.extend(obj)
        pdf.extend(b"\n")

    xref_start = len(pdf)
    pdf.extend(f"xref\n0 {len(offsets)}\n".encode("latin-1"))
    pdf.extend(b"0000000000 65535 f \n")
    for off in offsets[1:]:
        pdf.extend(f"{off:010d} 00000 n \n".encode("latin-1"))
    pdf.extend(f"trailer << /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF".encode("latin-1"))
    return bytes(pdf)

@router.get("/available-classes")
async def list_available_classes(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=2000),
    student: dict = Depends(check_student_role),
):
    """
    List classes the student can enroll in (excluding already-enrolled classes).
    """
    db = get_database()
    enrolled_class_ids = set(await db.enrollments.distinct("class_id", {"student_id": student["_id"]}))
    query = {"_id": {"$nin": list(enrolled_class_ids)}}
    total = await db.classes.count_documents(query)
    classes = await db.classes.find(query).skip(skip).limit(limit).to_list(limit)
    # Enrich with course/teacher info for UI
    teacher_ids = {c.get("teacher_id") for c in classes if c.get("teacher_id")}
    course_ids = {c.get("course_id") for c in classes if c.get("course_id")}
    teachers = await db.users.find({"_id": {"$in": list(teacher_ids)}}).to_list(1000) if teacher_ids else []
    courses = await db.courses.find({"_id": {"$in": list(course_ids)}}).to_list(1000) if course_ids else []
    teacher_by_id = {t["_id"]: t for t in teachers}
    course_by_id = {c["_id"]: c for c in courses}
    for cls in classes:
        t = teacher_by_id.get(cls.get("teacher_id"))
        crs = course_by_id.get(cls.get("course_id"))
        cls["teacher_name"] = t.get("full_name") if t else None
        cls["course_code"] = crs.get("code") if crs else None
        cls["course_title"] = crs.get("title") if crs else None
    return {
        "data": classes,
        "total": total,
        "skip": skip,
        "limit": limit,
    }

@router.get("/my-enrollments")
async def list_my_enrollments(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=2000),
    student: dict = Depends(check_student_role),
):
    db = get_database()
    query = {"student_id": student["_id"]}
    total = await db.enrollments.count_documents(query)
    enrollments = await db.enrollments.find(query).sort("enrolled_at", -1).skip(skip).limit(limit).to_list(limit)
    class_ids = [e["class_id"] for e in enrollments]
    classes = await db.classes.find({"_id": {"$in": class_ids}}).to_list(1000) if class_ids else []
    class_by_id = {c["_id"]: c for c in classes}
    course_ids = {c.get("course_id") for c in classes if c.get("course_id")}
    courses = await db.courses.find({"_id": {"$in": list(course_ids)}}).to_list(1000) if course_ids else []
    course_by_id = {c["_id"]: c for c in courses}
    items = []
    for e in enrollments:
        cls = class_by_id.get(e["class_id"])
        crs = course_by_id.get(cls.get("course_id")) if cls else None
        items.append({
            **e,
            "class": cls,
            "course": crs,
        })
    return {
        "data": items,
        "total": total,
        "skip": skip,
        "limit": limit,
    }

@router.get("/my-assignments")
async def list_my_assignments(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=2000),
    student: dict = Depends(check_student_role),
):
    db = get_database()
    class_ids = await db.enrollments.distinct("class_id", {"student_id": student["_id"], "status": {"$in": ["enrolled", "completed"]}})
    query = {"class_id": {"$in": class_ids}} if class_ids else {"class_id": {"$in": []}}
    total = await db.assignments.count_documents(query)
    assignments = await db.assignments.find(query).sort("deadline", 1).skip(skip).limit(limit).to_list(limit) if class_ids else []
    return {
        "data": assignments,
        "total": total,
        "skip": skip,
        "limit": limit,
    }

@router.get("/my-submissions")
async def list_my_submissions(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=2000),
    student: dict = Depends(check_student_role),
):
    db = get_database()
    query = {"student_id": student["_id"]}
    total = await db.submissions.count_documents(query)
    submissions = await db.submissions.find(query).sort("submitted_at", -1).skip(skip).limit(limit).to_list(limit)
    return {
        "data": submissions,
        "total": total,
        "skip": skip,
        "limit": limit,
    }

@router.post("/enroll/{class_id}")
async def enroll_in_class(
    class_id: str, 
    student: dict = Depends(check_student_role)
):
    db = get_database()
    
    # 1. Check if class exists
    target_class = await db.classes.find_one({"_id": class_id})
    if not target_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # 2. Check capacity
    if target_class.get("current_enrollment", 0) >= target_class["capacity"]:
        raise HTTPException(status_code=400, detail="Class is full")
    
    # 3. Check if already enrolled
    existing = await db.enrollments.find_one({
        "student_id": student["_id"],
        "class_id": class_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled in this class")

    # 4. Check Prerequisites
    course = await db.courses.find_one({"_id": target_class["course_id"]})
    if course and course.get("prerequisites"):
        prereq_courses = await db.courses.find({"code": {"$in": course["prerequisites"]}}).to_list(len(course["prerequisites"]))
        prereq_by_code = {item["code"]: item for item in prereq_courses}

        missing_configs = [code for code in course["prerequisites"] if code not in prereq_by_code]
        if missing_configs:
            raise HTTPException(status_code=400, detail=f"Prerequisite course {missing_configs[0]} is not configured")

        prereq_course_ids = [item["_id"] for item in prereq_courses]
        prereq_classes = await db.classes.find({"course_id": {"$in": prereq_course_ids}}).to_list(5000)
        prereq_class_ids_by_course = {}
        for cls in prereq_classes:
            prereq_class_ids_by_course.setdefault(cls["course_id"], []).append(cls["_id"])

        completed_enrollments = await db.enrollments.find({
            "student_id": student["_id"],
            "class_id": {"$in": [cls["_id"] for cls in prereq_classes]},
            "status": "completed",
            "grade": {"$gte": 2.0},
        }).to_list(5000)
        completed_class_ids = {item["class_id"] for item in completed_enrollments}

        for prereq_code in course["prerequisites"]:
            prereq_course = prereq_by_code[prereq_code]
            prereq_class_ids = prereq_class_ids_by_course.get(prereq_course["_id"], [])
            if not prereq_class_ids or not any(class_id in completed_class_ids for class_id in prereq_class_ids):
                raise HTTPException(status_code=400, detail=f"Missing prerequisite: {prereq_code}")

    # 5. Perform Enrollment
    enrollment = {
        "_id": str(uuid.uuid4()),
        "student_id": student["_id"],
        "class_id": class_id,
        "status": "enrolled",
        "enrolled_at": datetime.utcnow()
    }
    
    await db.enrollments.insert_one(enrollment)
    await db.classes.update_one(
        {"_id": class_id},
        {"$inc": {"current_enrollment": 1}}
    )
    await log_audit_event(
        action="student.enroll",
        actor_id=student["_id"],
        actor_role=student["role"],
        target_type="class",
        target_id=class_id,
        metadata={"enrollment_id": enrollment["_id"]},
    )
    
    return {"message": "Successfully enrolled", "enrollment_id": enrollment["_id"]}

@router.post("/submit-assignment/{assignment_id}")
async def submit_assignment(
    assignment_id: str,
    submission_content: str, # Link or text
    student: dict = Depends(check_student_role)
):
    db = get_database()
    # Check if assignment exists
    assignment = await db.assignments.find_one({"_id": assignment_id})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Check if student is enrolled in the class of this assignment
    enrolled = await db.enrollments.find_one({
        "student_id": student["_id"],
        "class_id": assignment["class_id"]
    })
    if not enrolled:
        raise HTTPException(status_code=403, detail="You are not enrolled in this class")
    
    submission = SubmissionCreate(
        assignment_id=assignment_id,
        student_id=student["_id"],
        content=submission_content,
    ).model_dump()
    submission.update({
        "_id": str(uuid.uuid4()),
        "submitted_at": datetime.utcnow(),
        "status": "submitted",
    })
    
    await db.submissions.insert_one(submission)
    await log_audit_event(
        action="student.submit_assignment",
        actor_id=student["_id"],
        actor_role=student["role"],
        target_type="assignment",
        target_id=assignment_id,
        metadata={"submission_id": submission["_id"]},
    )
    return {"message": "Assignment submitted successfully", "submission_id": submission["_id"]}

@router.get("/my-schedule")
async def get_my_schedule(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=2000),
    student: dict = Depends(check_student_role),
):
    db = get_database()
    
    # Get all enrollments for this student
    enrollments = await db.enrollments.find({"student_id": student["_id"], "status": "enrolled"}).to_list(1000)
    
    class_ids = [e["class_id"] for e in enrollments]
    
    # Get class details including schedule
    total = len(class_ids)
    class_by_id = await _fetch_classes_by_ids(db, class_ids)
    paginated_ids = class_ids[skip:skip + limit]
    my_classes = [class_by_id[class_id] for class_id in paginated_ids if class_id in class_by_id]
    
    # Enrich with course titles
    course_by_id = await _fetch_courses_by_ids(db, [c.get("course_id") for c in my_classes])
    for c in my_classes:
        course = course_by_id.get(c.get("course_id"))
        c["course_title"] = course["title"] if course else "Unknown Course"
        c["course_code"] = course["code"] if course else "???"

    return {
        "data": my_classes,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/my-schedule/export")
async def export_my_schedule(student: dict = Depends(check_student_role)):
    response = await get_my_schedule(skip=0, limit=1000, student=student)
    my_classes = response.get("data", []) if isinstance(response, dict) else response
    lines = [
        f"Student schedule export for: {student.get('full_name', student.get('email', student['_id']))}",
        "",
    ]
    for item in my_classes:
        lines.append(f"{item.get('course_code', '---')} - {item.get('course_title', 'Unknown course')}")
        for slot in item.get("schedule", []):
            lines.append(
                f"  {slot.get('day', 'Unknown')} | {slot.get('start', '--:--')} - {slot.get('end', '--:--')} | room: {item.get('room', 'TBA')}"
            )
        lines.append("")

    pdf_bytes = _build_simple_pdf(lines if len(lines) > 2 else ["Student schedule", "No active schedule available"])
    await log_audit_event(
        action="student.export_schedule",
        actor_id=student["_id"],
        actor_role=student["role"],
        target_type="student",
        target_id=student["_id"],
    )
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="schedule-{student["_id"]}.pdf"'},
    )

@router.get("/my-grades")
async def get_my_grades(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=2000),
    student: dict = Depends(check_student_role),
):
    db = get_database()
    enrollments = await db.enrollments.find({"student_id": student["_id"]}).to_list(1000)
    class_by_id = await _fetch_classes_by_ids(db, [enrollment["class_id"] for enrollment in enrollments])
    course_by_id = await _fetch_courses_by_ids(db, [item.get("course_id") for item in class_by_id.values()])

    grade_items = []
    total_points = 0.0
    total_credits = 0

    for enrollment in enrollments:
        cls = class_by_id.get(enrollment["class_id"])
        if not cls:
            continue
        course = course_by_id.get(cls.get("course_id"))
        if not course:
            continue
        grade = enrollment.get("grade")
        credits = course.get("credits", 0)
        grade_items.append({
            "enrollment_id": enrollment["_id"],
            "course_code": course.get("code"),
            "course_title": course.get("title"),
            "status": enrollment.get("status"),
            "grade": grade,
            "credits": credits,
            "teacher_comments": enrollment.get("teacher_comments"),
        })
        if grade is not None and enrollment.get("status") == "completed":
            total_points += float(grade) * credits
            total_credits += credits

    gpa = round(total_points / total_credits, 2) if total_credits > 0 else 0.0
    total_records = len(grade_items)
    paginated_records = grade_items[skip:skip + limit]
    return {
        "records": paginated_records,
        "total": total_records,
        "skip": skip,
        "limit": limit,
        "gpa": gpa,
        "graded_credits": total_credits,
    }

@router.post("/withdraw/{enrollment_id}")
async def withdraw_course(enrollment_id: str, payload: dict, student: dict = Depends(check_student_role)):
    db = get_database()
    enrollment = await db.enrollments.find_one({"_id": enrollment_id, "student_id": student["_id"]})
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    if enrollment.get("status") != "enrolled":
        raise HTTPException(status_code=400, detail="Only active enrollments can request withdrawal")
    
    reason = str(payload.get("reason", "")).strip()
    if len(reason) < 10:
        raise HTTPException(status_code=400, detail="Withdrawal reason must be at least 10 characters")

    # Set status to pending instead of withdrawn
    await db.enrollments.update_one(
        {"_id": enrollment_id},
        {"$set": {
            "status": "withdrawal_pending", 
            "withdrawal_requested_at": datetime.utcnow(), 
            "withdrawal_reason": reason
        }},
    )
    # We DO NOT decrement current_enrollment here. Admin will do it upon approval.
    
    await log_audit_event(
        action="student.request_withdrawal",
        actor_id=student["_id"],
        actor_role=student["role"],
        target_type="enrollment",
        target_id=enrollment_id,
        metadata={"class_id": enrollment["class_id"], "reason": reason},
    )

    cls = await db.classes.find_one({"_id": enrollment.get("class_id")}) if enrollment.get("class_id") else None
    course = await db.courses.find_one({"_id": cls.get("course_id")}) if cls and cls.get("course_id") else None
    # Notify admins and the class teacher so they can review the request promptly
    admins = await db.users.find({"role": UserRole.ADMIN}).to_list(1000)
    recipient_ids = {admin.get("_id") for admin in admins if admin.get("_id")}
    teacher_id = cls.get("teacher_id") if cls else None
    if teacher_id:
        recipient_ids.add(teacher_id)
    course_label = ""
    if course:
        code = course.get("code") or ""
        title = course.get("title") or ""
        course_label = f"{code} - {title}".strip(" -")

    student_name = student.get("full_name") or student.get("email") or "Sinh viên"
    class_id = enrollment.get("class_id") or ""
    message = f"{student_name} vừa gửi yêu cầu rút học phần"
    if course_label:
        message += f" ({course_label})"
    if class_id:
        message += f" - lớp {class_id}"
    message += "."

    for recipient_id in recipient_ids:
        await create_notification(
            user_id=recipient_id,
            title="Yêu cầu rút học phần mới",
            message=message,
        )

    return {"message": "Withdrawal request submitted for approval"}

@router.post("/feedback")
async def submit_feedback(payload: FeedbackCreate, student: dict = Depends(check_student_role)):
    db = get_database()
    class_id = payload.class_id
    rating = payload.rating
    comment = payload.comment
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="rating must be between 1 and 5")

    enrollment = await db.enrollments.find_one({"student_id": student["_id"], "class_id": class_id})
    if not enrollment:
        raise HTTPException(status_code=403, detail="You are not enrolled in this class")

    feedback = payload.model_dump()
    feedback.update({
        "student_id": student["_id"],
        "_id": str(uuid.uuid4()),
        "created_at": datetime.utcnow(),
    })
    await db.feedback.insert_one(feedback)
    await log_audit_event(
        action="student.submit_feedback",
        actor_id=student["_id"],
        actor_role=student["role"],
        target_type="class",
        target_id=class_id,
        metadata={"feedback_id": feedback["_id"], "rating": feedback["rating"]},
    )
    return {"message": "Feedback submitted successfully", "feedback_id": feedback["_id"]}


@router.get("/dashboard-summary")
async def get_dashboard_summary(student: dict = Depends(check_student_role)):
    db = get_database()
    enrollments = await db.enrollments.find({"student_id": student["_id"]}).to_list(1000)
    active_enrollments = [e for e in enrollments if e.get("status") == "enrolled"]
    completed_enrollments = [e for e in enrollments if e.get("status") == "completed" and e.get("grade") is not None]

    class_ids = [e["class_id"] for e in enrollments]
    class_by_id = await _fetch_classes_by_ids(db, class_ids)
    course_by_id = await _fetch_courses_by_ids(db, [item.get("course_id") for item in class_by_id.values()])

    total_points = 0.0
    total_credits = 0
    for enrollment in completed_enrollments:
        cls = class_by_id.get(enrollment["class_id"])
        course = course_by_id.get(cls.get("course_id")) if cls else None
        credits = int(course.get("credits", 0)) if course else 0
        total_points += float(enrollment["grade"]) * credits
        total_credits += credits
    gpa = round(total_points / total_credits, 2) if total_credits > 0 else 0.0

    next_class = None
    active_classes = [class_by_id[e["class_id"]] for e in active_enrollments if e["class_id"] in class_by_id]
    ordered_days = {"Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6, "Sunday": 7}
    next_slots = []
    for cls in active_classes:
        course = course_by_id.get(cls.get("course_id"))
        for slot in cls.get("schedule", []):
            next_slots.append(
                {
                    "course_code": course.get("code") if course else None,
                    "course_title": course.get("title") if course else None,
                    "room": cls.get("room"),
                    "day": slot.get("day"),
                    "start": slot.get("start"),
                    "end": slot.get("end"),
                    "sort_day": ordered_days.get(slot.get("day"), 99),
                }
            )
    if next_slots:
        next_slots.sort(key=lambda item: (item["sort_day"], str(item.get("start") or "")))
        next_class = next_slots[0]
        next_class.pop("sort_day", None)

    assignments = await db.assignments.find({"class_id": {"$in": [c["_id"] for c in active_classes]}}).sort("deadline", 1).to_list(1000) if active_classes else []
    submissions = await db.submissions.find({"student_id": student["_id"]}).to_list(1000)
    submitted_assignment_ids = {item["assignment_id"] for item in submissions}
    pending_assignments = [item for item in assignments if item["_id"] not in submitted_assignment_ids]

    invoice = await db.invoices.find_one({"student_id": student["_id"]})
    if not invoice:
        total_registered_credits = 0
        for enrollment in enrollments:
            cls = class_by_id.get(enrollment["class_id"])
            course = course_by_id.get(cls.get("course_id")) if cls else None
            if course:
                total_registered_credits += int(course.get("credits", 0))
        balance = float(total_registered_credits) * 500.0
    else:
        balance = max(0.0, float(invoice.get("total_amount", 0)) - float(invoice.get("paid_amount", 0)))

    unread_notifications = await db.notifications.count_documents({"user_id": student["_id"], "read": False})

    upcoming_deadline = None
    if pending_assignments:
        nearest = pending_assignments[0]
        cls = class_by_id.get(nearest.get("class_id"))
        course = course_by_id.get(cls.get("course_id")) if cls else None
        upcoming_deadline = {
            "title": nearest.get("title"),
            "description": nearest.get("description"),
            "deadline": nearest.get("deadline"),
            "course_code": course.get("code") if course else None,
            "course_title": course.get("title") if course else None,
        }

    return {
        "gpa": gpa,
        "active_courses": len(active_enrollments),
        "completed_courses": len(completed_enrollments),
        "pending_assignments": len(pending_assignments),
        "unread_notifications": unread_notifications,
        "outstanding_balance": round(balance, 2),
        "next_class": next_class,
        "upcoming_deadline": upcoming_deadline,
    }

@router.get("/my-feedback", response_model=List[FeedbackOut])
async def list_my_feedback(student: dict = Depends(check_student_role)):
    db = get_database()
    return await db.feedback.find({"student_id": student["_id"]}).sort("created_at", -1).to_list(1000)
