"""DailyMemo API router — get/upsert daily scratchpad."""

from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.memo import DailyMemo
from app.schemas.memo import MemoUpdate, MemoResponse

router = APIRouter(prefix="/api/memos", tags=["memos"])


@router.get("/{memo_date}", response_model=MemoResponse)
def get_memo(memo_date: date, db: Session = Depends(get_db)):
    memo = db.query(DailyMemo).filter(DailyMemo.date == memo_date).first()
    if not memo:
        # Return empty memo — don't create until user writes
        return MemoResponse(id=0, date=memo_date.isoformat(), content="")
    return MemoResponse(
        id=memo.id,
        date=memo.date.isoformat(),
        content=memo.content,
    )


@router.put("/{memo_date}", response_model=MemoResponse)
def upsert_memo(memo_date: date, data: MemoUpdate, db: Session = Depends(get_db)):
    memo = db.query(DailyMemo).filter(DailyMemo.date == memo_date).first()
    if memo:
        memo.content = data.content
    else:
        memo = DailyMemo(date=memo_date, content=data.content)
        db.add(memo)
    db.commit()
    db.refresh(memo)
    return MemoResponse(
        id=memo.id,
        date=memo.date.isoformat(),
        content=memo.content,
    )
