import type { ImageFilter } from "./ImageFilter";
import { okLabToRGB, rgbToOKLab } from "../utils/color";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function shapedAmount(value: number): number {
  const normalized = Math.abs(value) / 100;
  return Math.sign(value) * normalized ** 1.25;
}

export class TemperatureTintFilter implements ImageFilter {
  temperature = 0;
  tint = 0;

  apply(imageData: ImageData): ImageData {
    const data = imageData.data;
    const temperature = shapedAmount(this.temperature);
    const tint = shapedAmount(this.tint);

    // OKLab keeps the adjustment perceptual, so the white balance feels smoother and more natural.
    const temperatureA = 0.020 * temperature;
    const temperatureB = 0.050 * temperature;
    const tintA = 0.040 * tint;
    const tintB = -0.014 * tint;

    for (let i = 0; i < data.length; i += 4) {
      const lab = rgbToOKLab({
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
      });

      const chroma = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
      const chromaMask = 1 - smoothstep(0.05, 0.20, chroma);
      const toneMask = 0.82 + 0.18 * (1 - Math.abs(lab.l - 0.5) * 2);
      const amountMask = chromaMask * toneMask;

      lab.a += (temperatureA + tintA) * amountMask;
      lab.b += (temperatureB + tintB) * amountMask;

      const rgb = okLabToRGB(lab);

      data[i] = clamp(rgb.r, 0, 255);
      data[i + 1] = clamp(rgb.g, 0, 255);
      data[i + 2] = clamp(rgb.b, 0, 255);
    }

    return imageData;
  }
}
