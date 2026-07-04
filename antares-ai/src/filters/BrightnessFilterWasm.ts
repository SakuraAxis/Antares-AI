import { getWasmFilterEngine } from "../wasm/WasmFilterEngine";

/**
 * WASM-accelerated Brightness Filter
 *
 * Uses OKLab lightness with a soft, perceptual response curve.
 */
export class BrightnessFilterWasm {
  amount = 0; // Range : -100 to +100

  async apply(imageData: ImageData): Promise<ImageData> {
    const engine = await getWasmFilterEngine();
    await engine.applyBrightness(imageData, this.amount);
    return imageData;
  }
}
