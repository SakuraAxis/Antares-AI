import init, { applyVibranceFilter } from '../../../antares_wgpu/pkg/antares_wgpu.js';
import wasmUrl from '../../../antares_wgpu/pkg/antares_wgpu_bg.wasm?url';

/**
 * WASM-based filter engine for high-performance image processing
 */
export class WasmFilterEngine {
  private initialized = false;

  /**
   * Initialize the WASM module
   * Must be called before using any filters
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    
    await init(wasmUrl);
    this.initialized = true;
    console.log('WASM Filter Engine initialized');
  }

  /**
   * Apply vibrance filter
   * @param imageData - ImageData from canvas context
   * @param amount - Vibrance amount ( -100 to +100 )
   */
  applyVibrance(imageData: ImageData, amount: number): void {
    this.ensureInitialized();
    applyVibranceFilter(imageData.data, imageData.width, imageData.height, amount);
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
