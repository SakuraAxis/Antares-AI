import type { ImageFilter } from "./ImageFilter";

import {
  rgbToOKLab,
  okLabToRGB,
  okLabToOKLCH,
  okLCHToOKLab,
} from "../utils/color/";

export class VibranceFilter implements ImageFilter {
  amount = 0;

  apply(imageData: ImageData): ImageData {
    const data = imageData.data;

    // -100 ~ 100
    const strength = this.amount / 100;

    const MAX_CHROMA = 0.4;
    const SCALE = 0.08;

    for (let i = 0; i < data.length; i += 4) {
      // RGB -> OKLab
      const lab = rgbToOKLab({
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
      });

      // OKLab -> OKLCH
      const lch = okLabToOKLCH(lab);

      // If it's already very vibrant, don't add too much
      const boost = 1 - Math.min(lch.c / MAX_CHROMA, 1);

      // Core
      lch.c += strength * boost * SCALE;

      // Avoid negative Chroma
      lch.c = Math.max(0, lch.c);

      // OKLCH -> OKLab -> RGB
      const rgb = okLabToRGB(okLCHToOKLab(lch));

      data[i] = rgb.r;
      data[i + 1] = rgb.g;
      data[i + 2] = rgb.b;
    }

    return imageData;
  }
}