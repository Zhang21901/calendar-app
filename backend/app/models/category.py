"""Category ORM model for task tags."""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.task import task_category_table


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False, unique=True)
    color = Column(String(7), default="#6366f1")  # Hex color

    tasks = relationship("Task", secondary=task_category_table, back_populates="categories", lazy="selectin")
