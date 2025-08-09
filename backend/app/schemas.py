from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str


class BookingCreate(BaseModel):
    restaurant_id: int = Field(..., ge=1)
    date: date
    time_slot: str  # retained for capacity counting
    client_name: str
    # New fields
    start_time: str | None = None
    end_time: str | None = None
    phone: str | None = None
    guest_count: int | None = Field(default=None, ge=1)
    comment: str | None = None
    tags: list[str] | None = None
    deposit: bool = False


class SlotInfo(BaseModel):
    time: str
    booked: int
    free: int


class SlotsResponse(BaseModel):
    restaurant_id: int
    date: date
    slots: List[SlotInfo]


class RestaurantSettingsIn(BaseModel):
    host_choice: str | None = None
    greeting_text: str | None = None
    info_text: str | None = None


class RestaurantSettingsOut(RestaurantSettingsIn):
    restaurant_id: int


class AssistantChatRequest(BaseModel):
    assistant_id: str
    message: str
    thread_id: str | None = None


class AssistantChatResponse(BaseModel):
    thread_id: str
    assistant_message: str

