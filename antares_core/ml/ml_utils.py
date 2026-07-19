from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import json

import numpy as np
import torch


FEATURE_COLUMNS = []

TARGET_COLUMNS = [
    "brightness",
    "vibrance",
    "highlights_shadows",
    "temperature",
    "tint",
    "duotone",
    "duotone_dark_l",
    "duotone_dark_a",
    "duotone_dark_b",
    "duotone_light_l",
    "duotone_light_a",
    "duotone_light_b",
]

MODEL_DIR = Path(__file__).resolve().parent.parent.parent / "models"

MODEL_PATH = MODEL_DIR / "filter_predictor.pt"
SCALER_PATH = MODEL_DIR / "filter_predictor_scaler.json"
TARGET_SCALER_PATH = MODEL_DIR / "filter_predictor_target_scaler.json"

NEWEST_XIN_MODEL_PATH = MODEL_DIR / "Xin1.5.pt"
NEWEST_XIN_SCALER_PATH = MODEL_DIR / "Xin1.5_scaler.json"
NEWEST_XIN_TARGET_SCALER_PATH = MODEL_DIR / "Xin1.5_target_scaler.json"


@dataclass
class FeatureScaler:
    mean: np.ndarray
    std: np.ndarray

    def transform(self, x: np.ndarray) -> np.ndarray:
        return (x - self.mean) / self.std

    def state_dict(self) -> dict:
        return {"mean": self.mean.tolist(), "std": self.std.tolist()}

    @classmethod
    def from_state_dict(cls, state: dict) -> "FeatureScaler":
        return cls(
            mean=np.asarray(state["mean"], dtype=np.float32),
            std=np.asarray(state["std"], dtype=np.float32),
        )


def ensure_model_dir() -> None:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)


def save_scaler(scaler: FeatureScaler) -> None:
    ensure_model_dir()
    SCALER_PATH.write_text(json.dumps(scaler.state_dict(), indent=2), encoding="utf-8")


def load_scaler() -> FeatureScaler:
    if not SCALER_PATH.exists():
        state = json.loads(NEWEST_XIN_SCALER_PATH.read_text(encoding="utf-8"))
    else:
        state = json.loads(SCALER_PATH.read_text(encoding="utf-8"))

    return FeatureScaler.from_state_dict(state)


def save_model_state(model: torch.nn.Module) -> None:
    ensure_model_dir()
    torch.save(model.state_dict(), MODEL_PATH)


def load_model_state(model: torch.nn.Module) -> torch.nn.Module:
    try:
        if not MODEL_PATH.exists():
            state_dict = torch.load(NEWEST_XIN_MODEL_PATH, map_location="cpu", weights_only=True)
        else:
            state_dict = torch.load(MODEL_PATH, map_location="cpu", weights_only=True)
    except TypeError:
        if not MODEL_PATH.exists():
            state_dict = torch.load(NEWEST_XIN_MODEL_PATH, map_location="cpu")
        else:
            state_dict = torch.load(MODEL_PATH, map_location="cpu")
    model.load_state_dict(state_dict)
    model.eval()
    return model


def clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))


@dataclass
class TargetScaler:
    mean: np.ndarray
    std: np.ndarray

    def transform(self, y: np.ndarray) -> np.ndarray:
        return (y - self.mean) / self.std

    def inverse_transform(self, y: np.ndarray) -> np.ndarray:
        return y * self.std + self.mean

    def state_dict(self) -> dict:
        return {"mean": self.mean.tolist(), "std": self.std.tolist()}

    @classmethod
    def from_state_dict(cls, state: dict) -> "TargetScaler":
        return cls(
            mean=np.asarray(state["mean"], dtype=np.float32),
            std=np.asarray(state["std"], dtype=np.float32),
        )


def save_target_scaler(scaler: TargetScaler) -> None:
    ensure_model_dir()
    TARGET_SCALER_PATH.write_text(json.dumps(scaler.state_dict(), indent=2), encoding="utf-8")


def load_target_scaler() -> TargetScaler:
    if not TARGET_SCALER_PATH.exists():
        state = json.loads(NEWEST_XIN_TARGET_SCALER_PATH.read_text(encoding="utf-8"))
    else:
        state = json.loads(TARGET_SCALER_PATH.read_text(encoding="utf-8"))

    return TargetScaler.from_state_dict(state)

