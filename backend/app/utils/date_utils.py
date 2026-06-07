"""Date utility helpers."""

from datetime import date, timedelta


def get_week_bounds(reference_date: date | None = None) -> tuple[date, date]:
    """Return (Monday, Sunday) for the week containing reference_date."""
    d = reference_date or date.today()
    monday = d - timedelta(days=d.weekday())
    sunday = monday + timedelta(days=6)
    return monday, sunday


def get_month_bounds(reference_date: date | None = None) -> tuple[date, date]:
    """Return (first_day, last_day) for the month containing reference_date."""
    d = reference_date or date.today()
    first = d.replace(day=1)
    if d.month == 12:
        last = d.replace(year=d.year + 1, month=1, day=1) - timedelta(days=1)
    else:
        last = d.replace(month=d.month + 1, day=1) - timedelta(days=1)
    return first, last


def get_calendar_days(year: int, month: int) -> list[date]:
    """Return all dates to display for a calendar month grid (including padding)."""
    first = date(year, month, 1)
    # Start from the Monday of the week containing the 1st
    start = first - timedelta(days=first.weekday())
    # End at the Sunday of the week containing the last day
    if month == 12:
        last = date(year, 12, 31)
    else:
        last = date(year, month + 1, 1) - timedelta(days=1)
    end = last + timedelta(days=6 - last.weekday())

    days = []
    current = start
    while current <= end:
        days.append(current)
        current += timedelta(days=1)
    return days
