"""TimeRecord API router — timer start/stop and manual entries."""

from datetime import datetime, date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.time_record import TimeRecord
from app.models.task import Task
from app.schemas.time_record import (
    TimeRecordStart, TimeRecordManual, TimeRecordResponse,
)

router = APIRouter(prefix="/api/time-records", tags=["time-records"])


@router.get("", response_model=list[TimeRecordResponse])
def list_time_records(
    task_id: Optional[int] = Query(None),
    date_param: Optional[date] = Query(None, alias="date"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(TimeRecord)
    if task_id:
        query = query.filter(TimeRecord.task_id == task_id)
    if date_param:
        query = query.filter(TimeRecord.date == date_param)
    if start_date and end_date:
        query = query.filter(TimeRecord.date.between(start_date, end_date))
    return query.order_by(TimeRecord.start_time.desc()).all()


@router.post("", response_model=TimeRecordResponse, status_code=201)
def start_timer(data: TimeRecordStart, db: Session = Depends(get_db)):
    # Verify task exists
    task = db.query(Task).filter(Task.id == data.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    # Check for already running timer
    running = (
        db.query(TimeRecord)
        .filter(TimeRecord.task_id == data.task_id, TimeRecord.end_time == None)
        .first()
    )
    if running:
        raise HTTPException(status_code=400, detail="Timer already running for this task")
    record = TimeRecord(
        task_id=data.task_id,
        date=data.date,
        start_time=datetime.utcnow(),
        source="timer",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/{record_id}/stop", response_model=TimeRecordResponse)
def stop_timer(record_id: int, db: Session = Depends(get_db)):
    record = db.query(TimeRecord).filter(TimeRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Time record not found")
    if record.end_time is not None:
        raise HTTPException(status_code=400, detail="Timer already stopped")
    now = datetime.utcnow()
    record.end_time = now
    duration = (now - record.start_time).total_seconds() / 60
    record.duration_minutes = int(duration)
    # Update task actual_minutes
    task = db.query(Task).filter(Task.id == record.task_id).first()
    if task:
        task.actual_minutes = (task.actual_minutes or 0) + record.duration_minutes
    db.commit()
    db.refresh(record)
    return record


@router.post("/manual", response_model=TimeRecordResponse, status_code=201)
def add_manual_time(data: TimeRecordManual, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == data.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    now = datetime.utcnow()
    record = TimeRecord(
        task_id=data.task_id,
        date=data.date,
        start_time=now,
        end_time=now,
        duration_minutes=data.duration_minutes,
        source="manual",
    )
    task.actual_minutes = (task.actual_minutes or 0) + data.duration_minutes
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
