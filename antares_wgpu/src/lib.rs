use wasm_bindgen::prelude::*;

mod filters;
mod gpu;

use filters::apply_duotone;
use filters::apply_highlights_shadows;
use filters::apply_brightness;
use filters::apply_temperature_tint;
use filters::apply_vibrance;

/// Initialize WebGPU device and filter pipelines.
#[wasm_bindgen(js_name = initFilterEngine)]
pub async fn init_filter_engine() -> Result<(), JsValue> {
    gpu::init().await.map_err(|e| JsValue::from_str(&e))
}

/// Apply vibrance filter using WGPU compute shader.
#[wasm_bindgen(js_name = applyVibranceFilter)]
pub async fn apply_vibrance_filter(
    data: &mut [u8],
    width: u32,
    height: u32,
    amount: f32,
) -> Result<(), JsValue> {
    apply_vibrance(data, width, height, amount)
        .await
        .map_err(|e| JsValue::from_str(&e))
}

/// Apply brightness filter using WGPU compute shader.
#[wasm_bindgen(js_name = applyBrightnessFilter)]
pub async fn apply_brightness_filter(
    data: &mut [u8],
    width: u32,
    height: u32,
    amount: f32,
) -> Result<(), JsValue> {
    apply_brightness(data, width, height, amount)
        .await
        .map_err(|e| JsValue::from_str(&e))
}

/// Apply highlights/shadows filter using WGPU compute shader.
#[wasm_bindgen(js_name = applyHighlightsShadowsFilter)]
pub async fn apply_highlights_shadows_filter(
    data: &mut [u8],
    width: u32,
    height: u32,
    amount: f32,
) -> Result<(), JsValue> {
    apply_highlights_shadows(data, width, height, amount)
        .await
        .map_err(|e| JsValue::from_str(&e))
}

/// Apply temperature and tint filter using WGPU compute shader.
#[wasm_bindgen(js_name = applyTemperatureTintFilter)]
pub async fn apply_temperature_tint_filter(
    data: &mut [u8],
    width: u32,
    height: u32,
    temperature: f32,
    tint: f32,
) -> Result<(), JsValue> {
    apply_temperature_tint(data, width, height, temperature, tint)
        .await
        .map_err(|e| JsValue::from_str(&e))
}

/// Apply duotone filter using WGPU compute shader.
#[wasm_bindgen(js_name = applyDuotoneFilter)]
pub async fn apply_duotone_filter(
    data: &mut [u8],
    width: u32,
    height: u32,
    amount: f32,
    contrast_curve: f32,
    dr: f32,
    dg: f32,
    db: f32,
    lr: f32,
    lg: f32,
    lb: f32,
) -> Result<(), JsValue> {
    apply_duotone(
        data,
        width,
        height,
        amount,
        contrast_curve,
        dr,
        dg,
        db,
        lr,
        lg,
        lb,
    )
    .await
    .map_err(|e| JsValue::from_str(&e))
}
