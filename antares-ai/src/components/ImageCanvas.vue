<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  vibrance: number;
  highlightsShadows: number;
  temperature: number;
  tint: number;
  duotone: number;
  duotoneDark: string;
  duotoneLight: string;
}>();

const emit = defineEmits<{
  "update:vibrance": [value: number];
  "update:highlightsShadows": [value: number];
  "update:temperature": [value: number];
  "update:tint": [value: number];
  "update:duotone": [value: number];
  "update:duotoneDark": [value: string];
  "update:duotoneLight": [value: string];
  "update:canvasEl": [el: HTMLCanvasElement | null];
  "vibrance-input": [];
  "highlights-shadows-input": [];
  "temperature-input": [];
  "tint-input": [];
  "duotone-input": [];
  "duotone-dark-input": [];
  "duotone-light-input": [];
}>();

const showControls = ref(false);
const dragging = ref(false);

function onVibranceChange(event: Event) {
  const input = event.target as HTMLInputElement;
  emit("update:vibrance", Number(input.value));
  emit("vibrance-input");
}

function onHighlightsShadowsChange(event: Event) {
  const input = event.target as HTMLInputElement;
  emit("update:highlightsShadows", Number(input.value));
  emit("highlights-shadows-input");
}

function onTemperatureChange(event: Event) {
  const input = event.target as HTMLInputElement;
  emit("update:temperature", Number(input.value));
  emit("temperature-input");
}

function onTintChange(event: Event) {
  const input = event.target as HTMLInputElement;
  emit("update:tint", Number(input.value));
  emit("tint-input");
}

function onDuotoneChange(event: Event) {
  const input = event.target as HTMLInputElement;
  emit("update:duotone", Number(input.value));
  emit("duotone-input");
}

function onDuotoneDarkChange(event: Event) {
  const input = event.target as HTMLInputElement;
  emit("update:duotoneDark", input.value);
  emit("duotone-dark-input");
}

function onDuotoneLightChange(event: Event) {
  const input = event.target as HTMLInputElement;
  emit("update:duotoneLight", input.value);
  emit("duotone-light-input");
}

function onPointerDown() {
  dragging.value = true;
}

function onPointerUp() {
  dragging.value = false;
}
</script>

<template>
  <div
    class="relative flex justify-center"
    @mouseenter="showControls = true"
    @mouseleave="showControls = false"
  >
    <canvas
      :ref="(el) => emit('update:canvasEl', el as HTMLCanvasElement | null)"
      class="max-w-full border border-neutral-200"
    />

    <div
      :class="[
        'absolute inset-0 flex items-center justify-center transition-opacity duration-300',
        showControls && !dragging ? 'opacity-100' : 'opacity-0 pointer-events-none',
      ]"
    >
      <div class="w-80 space-y-5 rounded-xl bg-white/90 p-4 shadow-lg ring-1 ring-black/5 backdrop-blur">
        <div class="flex gap-2">
          <input
            :value="duotoneDark"
            type="color"
            class="h-9 w-9 cursor-pointer rounded-full border border-neutral-200/80 bg-transparent p-0 transition hover:scale-110 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-full"
            @input="onDuotoneDarkChange"
          />

          <input
            :value="duotoneLight"
            type="color"
            class="h-9 w-9 cursor-pointer rounded-full border border-neutral-200/80 bg-transparent p-0 transition hover:scale-110 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-full"
            @input="onDuotoneLightChange"
          />
        </div>

        <div>
          <input
            :value="duotone"
            type="range"
            min="0"
            max="100"
            class="w-full accent-black"
            @input="onDuotoneChange"
            @pointerdown="onPointerDown"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
          />

          <p class="mt-2 text-center text-sm text-neutral-500">
            Duotone / Gradient {{ duotone }}
          </p>
        </div>

        <div>
          <input
            :value="temperature"
            type="range"
            min="-100"
            max="100"
            class="w-full accent-black"
            @input="onTemperatureChange"
            @pointerdown="onPointerDown"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
          />

          <p class="mt-2 text-center text-sm text-neutral-500">
            Temperature {{ temperature }}
          </p>
        </div>

        <div>
          <input
            :value="tint"
            type="range"
            min="-100"
            max="100"
            class="w-full accent-black"
            @input="onTintChange"
            @pointerdown="onPointerDown"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
          />

          <p class="mt-2 text-center text-sm text-neutral-500">
            Tint {{ tint }}
          </p>
        </div>

        <div>
          <input
            :value="highlightsShadows"
            type="range"
            min="-100"
            max="100"
            class="w-full accent-black"
            @input="onHighlightsShadowsChange"
            @pointerdown="onPointerDown"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
          />

          <p class="mt-2 text-center text-sm text-neutral-500">
            Highlights & Shadows {{ highlightsShadows }}
          </p>
        </div>

        <div>
          <input
            :value="vibrance"
            type="range"
            min="-100"
            max="100"
            class="w-full accent-black"
            @input="onVibranceChange"
            @pointerdown="onPointerDown"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
          />

          <p class="mt-2 text-center text-sm text-neutral-500">
            Vibrance {{ vibrance }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
