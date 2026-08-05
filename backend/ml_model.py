"""
Sunscreen recommendation model.

Trains two RandomForest classifiers on synthetic-but-rule-consistent data:
  - spf: recommended SPF level
  - apply: whether sunscreen should be applied at all

The trained bundle is cached on disk (joblib) and in memory (module-level
global) so repeated predictions don't pay disk I/O + deserialization cost
on every request.
"""
import logging
from pathlib import Path
from typing import Any, Dict, List

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).parent / "sunscreen_model.pkl"

FEATURES: List[str] = [
    "temperature", "humidity", "uv_index", "wind_speed", "cloud_cover",
    "pressure", "visibility", "skin_type", "activity", "sweating", "age",
]

SKIN_TYPE_MAPPING: Dict[str, int] = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6}
ACTIVITY_MAPPING: Dict[str, int] = {
    "Indoor": 1, "Walking": 2, "Sports": 3, "Hiking": 4, "Beach": 5, "Swimming": 6,
}
SWEATING_MAPPING: Dict[str, int] = {"Low": 1, "Medium": 2, "High": 3}

# In-memory cache so we don't hit disk on every /predict call.
_MODEL_CACHE: Dict[str, Any] | None = None


def _generate_training_data(n_samples: int = 5000, seed: int = 42) -> pd.DataFrame:
    """Generate synthetic training data using a deterministic RNG.

    Note: this is synthetic *label generation* for training a demo model,
    not a security-sensitive operation, so numpy's default_rng is fine here
    (no need for `secrets`).
    """
    rng = np.random.default_rng(seed)
    rows = []

    for _ in range(n_samples):
        temperature = rng.uniform(15, 40)
        humidity = rng.uniform(20, 95)
        uv_index = rng.uniform(0, 11)
        wind_speed = rng.uniform(0, 30)
        cloud_cover = rng.uniform(0, 100)
        pressure = rng.uniform(980, 1030)
        visibility = rng.uniform(1, 20)

        skin_type = int(rng.choice([1, 2, 3, 4, 5, 6]))
        activity = int(rng.choice([1, 2, 3, 4, 5, 6]))
        sweating = int(rng.choice([1, 2, 3]))
        age = int(rng.integers(5, 80))

        spf = 15
        risk_score = 0

        if uv_index >= 8:
            spf, risk_score = 50, risk_score + 40
        elif uv_index >= 6:
            spf, risk_score = max(spf, 40), risk_score + 30
        elif uv_index >= 3:
            spf, risk_score = max(spf, 30), risk_score + 20
        else:
            risk_score += 5

        if skin_type <= 2:
            spf, risk_score = max(spf, 50), risk_score + 25
        elif skin_type <= 4:
            spf, risk_score = max(spf, 30), risk_score + 15
        else:
            risk_score += 5

        if activity >= 4:
            spf, risk_score = max(spf, 40), risk_score + 20
        elif activity >= 2:
            spf, risk_score = max(spf, 30), risk_score + 10

        if temperature > 30:
            risk_score += 10
        if humidity < 30:
            risk_score += 5
        if cloud_cover > 70:
            risk_score -= 10
            spf = max(15, spf - 10)
        if sweating == 3:
            risk_score += 10

        apply_flag = 1 if (uv_index > 2 or activity > 1) else 0
        risk_score = min(100, max(0, risk_score))

        if sweating == 3:
            reapply_time = 60
        elif activity >= 4:
            reapply_time = 90
        else:
            reapply_time = 120

        rows.append({
            "temperature": temperature, "humidity": humidity, "uv_index": uv_index,
            "wind_speed": wind_speed, "cloud_cover": cloud_cover, "pressure": pressure,
            "visibility": visibility, "skin_type": skin_type, "activity": activity,
            "sweating": sweating, "age": age, "apply": apply_flag, "spf": spf,
            "risk_score": risk_score, "reapply_time": reapply_time,
        })

    return pd.DataFrame(rows)


