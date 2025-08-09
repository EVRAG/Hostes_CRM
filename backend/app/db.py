from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(settings.DB_URL, echo=False, future=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def init_db() -> None:
    # Import models inside function to avoid circular imports
    from .models import Restaurant, Booking  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # best-effort schema upgrades for new booking fields
        try:
            await conn.exec_driver_sql("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS start_time VARCHAR(10)")
            await conn.exec_driver_sql("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS end_time VARCHAR(10)")
            await conn.exec_driver_sql("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS phone VARCHAR(32)")
            await conn.exec_driver_sql("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_count INTEGER")
            await conn.exec_driver_sql("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS comment TEXT")
            await conn.exec_driver_sql("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tags TEXT")
            await conn.exec_driver_sql("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit BOOLEAN DEFAULT FALSE NOT NULL")
        except Exception:
            pass

    # Seed default restaurant with id=1 if not exists
    from sqlalchemy import select

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Restaurant).where(Restaurant.id == 1))
        restaurant = result.scalar_one_or_none()
        if restaurant is None:
            session.add(Restaurant(id=1, name="Default Restaurant", default_table_count=5))
            await session.commit()

