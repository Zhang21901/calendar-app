"""AppSetting ORM model — key-value settings store (theme, preferences)."""

from sqlalchemy import Column, String, Text
from app.database import Base


class AppSetting(Base):
    __tablename__ = "app_settings"

    key = Column(String(50), primary_key=True)
    value = Column(Text, nullable=False)
