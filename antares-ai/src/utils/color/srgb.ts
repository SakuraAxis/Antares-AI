export function srgbToLinear(v: number): number {
  v /= 255;

  if (v <= 0.04045) {
    return v / 12.92;
  }

  return Math.pow((v + 0.055) / 1.055, 2.4);
}

export function linearToSrgb(v: number): number {
  if (v <= 0.0031308) {
    v *= 12.92;
  } else {
    v = 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  }

  return Math.min(255, Math.max(0, Math.round(v * 255)));
}