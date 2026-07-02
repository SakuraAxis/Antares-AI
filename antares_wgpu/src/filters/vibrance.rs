use crate::utils::color::{oklab_to_oklch, oklab_to_rgb, oklch_to_oklab, rgb_to_oklab, RGB};

/// Vibrance filter parameters
const MAX_CHROMA: f32 = 0.45;
const SCALE: f32 = 0.12;

/// Apply vibrance filter to image data
///
/// # Arguments
/// * `data` - RGBA image data ( length must be width * height * 4 )
/// * `width` - Image width in pixels
/// * `height` - Image height in pixels
/// * `amount` - Vibrance amount ( -100 to +100 )
pub fn apply_vibrance(data: &mut [u8], width: u32, height: u32, amount: f32) {
    let strength = amount / 100.0;
    let pixel_count = (width * height) as usize;

    for i in 0..pixel_count {
        let idx = i * 4;

        // Read RGB values
        let rgb = RGB {
            r: data[idx],
            g: data[idx + 1],
            b: data[idx + 2],
        };

        // Transform in OKLCH space
        let lab = rgb_to_oklab(rgb);
        let mut lch = oklab_to_oklch(lab);

        // Boost lower-saturation areas more ( classic vibrance behavior )
        let chroma_boost = 1.0 - (lch.c / MAX_CHROMA).min(1.0);

        // Protect extreme tones : boost midtones more than shadows/highlights
        let luma_mask = 1.0 - (lch.l - 0.5).abs() * 0.3;

        let boost = chroma_boost * luma_mask;
        lch.c = (lch.c + strength * boost * SCALE).max(0.0);

        // Convert back to RGB
        let lab = oklch_to_oklab(lch);
        let result = oklab_to_rgb(lab);

        // Write back
        data[idx] = result.r;
        data[idx + 1] = result.g;
        data[idx + 2] = result.b;
        // Alpha channel (idx + 3) remains unchanged
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vibrance_identity() {
        let mut data = vec![128u8; 4 * 4]; // 2x2 image
        let original = data.clone();

        apply_vibrance(&mut data, 2, 2, 0.0);

        // With amount=0, output should be close to input
        for i in 0..data.len() {
            assert!((data[i] as i32 - original[i] as i32).abs() <= 1);
        }
    }

    #[test]
    fn test_vibrance_increase() {
        // Red pixel
        let mut data = vec![255u8, 0, 0, 255];

        apply_vibrance(&mut data, 1, 1, 50.0);

        // Red should remain dominant
        assert!(data[0] > data[1]);
        assert!(data[0] > data[2]);
    }
}
