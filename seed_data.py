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
        "classrooms", "finance_policies", "finance_records", "notifications", 
        "audit_logs", "assignments", "submissions", "attendance", "feedback"
    ]
    for coll in collections:
        await db[coll].delete_many({})

    print("--- STARTING COMPLETE SEEDING ---")

    # 1. Departments
    print("Seeding Departments...")
    depts = [
        {"_id": str(uuid.uuid4()), "name": "Computer Science", "faculty": "Information Technology", "description": "Core algorithm and computing science."},
        {"_id": str(uuid.uuid4()), "name": "Software Engineering", "faculty": "Information Technology", "description": "Practical software development and architecture."},
        {"_id": str(uuid.uuid4()), "name": "Data Science", "faculty": "Information Technology", "description": "Machine learning and big data analytics."},
        {"_id": str(uuid.uuid4()), "name": "Cyber Security", "faculty": "Information Technology", "description": "Network security and cryptography."}
    ]
    await db.departments.insert_many(depts)
    dept_cs = depts[0]["name"]
    dept_se = depts[1]["name"]

    # 2. Classrooms
    print("Seeding Classrooms...")
    rooms = [
        {"_id": str(uuid.uuid4()), "code": "A101", "building": "Building A", "capacity": 60, "facilities": ["Projector", "AC", "Ethernet"]},
        {"_id": str(uuid.uuid4()), "code": "B202", "building": "Building B", "capacity": 40, "facilities": ["Whiteboard", "AC"]},
        {"_id": str(uuid.uuid4()), "code": "C303", "building": "Building C", "capacity": 100, "facilities": ["Stage", "Sound System", "AC"]},
        {"_id": str(uuid.uuid4()), "code": "LAB_01", "building": "Tech Center", "capacity": 30, "facilities": ["Workstations", "Server Access"]}
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
        "full_name": "System Administrator",
        "role": "admin",
        "is_active": True,
        "created_at": datetime.utcnow()
    })

    # Teachers
    teacher_ids = [str(uuid.uuid4()) for _ in range(3)]
    teacher_names = ["Dr. Minh Tuấn", "Prof. Elena Smith", "Dr. Robert J."]
    for i, tid in enumerate(teacher_ids):
        users.append({
            "_id": tid,
            "email": f"teacher{i+1}@sms.com",
            "hashed_password": get_password_hash("teacher123"),
            "full_name": teacher_names[i],
            "role": "teacher",
            "department": dept_cs if i == 0 else dept_se,
            "is_active": True,
            "created_at": datetime.utcnow()
        })
    # Keep teacher@sms.com for backward compatibility with user instructions
    users.append({
        "_id": str(uuid.uuid4()),
        "email": "teacher@sms.com",
        "hashed_password": get_password_hash("teacher123"),
        "full_name": "Lead Teacher",
        "role": "teacher",
        "department": dept_cs,
        "is_active": True,
        "created_at": datetime.utcnow()
    })

    # Students
    student_ids = [str(uuid.uuid4()) for _ in range(5)]
    student_names = ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C", "Phạm Minh D", "Hoàng An E"]
    for i, sid in enumerate(student_ids):
        users.append({
            "_id": sid,
            "email": f"student{i+1}@sms.com",
            "hashed_password": get_password_hash("student123"),
            "full_name": student_names[i],
            "role": "student",
            "department": dept_se if i < 3 else dept_cs,
            "is_active": True,
            "created_at": datetime.utcnow()
        })
    # Keep student@sms.com
    student_main_id = student_ids[0]
    await db.users.insert_many(users)
    # Ensure student@sms.com exists and is mapped to student_main_id for consistency
    await db.users.update_one({"_id": student_main_id}, {"$set": {"email": "student@sms.com"}})

    # 4. Courses
    print("Seeding Courses...")
    courses = [
        {"_id": str(uuid.uuid4()), "code": "CS101", "title": "Programming Basics", "credits": 3, "description": "Python fundamentals.", "prerequisites": []},
        {"_id": str(uuid.uuid4()), "code": "CS202", "title": "Data Structures", "credits": 4, "description": "Stacks, Queues, Trees, Graphs.", "prerequisites": ["CS101"]},
        {"_id": str(uuid.uuid4()), "code": "CS303", "title": "Database Systems", "credits": 3, "description": "Relational DB and SQL.", "prerequisites": ["CS101"]},
        {"_id": str(uuid.uuid4()), "code": "SE101", "title": "Software Lifecycle", "credits": 3, "description": "Agile and Waterfall models.", "prerequisites": []},
        {"_id": str(uuid.uuid4()), "code": "AI401", "title": "Artificial Intelligence", "credits": 4, "description": "Introduction to Neural Networks.", "prerequisites": ["CS202"]}
    ]
    await db.courses.insert_many(courses)

    # 5. Classes
    print("Seeding Classes...")
    classes = []
    sem = "2026-Spring"
    for i, course in enumerate(courses):
        classes.append({
            "_id": str(uuid.uuid4()),
            "course_id": course["_id"],
            "teacher_id": teacher_ids[i % len(teacher_ids)],
            "semester": sem,
            "capacity": 30 + (i * 10),
            "current_enrollment": 0,
            "room": rooms[i % len(rooms)]["code"],
            "schedule": [
                {"day": "Mon" if i % 2 == 0 else "Tue", "start": "08:00", "end": "10:00"},
                {"day": "Wed" if i % 2 == 0 else "Thu", "start": "08:00", "end": "10:00"}
            ]
        })
    await db.classes.insert_many(classes)

    # 6. Enrollments
    print("Seeding Enrollments...")
    enrollments = []
    # Main student enrolled in everything
    for i, cls in enumerate(classes):
        status = "completed" if i == 0 else "active"
        grade = 4.0 if i == 0 else None
        enrollments.append({
            "_id": str(uuid.uuid4()),
            "student_id": student_main_id,
            "class_id": cls["_id"],
            "status": status,
            "grade": grade,
            "comments": "Excellent start" if grade else None,
            "enrolled_at": datetime.utcnow() - timedelta(days=30)
        })
    
    # Other students randomized
    for sid in student_ids[1:]:
        enrollments.append({
            "_id": str(uuid.uuid4()),
            "student_id": sid,
            "class_id": classes[0]["_id"],
            "status": "active",
            "enrolled_at": datetime.utcnow()
        })
    
    await db.enrollments.insert_many(enrollments)
    # Update current_enrollment counts
    for cls in classes:
        count = await db.enrollments.count_documents({"class_id": cls["_id"]})
        await db.classes.update_one({"_id": cls["_id"]}, {"$set": {"current_enrollment": count}})

    # 7. Finance
    print("Seeding Finance...")
    policy_id = str(uuid.uuid4())
    await db.finance_policies.insert_one({
        "_id": str(uuid.uuid4()),
        "semester": sem,
        "cost_per_credit": 600.0,
        "is_active": True,
        "created_at": datetime.utcnow()
    })
    
    # Calculate finance records for all students
    for sid in student_ids:
        # Get credits for enrolled active/completed classes
        student_enrolls = await db.enrollments.find({"student_id": sid}).to_list(100)
        total_credits = 0
        for en in student_enrolls:
            cls = await db.classes.find_one({"_id": en["class_id"]})
            crs = await db.courses.find_one({"_id": cls["course_id"]})
            total_credits += crs["credits"]
        
        total_amount = float(total_credits * 600)
        paid = 500.0 if sid == student_main_id else 0.0
        await db.finance_records.insert_one({
            "_id": str(uuid.uuid4()),
            "student_id": sid,
            "semester": sem,
            "total_amount": total_amount,
            "paid_amount": paid,
            "status": "paid" if paid >= total_amount else ("partial" if paid > 0 else "unpaid"),
            "updated_at": datetime.utcnow()
        })

    # 8. Assignments & Submissions
    print("Seeding Assignments...")
    asgn1_id = str(uuid.uuid4())
    await db.assignments.insert_one({
        "_id": asgn1_id,
        "class_id": classes[1]["_id"],
        "title": "First Project: Data Structures",
        "description": "Implement a balanced binary search tree.",
        "deadline": datetime.utcnow() + timedelta(days=5),
        "created_at": datetime.utcnow()
    })
    
    # Main student submits
    await db.submissions.insert_one({
        "_id": str(uuid.uuid4()),
        "assignment_id": asgn1_id,
        "student_id": student_main_id,
        "content": "https://github.com/student/ds-project",
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
            "records": [{"student_id": sid, "status": "PRESENT"} for sid in student_ids]
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
