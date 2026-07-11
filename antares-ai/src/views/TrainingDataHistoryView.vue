<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import AppHeader from "../components/AppHeader.vue";
import { API_BASE_URL } from "../utils/api";

type ImageRow = {
  id: number;
  filename: string;
  width: number;
  height: number;
  file_size: number;
  upload_time?: string | null;
};

type ImageFeatureRow = {
  id: number;
  image_id: number;
  filename?: string | null;
  brightness_mean: number;
  brightness_std: number;
  brightness_p5: number;
  brightness_p50: number;
  brightness_p95: number;
  dynamic_range: number;
  black_clip_ratio: number;
  white_clip_ratio: number;
  saturation_mean: number;
  saturation_std: number;
  mean_r: number;
  mean_g: number;
  mean_b: number;
  lab_a_mean: number;
  lab_b_mean: number;
  dominant_colors: Array<{ rgb: [number, number, number]; percentage: number }>;
  unique_colors_ratio: number;
  sharpness: number;
  edge_density: number;
  entropy: number;
  local_contrast: number;
};

type UserFilterRow = {
  id: number;
  image_id: number;
  filename?: string | null;
  brightness: number;
  vibrance: number;
  highlights_shadows: number;
  temperature: number;
  tint: number;
  duotone: number;
  duotone_dark: string;
  duotone_light: string;
  updated_at?: string | null;
};

const imageRows = ref<ImageRow[]>([]);
const featureRows = ref<ImageFeatureRow[]>([]);
const filterRows = ref<UserFilterRow[]>([]);
const focusedImageId = ref<number | null>(null);
const focusConfirm = reactive<Record<number, boolean>>({});
const deleteConfirm = reactive<Record<number, boolean>>({});
const deleteResetTimers = new Map<number, ReturnType<typeof setTimeout>>();
const focusResetTimers = new Map<number, ReturnType<typeof setTimeout>>();
const loading = ref(false);
const errorMessage = ref("");
const focusedImageRows = computed(() =>
  focusedImageId.value === null
    ? imageRows.value
    : imageRows.value.filter((row) => row.id === focusedImageId.value)
);
const focusedFeatureRows = computed(() =>
  focusedImageId.value === null
    ? featureRows.value
    : featureRows.value.filter((row) => row.image_id === focusedImageId.value)
);
const focusedFilterRows = computed(() =>
  focusedImageId.value === null
    ? filterRows.value
    : filterRows.value.filter((row) => row.image_id === focusedImageId.value)
);

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json() as Promise<T>;
}

async function loadAll() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const [images, features, filters] = await Promise.all([
      fetchJson<ImageRow[]>(`${API_BASE_URL}/training-data-history/images`),
      fetchJson<ImageFeatureRow[]>(`${API_BASE_URL}/training-data-history/image-features`),
      fetchJson<UserFilterRow[]>(`${API_BASE_URL}/training-data-history`),
    ]);

    imageRows.value = images;
    featureRows.value = features;
    filterRows.value = filters;
    for (const key of Object.keys(focusConfirm)) {
      delete focusConfirm[Number(key)];
    }
    for (const key of Object.keys(deleteConfirm)) {
      delete deleteConfirm[Number(key)];
    }
    for (const timer of focusResetTimers.values()) {
      clearTimeout(timer);
    }
    focusResetTimers.clear();
    for (const timer of deleteResetTimers.values()) {
      clearTimeout(timer);
    }
    deleteResetTimers.clear();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Failed to load data";
  } finally {
    loading.value = false;
  }
}

async function focusImage(row: ImageRow) {
  if (focusedImageId.value === row.id && focusConfirm[row.id]) {
    focusedImageId.value = null;
    delete focusConfirm[row.id];

    const timer = focusResetTimers.get(row.id);
    if (timer) {
      clearTimeout(timer);
      focusResetTimers.delete(row.id);
    }
    return;
  }

  if (focusedImageId.value === row.id) {
    focusConfirm[row.id] = true;

    const existingTimer = focusResetTimers.get(row.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      delete focusConfirm[row.id];
      focusResetTimers.delete(row.id);
    }, 5000);

    focusResetTimers.set(row.id, timer);
    return;
  }

  focusedImageId.value = row.id;
  focusConfirm[row.id] = true;

  const existingTimer = focusResetTimers.get(row.id);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(() => {
    delete focusConfirm[row.id];
    focusResetTimers.delete(row.id);
  }, 5000);

  focusResetTimers.set(row.id, timer);
}

