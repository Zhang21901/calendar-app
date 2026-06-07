"""Pydantic schemas for DailyMemo."""

from pydantic import BaseModel


class MemoUpdate(BaseModel):
    content: str


class MemoResponse(BaseModel):
    id: int
    date: str
    content: str

    model_config = {"from_attributes": True}
