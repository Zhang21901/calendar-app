"""MigrationLog ORM model — tracks task procrastination/migration history."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class MigrationLog(Base):
    __tablename__ = "migration_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    from_date = Column(Date, nullable=False)
    to_date = Column(Date, nullable=False)
    migrated_at = Column(DateTime, default=datetime.utcnow)
    reason = Column(String(50), default="unfinished")  # 'unfinished' or 'manual'

    task = relationship("Task", back_populates="migration_logs")
