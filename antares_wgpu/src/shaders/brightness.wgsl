// Brightness Filter - GPU Compute Shader
// Uses OKLab lightness for perceptually smoother brightness changes
// Positive amounts lift shadows more than highlights, negative amounts darken softly

struct Params {
    width: u32,
    height: u32,
    strength: f32,
    _padding: u32,
}

@group(0) @binding(0) var<storage, read_write> pixels: array<u32>;
@group(0) @binding(1) var<uniform> params: Params;

fn apply_brightness(l: f32, strength: f32) -> f32 {
    let s = clamp(abs(strength), 0.0, 1.0);

    if (strength >= 0.0) {
        let lift = 1.0 - pow(1.0 - s, 2.0);
        let highlight_protection = 1.0 - 0.28 * smoothstep(0.72, 1.0, l);
        let shadow_emphasis = 1.0 - 0.18 * smoothstep(0.0, 0.55, l);
        let amount = lift * highlight_protection * shadow_emphasis;
        return clamp(l + (1.0 - l) * amount, 0.0, 1.0);
    }

    let darken = 1.0 - pow(1.0 - s, 2.0);
    let toe_protection = 1.0 - 0.22 * smoothstep(0.0, 0.18, l);
    let amount = darken * toe_protection;
    return clamp(l * (1.0 - amount), 0.0, 1.0);
}

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
    lab.x = apply_brightness(lab.x, params.strength);

    let result = oklab_to_rgb(lab);
    pixels[idx] = pack_rgba(vec4<f32>(result, rgba.a));
}
