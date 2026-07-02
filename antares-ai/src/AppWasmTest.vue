<script setup lang="ts">
import { ref } from "vue";

import AppHeader from "./components/AppHeader.vue";
import ImageCanvas from "./components/ImageCanvas.vue";
import { useImageEditor } from "./composables/useImageEditor";
import { useImageEditorWasm } from "./composables/useImageEditorWasm";

const canvasEl = ref<HTMLCanvasElement | null>(null);
const canvasWasmEl = ref<HTMLCanvasElement | null>(null);
const useWasm = ref(false);

// TS version
const tsEditor = useImageEditor(canvasEl);

// WASM version
const wasmEditor = useImageEditorWasm(canvasWasmEl);

// Current active editor
const activeEditor = () => useWasm.value ? wasmEditor : tsEditor;

function toggleMode() {
  useWasm.value = !useWasm.value;
}
</script>

<template>
  <main class="min-h-screen bg-white">
    <div class="mx-auto max-w-6xl p-8">
      <AppHeader />

      <!-- Mode Toggle -->
      <div class="mb-8 flex justify-center gap-4">
        <label class="cursor-pointer rounded border border-neutral-300 px-4 py-2 transition hover:bg-neutral-50">
          Open Image
          <input
            class="hidden"
            type="file"
            accept="image/*"
            @change="activeEditor().openImage"
          />
        </label>

        <button
          @click="toggleMode"
          :class="[
            'rounded px-4 py-2 font-semibold transition',
            useWasm
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          ]"
        >
          {{ useWasm ? 'WASM Mode' : 'TypeScript Mode' }}
        </button>
      </div>

      <!-- Performance Indicator -->
      <div class="mb-4 text-center text-sm text-gray-600">
        <span v-if="useWasm">
          Using Rust WASM for Vibrance filter
        </span>
        <span v-else>
          Using TypeScript for all filters
        </span>
      </div>

      <!-- TS Canvas -->
      <div v-show="!useWasm">
        <ImageCanvas
          v-model:vibrance="tsEditor.vibrance.value"
          v-model:highlightsShadows="tsEditor.highlightsShadows.value"
          v-model:temperature="tsEditor.temperature.value"
          v-model:tint="tsEditor.tint.value"
          v-model:duotone="tsEditor.duotone.value"
          v-model:duotoneDark="tsEditor.duotoneDark.value"
          v-model:duotoneLight="tsEditor.duotoneLight.value"
          v-model:canvasEl="canvasEl"
          @vibrance-input="tsEditor.onVibranceInput"
          @highlights-shadows-input="tsEditor.onHighlightsShadowsInput"
          @temperature-input="tsEditor.onTemperatureInput"
          @tint-input="tsEditor.onTintInput"
          @duotone-input="tsEditor.onDuotoneInput"
          @duotone-dark-input="tsEditor.onDuotoneDarkInput"
          @duotone-light-input="tsEditor.onDuotoneLightInput"
        />
      </div>

      <!-- WASM Canvas -->
      <div v-show="useWasm">
        <ImageCanvas
          v-model:vibrance="wasmEditor.vibrance.value"
          v-model:highlightsShadows="wasmEditor.highlightsShadows.value"
          v-model:temperature="wasmEditor.temperature.value"
          v-model:tint="wasmEditor.tint.value"
          v-model:duotone="wasmEditor.duotone.value"
          v-model:duotoneDark="wasmEditor.duotoneDark.value"
          v-model:duotoneLight="wasmEditor.duotoneLight.value"
          v-model:canvasEl="canvasWasmEl"
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
