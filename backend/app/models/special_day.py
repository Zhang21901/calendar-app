"""SpecialDay ORM model — marks important dates."""

from sqlalchemy import Column, Integer, String, Date, Boolean, Text
from app.database import Base


class SpecialDay(Base):
    __tablename__ = "special_days"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False, unique=True)
    type = Column(String(20), nullable=False)  # hard_deadline/milestone/rest_day/custom
    label = Column(String(100), default="")
    color = Column(String(7), default="#ef4444")
    icon = Column(String(50), default="")  # emoji or icon name
    reminder = Column(Boolean, default=True)
    note = Column(Text, nullable=True)
