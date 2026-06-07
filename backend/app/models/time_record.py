"""TimeRecord ORM model — tracks timer start/stop for tasks."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class TimeRecord(Base):
    __tablename__ = "time_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=0)
    source = Column(String(10), default="timer")  # 'timer' or 'manual'

    task = relationship("Task", back_populates="time_records")
