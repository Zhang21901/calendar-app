"""Pydantic schemas for Dashboard aggregation data."""

from typing import List
from pydantic import BaseModel


class DashboardSummary(BaseModel):
    weekly_completion_rate: float  # 0-100
    monthly_completion_rate: float  # 0-100
    total_tasks_week: int
    completed_tasks_week: int
    total_tasks_month: int
    completed_tasks_month: int


class DailyHoursItem(BaseModel):
    date: str
    hours: float


class DailyHoursResponse(BaseModel):
    data: List[DailyHoursItem]


class CompletionHeatmapItem(BaseModel):
    date: str
    rate: float  # 0-100


class CompletionHeatmapResponse(BaseModel):
    data: List[CompletionHeatmapItem]


class MigrationTrendItem(BaseModel):
    date: str
    count: int


class MigrationTrendResponse(BaseModel):
    data: List[MigrationTrendItem]
