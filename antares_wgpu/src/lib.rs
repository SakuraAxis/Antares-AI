use wasm_bindgen::prelude::*;

mod filters;
mod utils;

use filters::apply_vibrance;

#[wasm_bindgen(js_name = applyVibranceFilter)]
pub fn apply_vibrance_filter(data: &mut [u8], width: u32, height: u32, amount: f32) {
    apply_vibrance(data, width, height, amount);
}
