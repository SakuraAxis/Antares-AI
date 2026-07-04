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