import type { CropRect, ImageMime } from '../types'

type RenderOptions = {
  bitmap: ImageBitmap
  crop: CropRect
  width: number
  height: number
  mime: ImageMime
  quality: number
}

const htmlCanvasBlob = (canvas: HTMLCanvasElement, mime: ImageMime, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('This browser could not encode the requested image.'))),
      mime,
      quality,
    )
  })

export async function renderImage({ bitmap, crop, width, height, mime, quality }: RenderOptions) {
  const outputWidth = Math.max(1, Math.round(width))
  const outputHeight = Math.max(1, Math.round(height))

  if ('OffscreenCanvas' in window) {
    const canvas = new OffscreenCanvas(outputWidth, outputHeight)
    const context = canvas.getContext('2d', { alpha: mime === 'image/png' })
    if (!context) throw new Error('Canvas rendering is unavailable in this browser.')
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(bitmap, crop.x, crop.y, crop.width, crop.height, 0, 0, outputWidth, outputHeight)
    return canvas.convertToBlob({ type: mime, quality })
  }

  const canvas = document.createElement('canvas')
  canvas.width = outputWidth
  canvas.height = outputHeight
  const context = canvas.getContext('2d', { alpha: mime === 'image/png' })
  if (!context) throw new Error('Canvas rendering is unavailable in this browser.')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(bitmap, crop.x, crop.y, crop.width, crop.height, 0, 0, outputWidth, outputHeight)
  return htmlCanvasBlob(canvas, mime, quality)
}

export function outputExtension(mime: ImageMime) {
  return mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1]
}