def _train_model() -> Dict[str, Any]:
    logger.info("Training SunSafe recommendation model...")
    df = _generate_training_data()
    X = df[FEATURES]

    model_spf = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10)
    model_spf.fit(X, df["spf"])

    model_apply = RandomForestClassifier(n_estimators=50, random_state=42, max_depth=5)
    model_apply.fit(X, df["apply"])

    bundle = {"spf": model_spf, "apply": model_apply, "features": FEATURES}
    joblib.dump(bundle, MODEL_PATH)
    logger.info("Model trained and saved to %s", MODEL_PATH)
    return bundle


def load_model(force_reload: bool = False) -> Dict[str, Any]:
    """Load the model bundle, preferring the in-memory cache."""
    global _MODEL_CACHE
    if _MODEL_CACHE is not None and not force_reload:
        return _MODEL_CACHE

    if MODEL_PATH.exists() and not force_reload:
        _MODEL_CACHE = joblib.load(MODEL_PATH)
    else:
        _MODEL_CACHE = _train_model()

    return _MODEL_CACHE


def warm_up() -> None:
    """Call on app startup so the first request isn't slowed by training/loading."""
    load_model()


def predict_sunscreen(weather_data: Dict[str, Any], user_profile: Dict[str, Any]) -> Dict[str, Any]:
    """Run inference and return a JSON-serializable recommendation."""
    models = load_model()

    input_data = {
        "temperature": weather_data.get("temperature", 20),
        "humidity": weather_data.get("humidity", 50),
        "uv_index": weather_data.get("uv_index", 3),
        "wind_speed": weather_data.get("wind_speed", 10),
        "cloud_cover": weather_data.get("cloud_cover", 50),
        "pressure": weather_data.get("pressure", 1013),
        "visibility": weather_data.get("visibility", 10),
        "skin_type": SKIN_TYPE_MAPPING.get(user_profile.get("skin_type", "III"), 3),
        "activity": ACTIVITY_MAPPING.get(user_profile.get("activity", "Indoor"), 1),
        "sweating": SWEATING_MAPPING.get(user_profile.get("sweating", "Low"), 1),
        "age": user_profile.get("age", 30),
    }

    X = pd.DataFrame([input_data])[models["features"]]

    spf_pred = int(models["spf"].predict(X)[0])
    apply_pred = int(models["apply"].predict(X)[0])
    confidence = int(max(models["spf"].predict_proba(X)[0]) * 100)

    uv_index = input_data["uv_index"]
    if uv_index >= 8 or spf_pred >= 50:
        risk = "Extreme"
    elif uv_index >= 6 or spf_pred >= 40:
        risk = "High"
    elif uv_index >= 3 or spf_pred >= 30:
        risk = "Moderate"
    else:
        risk = "Low"

    reasons: List[str] = []
    if uv_index >= 8:
        reasons.append("Extreme UV Index")
    elif uv_index >= 6:
        reasons.append("High UV Index")
    elif uv_index >= 3:
        reasons.append("Moderate UV Index")

    if input_data["skin_type"] <= 2:
        reasons.append("Fair Skin Type")
    if input_data["activity"] >= 4:
        reasons.append("High Outdoor Activity")
    elif input_data["activity"] >= 2:
        reasons.append("Outdoor Activity")
    if input_data["temperature"] > 30:
        reasons.append("High Temperature")
    if input_data["sweating"] == 3:
        reasons.append("High Sweating Level")
    if input_data["cloud_cover"] > 70:
        reasons.append("High Cloud Cover - Reduced Risk")

    reapply_min = 60 if input_data["sweating"] == 3 else (90 if input_data["activity"] >= 4 else 120)

    return {
        "apply": apply_pred,
        "spf": spf_pred,
        "confidence": confidence,
        "risk": risk,
        "reapply_min": reapply_min,
        "reason": reasons[:3] if reasons else ["Normal conditions"],
    }
