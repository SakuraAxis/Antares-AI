import type { ImageFilter } from "./ImageFilter";

export class VibranceFilter implements ImageFilter {
  amount = 0;
  constructor(amount: number = 50) {
    this.amount = amount;
  }

  apply(imageData: ImageData): ImageData {
    const data = imageData.data;

    // amount: 0~100 -> 0~1
    const amount = this.amount / 100;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      const max = Math.max(r, g, b);
      const avg = (r + g + b) / 3;

      // The closer to gray, the greater the boost.
      const boost = (1 - (max - avg) / 255) * amount;

      r += (max - r) * boost;
      g += (max - g) * boost;
      b += (max - b) * boost;

      data[i] = Math.min(255, Math.max(0, Math.round(r)));
      data[i + 1] = Math.min(255, Math.max(0, Math.round(g)));
      data[i + 2] = Math.min(255, Math.max(0, Math.round(b)));
    }

    return imageData;
  }
}