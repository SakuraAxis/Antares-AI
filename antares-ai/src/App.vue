<script setup lang="ts">
import { ref } from "vue";

import AppHeader from "./components/AppHeader.vue";
import ImageCanvas from "./components/ImageCanvas.vue";
import { useImageEditor } from "./composables/useImageEditor";

const canvasEl = ref<HTMLCanvasElement | null>(null);
const {
  vibrance,
  highlightsShadows,
  temperature,
  tint,
  openImage,
  onVibranceInput,
  onHighlightsShadowsInput,
  onTemperatureInput,
  onTintInput,
} = useImageEditor(canvasEl);
</script>

<template>
  <main class="min-h-screen bg-white">
    <div class="mx-auto max-w-6xl p-8">
      <AppHeader />

      <div class="mb-8 flex justify-center">
        <label class="cursor-pointer rounded border border-neutral-300 px-4 py-2 transition hover:bg-neutral-50">
          Open Image
          <input
            class="hidden"
            type="file"
            accept="image/*"
            @change="openImage"
          />
        </label>
      </div>

      <ImageCanvas
        v-model:vibrance="vibrance"
        v-model:highlightsShadows="highlightsShadows"
        v-model:temperature="temperature"
        v-model:tint="tint"
        v-model:canvasEl="canvasEl"
        @vibrance-input="onVibranceInput"
        @highlights-shadows-input="onHighlightsShadowsInput"
        @temperature-input="onTemperatureInput"
        @tint-input="onTintInput"
      />
    </div>
  </main>
</template>
