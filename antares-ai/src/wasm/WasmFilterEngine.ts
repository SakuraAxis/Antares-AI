import init, { applyVibranceFilter, applyHighlightsShadowsFilter, applyTemperatureTintFilter, initFilterEngine } from '../../../antares_wgpu/pkg/antares_wgpu.js';
import wasmUrl from '../../../antares_wgpu/pkg/antares_wgpu_bg.wasm?url';

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
    await applyVibranceFilter(imageData.data, imageData.width, imageData.height, amount);
  }

  /**
   * Apply highlights/shadows filter via WGPU compute shader
   * @param imageData - ImageData from canvas context
   * @param amount - Amount ( -100 = full highlight recovery, +100 = full shadow lift )
   */
  async applyHighlightsShadows(imageData: ImageData, amount: number): Promise<void> {
    this.ensureInitialized();
    await applyHighlightsShadowsFilter(imageData.data, imageData.width, imageData.height, amount);
  }

  /**
   * Apply temperature and tint filter via WGPU compute shader
   * @param imageData - ImageData from canvas context
   * @param temperature - Temperature ( -100 to +100 )
   * @param tint - Tint ( -100 to +100 )
   */
  async applyTemperatureTint(imageData: ImageData, temperature: number, tint: number): Promise<void> {
    this.ensureInitialized();
    await applyTemperatureTintFilter(imageData.data, imageData.width, imageData.height, temperature, tint);
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
