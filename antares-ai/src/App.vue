<script setup lang="ts">
import { ref } from "vue";

import AppHeader from "./components/AppHeader.vue";
import ImageCanvas from "./components/ImageCanvas.vue";

import { useImageEditorWasm } from "./composables/useImageEditorWasm";
import { saveCanvasAsImage } from "./utils/images";

const canvasWasmEl = ref<HTMLCanvasElement | null>(null);

// WASM version
const wasmEditor = useImageEditorWasm(canvasWasmEl);

const activeEditor = () => wasmEditor;

</script>

<template>
  <main class="min-h-screen bg-white">
    <div class="mx-auto max-w-6xl p-8">
      <AppHeader />

      <div class="mb-8 flex justify-center gap-4">
        <label class="cursor-pointer rounded border border-neutral-300 px-4 py-2 transition hover:bg-neutral-50 duration-200">
          Open Image
          <input
            class="hidden"
            type="file"
            accept="image/*"
            @change="activeEditor().openImage"
          />
        </label>
        
        <button
          class="cursor-pointer rounded border border-neutral-300 px-4 py-2 transition hover:bg-neutral-50 duration-200"
          @click="saveCanvasAsImage(canvasWasmEl)"
        >
          Save Image
        </button>
      </div>

      <div>
        <ImageCanvas
          v-model:brightness="wasmEditor.brightness.value"
          v-model:vibrance="wasmEditor.vibrance.value"
          v-model:highlightsShadows="wasmEditor.highlightsShadows.value"
          v-model:temperature="wasmEditor.temperature.value"
          v-model:tint="wasmEditor.tint.value"
          v-model:duotone="wasmEditor.duotone.value"
          v-model:duotoneDark="wasmEditor.duotoneDark.value"
          v-model:duotoneLight="wasmEditor.duotoneLight.value"
          v-model:canvasEl="canvasWasmEl"
          @brightness-input="wasmEditor.onBrightnessInput"
          @vibrance-input="wasmEditor.onVibranceInput"
          @highlights-shadows-input="wasmEditor.onHighlightsShadowsInput"
          @temperature-input="wasmEditor.onTemperatureInput"
          @tint-input="wasmEditor.onTintInput"
          @duotone-input="wasmEditor.onDuotoneInput"
          @duotone-dark-input="wasmEditor.onDuotoneDarkInput"
          @duotone-light-input="wasmEditor.onDuotoneLightInput"
        />
      </div>
    </div>
  </main>
</template>