function armDeleteConfirm(imageId: number) {
  deleteConfirm[imageId] = true;

  const existingTimer = deleteResetTimers.get(imageId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(() => {
    delete deleteConfirm[imageId];
    deleteResetTimers.delete(imageId);
  }, 5000);

  deleteResetTimers.set(imageId, timer);
}

async function deleteFilterRow(imageId: number) {
  if (!deleteConfirm[imageId]) {
    armDeleteConfirm(imageId);
    return;
  }

  const response = await fetch(`${API_BASE_URL}/training-data-history/user-filter-data/${imageId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    errorMessage.value = await response.text();
    return;
  }

  delete deleteConfirm[imageId];
  const timer = deleteResetTimers.get(imageId);
  if (timer) {
    clearTimeout(timer);
    deleteResetTimers.delete(imageId);
  }
  await loadAll();
}

onMounted(loadAll);
</script>

<template>
  <main class="min-h-screen bg-white text-neutral-900">
    <div class="mx-auto max-w-7xl p-8">
      <AppHeader />

      <div class="mb-6 flex flex-wrap items-center justify-center gap-3">
        <RouterLink
          class="cursor-pointer rounded border border-neutral-300 px-4 py-2 transition hover:bg-neutral-50 duration-200"
          to="/"
        >
          back home
        </RouterLink>
      </div>

      <p
        v-if="errorMessage"
        class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 font-mono text-xs text-red-600"
      >
        {{ errorMessage }}
      </p>
      <p
        v-if="loading"
        class="mb-4 font-mono text-xs text-neutral-400"
      >
        loading…
      </p>

      <!-- images -->
      <section class="mb-8 rounded-lg border border-neutral-300">
        <header class="flex items-center justify-between border-b border-neutral-300 px-4 py-3">
          <div class="flex items-center gap-2">
            <span class="h-2.5 w-2.5 rounded-full bg-sky-500"></span>
            <h2 class="font-mono text-xs font-medium tracking-wide text-neutral-900">images</h2>
          </div>
          <span class="rounded-full border border-neutral-300 px-2 py-0.5 font-mono text-[11px] text-neutral-400">
            {{ focusedImageRows.length }}
          </span>
        </header>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse font-mono text-xs">
            <thead>
              <tr>
                <th class="space-style-basic training-data-th">id</th>
                <th class="space-style-basic training-data-th">filename</th>
                <th class="space-style-basic training-data-th">width</th>
                <th class="space-style-basic training-data-th">height</th>
                <th class="space-style-basic training-data-th">file_size</th>
                <th class="space-style-basic training-data-th">upload_time</th>
                <th class="space-style-basic training-data-th">actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in focusedImageRows"
                :key="row.id"
                class="hover:bg-neutral-50"
              >
                <td class="space-style-basic text-neutral-400">{{ row.id }}</td>
                <td class="space-style-basic text-neutral-900">{{ row.filename }}</td>
                <td class="space-style-basic training-data-td-common">{{ row.width }}</td>
                <td class="space-style-basic training-data-td-common">{{ row.height }}</td>
                <td class="space-style-basic training-data-td-common">{{ row.file_size }}</td>
                <td class="space-style-basic whitespace-nowrap text-neutral-400">{{ row.upload_time }}</td>
                <td class="space-style-basic">
                  <div class="flex gap-2">
                    <button
                      class="rounded border border-neutral-300 px-2.5 py-1 text-[11px] text-neutral-500 transition hover:border-sky-400 hover:text-sky-600"
                      @click="focusImage(row)"
                    >
                      {{ focusConfirm[row.id] && focusedImageId === row.id ? "cancel" : "focus" }}
                    </button>
                    <button
                      class="rounded border px-2.5 py-1 text-[11px] transition"
                      :class="deleteConfirm[row.id]
                        ? 'border-red-500 bg-red-500 text-white hover:bg-red-600'
                        : 'border-neutral-300 text-neutral-500 hover:border-red-300 hover:text-red-600'"
                      @click="deleteFilterRow(row.id)"
                    >
                      {{ deleteConfirm[row.id] ? "sure?" : "delete" }}
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="focusedImageRows.length === 0">
                <td colspan="7" class="px-4 py-8 text-center text-neutral-300">no rows found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- image_features -->
      <section class="mb-8 rounded-lg border border-neutral-300">
        <header class="flex items-center justify-between border-b border-neutral-300 px-4 py-3">
          <div class="flex items-center gap-2">
            <span class="h-2.5 w-2.5 rounded-full bg-violet-500"></span>
            <h2 class="font-mono text-xs font-medium tracking-wide text-neutral-900">image_features</h2>
          </div>
          <span class="rounded-full border border-neutral-300 px-2 py-0.5 font-mono text-[11px] text-neutral-400">
            {{ focusedFeatureRows.length }}
          </span>
        </header>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse font-mono text-xs">
            <thead>
              <tr>
                <th class="space-style-basic training-data-th">id</th>
                <th class="space-style-basic training-data-th">image_id</th>
                <th class="space-style-basic training-data-th">filename</th>
                <th class="space-style-basic training-data-th">brightness_mean</th>
                <th class="space-style-basic training-data-th">dynamic_range</th>
                <th class="space-style-basic training-data-th">saturation_mean</th>
                <th class="space-style-basic training-data-th">mean_rgb</th>
                <th class="space-style-basic training-data-th">unique_colors_ratio</th>
                <th class="space-style-basic training-data-th">sharpness</th>
                <th class="space-style-basic training-data-th">entropy</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in focusedFeatureRows"
                :key="row.id"
                class="hover:bg-neutral-50"
              >
                <td class="space-style-basic text-neutral-400">{{ row.id }}</td>
                <td class="space-style-basic text-neutral-400">{{ row.image_id }}</td>
                <td class="space-style-basic text-neutral-900">{{ row.filename }}</td>
                <td class="space-style-basic training-data-td-common">{{ row.brightness_mean }}</td>
                <td class="space-style-basic training-data-td-common">{{ row.dynamic_range }}</td>
                <td class="space-style-basic training-data-td-common">{{ row.saturation_mean }}</td>
                <td class="space-style-basic training-data-td-common">{{ row.mean_r }}, {{ row.mean_g }}, {{ row.mean_b }}</td>
                <td class="space-style-basic training-data-td-common">{{ row.unique_colors_ratio }}</td>
                <td class="space-style-basic training-data-td-common">{{ row.sharpness }}</td>
                <td class="space-style-basic training-data-td-common">{{ row.entropy }}</td>
              </tr>
              <tr v-if="focusedFeatureRows.length === 0">
                <td colspan="10" class="px-4 py-8 text-center text-neutral-300">no rows found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- user_filter_data -->
      <section class="rounded-lg border border-neutral-300">
        <header class="flex items-center justify-between border-b border-neutral-300 px-4 py-3">
          <div class="flex items-center gap-2">
            <span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <h2 class="font-mono text-xs font-medium tracking-wide text-neutral-900">user_filter_data</h2>
          </div>
          <span class="rounded-full border border-neutral-300 px-2 py-0.5 font-mono text-[11px] text-neutral-400">
            {{ focusedFilterRows.length }}
          </span>
        </header>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse font-mono text-xs">
            <thead>
              <tr>
                <th class="space-style-basic training-data-th">id</th>
                <th class="space-style-basic training-data-th">image_id</th>
                <th class="space-style-basic training-data-th">filename</th>
                <th class="space-style-basic training-data-th">brightness</th>
                <th class="space-style-basic training-data-th">vibrance</th>
                <th class="space-style-basic training-data-th">highlights_shadows</th>
                <th class="space-style-basic training-data-th">temperature</th>
                <th class="space-style-basic training-data-th">tint</th>
                <th class="space-style-basic training-data-th">updated_at</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in focusedFilterRows"
                :key="row.id"
                class="hover:bg-neutral-50"
              >
                <td class="space-style-basic text-neutral-400">{{ row.id }}</td>
                <td class="space-style-basic text-neutral-400">{{ row.image_id }}</td>
                <td class="space-style-basic text-neutral-900">{{ row.filename }}</td>
                <td class="space-style-basic training-data-td-common">{{ row.brightness }}</td>
                <td class="space-style-basic training-data-td-common">{{ row.vibrance }}</td>
                <td class="space-style-basic training-data-td-common">{{ row.highlights_shadows }}</td>
                <td class="space-style-basic training-data-td-common">{{ row.temperature }}</td>
                <td class="space-style-basic training-data-td-common">{{ row.tint }}</td>
                <td class="space-style-basic whitespace-nowrap text-neutral-400">{{ row.updated_at }}</td>
              </tr>
              <tr v-if="focusedFilterRows.length === 0">
                <td colspan="9" class="px-4 py-8 text-center text-neutral-300">no rows found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </main>
</template>
