<script setup lang="ts">
import { ref } from "vue";
import AppHeader from "../components/AppHeader.vue";
import ImageCanvas from "../components/ImageCanvas.vue";
import { useImageEditorWasm } from "../composables/useImageEditorWasm";
import { saveCanvasAsImage, analyzeOriginalImage, saveFilterData } from "../utils/images";

const canvasWasmEl = ref<HTMLCanvasElement | null>(null);
const wasmEditor = useImageEditorWasm(canvasWasmEl);

const isImgDataStoring = ref(false);

const activeEditor = () => wasmEditor;

async function storeImageData() {
  if (isImgDataStoring.value) return;

  isImgDataStoring.value = true;

  try {
    const editor = activeEditor();

    if (editor.imageId.value === null) {
      if (!editor.originalFile.value) return;

      const analysisResult = await analyzeOriginalImage(editor.originalFile.value);
      if (!analysisResult?.image_id) return;

      editor.imageId.value = analysisResult.image_id;
    }

    await saveFilterData(editor.imageId.value, {
      brightness: editor.brightness.value,
      vibrance: editor.vibrance.value,
      highlights_shadows: editor.highlightsShadows.value,
      temperature: editor.temperature.value,
      tint: editor.tint.value,
      duotone: editor.duotone.value,
      duotone_dark: editor.duotoneDark.value,
      duotone_light: editor.duotoneLight.value,
    });
  } finally {
    isImgDataStoring.value = false;
  }
}
</script>

<template>
  <main class="min-h-screen bg-white">
    <div class="mx-auto max-w-6xl p-8">
      <AppHeader />

      <div class="mb-8 flex flex-wrap justify-center gap-4">
        <label class="cursor-pointer rounded border border-neutral-300 px-4 py-2 transition hover:bg-neutral-50 duration-200">
          Open Image
          <input class="hidden" type="file" accept="image/*" @change="activeEditor().openImage" />
        </label>

        <button class="cursor-pointer rounded border border-neutral-300 px-4 py-2 transition hover:bg-neutral-50 duration-200" @click="saveCanvasAsImage(canvasWasmEl)">
          Save Image
        </button>

        <button
          class="rounded border border-neutral-300 px-4 py-2 transition duration-200"
          :class="
            isImgDataStoring
              ? 'cursor-not-allowed bg-neutral-100 text-neutral-400'
              : 'cursor-pointer hover:bg-neutral-50'
          "
          :disabled="isImgDataStoring"
          @click="storeImageData"
        >
          {{ isImgDataStoring ? "Storing..." : "Store Img Data" }}
        </button>

        <RouterLink
          class="cursor-pointer rounded border border-neutral-300 px-4 py-2 transition hover:bg-neutral-50 duration-200"
          to="/training-data-history"
        >
          Img Data History
        </RouterLink>
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
