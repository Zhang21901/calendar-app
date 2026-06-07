"""Pydantic schemas for SpecialDay CRUD."""

from datetime import date
from typing import Optional
from pydantic import BaseModel, Field


class SpecialDayCreate(BaseModel):
    date: date
    type: str = Field(..., pattern=r"^(hard_deadline|milestone|rest_day|custom)$")
    label: str = ""
    color: str = Field(default="#ef4444", max_length=7)
    icon: str = ""
    reminder: bool = True
    note: Optional[str] = None


class SpecialDayUpdate(BaseModel):
    type: Optional[str] = Field(None, pattern=r"^(hard_deadline|milestone|rest_day|custom)$")
    label: Optional[str] = None
    color: Optional[str] = Field(None, max_length=7)
    icon: Optional[str] = None
    reminder: Optional[bool] = None
    note: Optional[str] = None


class SpecialDayResponse(BaseModel):
    id: int
    date: date
    type: str
    label: str
    color: str
    icon: str
    reminder: bool
    note: Optional[str] = None

    model_config = {"from_attributes": True}
