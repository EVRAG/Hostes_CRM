import json
from typing import Any, Optional

from redis.asyncio import Redis

from .config import settings


def get_redis_client() -> Redis:
    return Redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)


async def get_cached_slots(restaurant_id: int, date_str: str) -> Optional[list[dict[str, Any]]]:
    redis = get_redis_client()
    key = f"slots:{restaurant_id}:{date_str}"
    data = await redis.get(key)
    await redis.aclose()
    if data:
        try:
            return json.loads(data)
        except Exception:
            return None
    return None


async def set_cached_slots(restaurant_id: int, date_str: str, slots: list[dict[str, Any]], ttl_seconds: int = 3600) -> None:
    redis = get_redis_client()
    key = f"slots:{restaurant_id}:{date_str}"
    await redis.set(key, json.dumps(slots), ex=ttl_seconds)
    await redis.aclose()

