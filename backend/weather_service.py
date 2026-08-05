"""Open-Meteo weather client."""
import logging
from datetime import datetime, timezone
from typing import Any, Dict

import httpx

logger = logging.getLogger(__name__)

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
DEFAULT_UV_INDEX = 3.0
DEFAULT_VISIBILITY_M = 10000.0
REQUEST_TIMEOUT_SECONDS = 10.0


def _closest_hour_value(times: list, values: list, now: datetime, default: float) -> float:
    """Pick the hourly value whose timestamp is closest to `now`.

    The Open-Meteo `hourly` arrays are returned in the location's local
    timezone (since we pass timezone=auto), so matching by parsed timestamp
    is correct — indexing by UTC hour-of-day is not, since it silently
    misaligns whenever the location's UTC offset isn't zero.
    """
    if not times or not values:
        return default

    now_ts = now.timestamp()
    best_idx = 0
    best_diff = float("inf")

    for i, t in enumerate(times):
        try:
            candidate = datetime.fromisoformat(t)
        except (ValueError, TypeError):
            continue
        diff = abs(candidate.timestamp() - now_ts)
        if diff < best_diff:
            best_diff = diff
            best_idx = i

    try:
        return float(values[best_idx])
    except (IndexError, TypeError, ValueError):
        return default


async def fetch_weather_data(latitude: float, longitude: float) -> Dict[str, Any]:
    """Fetch current conditions + nearest-hour UV index / visibility."""
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,weather_code,cloud_cover,"
                   "pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m",
        "hourly": "uv_index,visibility",
        "timezone": "auto",
    }

    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
            response = await client.get(OPEN_METEO_URL, params=params)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as exc:
        logger.error("Open-Meteo request failed: %s", exc)
        raise

    current = data.get("current", {})
    hourly = data.get("hourly", {})
    now = datetime.now(timezone.utc)

    uv_index = _closest_hour_value(
        hourly.get("time", []), hourly.get("uv_index", []), now, DEFAULT_UV_INDEX
    )
    visibility_m = _closest_hour_value(
        hourly.get("time", []), hourly.get("visibility", []), now, DEFAULT_VISIBILITY_M
    )

    weather_data = {
        "temperature": round(current.get("temperature_2m", 20), 1),
        "humidity": round(current.get("relative_humidity_2m", 50), 1),
        "pressure": round(current.get("surface_pressure", 1013), 1),
        "wind_speed": round(current.get("wind_speed_10m", 10), 1),
        "wind_direction": round(current.get("wind_direction_10m", 0), 1),
        "cloud_cover": round(current.get("cloud_cover", 50), 1),
        "uv_index": round(uv_index, 1),
        "visibility": round(visibility_m / 1000, 1),
        "weather_code": current.get("weather_code", 0),
        "timestamp": current.get("time", now.isoformat()),
        "latitude": latitude,
        "longitude": longitude,
    }

    logger.info("Weather fetched for (%s, %s): UV %.1f", latitude, longitude, uv_index)
    return weather_data
