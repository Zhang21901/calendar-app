"""DailyMemo ORM model — scratchpad notes per day."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, Text, DateTime
from app.database import Base


class DailyMemo(Base):
    __tablename__ = "daily_memos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False, unique=True)
    content = Column(Text, default="")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
