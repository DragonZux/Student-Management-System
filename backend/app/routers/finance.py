from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.dependencies import get_current_user, check_admin_role
from app.routers.notifications import create_notification
from app.core.audit import log_audit_event
from app.db.database import get_database
from app.schemas.finance import InvoiceOut, PaymentCreate, PaymentOut, TuitionSummary
from app.schemas.user import UserRole
import uuid
from datetime import datetime

router = APIRouter(redirect_slashes=False)

async def _get_active_cost_per_credit(db, semester: Optional[str] = None) -> float:
    query = {"is_active": True}
    if semester:
        query["semester"] = semester
    policy = await db.fee_policies.find_one(query, sort=[("created_at", -1)])
    if policy:
        return float(policy["cost_per_credit"])
    return 500.0

@router.get("/my-tuition", response_model=InvoiceOut)
async def get_my_tuition(student: dict = Depends(get_current_user)):
    if student["role"] != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can view tuition")
    
    db = get_database()
    # Find all enrollments
    enrollments = await db.enrollments.find({"student_id": student["_id"]}).to_list(1000)
    
    # Calculate tuition based on credits and active policy
    total_credits = 0
    class_ids = [item["class_id"] for item in enrollments if item.get("class_id")]
    classes = await db.classes.find({"_id": {"$in": class_ids}}).to_list(len(set(class_ids))) if class_ids else []
    course_ids = [item.get("course_id") for item in classes if item.get("course_id")]
    courses = await db.courses.find({"_id": {"$in": list(set(course_ids))}}).to_list(len(set(course_ids))) if course_ids else []
    course_by_id = {item["_id"]: item for item in courses}

    for cls in classes:
        course = course_by_id.get(cls.get("course_id"))
        if course:
            total_credits += course.get("credits", 0)
    
    cost_per_credit = await _get_active_cost_per_credit(db)
    total_amount = total_credits * cost_per_credit
    
    # Check if a finance record exists
    invoice = await db.invoices.find_one({"student_id": student["_id"]})
    status_text = "paid" if invoice and invoice.get("paid_amount", 0) >= total_amount else "partially_paid" if invoice and invoice.get("paid_amount", 0) > 0 else "unpaid"
    invoice_payload = {
        "student_id": student["_id"],
        "semester": student.get("semester", "current"),
        "total_credits": total_credits,
        "cost_per_credit": cost_per_credit,
        "total_amount": total_amount,
        "paid_amount": invoice.get("paid_amount", 0) if invoice else 0,
        "status": status_text,
        "updated_at": datetime.utcnow(),
    }
    if not invoice:
        invoice_payload.update({"_id": str(uuid.uuid4()), "created_at": datetime.utcnow()})
        await db.invoices.insert_one(invoice_payload)
    else:
        await db.invoices.update_one({"student_id": student["_id"]}, {"$set": invoice_payload})
        invoice_payload["_id"] = invoice["_id"]
        invoice_payload["created_at"] = invoice.get("created_at")
    return invoice_payload


