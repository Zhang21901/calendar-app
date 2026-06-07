"""Dashboard API router — aggregated statistics for the data center."""

from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.task import Task
from app.models.migration_log import MigrationLog
from app.schemas.dashboard import (
    DashboardSummary,
    DailyHoursItem, DailyHoursResponse,
    CompletionHeatmapItem, CompletionHeatmapResponse,
    MigrationTrendItem, MigrationTrendResponse,
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _get_week_bounds() -> tuple[date, date]:
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    sunday = monday + timedelta(days=6)
    return monday, sunday


def _get_month_bounds() -> tuple[date, date]:
    today = date.today()
    first = today.replace(day=1)
    if today.month == 12:
        last = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
    else:
        last = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
    return first, last


@router.get("/summary", response_model=DashboardSummary)
def get_summary(db: Session = Depends(get_db)):
    week_start, week_end = _get_week_bounds()
    month_start, month_end = _get_month_bounds()

    # Weekly stats
    week_tasks = (
        db.query(Task)
        .filter(Task.scheduled_date.between(week_start, week_end))
        .all()
    )
    week_total = len(week_tasks)
    week_completed = sum(1 for t in week_tasks if t.is_completed)

    # Monthly stats
    month_tasks = (
        db.query(Task)
        .filter(Task.scheduled_date.between(month_start, month_end))
        .all()
    )
    month_total = len(month_tasks)
    month_completed = sum(1 for t in month_tasks if t.is_completed)

    return DashboardSummary(
        weekly_completion_rate=round(week_completed / week_total * 100, 1) if week_total > 0 else 0,
        monthly_completion_rate=round(month_completed / month_total * 100, 1) if month_total > 0 else 0,
        total_tasks_week=week_total,
        completed_tasks_week=week_completed,
        total_tasks_month=month_total,
        completed_tasks_month=month_completed,
    )


@router.get("/daily-hours", response_model=DailyHoursResponse)
def get_daily_hours(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db),
):
    tasks = (
        db.query(Task)
        .filter(Task.scheduled_date.between(start_date, end_date))
        .all()
    )
    # Group by date and sum actual_minutes
    hours_map: dict[str, float] = {}
    current = start_date
    while current <= end_date:
        hours_map[current.isoformat()] = 0.0
        current += timedelta(days=1)

    for task in tasks:
        if task.scheduled_date:
            key = task.scheduled_date.isoformat()
            hours_map[key] = hours_map.get(key, 0) + (task.actual_minutes or 0) / 60.0

    data = [
        DailyHoursItem(date=d, hours=round(h, 1))
        for d, h in sorted(hours_map.items())
    ]
    return DailyHoursResponse(data=data)


@router.get("/completion-heatmap", response_model=CompletionHeatmapResponse)
def get_completion_heatmap(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db),
):
    tasks = (
        db.query(Task)
        .filter(Task.scheduled_date.between(start_date, end_date))
        .all()
    )
    # Group by date and calculate completion rate
    rate_map: dict[str, list[bool]] = {}
    current = start_date
    while current <= end_date:
        rate_map[current.isoformat()] = []
        current += timedelta(days=1)

    for task in tasks:
        if task.scheduled_date:
            key = task.scheduled_date.isoformat()
            rate_map[key].append(task.is_completed)

    data = []
    for d, completed_list in sorted(rate_map.items()):
        total = len(completed_list)
        rate = round(sum(completed_list) / total * 100, 1) if total > 0 else 0
        data.append(CompletionHeatmapItem(date=d, rate=rate))

    return CompletionHeatmapResponse(data=data)


@router.get("/migration-trend", response_model=MigrationTrendResponse)
def get_migration_trend(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db),
):
    logs = (
        db.query(MigrationLog)
        .filter(MigrationLog.migrated_at.between(
            start_date, end_date + timedelta(days=1)
        ))
        .all()
    )
    # Count migrations per day
    count_map: dict[str, int] = {}
    current = start_date
    while current <= end_date:
        count_map[current.isoformat()] = 0
        current += timedelta(days=1)

    for log in logs:
        key = log.to_date.isoformat()
        count_map[key] = count_map.get(key, 0) + 1

    data = [
        MigrationTrendItem(date=d, count=c)
        for d, c in sorted(count_map.items())
    ]
    return MigrationTrendResponse(data=data)
