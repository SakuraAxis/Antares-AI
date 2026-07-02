use wasm_bindgen::prelude::*;

mod filters;
mod gpu;

use filters::apply_vibrance;
use filters::apply_highlights_shadows;

/// Initialize WebGPU device and filter pipelines.
#[wasm_bindgen(js_name = initFilterEngine)]
pub async fn init_filter_engine() -> Result<(), JsValue> {
    gpu::init()
        .await
        .map_err(|e| JsValue::from_str(&e))
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
