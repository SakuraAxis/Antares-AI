import type { ImageFilter } from "./ImageFilter";
import { okLabToRGB, rgbToOKLab } from "../utils/color";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export class HighlightsShadowsFilter implements ImageFilter {
  amount = 0; // Range: -100 ( recover highlights ) to +100 ( lift shadows )

  // Shadow lift transition thresholds ( OKLab L values )
  private readonly SHADOW_START = 0.16;
  private readonly SHADOW_END = 0.46;
  
  // Highlight recovery transition thresholds ( OKLab L values )
  private readonly HIGHLIGHT_START = 0.56;
  private readonly HIGHLIGHT_END = 0.92;
  
  // Effect intensity multipliers
  private readonly SHADOW_INTENSITY = 0.78;
  private readonly HIGHLIGHT_INTENSITY = 0.72;

  apply(imageData: ImageData): ImageData {
    const data = imageData.data;
    const strength = Math.abs(this.amount) / 100;
    const isShadowLift = this.amount > 0;
    const isHighlightRecovery = this.amount < 0;

    for (let i = 0; i < data.length; i += 4) {
      const lab = rgbToOKLab({
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
      });

      if (isShadowLift) {
        // Lift only darker tones in perceptual space, with a soft transition into midtones.
        const shadowMask = 1 - smoothstep(this.SHADOW_START, this.SHADOW_END, lab.l);
        const lift = (1 - (1 - strength) ** 2) * shadowMask * shadowMask;
        const blend = lift * this.SHADOW_INTENSITY;

        lab.l = clamp(lab.l + (1 - lab.l) * blend, 0, 1);
        
        // Shadow lift reveals detail and typically increases perceived saturation
        const saturationBoost = 1 + 0.06 * blend;
        lab.a *= saturationBoost;
        lab.b *= saturationBoost;
      } else if (isHighlightRecovery) {
        // Compress only brighter tones, keeping the shoulder soft and avoiding flat-looking whites.
        const highlightMask = smoothstep(this.HIGHLIGHT_START, this.HIGHLIGHT_END, lab.l);
        const recovery = (1 - (1 - strength) ** 2) * highlightMask * highlightMask;
        const blend = recovery * this.HIGHLIGHT_INTENSITY;

        lab.l = clamp(lab.l - lab.l * blend, 0, 1);
        
        // Highlight recovery moderately reduces saturation to prevent clipping
        lab.a *= 1 - 0.05 * blend;
        lab.b *= 1 - 0.05 * blend;
      }

      const rgb = okLabToRGB(lab);

      data[i] = clamp(rgb.r, 0, 255);
      data[i + 1] = clamp(rgb.g, 0, 255);
      data[i + 2] = clamp(rgb.b, 0, 255);
    }

    return imageData;
  }
}
