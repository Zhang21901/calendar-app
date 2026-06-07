"""Application configuration loaded from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME: str = "Calendar App"
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "sqlite:///./calendar.db"
    )
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
    DEEPSEEK_BASE_URL: str = os.getenv(
        "DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1"
    )
    DEEPSEEK_MODEL: str = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
    LLM_DAILY_SUGGESTION_TIME: str = os.getenv(
        "LLM_DAILY_SUGGESTION_TIME", "07:00"
    )
    MIGRATION_TIME: str = os.getenv("MIGRATION_TIME", "00:05")


settings = Settings()
