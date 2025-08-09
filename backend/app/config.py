import os
from typing import List


class Settings:
    DB_URL: str = os.getenv("DB_URL", "postgresql+asyncpg://crm_user:crm_password@db:5432/crm_db")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "supersecretjwt")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "password123")
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")

    # Define restaurant-wide default time slots (local time strings HH:MM)
    TIME_SLOTS: List[str] = [
        "12:00",
        "13:00",
        "14:00",
        "15:00",
        "16:00",
        "17:00",
        "18:00",
        "19:00",
        "20:00",
        "21:00",
        "22:00",
    ]


settings = Settings()

