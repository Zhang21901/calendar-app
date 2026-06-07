"""Pydantic schemas for LLM endpoints."""

from typing import List, Optional
from datetime import date, time
from pydantic import BaseModel, Field


class NLPParseRequest(BaseModel):
    text: str


class NLPParseResponse(BaseModel):
    title: str
    description: str = ""
    estimated_minutes: int = 0
    priority: str = "P3"
    hard_deadline: Optional[date] = None
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    category_names: List[str] = []


class WeeklySummaryRequest(BaseModel):
    start_date: date
    end_date: date
    tasks_json: str  # JSON string of task data for the week


class WeeklySummaryResponse(BaseModel):
    summary: str


class SmartScheduleRequest(BaseModel):
    pool_task_ids: List[int]
    start_date: date
    end_date: date


class SmartScheduleAssignment(BaseModel):
    task_id: int
    scheduled_date: date
    scheduled_time: Optional[time] = None
    reason: str = ""


class SmartScheduleResponse(BaseModel):
    assignments: List[SmartScheduleAssignment]


class BreakdownRequest(BaseModel):
    goal: str
    deadline: Optional[date] = None


class BreakdownSubTask(BaseModel):
    title: str
    description: str = ""
    estimated_minutes: int = 0
    priority: str = "P3"


class BreakdownResponse(BaseModel):
    sub_tasks: List[BreakdownSubTask]


class SuggestPlanRequest(BaseModel):
    date: date
    pool_tasks_json: str
    scheduled_tasks_json: str
    special_day_json: str = "{}"


class SuggestPlanResponse(BaseModel):
    plan: str
    suggestions: List[SmartScheduleAssignment]


class AnomalyCheckRequest(BaseModel):
    recent_history_json: str  # JSON string of recent task completion data


class AnomalyItem(BaseModel):
    type: str  # e.g., 'streak_break', 'low_completion', 'procrastination'
    message: str
    severity: str = "warning"  # 'info', 'warning', 'alert'


class AnomalyCheckResponse(BaseModel):
    anomalies: List[AnomalyItem]
