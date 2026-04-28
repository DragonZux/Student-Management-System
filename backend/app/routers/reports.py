from io import BytesIO
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.dependencies import get_current_user, check_admin_role, check_admin_or_self
from app.core.audit import log_audit_event
from app.db.database import get_database
from app.schemas.user import UserRole

router = APIRouter()


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

@router.get("/transcript/{user_id}")
async def generate_transcript(user_id: str, current_user: dict = Depends(check_admin_or_self)):
    db = get_database()
    student = await db.users.find_one({"_id": user_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    enrollments = await db.enrollments.find({"student_id": user_id, "status": "completed"}).to_list(1000)
    class_ids = [item["class_id"] for item in enrollments if item.get("class_id")]
    classes = await db.classes.find({"_id": {"$in": list(set(class_ids))}}).to_list(len(set(class_ids))) if class_ids else []
    class_by_id = {item["_id"]: item for item in classes}
    course_ids = [item.get("course_id") for item in classes if item.get("course_id")]
    courses = await db.courses.find({"_id": {"$in": list(set(course_ids))}}).to_list(len(set(course_ids))) if course_ids else []
    course_by_id = {item["_id"]: item for item in courses}
    
    transcript_data = []
    total_points = 0
    total_credits = 0
    
    for e in enrollments:
        cls = class_by_id.get(e["class_id"])
        if not cls:
            continue
        course = course_by_id.get(cls.get("course_id"))
        if not course:
            continue
        
        grade = e.get("grade", 0)
        credits = course["credits"]
        
        transcript_data.append({
            "course_code": course["code"],
            "course_title": course["title"],
            "grade": grade,
            "credits": credits
        })
        
        total_points += grade * credits
        total_credits += credits
    
    gpa = total_points / total_credits if total_credits > 0 else 0
    
    return {
        "student_name": student["full_name"],
        "student_email": student["email"],
        "records": transcript_data,
        "cgpa": round(gpa, 2),
        "total_credits": total_credits
    }


@router.get("/transcript/{user_id}/export")
async def export_transcript(user_id: str, current_user: dict = Depends(check_admin_or_self)):
    transcript = await generate_transcript(user_id, current_user)
    lines = [
        f"Student: {transcript['student_name']}",
        f"Email: {transcript['student_email']}",
        f"Total credits: {transcript['total_credits']}",
        f"CGPA: {transcript['cgpa']}",
        "",
        "Course Records:",
    ]
    for item in transcript["records"]:
        lines.append(
            f"{item['course_code']} - {item['course_title']} | grade: {item['grade']} | credits: {item['credits']}"
        )

    pdf_bytes = _build_simple_pdf(lines)
    await log_audit_event(
        action="report.export_transcript",
        actor_id=current_user["_id"],
        actor_role=current_user["role"],
        target_type="student",
        target_id=user_id,
    )
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="transcript-{user_id}.pdf"'},
    )

@router.get("/admin-stats", dependencies=[Depends(check_admin_role)])
async def get_admin_stats():
    db = get_database()
    
    total_students = await db.users.count_documents({"role": UserRole.STUDENT})
    total_teachers = await db.users.count_documents({"role": UserRole.TEACHER})
    total_courses = await db.courses.count_documents({})
    total_classes = await db.classes.count_documents({})
    
    return {
        "students": total_students,
        "teachers": total_teachers,
        "courses": total_courses,
        "classes": total_classes
    }
