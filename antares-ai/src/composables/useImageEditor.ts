import { ref } from "vue";
import type { Ref } from "vue";

import { CanvasEngine } from "../core/CanvasEngine";
import { HighlightsShadowsFilter } from "../filters/HighlightsShadowsFilter";
import { TemperatureTintFilter } from "../filters/TemperatureTintFilter";
import { VibranceFilter } from "../filters/VibranceFilter";
import type { ImageFilter } from "../filters/ImageFilter";

function cloneImageData(imageData: ImageData): ImageData {
  return new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );
}

export function useImageEditor(canvasRef: Ref<HTMLCanvasElement | null>) {
  const vibrance = ref(0);
  const highlightsShadows = ref(0);
  const temperature = ref(0);
  const tint = ref(0);

  let engine: CanvasEngine | null = null;
  let originalImageData: ImageData | null = null;

  const temperatureTintFilter = new TemperatureTintFilter();
  const vibranceFilter = new VibranceFilter();
  const highlightsShadowsFilter = new HighlightsShadowsFilter();
  temperatureTintFilter.temperature = temperature.value;
  temperatureTintFilter.tint = tint.value;
  vibranceFilter.amount = vibrance.value;
  highlightsShadowsFilter.amount = highlightsShadows.value;

  const filters: ImageFilter[] = [
    temperatureTintFilter,
    highlightsShadowsFilter,
    vibranceFilter,
  ];

  function render() {
    if (!engine || !originalImageData) return;

    const image = cloneImageData(originalImageData);

    for (const filter of filters) {
      filter.apply(image);
    }

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
    openImage,
    onVibranceInput,
    onHighlightsShadowsInput,
    onTemperatureInput,
    onTintInput,
  };
}
