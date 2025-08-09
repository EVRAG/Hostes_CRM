from datetime import datetime
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import get_current_user
from ..cache import get_cached_slots, set_cached_slots
from ..config import settings
from ..db import get_db
from ..models import Booking, Restaurant
from ..schemas import BookingCreate, SlotInfo, SlotsResponse


router = APIRouter()


@router.get("/{restaurant_id}/{date}", response_model=SlotsResponse)
async def get_slots(restaurant_id: int, date: str, _: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        date_str = date
        try:
            parsed_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format, expected YYYY-MM-DD")
        query_date = date_str  # keep as string for cache key
        # Check cache first
        cached = await get_cached_slots(restaurant_id, query_date)
        if cached is not None:
            return SlotsResponse(restaurant_id=restaurant_id, date=parsed_date, slots=[SlotInfo(**s) for s in cached])

        # Build from DB
        # Get restaurant to know default_table_count
        restaurant = await db.get(Restaurant, restaurant_id)
        if restaurant is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")

        stmt: Select = (
            select(Booking.time_slot, func.count(Booking.id))
            .where(Booking.restaurant_id == restaurant_id)
            .where(Booking.date == parsed_date)
            .group_by(Booking.time_slot)
        )
        result = await db.execute(stmt)
        counts: Dict[str, int] = {row[0]: int(row[1]) for row in result.all()}

        slots: List[dict] = []
        for t in settings.TIME_SLOTS:
            booked = counts.get(t, 0)
            free = max(restaurant.default_table_count - booked, 0)
            slots.append({"time": t, "booked": booked, "free": free})

        # Cache result
        await set_cached_slots(restaurant_id, query_date, slots)

        return SlotsResponse(restaurant_id=restaurant_id, date=parsed_date, slots=[SlotInfo(**s) for s in slots])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("", status_code=201)
async def create_booking(payload: BookingCreate, _: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Ensure restaurant exists
    restaurant = await db.get(Restaurant, payload.restaurant_id)
    if restaurant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")

    # Check if time slot is valid
    if payload.time_slot not in settings.TIME_SLOTS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid time slot")

    # Count existing bookings
    stmt: Select = (
        select(func.count(Booking.id))
        .where(Booking.restaurant_id == payload.restaurant_id)
        .where(Booking.date == payload.date)
        .where(Booking.time_slot == payload.time_slot)
    )
    result = await db.execute(stmt)
    current_count = int(result.scalar() or 0)
    if current_count >= restaurant.default_table_count:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="No free tables for selected slot")

    booking = Booking(
        restaurant_id=payload.restaurant_id,
        date=payload.date,
        time_slot=payload.time_slot,
        client_name=payload.client_name,
        start_time=payload.start_time,
        end_time=payload.end_time,
        phone=payload.phone,
        guest_count=payload.guest_count,
        comment=payload.comment,
        tags=','.join(payload.tags) if payload.tags else None,
        deposit=bool(payload.deposit),
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)

    # Invalidate/update cache by recomputing slots for that date
    # Simpler: recompute and set cache now
    stmt_counts: Select = (
        select(Booking.time_slot, func.count(Booking.id))
        .where(Booking.restaurant_id == payload.restaurant_id)
        .where(Booking.date == payload.date)
        .group_by(Booking.time_slot)
    )
    res = await db.execute(stmt_counts)
    counts = {row[0]: int(row[1]) for row in res.all()}
    slots = []
    for t in settings.TIME_SLOTS:
        booked = counts.get(t, 0)
        free = max(restaurant.default_table_count - booked, 0)
        slots.append({"time": t, "booked": booked, "free": free})

    await set_cached_slots(payload.restaurant_id, str(payload.date), slots)

    return {"status": "ok", "booking_id": booking.id}

