import type { ImageFilter } from "./ImageFilter";
import { getWasmFilterEngine } from "../wasm/WasmFilterEngine";

/**
 * WASM-accelerated Highlights & Shadows Filter
 *
 * Drop-in replacement for the TypeScript HighlightsShadowsFilter
 * Uses Rust + WASM for significantly better performance
 */
export class HighlightsShadowsFilterWasm implements ImageFilter {
  amount = 0; // Range : -100 ( recover highlights ) to +100 ( lift shadows )

  async apply(imageData: ImageData): Promise<ImageData> {
    const engine = await getWasmFilterEngine();
    await engine.applyHighlightsShadows(imageData, this.amount);
    return imageData;
  }
}
