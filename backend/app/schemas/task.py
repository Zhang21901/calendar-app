"""Pydantic schemas for Task CRUD."""

from datetime import date, time, datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class CategoryBrief(BaseModel):
    id: int
    name: str
    color: str

    model_config = {"from_attributes": True}


class TaskCreate(BaseModel):
    title: str = Field(..., max_length=200)
    description: str = ""
    estimated_minutes: int = 0
    priority: str = Field(default="P3", pattern=r"^P[0-3]$")
    hard_deadline: Optional[date] = None
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    pool_only: bool = False
    category_ids: List[int] = []


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    priority: Optional[str] = Field(None, pattern=r"^P[0-3]$")
    status: Optional[str] = Field(None, pattern=r"^(pending|in_progress|completed)$")
    completion_pct: Optional[int] = Field(None, ge=0, le=100)
    is_completed: Optional[bool] = None
    hard_deadline: Optional[date] = None
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    pool_only: Optional[bool] = None
    migration_count: Optional[int] = None
    sort_order: Optional[int] = None
    category_ids: Optional[List[int]] = None


class TaskSchedule(BaseModel):
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None


class TaskProgress(BaseModel):
    completion_pct: Optional[int] = Field(None, ge=0, le=100)
    is_completed: Optional[bool] = None


class TaskTime(BaseModel):
    actual_minutes: int = Field(..., ge=0)


class TaskBatchCreate(BaseModel):
    tasks: List[TaskCreate]


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    estimated_minutes: int
    actual_minutes: int
    priority: str
    status: str
    completion_pct: int
    is_completed: bool
    hard_deadline: Optional[date] = None
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    pool_only: bool
    migration_count: int
    sort_order: int
    created_at: datetime
    updated_at: datetime
    categories: List[CategoryBrief] = []

    model_config = {"from_attributes": True}


class TaskBrief(BaseModel):
    """Lightweight task representation for calendar cells."""
    id: int
    title: str
    priority: str
    status: str
    completion_pct: int
    is_completed: bool
    scheduled_time: Optional[time] = None
    categories: List[CategoryBrief] = []

    model_config = {"from_attributes": True}
