import type { ImageFilter } from "./ImageFilter";
import { transformOKLCH } from "../utils/color/";

export class VibranceFilter implements ImageFilter {
  amount = 0; // Range : -100 to +100

  // Maximum chroma threshold for boost calculation
  // OKLCH chroma can exceed 0.4, using 0.45 allows for more headroom
  private readonly MAX_CHROMA = 0.45;
  
  // Base scale factor for chroma adjustment
  private readonly SCALE = 0.12;

  apply(imageData: ImageData): ImageData {
    const data = imageData.data;
    const strength = this.amount / 100;

    for (let i = 0; i < data.length; i += 4) {
      const rgb = transformOKLCH(
        { r: data[i], g: data[i + 1], b: data[i + 2] },
        (lch) => {
          // Boost lower-saturation areas more ( classic vibrance behavior )
          const chromaBoost = 1 - Math.min(lch.c / this.MAX_CHROMA, 1);
          
          // Protect extreme tones : boost midtones more than shadows / highlights
          const lumaMask = 1 - Math.abs(lch.l - 0.5) * 0.3;
          
          const boost = chromaBoost * lumaMask;
          lch.c = Math.max(0, lch.c + strength * boost * this.SCALE);
        }
      );

      data[i] = rgb.r;
      data[i + 1] = rgb.g;
      data[i + 2] = rgb.b;
    }

    return imageData;
  }
}