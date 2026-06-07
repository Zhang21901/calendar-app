"""Task business logic — CRUD operations with category management."""

from datetime import date, time
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.task import Task
from app.models.category import Category
from app.schemas.task import TaskCreate, TaskUpdate


def get_task(db: Session, task_id: int) -> Optional[Task]:
    return db.query(Task).filter(Task.id == task_id).first()


def list_tasks(
    db: Session,
    search: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    scheduled_date: Optional[date] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    pool_only: Optional[bool] = None,
    category_id: Optional[int] = None,
) -> List[Task]:
    query = db.query(Task)

    if search:
        query = query.filter(
            or_(
                Task.title.ilike(f"%{search}%"),
                Task.description.ilike(f"%{search}%"),
            )
        )
    if priority:
        query = query.filter(Task.priority == priority)
    if status:
        query = query.filter(Task.status == status)
    if scheduled_date:
        query = query.filter(Task.scheduled_date == scheduled_date)
    if start_date and end_date:
        query = query.filter(Task.scheduled_date.between(start_date, end_date))
    if pool_only is not None:
        if pool_only:
            query = query.filter(
                or_(Task.pool_only == True, Task.scheduled_date == None)
            )
    if category_id:
        query = query.filter(Task.categories.any(id=category_id))

    return query.order_by(Task.sort_order, Task.priority, Task.created_at.desc()).all()


def create_task(db: Session, data: TaskCreate) -> Task:
    task = Task(
        title=data.title,
        description=data.description,
        estimated_minutes=data.estimated_minutes,
        priority=data.priority,
        hard_deadline=data.hard_deadline,
        scheduled_date=data.scheduled_date,
        scheduled_time=data.scheduled_time,
        pool_only=data.pool_only,
    )
    if data.category_ids:
        categories = (
            db.query(Category).filter(Category.id.in_(data.category_ids)).all()
        )
        task.categories = categories
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update_task(db: Session, task: Task, data: TaskUpdate) -> Task:
    update_data = data.model_dump(exclude_unset=True)
    category_ids = update_data.pop("category_ids", None)

    for key, value in update_data.items():
        setattr(task, key, value)

    if category_ids is not None:
        categories = (
            db.query(Category).filter(Category.id.in_(category_ids)).all()
        )
        task.categories = categories

    # Auto-set is_completed when completion_pct reaches 100
    if task.completion_pct is not None and task.completion_pct >= 100:
        task.is_completed = True
        task.status = "completed"

    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task: Task) -> None:
    db.delete(task)
    db.commit()


def schedule_task(
    db: Session, task: Task, scheduled_date: Optional[date], scheduled_time: Optional[time]
) -> Task:
    task.scheduled_date = scheduled_date
    task.scheduled_time = scheduled_time
    task.pool_only = False
    db.commit()
    db.refresh(task)
    return task


def update_progress(
    db: Session, task: Task, completion_pct: Optional[int], is_completed: Optional[bool]
) -> Task:
    if completion_pct is not None:
        task.completion_pct = completion_pct
        if completion_pct >= 100:
            task.is_completed = True
            task.status = "completed"
    if is_completed is not None:
        task.is_completed = is_completed
        if is_completed:
            task.completion_pct = 100
            task.status = "completed"
        else:
            task.status = "in_progress" if task.completion_pct > 0 else "pending"
    db.commit()
    db.refresh(task)
    return task


def copy_task(db: Session, task: Task) -> Task:
    """Create a copy of a task (for Alt+drag duplication)."""
    new_task = Task(
        title=task.title,
        description=task.description,
        estimated_minutes=task.estimated_minutes,
        priority=task.priority,
        hard_deadline=task.hard_deadline,
        pool_only=True,
    )
    new_task.categories = task.categories
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task
