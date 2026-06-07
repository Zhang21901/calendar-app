"""Task CRUD API router."""

from datetime import date, time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.task import (
    TaskCreate, TaskUpdate, TaskResponse, TaskBrief,
    TaskSchedule, TaskProgress, TaskTime, TaskBatchCreate,
)
from app.services import task_service

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskResponse])
def list_tasks(
    search: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    scheduled_date: Optional[date] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    pool_only: Optional[bool] = Query(None),
    category_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    return task_service.list_tasks(
        db, search=search, priority=priority, status=status,
        scheduled_date=scheduled_date, start_date=start_date,
        end_date=end_date, pool_only=pool_only, category_id=category_id,
    )


@router.post("", response_model=TaskResponse, status_code=201)
def create_task(data: TaskCreate, db: Session = Depends(get_db)):
    return task_service.create_task(db, data)


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = task_service.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, data: TaskUpdate, db: Session = Depends(get_db)):
    task = task_service.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_service.update_task(db, task, data)


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = task_service.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task_service.delete_task(db, task)


@router.put("/{task_id}/schedule", response_model=TaskResponse)
def schedule_task(task_id: int, data: TaskSchedule, db: Session = Depends(get_db)):
    task = task_service.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_service.schedule_task(db, task, data.scheduled_date, data.scheduled_time)


@router.put("/{task_id}/progress", response_model=TaskResponse)
def update_progress(task_id: int, data: TaskProgress, db: Session = Depends(get_db)):
    task = task_service.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_service.update_progress(db, task, data.completion_pct, data.is_completed)


@router.put("/{task_id}/time", response_model=TaskResponse)
def update_time(task_id: int, data: TaskTime, db: Session = Depends(get_db)):
    task = task_service.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.actual_minutes = data.actual_minutes
    db.commit()
    db.refresh(task)
    return task


@router.post("/{task_id}/copy", response_model=TaskResponse, status_code=201)
def copy_task(task_id: int, db: Session = Depends(get_db)):
    task = task_service.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_service.copy_task(db, task)


@router.post("/batch", response_model=list[TaskResponse], status_code=201)
def batch_create_tasks(data: TaskBatchCreate, db: Session = Depends(get_db)):
    tasks = [task_service.create_task(db, t) for t in data.tasks]
    return tasks
