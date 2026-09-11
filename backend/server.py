import csv
import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from io import StringIO
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Query
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import ml_model
from auth import create_access_token, decode_access_token, hash_password, verify_password
from weather_service import fetch_weather_data

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

mongo_url = os.environ["MONGO_URL"]
db_name = os.environ["DB_NAME"]
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

MAX_HISTORY_LIMIT = 500
MAX_ANALYTICS_RECORDS = 5000


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up the ML model once so the first /predict call isn't slow.
    ml_model.warm_up()
    await db.users.create_index("email", unique=True)
    logger.info("SunSafe API startup complete.")
    yield
    client.close()
    logger.info("SunSafe API shutdown complete.")


app = FastAPI(title="SunSafe API", lifespan=lifespan)
api_router = APIRouter(prefix="/api")
bearer_scheme = HTTPBearer(auto_error=False)

# ============ Models ============


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    name: str = Field(..., min_length=1, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class WeatherResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    temperature: float
    humidity: float
    pressure: float
    wind_speed: float
    wind_direction: float
    cloud_cover: float
    uv_index: float
    visibility: float
    weather_code: int
    timestamp: str
    latitude: float
    longitude: float


class UserProfile(BaseModel):
    skin_type: str = Field(..., pattern="^(I|II|III|IV|V|VI)$")
    activity: str = Field(..., pattern="^(Indoor|Walking|Sports|Hiking|Beach|Swimming)$")
    sweating: str = Field(..., pattern="^(Low|Medium|High)$")
    age: Optional[int] = Field(default=30, ge=1, le=120)
    gender: Optional[str] = None


class PredictionRequest(BaseModel):
    weather: Dict[str, Any]
    user_profile: UserProfile
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class PredictionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    apply: int
    spf: int
    confidence: int
    risk: str
    reapply_min: int
    reason: List[str]


class PredictionHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    latitude: float
    longitude: float
    temperature: float
    humidity: float
    uv_index: float
    cloud_cover: float
    skin_type: str
    activity: str
    sweating: str
    spf: int
    risk: str
    confidence: int
    reapply_min: int
    apply: int


class AnalyticsResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    daily_uv: List[Dict[str, Any]]
    weekly_uv: List[Dict[str, Any]]
    spf_distribution: Dict[str, int]
    skin_type_distribution: Dict[str, int]
    risk_distribution: Dict[str, int]
    avg_confidence: float
    total_predictions: int


EMPTY_ANALYTICS = AnalyticsResponse(
    daily_uv=[], weekly_uv=[], spf_distribution={}, skin_type_distribution={},
    risk_distribution={}, avg_confidence=0, total_predictions=0,
)

# ============ Auth ============


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)) -> dict:
    unauthorized = HTTPException(
        status_code=401, detail="Not authenticated", headers={"WWW-Authenticate": "Bearer"}
    )
    if credentials is None:
        raise unauthorized

    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise unauthorized

    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if user is None:
        raise unauthorized

    return user


# ============ Routes ============


@api_router.get("/")
async def root():
    return {"message": "SunSafe API - AI Powered Sunscreen Recommendation System"}


@api_router.post("/auth/register", response_model=TokenResponse, status_code=201)
async def register(request: UserRegister):
    email = request.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user_doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "name": request.name,
        "password_hash": hash_password(request.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)

    token = create_access_token(user_doc["id"])
    return TokenResponse(
        access_token=token,
        user=UserPublic(id=user_doc["id"], email=user_doc["email"], name=user_doc["name"]),
    )


@api_router.post("/auth/login", response_model=TokenResponse)
async def login(request: UserLogin):
    user = await db.users.find_one({"email": request.email.lower()})
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user["id"])
    return TokenResponse(
        access_token=token,
        user=UserPublic(id=user["id"], email=user["email"], name=user["name"]),
    )


@api_router.get("/auth/me", response_model=UserPublic)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserPublic(**current_user)


@api_router.get("/weather", response_model=WeatherResponse)
async def get_weather(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
):
    try:
        return await fetch_weather_data(lat, lon)
    except Exception as e:
        logger.error("Error fetching weather: %s", e)
        raise HTTPException(status_code=502, detail="Failed to fetch weather data") from e


