import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
import bcrypt
from datetime import datetime, timedelta
import socket

import os

# Try to get MONGO_URI from environment, then try 'mongodb' (docker), then 'localhost'
MONGO_URI = os.getenv("MONGO_URI", "mongodb://mongodb:27017/sms_db")
# If it contains the DB name at the end, AsyncIOMotorClient handles it, but we need the base for some checks
MONGO_BASE_URI = MONGO_URI.rsplit('/', 1)[0] if MONGO_URI.count('/') > 2 else MONGO_URI
DATABASE_NAME = "sms_db"

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def seed_data():
    global MONGO_URI
    
    print(f"Connecting to MongoDB at {MONGO_URI}...")
    client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[DATABASE_NAME]
    
    try:
        # Verify connection
        await client.admin.command('ping')
        print("Successfully connected to MongoDB.")
    except Exception as e:
        if "mongodb" in MONGO_URI:
            print("Could not connect to 'mongodb' host, trying 'localhost'...")
            MONGO_URI = "mongodb://localhost:27017/sms_db"
            client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
            db = client[DATABASE_NAME]
            try:
                await client.admin.command('ping')
                print("Successfully connected to MongoDB at localhost.")
            except:
                print(f"Error: Could not connect to MongoDB at {MONGO_URI}.")
                print("Make sure your MongoDB container is running or MongoDB is installed locally.")
                return
        else:
            print(f"Error: Could not connect to MongoDB at {MONGO_URI}.")
            print("Make sure your MongoDB container is running or MongoDB is installed locally.")
            return

    # Clear existing data
    collections = [
        "users", "courses", "classes", "enrollments", "departments", 
        "classrooms", "fee_policies", "invoices", "payments", "notifications", 
        "audit_logs", "assignments", "submissions", "attendance", "feedback"
    ]
    for coll in collections:
        await db[coll].delete_many({})

    print("--- STARTING FULL SYSTEM SEEDING (VIETNAMESE DATA + COMPLETE FEATURES) ---")

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
        "email": "admin@sms.com",
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
            "email": f"teacher{i+1}@sms.com",
            "hashed_password": get_password_hash("teacher123"),
            "full_name": teacher_names[i],
            "role": "teacher",
            "department": dept_cs if i % 2 == 0 else dept_se,
            "is_active": True,
            "created_at": datetime.utcnow()
        })
    # Main teacher account
    teacher_main_id = str(uuid.uuid4())
    users.append({
        "_id": teacher_main_id,
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
            "email": f"student{i+1}@sms.com",
            "hashed_password": get_password_hash("student123"),
            "full_name": student_names[i],
            "role": "student",
            "department": dept_se if i < 5 else dept_cs,
            "is_active": True,
            "created_at": datetime.utcnow()
        })
    # Main student account
    student_main_id = str(uuid.uuid4())
    users.append({
        "_id": student_main_id,
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

    # 6. Enrollments
    print("Seeding Enrollments...")
    enrollments = []
    # Main student enrolled in everything
    for i, cls in enumerate(classes):
        status = "completed" if i == 0 else "enrolled"
        grade = 4.0 if i == 0 else None
        enrollments.append({
            "_id": str(uuid.uuid4()),
            "student_id": student_main_id,
            "class_id": cls["_id"],
            "status": status,
            "grade": grade,
            "teacher_comments": "Kết quả học tập xuất sắc" if grade else None,
            "enrolled_at": datetime.utcnow() - timedelta(days=30)
        })
    
    # Other students randomized
    for sid in student_ids:
        enrollments.append({
            "_id": str(uuid.uuid4()),
            "student_id": sid,
            "class_id": classes[0]["_id"],
            "status": "enrolled",
            "enrolled_at": datetime.utcnow()
        })
    
    await db.enrollments.insert_many(enrollments)
    # Update current_enrollment counts
    for cls in classes:
        count = await db.enrollments.count_documents({"class_id": cls["_id"]})
        await db.classes.update_one({"_id": cls["_id"]}, {"$set": {"current_enrollment": count}})

    # 7. Finance
    print("Seeding Finance...")
    cost_per_credit = 600000.0 # 600k VND per credit
    await db.fee_policies.insert_one({
        "_id": str(uuid.uuid4()),
        "semester": sem,
        "cost_per_credit": cost_per_credit,
        "is_active": True,
        "created_at": datetime.utcnow(),
    })
    
    # Create invoices for main student and some others
    all_student_ids = student_ids + [student_main_id]
    for sid in all_student_ids:
        student_enrolls = await db.enrollments.find({"student_id": sid}).to_list(1000)
        total_credits = 0
        for en in student_enrolls:
            cls = await db.classes.find_one({"_id": en["class_id"]})
            crs = await db.courses.find_one({"_id": cls["course_id"]})
            total_credits += crs["credits"]
        
        total_amount = float(total_credits * cost_per_credit)
        paid = float(total_amount) if sid == student_main_id else 0.0
        status = "paid" if paid >= total_amount else ("partially_paid" if paid > 0 else "unpaid")
        invoice_id = str(uuid.uuid4())
        await db.invoices.insert_one({
            "_id": invoice_id,
            "student_id": sid,
            "semester": sem,
            "total_credits": int(total_credits),
            "cost_per_credit": float(cost_per_credit),
            "total_amount": float(total_amount),
            "paid_amount": paid,
            "status": status,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        })
        if paid > 0:
            await db.payments.insert_one({
                "_id": str(uuid.uuid4()),
                "student_id": sid,
                "invoice_id": invoice_id,
                "amount": paid,
                "method": "Chuyển khoản",
                "status": "recorded",
                "paid_at": datetime.utcnow(),
            })

    # 8. Assignments & Submissions
    print("Seeding Assignments...")
    asgn1_id = str(uuid.uuid4())
    await db.assignments.insert_one({
        "_id": asgn1_id,
        "class_id": classes[1]["_id"],
        "title": "Bài tập lớn: Cấu trúc dữ liệu",
        "description": "Cài đặt cây nhị phân tìm kiếm cân bằng (AVL Tree).",
        "deadline": datetime.utcnow() + timedelta(days=7),
        "created_at": datetime.utcnow()
    })
    
    # Main student submits
    await db.submissions.insert_one({
        "_id": str(uuid.uuid4()),
        "assignment_id": asgn1_id,
        "student_id": student_main_id,
        "content": "https://github.com/student/ds-project-avl",
        "status": "submitted",
        "submitted_at": datetime.utcnow()
    })

    # 9. Attendance
    print("Seeding Attendance...")
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    for i in range(3):
        date = today - timedelta(days=i)
        await db.attendance.insert_one({
            "_id": str(uuid.uuid4()),
            "class_id": classes[0]["_id"],
            "date": date,
            "records": [{"student_id": sid, "status": "PRESENT"} for sid in all_student_ids]
        })

    # 10. Audit Logs
    print("Seeding Audit Logs...")
    actions = ["auth.login", "student.enroll", "admin.create_user", "teacher.submit_grade"]
    for i in range(20):
        await db.audit_logs.insert_one({
            "_id": str(uuid.uuid4()),
            "action": actions[i % len(actions)],
            "actor_id": admin_id,
            "actor_role": "admin",
            "target_type": "system",
            "target_id": "global",
            "created_at": datetime.utcnow() - timedelta(minutes=i*10)
        })

    print("--- SEEDING COMPLETED SUCCESSFULLY ---")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
