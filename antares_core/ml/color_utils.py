from __future__ import annotations


def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    normalized = hex_color.lstrip("#")
    if len(normalized) != 6:
        raise ValueError(f"Invalid hex color: {hex_color}")
    return tuple(int(normalized[i : i + 2], 16) for i in (0, 2, 4))


def rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    r, g, b = rgb
    return f"#{r:02x}{g:02x}{b:02x}"


def srgb_to_linear(value: float) -> float:
    value = value / 255.0
    if value <= 0.04045:
        return value / 12.92
    return ((value + 0.055) / 1.055) ** 2.4


def linear_to_srgb(value: float) -> float:
    if value <= 0.0031308:
        return value * 12.92
    return 1.055 * (value ** (1 / 2.4)) - 0.055


def rgb_to_oklab(rgb: tuple[int, int, int]) -> tuple[float, float, float]:
    r, g, b = (srgb_to_linear(channel) for channel in rgb)

    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b

    l_ = l ** (1 / 3)
    m_ = m ** (1 / 3)
    s_ = s ** (1 / 3)

    ok_l = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
    ok_a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
    ok_b = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    return ok_l, ok_a, ok_b


def oklab_to_rgb(lab: tuple[float, float, float]) -> tuple[int, int, int]:
    l, a, b = lab

    l_ = l + 0.3963377774 * a + 0.2158037573 * b
    m_ = l - 0.1055613458 * a - 0.0638541728 * b
    s_ = l - 0.0894841775 * a - 1.2914855480 * b

    l3 = l_ * l_ * l_
    m3 = m_ * m_ * m_
    s3 = s_ * s_ * s_

    r = linear_to_srgb(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3)
    g = linear_to_srgb(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3)
    b = linear_to_srgb(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3)

    return (
        max(0, min(255, round(r * 255))),
        max(0, min(255, round(g * 255))),
        max(0, min(255, round(b * 255))),
    )


def normalize_oklab(lab: tuple[float, float, float]) -> tuple[float, float, float]:
    l, a, b = lab
    return l, (a + 0.4) / 0.8, (b + 0.4) / 0.8


def denormalize_oklab(values: tuple[float, float, float]) -> tuple[float, float, float]:
    l, a, b = values
    return l, a * 0.8 - 0.4, b * 0.8 - 0.4