@api_router.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest, current_user: dict = Depends(get_current_user)):
    try:
        prediction = ml_model.predict_sunscreen(request.weather, request.user_profile.model_dump())
    except Exception as e:
        logger.error("Prediction error: %s", e)
        raise HTTPException(status_code=500, detail="Prediction failed") from e

    history_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "latitude": request.latitude,
        "longitude": request.longitude,
        "temperature": request.weather.get("temperature", 0),
        "humidity": request.weather.get("humidity", 0),
        "uv_index": request.weather.get("uv_index", 0),
        "cloud_cover": request.weather.get("cloud_cover", 0),
        "skin_type": request.user_profile.skin_type,
        "activity": request.user_profile.activity,
        "sweating": request.user_profile.sweating,
        **prediction,
    }

    try:
        await db.predictions.insert_one(history_doc)
    except Exception as e:
        # Prediction itself succeeded; a persistence failure shouldn't 500 the user's result.
        logger.error("Failed to persist prediction history: %s", e)

    return prediction


@api_router.get("/history", response_model=List[PredictionHistory])
async def get_history(
    limit: int = Query(100, ge=1, le=MAX_HISTORY_LIMIT),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    try:
        predictions = await db.predictions.find({"user_id": current_user["id"]}, {"_id": 0}) \
            .sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)

        for pred in predictions:
            if isinstance(pred.get("timestamp"), str):
                pred["timestamp"] = datetime.fromisoformat(pred["timestamp"])

        return predictions
    except Exception as e:
        logger.error("Error fetching history: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch history") from e


@api_router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(current_user: dict = Depends(get_current_user)):
    try:
        predictions = await db.predictions.find({"user_id": current_user["id"]}, {"_id": 0}) \
            .to_list(MAX_ANALYTICS_RECORDS)
    except Exception as e:
        logger.error("Error fetching analytics data: %s", e)
        raise HTTPException(status_code=500, detail="Failed to generate analytics") from e

    if not predictions:
        return EMPTY_ANALYTICS

    daily_uv_map: Dict[str, Dict[str, Any]] = {}
    spf_dist: Dict[str, int] = {}
    skin_type_dist: Dict[str, int] = {}
    risk_dist: Dict[str, int] = {}
    total_confidence = 0

    for pred in predictions:
        ts = pred.get("timestamp")
        ts = datetime.fromisoformat(ts) if isinstance(ts, str) else (ts or datetime.now(timezone.utc))
        date_key = ts.strftime("%Y-%m-%d")

        bucket = daily_uv_map.setdefault(date_key, {"date": date_key, "uv": [], "count": 0})
        bucket["uv"].append(pred.get("uv_index", 0))
        bucket["count"] += 1

        spf = str(pred.get("spf", 30))
        spf_dist[spf] = spf_dist.get(spf, 0) + 1

        skin_type = pred.get("skin_type", "III")
        skin_type_dist[skin_type] = skin_type_dist.get(skin_type, 0) + 1

        risk = pred.get("risk", "Moderate")
        risk_dist[risk] = risk_dist.get(risk, 0) + 1

        total_confidence += pred.get("confidence", 0)

    daily_uv = [
        {"date": d, "uv": round(sum(v["uv"]) / len(v["uv"]), 1) if v["uv"] else 0, "count": v["count"]}
        for d, v in sorted(daily_uv_map.items())[-7:]
    ]

    dates = sorted(daily_uv_map.keys())[-28:]
    weekly_uv = []
    for i in range(0, len(dates), 7):
        week_values: List[float] = []
        for d in dates[i:i + 7]:
            week_values.extend(daily_uv_map[d]["uv"])
        if week_values:
            weekly_uv.append({
                "week": f"Week {len(weekly_uv) + 1}",
                "uv": round(sum(week_values) / len(week_values), 1),
            })

    return AnalyticsResponse(
        daily_uv=daily_uv,
        weekly_uv=weekly_uv[-4:],
        spf_distribution=spf_dist,
        skin_type_distribution=skin_type_dist,
        risk_distribution=risk_dist,
        avg_confidence=round(total_confidence / len(predictions), 1),
        total_predictions=len(predictions),
    )


@api_router.get("/export")
async def export_csv(current_user: dict = Depends(get_current_user)):
    try:
        predictions = await db.predictions.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(10000)
    except Exception as e:
        logger.error("Error exporting CSV: %s", e)
        raise HTTPException(status_code=500, detail="Failed to export CSV") from e

    if not predictions:
        raise HTTPException(status_code=404, detail="No prediction data available")

    fieldnames = [
        "id", "timestamp", "latitude", "longitude", "temperature", "humidity",
        "uv_index", "cloud_cover", "skin_type", "activity", "sweating",
        "spf", "risk", "confidence", "reapply_min", "apply",
    ]

    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(predictions)
    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sunsafe_predictions.csv"},
    )


app.include_router(api_router)

cors_origins = os.environ.get("CORS_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[o.strip() for o in cors_origins.split(",")] if cors_origins != "*" else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
