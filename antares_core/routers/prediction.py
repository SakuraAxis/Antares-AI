from __future__ import annotations

from typing import Any

import numpy as np
import torch
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from ml.color_utils import denormalize_oklab, oklab_to_rgb, rgb_to_hex
from features.image_analyzer import ImageAnalyzer
from ml.filter_predictor import FilterPredictor
from ml.ml_utils import load_model_state, load_scaler, load_target_scaler

N_DOMINANT_COLORS = 10

router = APIRouter(tags=["prediction"])
analyzer = ImageAnalyzer()

# Lazy-loaded prediction resources.
_model = None
_feature_scaler = None
_target_scaler = None


def get_prediction_resources():
    global _model, _feature_scaler, _target_scaler

    if (
        _model is None
        or _feature_scaler is None
        or _target_scaler is None
    ):
        try:
            _model = load_model_state(FilterPredictor())
            _model.eval()

            _feature_scaler = load_scaler()
            _target_scaler = load_target_scaler()

        except FileNotFoundError:
            raise HTTPException(
                status_code=503,
                detail="Prediction model has not been trained yet.",
            )

    return _model, _feature_scaler, _target_scaler


class PredictFilterDataOut(BaseModel):
    status: str
    image_id: int | None = None
    prediction: dict[str, float | str]


def _build_feature_vector(features: Any) -> list[float]:
    feature_vector = [
        float(features["brightness_mean"]),
        float(features["brightness_std"]),
        float(features["brightness_p5"]),
        float(features["brightness_p50"]),
        float(features["brightness_p95"]),
        float(features["dynamic_range"]),
        float(features["black_clip_ratio"]),
        float(features["white_clip_ratio"]),
        float(features["saturation_mean"]),
        float(features["saturation_std"]),
        float(features["mean_r"]),
        float(features["mean_g"]),
        float(features["mean_b"]),
        float(features["lab_a_mean"]),
        float(features["lab_b_mean"]),
        float(features["unique_colors_ratio"]),
        float(features["sharpness"]),
        float(features["edge_density"]),
        float(features["entropy"]),
        float(features["local_contrast"]),
    ]

    dominant_colors = features.get("dominant_colors") or []
    for idx in range(N_DOMINANT_COLORS):
        color = dominant_colors[idx] if idx < len(dominant_colors) else {}
        rgb = color.get("rgb", [0, 0, 0])
        percentage = float(color.get("percentage", 0.0))
        feature_vector.extend([float(rgb[0]), float(rgb[1]), float(rgb[2]), percentage])

    return feature_vector


@router.post("/predict-filter-data", response_model=PredictFilterDataOut)
async def predict_filter_data(
    file: UploadFile = File(...),
):
    contents = await file.read()

    analyzer_features = analyzer.analyze(contents)
    feature_vector = _build_feature_vector(analyzer_features)

    model, feature_scaler, target_scaler = get_prediction_resources()

    x = _feature_scaler.transform(np.asarray([feature_vector], dtype=np.float32))
    with torch.no_grad():
        y_scaled = _model(torch.from_numpy(x)).cpu().numpy()[0]

    y = _target_scaler.inverse_transform(y_scaled)

    dark_oklab = denormalize_oklab((float(y[6]), float(y[7]), float(y[8])))
    light_oklab = denormalize_oklab((float(y[9]), float(y[10]), float(y[11])))

    prediction = {
        "brightness": float(y[0]),
        "vibrance": float(y[1]),
        "highlights_shadows": float(y[2]),
        "temperature": float(y[3]),
        "tint": float(y[4]),
        "duotone": float(y[5]),
        "duotone_dark_l": dark_oklab[0],
        "duotone_dark_a": dark_oklab[1],
        "duotone_dark_b": dark_oklab[2],
        "duotone_light_l": light_oklab[0],
        "duotone_light_a": light_oklab[1],
        "duotone_light_b": light_oklab[2],
        "duotone_dark": rgb_to_hex(oklab_to_rgb(dark_oklab)),
        "duotone_light": rgb_to_hex(oklab_to_rgb(light_oklab)),
    }

    return {
        "status": "success",
        "image_id": None,
        "prediction": prediction,
    }