import { API_BASE_URL } from "./api";

export function saveCanvasAsImage(
  canvas: HTMLCanvasElement | null,
  filename = `antares-edited-${Date.now()}.png`
) {
  if (!canvas) {
    console.log('No image to save');
    return;
  }

  canvas.toBlob((blob) => {
    if (!blob) {
      console.log('Failed to save image');
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

export interface AnalyzeImageResult {
  status: string;
  image_id: number;
  filename: string;
  size: number;
  dimensions: { width: number; height: number };
  features: Record<string, unknown>;
}

// Upload the ORIGINAL file for feature analysis.
export async function analyzeOriginalImage(
  file: File
): Promise<AnalyzeImageResult | null> {
  const formData = new FormData();
  formData.append('file', file, file.name);

  try {
    console.log('Sending original image to backend analysis ...');

    const response = await fetch(`${API_BASE_URL}/training-images`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ! Status code : ${response.status}, Content : ${errorText}`);
    }

    const aiData = await response.json();
    console.log('Analysis successful :', aiData);
    return aiData;
  } catch (error) {
    console.error('Image transmission or parsing failed :', error);
    return null;
  }
}

export interface FilterDataPayload {
  brightness: number;
  vibrance: number;
  highlights_shadows: number;
  temperature: number;
  tint: number;
  duotone: number;
  duotone_dark: string;
  duotone_light: string;
}

export interface PredictFilterDataResult {
  status: string;
  image_id: number | null;
  prediction: FilterDataPayload & {
    duotone_dark_l: number;
    duotone_dark_a: number;
    duotone_dark_b: number;
    duotone_light_l: number;
    duotone_light_a: number;
    duotone_light_b: number;
  };
}

export async function saveFilterData(
  imageId: number,
  filterData: FilterDataPayload
) {
  try {
    console.log(`Saving filter data for image ${imageId} ...`);

    const response = await fetch(
      `${API_BASE_URL}/images/${imageId}/filter-data`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filterData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ! Status code : ${response.status}, Content : ${errorText}`);
    }

    const data = await response.json();
    console.log('Filter data saved :', data);
    return data;
  } catch (error) {
    console.error('Filter data transmission failed :', error);
    return null;
  }
}

export async function predictFilterData(
  file: File
): Promise<PredictFilterDataResult | null> {
  const formData = new FormData();
  formData.append('file', file, file.name);

  try {
    console.log('Sending original image for prediction ...');

    const response = await fetch(`${API_BASE_URL}/predict-filter-data`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ! Status code : ${response.status}, Content : ${errorText}`);
    }

    const data = await response.json();
    console.log('Prediction successful :', data);
    return data;
  } catch (error) {
    console.error('Prediction failed :', error);
    return null;
  }
}
