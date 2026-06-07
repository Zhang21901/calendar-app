"""Pydantic schemas for TimeRecord."""

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class TimeRecordStart(BaseModel):
    task_id: int
    date: date


class TimeRecordManual(BaseModel):
    task_id: int
    date: date
    duration_minutes: int = Field(..., ge=0)


class TimeRecordResponse(BaseModel):
    id: int
    task_id: int
    date: date
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: int
    source: str

    model_config = {"from_attributes": True}
