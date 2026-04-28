from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import logging

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_manager = Database()

async def connect_to_mongo():
    logging.info("Connecting to MongoDB...")
    db_manager.client = AsyncIOMotorClient(settings.MONGO_URI)
    db_manager.db = db_manager.client[settings.DATABASE_NAME]
    
    # --- performance indexes ---
    # User & Search
    await db_manager.db.users.create_index("email", unique=True)
    await db_manager.db.users.create_index("role")
    await db_manager.db.users.create_index([("active_jti", 1), ("is_active", 1)])
    await db_manager.db.users.create_index([("full_name", "text")]) # Cho phép tìm kiếm theo tên
    
    # Academics
    await db_manager.db.courses.create_index("code", unique=True)
    await db_manager.db.courses.create_index("department_id")
    await db_manager.db.classrooms.create_index("code", unique=True)
    await db_manager.db.classes.create_index("teacher_id")
    await db_manager.db.classes.create_index("course_id")
    await db_manager.db.classes.create_index("semester")
    
    # Enrollments & Grades (Quan trọng cho bảng điểm)
    await db_manager.db.enrollments.create_index([("student_id", 1), ("class_id", 1)], unique=True)
    await db_manager.db.enrollments.create_index("class_id")
    await db_manager.db.enrollments.create_index("student_id")
    await db_manager.db.enrollments.create_index([("student_id", 1), ("status", 1)])
    
    # Assignments & Submissions
    await db_manager.db.assignments.create_index([("class_id", 1), ("deadline", -1)])
    await db_manager.db.assignments.create_index("class_id")
    await db_manager.db.submissions.create_index([("assignment_id", 1), ("student_id", 1)], unique=True)
    await db_manager.db.submissions.create_index("student_id")
    
    # Attendance
    await db_manager.db.attendance.create_index([("class_id", 1), ("date", -1)], unique=True)
    await db_manager.db.attendance.create_index("student_id")
    
    # Exams
    await db_manager.db.exams.create_index([("class_id", 1), ("scheduled_at", -1)])
    
    # Finance (Tối ưu hóa báo cáo tài chính)
    await db_manager.db.invoices.create_index([("student_id", 1), ("semester", 1)], unique=True)
    await db_manager.db.invoices.create_index("status")
    await db_manager.db.payments.create_index([("student_id", 1), ("paid_at", -1)])
    await db_manager.db.fee_policies.create_index([("semester", 1), ("is_active", 1)])
    
    # System Logs & Notifications (Dữ liệu tăng nhanh nhất)
    await db_manager.db.audit_logs.create_index([("created_at", -1)])
    await db_manager.db.audit_logs.create_index("user_id")
    await db_manager.db.audit_logs.create_index("actor_id")
    await db_manager.db.audit_logs.create_index("action")
    await db_manager.db.notifications.create_index([("user_id", 1), ("created_at", -1)])
    await db_manager.db.notifications.create_index([("user_id", 1), ("read", 1)])
    await db_manager.db.feedback.create_index([("class_id", 1), ("created_at", -1)])
    
    logging.info("Connected to MongoDB and optimized 20+ indexes!")

async def close_mongo_connection():
    logging.info("Closing MongoDB connection...")
    if db_manager.client:
        db_manager.client.close()
    logging.info("MongoDB connection closed.")

def get_database():
    return db_manager.db
