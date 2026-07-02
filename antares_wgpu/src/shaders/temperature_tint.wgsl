// Temperature and Tint Filter - GPU Compute Shader
// Adjusts white balance in OKLab color space

// OKLab adjustment scales for natural white balance
const TEMP_A_SCALE: f32 = 0.020;
const TEMP_B_SCALE: f32 = 0.050;
const TINT_A_SCALE: f32 = 0.040;
const TINT_B_SCALE: f32 = -0.014;

// Chroma mask range: protects near-gray pixels from color shifts
const CHROMA_MIN: f32 = 0.04;
const CHROMA_MAX: f32 = 0.25;

// Tone mask constants : emphasizes midtones
const TONE_BASE: f32 = 0.82;
const TONE_RANGE: f32 = 0.18;

struct Params {
    width: u32,
    height: u32,
    temperature: f32, // Pre-shaped in Rust
    tint: f32,        // Pre-shaped in Rust
}

@group(0) @binding(0) var<storage, read_write> pixels: array<u32>;
@group(0) @binding(1) var<uniform> params: Params;

@compute @workgroup_size(16, 16, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
    let x = gid.x;
    let y = gid.y;
    if (x >= params.width || y >= params.height) {
        return;
    }

    let idx = y * params.width + x;
    let rgba = unpack_rgba(pixels[idx]);

    var lab = rgb_to_oklab(rgba.r, rgba.g, rgba.b);

    let temperature_a = TEMP_A_SCALE * params.temperature;
    let temperature_b = TEMP_B_SCALE * params.temperature;
    let tint_a = TINT_A_SCALE * params.tint;
    let tint_b = TINT_B_SCALE * params.tint;

    let chroma = sqrt(lab.y * lab.y + lab.z * lab.z);
    
    // Protect near-neutral colors from excessive shifting
    let chroma_mask = 1.0 - smoothstep(CHROMA_MIN, CHROMA_MAX, chroma);
    
    // Apply more effect to midtones, less to extreme blacks and whites
    let tone_mask = TONE_BASE + TONE_RANGE * (1.0 - abs(lab.x - 0.5) * 2.0);
    
    let amount_mask = chroma_mask * tone_mask;

    lab.y += (temperature_a + tint_a) * amount_mask;
    lab.z += (temperature_b + tint_b) * amount_mask;

    let result = oklab_to_rgb(lab);

    pixels[idx] = pack_rgba(vec4<f32>(result, rgba.a));
}
