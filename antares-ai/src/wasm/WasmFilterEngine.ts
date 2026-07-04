import init, { applyBrightnessFilter, applyVibranceFilter, applyHighlightsShadowsFilter, applyTemperatureTintFilter, applyDuotoneFilter, initFilterEngine } from '../../../antares_wgpu/pkg/antares_wgpu.js';
import wasmUrl from '../../../antares_wgpu/pkg/antares_wgpu_bg.wasm?url';

/**
 * Convert a Uint8ClampedArray ( e.g. from ImageData.data ) into a Uint8Array
 * view over the same underlying buffer, without copying the data.
 */
function toUint8Array(data: Uint8ClampedArray): Uint8Array {
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

/**
 * WGPU-based filter engine for high-performance image processing
 */
export class WasmFilterEngine {
  private initialized = false;

  /**
   * Initialize the WASM module and WebGPU pipelines
   * Must be called before using any filters
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    await init(wasmUrl);
    await initFilterEngine();
    this.initialized = true;
    console.log('WGPU Filter Engine initialized');
  }

  /**
   * Apply vibrance filter via WGPU compute shader
   * @param imageData - ImageData from canvas context
   * @param amount - Vibrance amount ( -100 to +100 )
   */
  async applyVibrance(imageData: ImageData, amount: number): Promise<void> {
    this.ensureInitialized();
    await applyVibranceFilter(toUint8Array(imageData.data), imageData.width, imageData.height, amount);
  }

  /**
   * Apply brightness filter via WGPU compute shader
   * @param imageData - ImageData from canvas context
   * @param amount - Brightness amount ( -100 to +100 )
   */
  async applyBrightness(imageData: ImageData, amount: number): Promise<void> {
    this.ensureInitialized();
    await applyBrightnessFilter(toUint8Array(imageData.data), imageData.width, imageData.height, amount);
  }

  /**
   * Apply highlights/shadows filter via WGPU compute shader
   * @param imageData - ImageData from canvas context
   * @param amount - Amount ( -100 = full highlight recovery, +100 = full shadow lift )
   */
  async applyHighlightsShadows(imageData: ImageData, amount: number): Promise<void> {
    this.ensureInitialized();
    await applyHighlightsShadowsFilter(toUint8Array(imageData.data), imageData.width, imageData.height, amount);
  }

  /**
   * Apply temperature and tint filter via WGPU compute shader
   * @param imageData - ImageData from canvas context
   * @param temperature - Temperature ( -100 to +100 )
   * @param tint - Tint ( -100 to +100 )
   */
  async applyTemperatureTint(imageData: ImageData, temperature: number, tint: number): Promise<void> {
    this.ensureInitialized();
    await applyTemperatureTintFilter(toUint8Array(imageData.data), imageData.width, imageData.height, temperature, tint);
  }

  /**
   * Apply duotone filter via WGPU compute shader
   * @param imageData - ImageData from canvas context
   * @param amount - Amount (0 to 100)
   * @param contrastCurve - Contrast curve mapping (e.g. 0.82)
   * @param dr - Dark color R (0 to 255)
   * @param dg - Dark color G (0 to 255)
   * @param db - Dark color B (0 to 255)
   * @param lr - Light color R (0 to 255)
   * @param lg - Light color G (0 to 255)
   * @param lb - Light color B (0 to 255)
   */
  async applyDuotone(
    imageData: ImageData, 
    amount: number, 
    contrastCurve: number, 
    dr: number, dg: number, db: number,
    lr: number, lg: number, lb: number
  ): Promise<void> {
    this.ensureInitialized();
    await applyDuotoneFilter(
      toUint8Array(imageData.data), imageData.width, imageData.height, 
      amount, contrastCurve, dr, dg, db, lr, lg, lb
    );
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('WasmFilterEngine not initialized. Call init() first.');
    }
  }
}

// Singleton instance
let instance: WasmFilterEngine | null = null;

/**
 * Get the singleton WASM filter engine instance
 */
export async function getWasmFilterEngine(): Promise<WasmFilterEngine> {
  if (!instance) {
    instance = new WasmFilterEngine();
    await instance.init();
  }
  return instance;
}
