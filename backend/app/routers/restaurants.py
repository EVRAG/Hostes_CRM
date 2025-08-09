from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import get_current_user
from ..db import get_db
from ..models import Restaurant, RestaurantSettings
from ..schemas import RestaurantSettingsIn, RestaurantSettingsOut


router = APIRouter()


@router.get("/{restaurant_id}/settings", response_model=RestaurantSettingsOut)
async def get_settings(restaurant_id: int, _: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    restaurant = await db.get(Restaurant, restaurant_id)
    if restaurant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")

    settings = await db.get(RestaurantSettings, restaurant_id)
    if settings is None:
        # return empty defaults
        return RestaurantSettingsOut(restaurant_id=restaurant_id, host_choice=None, greeting_text=None, info_text=None)
    return RestaurantSettingsOut(
        restaurant_id=restaurant_id,
        host_choice=settings.host_choice,
        greeting_text=settings.greeting_text,
        info_text=settings.info_text,
    )


@router.put("/{restaurant_id}/settings", response_model=RestaurantSettingsOut)
async def update_settings(
    restaurant_id: int,
    payload: RestaurantSettingsIn,
    _: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    restaurant = await db.get(Restaurant, restaurant_id)
    if restaurant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")

    settings = await db.get(RestaurantSettings, restaurant_id)
    if settings is None:
        settings = RestaurantSettings(restaurant_id=restaurant_id)
        db.add(settings)

    settings.host_choice = payload.host_choice
    settings.greeting_text = payload.greeting_text
    settings.info_text = payload.info_text

    await db.commit()
    return RestaurantSettingsOut(
        restaurant_id=restaurant_id,
        host_choice=settings.host_choice,
        greeting_text=settings.greeting_text,
        info_text=settings.info_text,
    )

