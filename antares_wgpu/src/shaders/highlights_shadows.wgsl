// Highlights and Shadows Filter - GPU Compute Shader
// Shadow lift and highlight recovery in OKLab color space

// Shadow lift transition thresholds ( OKLab L values )
const SHADOW_START: f32 = 0.16;
const SHADOW_END: f32 = 0.46;

// Highlight recovery transition thresholds ( OKLab L values )
const HIGHLIGHT_START: f32 = 0.56;
const HIGHLIGHT_END: f32 = 0.92;

// Effect intensity multipliers
const SHADOW_INTENSITY: f32 = 0.78;
const HIGHLIGHT_INTENSITY: f32 = 0.72;

struct Params {
    width: u32,
    height: u32,
    strength: f32,
    amount: f32, // signed ( positive = shadow lift, negative = highlight recovery )
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

    if (params.amount > 0.0) {
        // Shadow Lift : brighten darker tones with a soft transition into midtones
        let shadow_mask = 1.0 - smoothstep(SHADOW_START, SHADOW_END, lab.x);
        let lift = (1.0 - pow(1.0 - params.strength, 2.0)) * shadow_mask * shadow_mask;
        let blend = lift * SHADOW_INTENSITY;

        lab.x = clamp(lab.x + (1.0 - lab.x) * blend, 0.0, 1.0);

        // Shadow lift reveals detail and typically increases perceived saturation
        let saturation_boost = 1.0 + 0.06 * blend;
        lab.y = lab.y * saturation_boost;
        lab.z = lab.z * saturation_boost;
    } else if (params.amount < 0.0) {
        // Highlight Recovery : compress brighter tones with a soft shoulder
        let highlight_mask = smoothstep(HIGHLIGHT_START, HIGHLIGHT_END, lab.x);
        let recovery = (1.0 - pow(1.0 - params.strength, 2.0)) * highlight_mask * highlight_mask;
        let blend = recovery * HIGHLIGHT_INTENSITY;

        lab.x = clamp(lab.x - lab.x * blend, 0.0, 1.0);

        // Highlight recovery moderately reduces saturation to prevent clipping
        let saturation_reduction = 1.0 - 0.05 * blend;
        lab.y = lab.y * saturation_reduction;
        lab.z = lab.z * saturation_reduction;
    }

    let result = oklab_to_rgb(lab);

    pixels[idx] = pack_rgba(vec4<f32>(result, rgba.a));
}
