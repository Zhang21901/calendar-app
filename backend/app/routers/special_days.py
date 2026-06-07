"""SpecialDay CRUD API router."""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.special_day import SpecialDay
from app.schemas.special_day import (
    SpecialDayCreate, SpecialDayUpdate, SpecialDayResponse,
)

router = APIRouter(prefix="/api/special-days", tags=["special-days"])


@router.get("", response_model=list[SpecialDayResponse])
def list_special_days(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(SpecialDay)
    if start_date and end_date:
        query = query.filter(SpecialDay.date.between(start_date, end_date))
    return query.order_by(SpecialDay.date).all()


@router.get("/today", response_model=Optional[SpecialDayResponse])
def get_today_special_day(db: Session = Depends(get_db)):
    from datetime import date as date_type
    today = date_type.today()
    return db.query(SpecialDay).filter(SpecialDay.date == today).first()


@router.post("", response_model=SpecialDayResponse, status_code=201)
def create_special_day(data: SpecialDayCreate, db: Session = Depends(get_db)):
    existing = db.query(SpecialDay).filter(SpecialDay.date == data.date).first()
    if existing:
        raise HTTPException(status_code=400, detail="Special day already exists for this date")
    sd = SpecialDay(**data.model_dump())
    db.add(sd)
    db.commit()
    db.refresh(sd)
    return sd


@router.put("/{special_day_id}", response_model=SpecialDayResponse)
def update_special_day(
    special_day_id: int, data: SpecialDayUpdate, db: Session = Depends(get_db)
):
    sd = db.query(SpecialDay).filter(SpecialDay.id == special_day_id).first()
    if not sd:
        raise HTTPException(status_code=404, detail="Special day not found")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(sd, key, value)
    db.commit()
    db.refresh(sd)
    return sd


@router.delete("/{special_day_id}", status_code=204)
def delete_special_day(special_day_id: int, db: Session = Depends(get_db)):
    sd = db.query(SpecialDay).filter(SpecialDay.id == special_day_id).first()
    if not sd:
        raise HTTPException(status_code=404, detail="Special day not found")
    db.delete(sd)
    db.commit()
