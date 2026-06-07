"""Pydantic schemas for Category CRUD."""

from typing import Optional
from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(..., max_length=50)
    color: str = Field(default="#6366f1", max_length=7)


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=7)


class CategoryResponse(BaseModel):
    id: int
    name: str
    color: str

    model_config = {"from_attributes": True}
