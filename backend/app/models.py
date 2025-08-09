from sqlalchemy import ForeignKey, Integer, String, Date, UniqueConstraint, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class Restaurant(Base):
    __tablename__ = "restaurants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    default_table_count: Mapped[int] = mapped_column(Integer, nullable=False, default=5)

    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="restaurant")


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        UniqueConstraint("restaurant_id", "date", "time_slot", "client_name", name="uq_booking_dedup"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    restaurant_id: Mapped[int] = mapped_column(ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[Date] = mapped_column(Date, nullable=False)
    time_slot: Mapped[str] = mapped_column(String(10), nullable=False)
    client_name: Mapped[str] = mapped_column(String(255), nullable=False)
    # New fields
    start_time: Mapped[str | None] = mapped_column(String(10), nullable=True)
    end_time: Mapped[str | None] = mapped_column(String(10), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    guest_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON-encoded list of strings
    deposit: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    restaurant: Mapped[Restaurant] = relationship("Restaurant", back_populates="bookings")


class RestaurantSettings(Base):
    __tablename__ = "restaurant_settings"

    restaurant_id: Mapped[int] = mapped_column(ForeignKey("restaurants.id", ondelete="CASCADE"), primary_key=True)
    host_choice: Mapped[str] = mapped_column(String(100), nullable=True)
    greeting_text: Mapped[str] = mapped_column(Text, nullable=True)
    info_text: Mapped[str] = mapped_column(Text, nullable=True)

