import asyncio
import os
import sys

# Add parent directory to sys.path to allow importing 'app'
sys.path.append(os.getcwd())

from app.db.database import connect_to_mongo, get_database, close_mongo_connection

async def create_indexes():
    print("Connecting to MongoDB...")
    await connect_to_mongo()
    db = get_database()
    
    print("Creating indexes for 'users' collection...")
    # Index for role filtering
    await db.users.create_index([("role", 1)])
    # Unique index for email
    await db.users.create_index([("email", 1)], unique=True)
    # Compound index for role and created_at sorting
    await db.users.create_index([("role", 1), ("created_at", -1)])
    
    print("Creating indexes for 'audit_logs' collection...")
    await db.audit_logs.create_index([("created_at", -1)])
    await db.audit_logs.create_index([("action", 1)])
    
    print("Creating indexes for 'enrollments' collection...")
    await db.enrollments.create_index([("student_id", 1)])
    await db.enrollments.create_index([("class_id", 1)])
    await db.enrollments.create_index([("status", 1)])

    print("Indexes created successfully!")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(create_indexes())
