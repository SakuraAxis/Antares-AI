from __future__ import annotations

import asyncio
from dataclasses import dataclass

import numpy as np
import torch
from sqlalchemy import select

from database import async_session_maker
from models import ImageFeature, UserFilterData
from .color_utils import hex_to_rgb, normalize_oklab, rgb_to_oklab
from .filter_predictor import FilterPredictor
from .ml_utils import (
    FeatureScaler,
    TargetScaler,
    save_model_state,
    save_scaler,
    save_target_scaler,
)

SEED = 42


def _set_seed(seed: int = SEED) -> None:
    np.random.seed(seed)
    torch.manual_seed(seed)


@dataclass
class TrainingBatch:
    features: np.ndarray
    targets: np.ndarray


def _flatten_image_features(feature: ImageFeature) -> list[float]:
    feature_row = [
        float(feature.brightness_mean),
        float(feature.brightness_std),
        float(feature.brightness_p5),
        float(feature.brightness_p50),
        float(feature.brightness_p95),
        float(feature.dynamic_range),
        float(feature.black_clip_ratio),
        float(feature.white_clip_ratio),
        float(feature.saturation_mean),
        float(feature.saturation_std),
        float(feature.mean_r),
        float(feature.mean_g),
        float(feature.mean_b),
        float(feature.lab_a_mean),
        float(feature.lab_b_mean),
        float(feature.unique_colors_ratio),
        float(feature.sharpness),
        float(feature.edge_density),
        float(feature.entropy),
        float(feature.local_contrast),
    ]

    dominant_colors = feature.dominant_colors or []
    for idx in range(5):
        color = dominant_colors[idx] if idx < len(dominant_colors) else {}
        rgb = color.get("rgb", [0, 0, 0])
        percentage = float(color.get("percentage", 0.0))
        feature_row.extend([float(rgb[0]), float(rgb[1]), float(rgb[2]), percentage])

    return feature_row


async def load_training_rows() -> TrainingBatch:
    async with async_session_maker() as session:
        stmt = (
            select(ImageFeature, UserFilterData)
            .join(UserFilterData, UserFilterData.image_id == ImageFeature.image_id)
            .order_by(ImageFeature.id.asc())
        )
        result = await session.execute(stmt)
        rows = result.all()

    feature_rows: list[list[float]] = []
    target_rows: list[list[float]] = []

    for feature, target in rows:
        feature_rows.append(_flatten_image_features(feature))

        dark_oklab = normalize_oklab(rgb_to_oklab(hex_to_rgb(target.duotone_dark)))
        light_oklab = normalize_oklab(rgb_to_oklab(hex_to_rgb(target.duotone_light)))
        target_rows.append(
            [
                float(target.brightness),
                float(target.vibrance),
                float(target.highlights_shadows),
                float(target.temperature),
                float(target.tint),
                float(target.duotone),
                dark_oklab[0],
                dark_oklab[1],
                dark_oklab[2],
                light_oklab[0],
                light_oklab[1],
                light_oklab[2],
            ]
        )

    return TrainingBatch(
        features=np.asarray(feature_rows, dtype=np.float32),
        targets=np.asarray(target_rows, dtype=np.float32),
    )


def train(
    val_ratio: float = 0.2,
    max_epochs: int = 500,
    patience: int = 30,
    batch_size: int = 32,
    weight_decay: float = 1e-4,
) -> None:
    _set_seed()

    batch = asyncio.run(load_training_rows())
    n = batch.features.shape[0]
    if n == 0:
        raise RuntimeError("No paired training rows found. Need image_features + user_filter_data records.")

    # --- train/val split ---
    indices = np.random.permutation(n)
    n_val = max(1, int(n * val_ratio)) if n >= 5 else 0
    val_idx, train_idx = indices[:n_val], indices[n_val:]

    if len(train_idx) == 0:
        raise RuntimeError(f"Not enough rows ({n}) to form a train/val split.")

    # --- feature scaler (fit on train only) ---
    feat_mean = batch.features[train_idx].mean(axis=0)
    feat_std = batch.features[train_idx].std(axis=0)
    feat_std = np.where(feat_std < 1e-6, 1.0, feat_std)
    feature_scaler = FeatureScaler(mean=feat_mean.astype(np.float32), std=feat_std.astype(np.float32))

    # --- target scaler (fit on train only) ---
    tgt_mean = batch.targets[train_idx].mean(axis=0)
    tgt_std = batch.targets[train_idx].std(axis=0)
    tgt_std = np.where(tgt_std < 1e-6, 1.0, tgt_std)
    target_scaler = TargetScaler(mean=tgt_mean.astype(np.float32), std=tgt_std.astype(np.float32))

    x_all = feature_scaler.transform(batch.features)
    y_all = target_scaler.transform(batch.targets)

    x_train = torch.from_numpy(x_all[train_idx])
    y_train = torch.from_numpy(y_all[train_idx])
    has_val = n_val > 0
    if has_val:
        x_val = torch.from_numpy(x_all[val_idx])
        y_val = torch.from_numpy(y_all[val_idx])

    model = FilterPredictor(input_dim=x_train.shape[1], output_dim=y_train.shape[1])
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=weight_decay)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="min", factor=0.5, patience=10)
    loss_fn = torch.nn.MSELoss()

    dataset = torch.utils.data.TensorDataset(x_train, y_train)
    effective_bs = min(batch_size, len(dataset))
    loader = torch.utils.data.DataLoader(dataset, batch_size=effective_bs, shuffle=True)

    best_val_loss = float("inf")
    best_state = None
    epochs_no_improve = 0

    for epoch in range(1, max_epochs + 1):
        model.train()
        epoch_loss = 0.0
        for xb, yb in loader:
            optimizer.zero_grad()
            pred = model(xb)
            loss = loss_fn(pred, yb)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            epoch_loss += loss.item() * xb.shape[0]
        epoch_loss /= len(dataset)

        if has_val:
            model.eval()
            with torch.no_grad():
                val_loss = loss_fn(model(x_val), y_val).item()
            scheduler.step(val_loss)

            if val_loss < best_val_loss - 1e-6:
                best_val_loss = val_loss
                best_state = {k: v.clone() for k, v in model.state_dict().items()}
                epochs_no_improve = 0
            else:
                epochs_no_improve += 1

            if epoch == 1 or epoch % 20 == 0:
                print(f"epoch={epoch:03d} train_loss={epoch_loss:.6f} val_loss={val_loss:.6f}")

            if epochs_no_improve >= patience:
                print(f"Early stopping at epoch={epoch:03d} (best val_loss={best_val_loss:.6f})")
                break
        else:
            # too few rows for a val split — just track train loss
            scheduler.step(epoch_loss)
            if epoch == 1 or epoch % 20 == 0:
                print(f"epoch={epoch:03d} train_loss={epoch_loss:.6f}")

    if has_val and best_state is not None:
        model.load_state_dict(best_state)
        print(f"Restored best checkpoint (val_loss={best_val_loss:.6f})")

    save_model_state(model)
    save_scaler(feature_scaler)
    save_target_scaler(target_scaler)
    print("Saved model to artifacts/filter_predictor.pt")
    print("Saved feature scaler to artifacts/filter_predictor_scaler.json")
    print("Saved target scaler to artifacts/filter_predictor_target_scaler.json")


def main() -> None:
    train()


if __name__ == "__main__":
    main()

