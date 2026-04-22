import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
import bcrypt
from datetime import datetime, timedelta

MONGO_URI = "mongodb://mongodb:27017"
DATABASE_NAME = "sms_db"

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def seed_data():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DATABASE_NAME]
    
    # Clear existing data
    collections = [
        "users", "courses", "classes", "enrollments", "departments", 
        "classrooms", "finance_policies", "invoices", "payments", "notifications", 
        "audit_logs", "assignments", "submissions", "attendance", "feedback"
    ]
    for coll in collections:
        await db[coll].delete_many({})

    print("--- STARTING REALISTIC SEEDING (VIETNAMESE UNI) ---")

    # 1. Departments
    print("Seeding Departments...")
    depts = [
        {"_id": str(uuid.uuid4()), "name": "Khoa Khoa học Máy tính", "faculty": "Công nghệ Thông tin", "description": "Đào tạo kỹ sư khoa học máy tính và AI."},
        {"_id": str(uuid.uuid4()), "name": "Khoa Kỹ thuật Phần mềm", "faculty": "Công nghệ Thông tin", "description": "Đào tạo kỹ sư quy trình và phát triển phần mềm."},
        {"_id": str(uuid.uuid4()), "name": "Khoa Hệ thống Thông tin", "faculty": "Công nghệ Thông tin", "description": "Đào tạo quản trị dữ liệu và hệ thống doanh nghiệp."},
        {"_id": str(uuid.uuid4()), "name": "Khoa Mạng Máy tính", "faculty": "Công nghệ Thông tin", "description": "Đào tạo an toàn thông tin và quản trị mạng."}
    ]
    await db.departments.insert_many(depts)
    dept_cs = depts[0]["name"]
    dept_se = depts[1]["name"]

    # 2. Classrooms
    print("Seeding Classrooms...")
    rooms = [
        {"_id": str(uuid.uuid4()), "code": "A1-201", "building": "Tòa nhà A1", "capacity": 60, "facilities": ["Máy chiếu", "Điều hòa", "Wifi"]},
        {"_id": str(uuid.uuid4()), "code": "A1-202", "building": "Tòa nhà A1", "capacity": 60, "facilities": ["Máy chiếu", "Điều hòa", "Wifi"]},
        {"_id": str(uuid.uuid4()), "code": "B2-105", "building": "Tòa nhà B2", "capacity": 100, "facilities": ["Hệ thống âm thanh", "Máy chiếu", "Điều hòa"]},
        {"_id": str(uuid.uuid4()), "code": "LAB-1", "building": "Trung tâm Thực hành", "capacity": 30, "facilities": ["30 PC", "Server Access", "Bảng thông minh"]}
    ]
    await db.classrooms.insert_many(rooms)

    # 3. Users (Admins, Teachers, Students)
    print("Seeding Users...")
    users = []
    
    # Admin
    admin_id = str(uuid.uuid4())
    users.append({
        "_id": admin_id,
        "email": "admin@university.edu.vn",
        "hashed_password": get_password_hash("admin123"),
        "full_name": "Quản trị viên Hệ thống",
        "role": "admin",
        "is_active": True,
        "created_at": datetime.utcnow()
    })

    # Teachers
    teacher_ids = [str(uuid.uuid4()) for _ in range(5)]
    teacher_names = ["PGS.TS Nguyễn Minh Tuấn", "TS. Trần Lê Hà", "ThS. Phạm Hoàng Vũ", "TS. Lê Thị Mai", "ThS. Bùi Quang Huy"]
    for i, tid in enumerate(teacher_ids):
        users.append({
            "_id": tid,
            "email": f"teacher{i+1}@university.edu.vn",
            "hashed_password": get_password_hash("teacher123"),
            "full_name": teacher_names[i],
            "role": "teacher",
            "department": dept_cs if i % 2 == 0 else dept_se,
            "is_active": True,
            "created_at": datetime.utcnow()
        })
    users.append({
        "_id": str(uuid.uuid4()),
        "email": "teacher@sms.com",
        "hashed_password": get_password_hash("teacher123"),
        "full_name": "PGS.TS Trưởng Khoa",
        "role": "teacher",
        "department": dept_cs,
        "is_active": True,
        "created_at": datetime.utcnow()
    })

    # Students
    student_ids = [str(uuid.uuid4()) for _ in range(10)]
    student_names = [
        "Nguyễn Thành Đạt", "Trần Thu Hà", "Lê Hải Minh", "Phạm Trọng Thủy", "Đỗ Mai Phương", 
        "Vũ Quốc Khanh", "Hoàng Thảo My", "Bùi Đức Thắng", "Đặng Thùy Linh", "Phan Anh Tuấn"
    ]
    for i, sid in enumerate(student_ids):
        users.append({
            "_id": sid,
            "email": f"student{i+1}@university.edu.vn",
            "hashed_password": get_password_hash("student123"),
            "full_name": student_names[i],
            "role": "student",
            "department": dept_se if i < 5 else dept_cs,
            "is_active": True,
            "created_at": datetime.utcnow()
        })
    student_main_id = student_ids[0]
    users.append({
        "_id": str(uuid.uuid4()),
        "email": "student@sms.com",
        "hashed_password": get_password_hash("student123"),
        "full_name": "Sinh Viên Demo",
        "role": "student",
        "department": dept_cs,
        "is_active": True,
        "created_at": datetime.utcnow()
    })
    
    await db.users.insert_many(users)

    # 4. Courses
    print("Seeding Courses...")
    courses = [
        {"_id": str(uuid.uuid4()), "code": "IT1110", "title": "Tin học Đại cương", "credits": 4, "description": "Kiến thức cơ bản về lập trình C và hệ thống máy tính.", "prerequisites": []},
        {"_id": str(uuid.uuid4()), "code": "IT2120", "title": "Kiến trúc máy tính", "credits": 3, "description": "Tổ chức và cấu trúc của hệ thống máy tính.", "prerequisites": ["IT1110"]},
        {"_id": str(uuid.uuid4()), "code": "IT3100", "title": "Cấu trúc dữ liệu và Giải thuật", "credits": 4, "description": "Cấu trúc cây, đồ thị, thuật toán sắp xếp và tìm kiếm.", "prerequisites": ["IT1110"]},
        {"_id": str(uuid.uuid4()), "code": "IT3040", "title": "Kỹ thuật lập trình", "credits": 3, "description": "Lập trình hướng đối tượng với C++ / Java.", "prerequisites": ["IT1110"]},
        {"_id": str(uuid.uuid4()), "code": "IT3160", "title": "Nhập môn Trí tuệ nhân tạo", "credits": 3, "description": "Các phương pháp tìm kiếm và Machine Learning cơ bản.", "prerequisites": ["IT3100"]}
    ]
    await db.courses.insert_many(courses)

    # 5. Classes
    print("Seeding Classes...")
    classes = []
    sem = "20261" # Semester 1, 2026
    for i, course in enumerate(courses):
        classes.append({
            "_id": str(uuid.uuid4()),
            "course_id": course["_id"],
            "teacher_id": teacher_ids[i % len(teacher_ids)],
            "semester": sem,
            "capacity": 50 + (i * 10),
            "current_enrollment": 0,
            "room": rooms[i % len(rooms)]["code"],
            "schedule": [
                {"day": "Thứ 2" if i % 2 == 0 else "Thứ 3", "start": "08:25", "end": "10:05"},
                {"day": "Thứ 4" if i % 2 == 0 else "Thứ 5", "start": "08:25", "end": "10:05"}
            ]
        })
    await db.classes.insert_many(classes)

    print("--- SEEDING COMPLETED SUCCESSFULLY ---")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
