from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.database import get_database
from app.schemas.user import UserCreate, UserOut
from app.schemas.common import ProfileUpdate
from app.api.deps import get_current_user
from app.core.audit import log_audit_event
from datetime import datetime
import uuid

router = APIRouter()

@router.post("/register", response_model=UserOut)
async def register(user_in: UserCreate):
    db = get_database()
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    user_dict = user_in.model_dump()
    user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
    user_dict["_id"] = str(uuid.uuid4())
    user_dict["created_at"] = datetime.utcnow()
    
    await db.users.insert_one(user_dict)
    await log_audit_event(
        action="auth.register",
        actor_id=user_dict["_id"],
        actor_role=user_dict["role"],
        target_type="user",
        target_id=user_dict["_id"],
    )
    return user_dict

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_database()
    try:
        user = await db.users.find_one({"email": form_data.username})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not verify_password(form_data.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token = create_access_token(subject=user["_id"])
        await log_audit_event(
            action="auth.login",
            actor_id=user["_id"],
            actor_role=user.get("role"),
            target_type="user",
            target_id=user["_id"],
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        print(f"DEBUG: Login error: {str(e)}")
        import traceback
        traceback.print_exc()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refresh-token")
async def refresh_token(current_user: dict = Depends(get_current_user)):
    access_token = create_access_token(subject=current_user["_id"])
    await log_audit_event(
        action="auth.refresh_token",
        actor_id=current_user["_id"],
        actor_role=current_user.get("role"),
        target_type="user",
        target_id=current_user["_id"],
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserOut)
async def update_my_profile(payload: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    db = get_database()
    updatable = payload.model_dump(exclude_none=True)
    # Prevent users from changing their own department, status, or active status via /me
    updatable.pop("department", None)
    updatable.pop("status", None)
    updatable.pop("is_active", None)
    
    if not updatable:
        return current_user

    if "email" in updatable and updatable["email"] != current_user["email"]:
        existing = await db.users.find_one({"email": updatable["email"], "_id": {"$ne": current_user["_id"]}})
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")

    await db.users.update_one({"_id": current_user["_id"]}, {"$set": updatable})
    updated = await db.users.find_one({"_id": current_user["_id"]})
    await log_audit_event(
        action="auth.update_profile",
        actor_id=current_user["_id"],
        actor_role=current_user.get("role"),
        target_type="user",
        target_id=current_user["_id"],
        metadata={"fields": list(updatable.keys())},
    )
    return updated

@router.post("/change-password")
async def change_password(payload: dict, current_user: dict = Depends(get_current_user)):
    current_password = payload.get("current_password")
    new_password = payload.get("new_password")
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="current_password and new_password are required")
    if not verify_password(current_password, current_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    db = get_database()
    hashed_password = get_password_hash(new_password)
    await db.users.update_one({"_id": current_user["_id"]}, {"$set": {"hashed_password": hashed_password}})
    await log_audit_event(
        action="auth.change_password",
        actor_id=current_user["_id"],
        actor_role=current_user.get("role"),
        target_type="user",
        target_id=current_user["_id"],
    )
    return {"message": "Password changed successfully"}
