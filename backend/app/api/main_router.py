from fastapi import APIRouter
from app.api import auth, admin, student, teacher, finance, notifications, reports, exams

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Management"])
api_router.include_router(student.router, prefix="/student", tags=["Student Features"])
api_router.include_router(teacher.router, prefix="/teacher", tags=["Teacher Features"])
api_router.include_router(finance.router, prefix="/finance", tags=["Finance & Tuition"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reporting & Stats"])
api_router.include_router(exams.router, prefix="/exams", tags=["Exams"])