@router.get("/my-payments")
async def get_my_payments(
    student: dict = Depends(get_current_user),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=2000)
):
    if student["role"] != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can view payments")
    db = get_database()
    query = {"student_id": student["_id"]}
    total = await db.payments.count_documents(query)
    payments = await db.payments.find(query).sort("paid_at", -1).skip(skip).limit(limit).to_list(limit)
    return {
        "data": payments,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.post("/update-payment/{student_id}", dependencies=[Depends(check_admin_role)])
async def update_payment(student_id: str, amount: float):
    db = get_database()
    if amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be positive")
    existing = await db.invoices.find_one({"student_id": student_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Finance record not found")

    await db.invoices.update_one({"student_id": student_id}, {"$inc": {"paid_amount": amount}, "$set": {"updated_at": datetime.utcnow()}})
    await db.payments.insert_one({
        "_id": str(uuid.uuid4()),
        "student_id": student_id,
        "invoice_id": existing.get("_id"),
        "amount": amount,
        "method": "admin_adjustment",
        "status": "recorded",
        "paid_at": datetime.utcnow(),
    })
    
    # Update status if fully paid
    invoice = await db.invoices.find_one({"student_id": student_id})
    if invoice and invoice["paid_amount"] >= invoice["total_amount"]:
        await db.invoices.update_one({"student_id": student_id}, {"$set": {"status": "paid"}})
    elif invoice and invoice["paid_amount"] > 0:
        await db.invoices.update_one({"student_id": student_id}, {"$set": {"status": "partially_paid"}})

    await log_audit_event(
        action="admin.update_payment",
        actor_role=UserRole.ADMIN.value,
        target_type="finance",
        target_id=student_id,
        metadata={"amount": amount},
    )

    # Notify student about payment update/adjustment
    updated_invoice = await db.invoices.find_one({"student_id": student_id})
    if updated_invoice:
        paid = float(updated_invoice.get("paid_amount", 0))
        total = float(updated_invoice.get("total_amount", 0))
        status_text = updated_invoice.get("status") or ("paid" if paid >= total else "partially_paid" if paid > 0 else "unpaid")
        if status_text == "paid":
            msg = f"Học phí của bạn đã được cập nhật và hiện đã thanh toán đủ ({paid}/{total})."
        elif status_text == "partially_paid":
            msg = f"Học phí của bạn đã được cập nhật. Đã thanh toán: {paid}/{total}."
        else:
            msg = f"Học phí của bạn đã được cập nhật. Số tiền đã ghi nhận: {paid}/{total}."
        await create_notification(user_id=student_id, title="Cập nhật học phí", message=msg)
         
    return {"message": "Payment recorded successfully"}


@router.get("")
@router.get("/invoices", dependencies=[Depends(check_admin_role)])
async def list_invoices(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=2000)
):
    db = get_database()
    total = await db.invoices.count_documents({})
    invoices = await db.invoices.find().sort("updated_at", -1).skip(skip).limit(limit).to_list(limit)
    return {
        "data": invoices,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("")
@router.get("/payments", dependencies=[Depends(check_admin_role)])
async def list_payments(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=2000)
):
    db = get_database()
    total = await db.payments.count_documents({})
    payments = await db.payments.find().sort("paid_at", -1).skip(skip).limit(limit).to_list(limit)
    return {
        "data": payments,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.post("/pay-my-tuition")
async def pay_my_tuition(payload: dict, student: dict = Depends(get_current_user)):
    if student["role"] != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can make tuition payments")
    amount = payload.get("amount")
    if amount is None or not isinstance(amount, (int, float)) or float(amount) <= 0:
        raise HTTPException(status_code=400, detail="Valid positive amount is required")

    db = get_database()
    invoice = await db.invoices.find_one({"student_id": student["_id"]})
    if not invoice:
        raise HTTPException(status_code=404, detail="Tuition record not found, call /my-tuition first")

    await db.invoices.update_one({"student_id": student["_id"]}, {"$inc": {"paid_amount": float(amount)}, "$set": {"updated_at": datetime.utcnow()}})
    await db.payments.insert_one({
        "_id": str(uuid.uuid4()),
        "student_id": student["_id"],
        "invoice_id": invoice.get("_id"),
        "amount": float(amount),
        "method": payload.get("method") or "online",
        "reference": payload.get("reference"),
        "status": "recorded",
        "paid_at": datetime.utcnow(),
    })
    updated = await db.invoices.find_one({"student_id": student["_id"]})
    status_text = "paid" if updated["paid_amount"] >= updated["total_amount"] else "partially_paid"
    await db.invoices.update_one({"student_id": student["_id"]}, {"$set": {"status": status_text}})
    updated = await db.invoices.find_one({"student_id": student["_id"]})

    await log_audit_event(
        action="student.pay_tuition",
        actor_id=student["_id"],
        actor_role=student["role"],
        target_type="finance",
        target_id=student["_id"],
        metadata={"amount": float(amount)},
    )
    # Optional: notify the student (useful if they have multiple sessions open)
    if updated:
        paid = float(updated.get("paid_amount", 0))
        total = float(updated.get("total_amount", 0))
        status_text = updated.get("status") or ("paid" if paid >= total else "partially_paid")
        title_text = "Thanh toán học phí thành công"
        if status_text == "paid":
            msg = f"Bạn đã thanh toán đủ học phí ({paid}/{total})."
        else:
            msg = f"Bạn đã thanh toán thành công. Đã thanh toán: {paid}/{total}."
        await create_notification(user_id=student["_id"], title=title_text, message=msg)

        # Notify all admins about the payment
        admin_users = await db.users.find({"role": UserRole.ADMIN}).to_list(100)
        for admin in admin_users:
            await create_notification(
                user_id=admin["_id"],
                title="Thông báo thanh toán học phí",
                message=f"Sinh viên {student.get('full_name', student['_id'])} đã thanh toán {float(amount):,.0f} VNĐ học phí."
            )
    if updated and "_id" in updated:
        updated["_id"] = str(updated["_id"])
    # Keep a stable response shape for FE/test scripts.
    return {"message": "Payment successful", "finance": updated}

@router.post("/policies", dependencies=[Depends(check_admin_role)])
async def create_fee_policy(payload: dict):
    db = get_database()
    semester = payload.get("semester")
    cost_per_credit = payload.get("cost_per_credit")
    if not semester or cost_per_credit is None:
        raise HTTPException(status_code=400, detail="semester and cost_per_credit are required")
    if not isinstance(cost_per_credit, (int, float)) or cost_per_credit <= 0:
        raise HTTPException(status_code=400, detail="cost_per_credit must be a positive number")

    if payload.get("is_active", True):
        await db.fee_policies.update_many({"semester": semester}, {"$set": {"is_active": False}})

    policy = {
        "_id": str(uuid.uuid4()),
        "semester": semester,
        "cost_per_credit": float(cost_per_credit),
        "is_active": bool(payload.get("is_active", True)),
        "created_at": datetime.utcnow(),
    }
    await db.fee_policies.insert_one(policy)
    await log_audit_event(
        action="admin.create_fee_policy",
        actor_role=UserRole.ADMIN.value,
        target_type="fee_policy",
        target_id=policy["_id"],
        metadata={"semester": semester},
    )
    return policy

@router.get("/policies", dependencies=[Depends(check_admin_role)], response_model=List[dict])
async def list_fee_policies():
    db = get_database()
    return await db.fee_policies.find().sort("created_at", -1).to_list(1000)

@router.patch("/policies/{policy_id}", dependencies=[Depends(check_admin_role)])
async def update_fee_policy(policy_id: str, payload: dict):
    db = get_database()
    updatable = {k: v for k, v in payload.items() if k in {"semester", "cost_per_credit", "is_active"}}
    if not updatable:
        policy = await db.fee_policies.find_one({"_id": policy_id})
        if not policy:
            raise HTTPException(status_code=404, detail="Policy not found")
        return policy

    if "cost_per_credit" in updatable:
        if not isinstance(updatable["cost_per_credit"], (int, float)) or updatable["cost_per_credit"] <= 0:
            raise HTTPException(status_code=400, detail="cost_per_credit must be a positive number")
        updatable["cost_per_credit"] = float(updatable["cost_per_credit"])

    current = await db.fee_policies.find_one({"_id": policy_id})
    if not current:
        raise HTTPException(status_code=404, detail="Policy not found")

    if updatable.get("is_active") is True:
        semester = updatable.get("semester", current["semester"])
        await db.fee_policies.update_many({"semester": semester, "_id": {"$ne": policy_id}}, {"$set": {"is_active": False}})

    await db.fee_policies.update_one({"_id": policy_id}, {"$set": updatable})
    updated = await db.fee_policies.find_one({"_id": policy_id})
    await log_audit_event(
        action="admin.update_fee_policy",
        actor_role=UserRole.ADMIN.value,
        target_type="fee_policy",
        target_id=policy_id,
        metadata={"fields": list(updatable.keys())},
    )
    return updated

@router.delete("/policies/{policy_id}", dependencies=[Depends(check_admin_role)])
async def delete_fee_policy(policy_id: str):
    db = get_database()
    result = await db.fee_policies.delete_one({"_id": policy_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Policy not found")
    await log_audit_event(
        action="admin.delete_fee_policy",
        actor_role=UserRole.ADMIN.value,
        target_type="fee_policy",
        target_id=policy_id,
    )
    return {"message": "Fee policy deleted successfully"}
