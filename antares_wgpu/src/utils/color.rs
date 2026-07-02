/// RGB color in 0-255 range
#[derive(Debug, Clone, Copy)]
pub struct RGB {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}

/// OKLab color space ( perceptually uniform )
#[derive(Debug, Clone, Copy)]
pub struct OKLab {
    pub l: f32,
    pub a: f32,
    pub b: f32,
}

/// OKLCH color space ( cylindrical representation of OKLab )
#[derive(Debug, Clone, Copy)]
pub struct OKLCH {
    pub l: f32,
    pub c: f32,
    pub h: f32,
}

/// Convert sRGB value ( 0-255 ) to linear RGB ( 0-1 )
#[inline]
pub fn srgb_to_linear(v: u8) -> f32 {
    let v = v as f32 / 255.0;

    if v <= 0.04045 {
        v / 12.92
    } else {
        ((v + 0.055) / 1.055).powf(2.4)
    }
}

/// Convert linear RGB ( 0-1 ) to sRGB ( 0-255 )
#[inline]
pub fn linear_to_srgb(v: f32) -> u8 {
    let v = if v <= 0.0031308 {
        v * 12.92
    } else {
        1.055 * v.powf(1.0 / 2.4) - 0.055
    };

    (v * 255.0).clamp(0.0, 255.0).round() as u8
}

/// Convert RGB to OKLab color space
pub fn rgb_to_oklab(rgb: RGB) -> OKLab {
    let r = srgb_to_linear(rgb.r);
    let g = srgb_to_linear(rgb.g);
    let b = srgb_to_linear(rgb.b);

    let l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
    let m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
    let s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

    let l_ = l.cbrt();
    let m_ = m.cbrt();
    let s_ = s.cbrt();

    OKLab {
        l: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
        a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
        b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
    }
}

/// Convert OKLab to RGB color space
pub fn oklab_to_rgb(lab: OKLab) -> RGB {
    let l_ = lab.l + 0.3963377774 * lab.a + 0.2158037573 * lab.b;
    let m_ = lab.l - 0.1055613458 * lab.a - 0.0638541728 * lab.b;
    let s_ = lab.l - 0.0894841775 * lab.a - 1.2914855480 * lab.b;

    let l = l_ * l_ * l_;
    let m = m_ * m_ * m_;
    let s = s_ * s_ * s_;

    RGB {
        r: linear_to_srgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
        g: linear_to_srgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
        b: linear_to_srgb(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
    }
}

/// Convert OKLab to OKLCH
#[inline]
pub fn oklab_to_oklch(lab: OKLab) -> OKLCH {
    OKLCH {
        l: lab.l,
        c: (lab.a * lab.a + lab.b * lab.b).sqrt(),
        h: lab.b.atan2(lab.a),
    }
}

/// Convert OKLCH to OKLab
#[inline]
pub fn oklch_to_oklab(lch: OKLCH) -> OKLab {
    OKLab {
        l: lch.l,
        a: lch.c * lch.h.cos(),
        b: lch.c * lch.h.sin(),
    }
}
