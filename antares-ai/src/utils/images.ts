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

export function analyzeCanvasImage(canvas: HTMLCanvasElement | null) {
  if (!canvas) {
    console.log('No canvas image to analyze');
    return;
  }

  canvas.toBlob(async (blob) => {
    if (!blob) {
      console.log('Failed to generate blob from canvas');
      return;
    }

    const formData = new FormData();
    // 'file' must correspond to the parameter name in the backend FastAPI
    formData.append('file', blob, `canvas-image-${Date.now()}.png`);

    try {
      console.log('Sending images to backend analysis ...');

      const response = await fetch('http://localhost:8000/training-images', {
        method: 'POST',
        body: formData, // Do not manually set the Content-Type; let the browser automatically add the multipart boundary
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
    }
  }, 'image/png');
}
