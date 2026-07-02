import type { ImageFilter } from "./ImageFilter";
import { okLabToRGB, rgbToOKLab } from "../utils/color";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mixColor(
  left: { r: number; g: number; b: number },
  right: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } {
  const leftLab = rgbToOKLab(left);
  const rightLab = rgbToOKLab(right);
  const blended = {
    l: mix(leftLab.l, rightLab.l, t),
    a: mix(leftLab.a, rightLab.a, t),
    b: mix(leftLab.b, rightLab.b, t),
  };

  return okLabToRGB(blended);
}

export class DuotoneFilter implements ImageFilter {
  amount = 100;

  // Adjusts the contrast curve of the duotone mapping
  // Values < 1 brighten midtones, values > 1 darken them
  // Range : 0.6 - 1.4, default : 0.82
  contrastCurve = 0.82;

  darkColor = { r: 43, g: 12, b: 86 };
  lightColor = { r: 255, g: 72, b: 176 };

  setColors(
    darkColor: { r: number; g: number; b: number },
    lightColor: { r: number; g: number; b: number }
  ): void {
    this.darkColor = darkColor;
    this.lightColor = lightColor;
  }

  apply(imageData: ImageData): ImageData {
    const data = imageData.data;
    const strength = clamp(this.amount / 100, 0, 1);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Use OKLab L channel for perceptually uniform luminance
      const lab = rgbToOKLab({ r, g, b });
      const luma = lab.l; // Range : 0-1, perceptually uniform

      const t = smoothstep(0, 1, luma);
      const lifted = t ** this.contrastCurve;
      const mapped = mixColor(this.darkColor, this.lightColor, lifted);

      data[i] = clamp(mix(r, mapped.r, strength), 0, 255);
      data[i + 1] = clamp(mix(g, mapped.g, strength), 0, 255);
      data[i + 2] = clamp(mix(b, mapped.b, strength), 0, 255);
    }

    return imageData;
  }
}
