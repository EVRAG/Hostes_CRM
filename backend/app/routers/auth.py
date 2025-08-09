from fastapi import APIRouter, HTTPException, status

from ..auth import create_access_token
from ..config import settings
from ..schemas import LoginRequest, TokenResponse


router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    if payload.username != settings.ADMIN_USERNAME or payload.password != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # For v1 we always map to restaurant_id=1
    access_token = create_access_token(subject=payload.username, restaurant_id=1)
    return TokenResponse(access_token=access_token)

