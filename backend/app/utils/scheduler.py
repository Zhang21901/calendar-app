"""Background scheduler for auto-migration and daily LLM suggestions."""

from datetime import date, datetime
from apscheduler.schedulers.background import BackgroundScheduler
from app.config import settings


scheduler = BackgroundScheduler()


def init_scheduler():
    """Initialize and start the background scheduler."""
    # Parse configured times
    migration_hour, migration_minute = map(int, settings.MIGRATION_TIME.split(":"))
    suggest_hour, suggest_minute = map(int, settings.LLM_DAILY_SUGGESTION_TIME.split(":"))

    # Schedule midnight migration
    scheduler.add_job(
        run_migration,
        "cron",
        hour=migration_hour,
        minute=migration_minute,
        id="migration_job",
        replace_existing=True,
    )

    # Schedule daily suggestion (only if API key is configured)
    if settings.DEEPSEEK_API_KEY:
        scheduler.add_job(
            run_daily_suggestion,
            "cron",
            hour=suggest_hour,
            minute=suggest_minute,
            id="daily_suggestion_job",
            replace_existing=True,
        )

    scheduler.start()


def run_migration():
    """Migrate unfinished tasks from past dates to today."""
    from app.database import SessionLocal
    from app.models.task import Task
    from app.models.migration_log import MigrationLog

    db = SessionLocal()
    try:
        today = date.today()
        overdue = (
            db.query(Task)
            .filter(
                Task.scheduled_date < today,
                Task.scheduled_date != None,
                Task.is_completed == False,
            )
            .all()
        )

        for task in overdue:
            from_date = task.scheduled_date
            task.scheduled_date = today
            task.migration_count = (task.migration_count or 0) + 1
            log = MigrationLog(
                task_id=task.id,
                from_date=from_date,
                to_date=today,
                reason="unfinished",
            )
            db.add(log)

        db.commit()
        print(f"[Migration] {len(overdue)} tasks migrated to {today}")
    except Exception as e:
        db.rollback()
        print(f"[Migration] Error: {e}")
    finally:
        db.close()


def run_daily_suggestion():
    """Generate daily suggestion via LLM and store/notify."""
    # This is a placeholder — the actual logic requires
    # calling the LLM service and storing the result
    # for the frontend to pick up.
    print(f"[Scheduler] Daily suggestion triggered at {datetime.now()}")
