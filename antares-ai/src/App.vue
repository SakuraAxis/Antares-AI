<script setup lang="ts">
import { ref } from "vue";

import { CanvasEngine } from "./core/CanvasEngine";
import { VibranceFilter } from "./filters/VibranceFilter";

const canvasRef = ref<HTMLCanvasElement | null>(null);

let engine: CanvasEngine;
let originalImageData: ImageData | null = null;

const vibrance = ref(60);

const showControls = ref(false);
const dragging = ref(false);

const vibranceFilter = new VibranceFilter();
vibranceFilter.amount = vibrance.value;

function cloneImageData(image: ImageData): ImageData {
  return new ImageData(
    new Uint8ClampedArray(image.data),
    image.width,
    image.height
  );
}

function render() {
  if (!engine || !originalImageData) return;

  const image = cloneImageData(originalImageData);

  vibranceFilter.apply(image);

  engine.putImageData(image);
}

function onVibranceInput() {
  vibranceFilter.amount = Number(vibrance.value);
  render();
}

function onPointerDown() {
  dragging.value = true;
}

function onPointerUp() {
  dragging.value = false;
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
</script>

<template>
  <main class="min-h-screen bg-white">
    <div class="mx-auto max-w-6xl p-8">

      <!-- Header -->
      <div class="mb-8 flex items-center justify-between">

        <h1 class="text-xl font-semibold">
          Antares Lab
        </h1>

      </div>

      <!-- Open -->
      <div
        class="mb-8 flex justify-center"
      >
        <label
          class="cursor-pointer rounded border border-neutral-300 px-4 py-2 hover:bg-neutral-50 transition"
        >
          Open Image

          <input
            class="hidden"
            type="file"
            accept="image/*"
            @change="openImage"
          />
        </label>
      </div>

      <!-- Canvas -->
      <div 
        class="relative flex justify-center"
        @mouseenter="showControls = true"
        @mouseleave="showControls = false"
      >

        <canvas
          ref="canvasRef"
          class="max-w-full border border-neutral-200"
        />

        <!-- Floating Slider -->
        <div
          :class="[
            'absolute inset-0 flex items-center justify-center transition-opacity duration-300',
            (showControls && !dragging) ? 'opacity-100' : 'opacity-0 pointer-events-none'
          ]"
        >
          <div class="w-80">

            <input
              v-model="vibrance"
              @input="onVibranceInput"
              @pointerdown="onPointerDown"
              @pointerup="onPointerUp"
              @pointercancel="onPointerUp"
              type="range"
              min="-100"
              max="100"
              class="w-full accent-black"
            />

            <p
              class="mt-2 text-center text-sm text-neutral-500"
            >
              Vibrance {{ vibrance }}
            </p>

          </div>
        </div>

      </div>

    </div>
  </main>
</template>