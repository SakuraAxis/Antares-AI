import type { ImageFilter } from "./ImageFilter";
import { getWasmFilterEngine } from "../wasm/WasmFilterEngine";

/**
 * WASM-accelerated Temperature & Tint Filter
 *
 * Drop-in replacement for the TypeScript TemperatureTintFilter
 * Uses Rust + WASM for significantly better performance
 */
export class TemperatureTintFilterWasm implements ImageFilter {
  temperature = 0; // Range : -100 ( cooler ) to +100 ( warmer )
  tint = 0; // Range : -100 ( green ) to +100 ( magenta )

  async apply(imageData: ImageData): Promise<ImageData> {
    const engine = await getWasmFilterEngine();
    await engine.applyTemperatureTint(imageData, this.temperature, this.tint);
    return imageData;
  }
}
