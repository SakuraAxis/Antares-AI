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
  temperature = 0; // Range: -100 ( cooler ) to +100 ( warmer )
  tint = 0; // Range: -100 ( green ) to +100 ( magenta )

  // OKLab adjustment scales for natural white balance
  private readonly TEMP_A_SCALE = 0.020;
  private readonly TEMP_B_SCALE = 0.050;
  private readonly TINT_A_SCALE = 0.040;
  private readonly TINT_B_SCALE = -0.014;

  // Chroma mask range: protects near-gray pixels from color shifts
  private readonly CHROMA_MIN = 0.04;
  private readonly CHROMA_MAX = 0.25;

  // Tone mask constants : emphasizes midtones
  private readonly TONE_BASE = 0.82;
  private readonly TONE_RANGE = 0.18;

  apply(imageData: ImageData): ImageData {
    const data = imageData.data;
    const temperature = shapedAmount(this.temperature);
    const tint = shapedAmount(this.tint);

    // OKLab keeps the adjustment perceptual, so the white balance feels smoother and more natural.
    const temperatureA = this.TEMP_A_SCALE * temperature;
    const temperatureB = this.TEMP_B_SCALE * temperature;
    const tintA = this.TINT_A_SCALE * tint;
    const tintB = this.TINT_B_SCALE * tint;

    for (let i = 0; i < data.length; i += 4) {
      const lab = rgbToOKLab({
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
      });

      const chroma = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
      
      // Protect near-neutral colors from excessive shifting
      const chromaMask = 1 - smoothstep(this.CHROMA_MIN, this.CHROMA_MAX, chroma);
      
      // Apply more effect to midtones, less to extreme blacks and whites
      const toneMask = this.TONE_BASE + this.TONE_RANGE * (1 - Math.abs(lab.l - 0.5) * 2);
      
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
