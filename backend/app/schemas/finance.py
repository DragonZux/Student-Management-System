from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class InvoiceBase(BaseModel):
    student_id: str
    semester: str
    total_credits: int = 0
    cost_per_credit: float = 0.0
    total_amount: float = 0.0
    paid_amount: float = 0.0
    status: str = "unpaid"


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceUpdate(BaseModel):
    semester: Optional[str] = None
    total_credits: Optional[int] = None
    cost_per_credit: Optional[float] = None
    total_amount: Optional[float] = None
    paid_amount: Optional[float] = None
    status: Optional[str] = None


class InvoiceOut(InvoiceBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


class PaymentBase(BaseModel):
    student_id: str
    invoice_id: Optional[str] = None
    amount: float
    method: Optional[str] = None
    reference: Optional[str] = None
    status: str = "recorded"


class PaymentCreate(PaymentBase):
    pass


class PaymentOut(PaymentBase):
    id: str = Field(alias="_id")
    paid_at: datetime

    class Config:
        populate_by_name = True


class TuitionSummary(BaseModel):
    student_id: str
    total_credits: int
    cost_per_credit: float
    total_amount: float
    paid_amount: float
    status: str
    updated_at: Optional[datetime] = None
