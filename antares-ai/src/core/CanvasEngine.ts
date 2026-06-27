export class CanvasEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("Cannot get 2D context")
    }

    this.canvas = canvas
    this.ctx = ctx
  }

  drawImage(image: HTMLImageElement) {
    this.canvas.width = image.width
    this.canvas.height = image.height

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.drawImage(image, 0, 0)
  }

  getImageData(): ImageData {
    return this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    )
  }

  putImageData(imageData: ImageData) {
    this.ctx.putImageData(imageData, 0, 0)
  }
}