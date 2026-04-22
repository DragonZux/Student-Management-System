import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_db():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["sms_db"]
    count = await db.classrooms.count_documents({})
    rooms = await db.classrooms.find().to_list(10)
    print(f"Total Classrooms in DB: {count}")
    for r in rooms:
        print(f"- {r.get('code')} ({r.get('building')})")
    client.close()

if __name__ == "__main__":
    asyncio.run(check_db())
