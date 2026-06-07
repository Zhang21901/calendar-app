"""AppSettings API router — get/set user preferences."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.app_setting import AppSetting

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/{key}")
def get_setting(key: str, db: Session = Depends(get_db)):
    setting = db.query(AppSetting).filter(AppSetting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return {"key": setting.key, "value": setting.value}


@router.put("/{key}")
def set_setting(key: str, value: dict, db: Session = Depends(get_db)):
    """value: {"value": "the actual value string"}"""
    raw_value = value.get("value", "")
    setting = db.query(AppSetting).filter(AppSetting.key == key).first()
    if setting:
        setting.value = raw_value
    else:
        setting = AppSetting(key=key, value=raw_value)
        db.add(setting)
    db.commit()
    return {"key": key, "value": raw_value}
