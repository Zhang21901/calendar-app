"""Task ORM model — the core entity."""

from datetime import datetime, date, time
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Date, Time, DateTime,
    CheckConstraint, ForeignKey, Table,
)
from sqlalchemy.orm import relationship
from app.database import Base


task_category_table = Table(
    "task_categories",
    Base.metadata,
    Column("task_id", Integer, ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", Integer, ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    estimated_minutes = Column(Integer, default=0)
    actual_minutes = Column(Integer, default=0)
    priority = Column(String(2), nullable=False, default="P3")  # P0/P1/P2/P3
    status = Column(String(20), nullable=False, default="pending")  # pending/in_progress/completed
    completion_pct = Column(Integer, default=0)  # 0-100
    is_completed = Column(Boolean, default=False)
    hard_deadline = Column(Date, nullable=True)
    scheduled_date = Column(Date, nullable=True)
    scheduled_time = Column(Time, nullable=True)
    pool_only = Column(Boolean, default=False)
    migration_count = Column(Integer, default=0)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    categories = relationship("Category", secondary=task_category_table, back_populates="tasks", lazy="selectin")
    time_records = relationship("TimeRecord", back_populates="task", cascade="all, delete-orphan", lazy="selectin")
    migration_logs = relationship("MigrationLog", back_populates="task", cascade="all, delete-orphan", lazy="selectin")

    __table_args__ = (
        CheckConstraint("completion_pct >= 0 AND completion_pct <= 100", name="ck_completion_pct"),
        CheckConstraint("priority IN ('P0', 'P1', 'P2', 'P3')", name="ck_priority"),
        CheckConstraint("status IN ('pending', 'in_progress', 'completed')", name="ck_status"),
    )
