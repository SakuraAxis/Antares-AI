import { ref } from "vue";
import type { Ref } from "vue";

import { CanvasEngine } from "../core/CanvasEngine";
import { DuotoneFilter } from "../filters/DuotoneFilter";
import { HighlightsShadowsFilter } from "../filters/HighlightsShadowsFilter";
import { TemperatureTintFilter } from "../filters/TemperatureTintFilter";
import { VibranceFilterWasm } from "../filters/VibranceFilterWasm";
import type { ImageFilter } from "../filters/ImageFilter";
import { getWasmFilterEngine } from "../wasm/WasmFilterEngine";

type RGBColor = { r: number; g: number; b: number };

function hexToRgb(hex: string): RGBColor {
  const normalized = hex.replace("#", "");
  const parsed = Number.parseInt(normalized, 16);

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

function cloneImageData(imageData: ImageData): ImageData {
  return new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );
}

export function useImageEditorWasm(canvasRef: Ref<HTMLCanvasElement | null>) {
  const vibrance = ref(0);
  const highlightsShadows = ref(0);
  const temperature = ref(0);
  const tint = ref(0);
  const duotone = ref(0);
  const duotoneDark = ref("#000000");
  const duotoneLight = ref("#ffffff");

  let engine: CanvasEngine | null = null;
  let originalImageData: ImageData | null = null;
  let wasmInitialized = false;

  const temperatureTintFilter = new TemperatureTintFilter();
  const vibranceFilter = new VibranceFilterWasm();
  const highlightsShadowsFilter = new HighlightsShadowsFilter();
  const duotoneFilter = new DuotoneFilter();
  
  temperatureTintFilter.temperature = temperature.value;
  temperatureTintFilter.tint = tint.value;
  vibranceFilter.amount = vibrance.value;
  highlightsShadowsFilter.amount = highlightsShadows.value;
  duotoneFilter.amount = duotone.value;
  duotoneFilter.setColors(
    hexToRgb(duotoneDark.value),
    hexToRgb(duotoneLight.value)
  );

  // Initialize WASM engine
  (async () => {
    await getWasmFilterEngine();
    wasmInitialized = true;
    console.log('WASM engine ready for Vibrance filter');
  })();

  async function render() {
    if (!engine || !originalImageData || !wasmInitialized) return;

    const image = cloneImageData(originalImageData);

    // Apply TS filters
    temperatureTintFilter.apply(image);
    highlightsShadowsFilter.apply(image);
    
    // Apply WASM filter ( async )
    await vibranceFilter.apply(image);
    
    // Apply remaining TS filters
    duotoneFilter.apply(image);

    engine.putImageData(image);
  }

  function onVibranceInput() {
    vibranceFilter.amount = vibrance.value;
    render();
  }

  function onHighlightsShadowsInput() {
    highlightsShadowsFilter.amount = highlightsShadows.value;
    render();
  }

  function onTemperatureInput() {
    temperatureTintFilter.temperature = temperature.value;
    render();
  }

  function onTintInput() {
    temperatureTintFilter.tint = tint.value;
    render();
  }

  function onDuotoneInput() {
    duotoneFilter.amount = duotone.value;
    render();
  }

  function applyDuotoneColors() {
    duotoneFilter.setColors(
      hexToRgb(duotoneDark.value),
      hexToRgb(duotoneLight.value)
    );
    render();
  }

  function onDuotoneDarkInput() {
    applyDuotoneColors();
  }

  function onDuotoneLightInput() {
    applyDuotoneColors();
  }

  function openImage(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const canvas = canvasRef.value;
        if (!canvas) return;

        engine = new CanvasEngine(canvas);
        engine.drawImage(img);
        originalImageData = engine.getImageData();

        render();
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  }

  return {
    vibrance,
    highlightsShadows,
    temperature,
    tint,
    duotone,
    duotoneDark,
    duotoneLight,
    openImage,
    onVibranceInput,
    onHighlightsShadowsInput,
    onTemperatureInput,
    onTintInput,
    onDuotoneInput,
    onDuotoneDarkInput,
    onDuotoneLightInput,
  };
}
