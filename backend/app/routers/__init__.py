from fastapi import APIRouter

from .auth import router as auth_router
from .bookings import router as bookings_router
from .restaurants import router as restaurants_router
from .assistants import router as assistants_router


api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(bookings_router, prefix="/bookings", tags=["bookings"])
api_router.include_router(restaurants_router, prefix="/restaurants", tags=["restaurants"])
api_router.include_router(assistants_router, prefix="/assistants", tags=["assistants"])

