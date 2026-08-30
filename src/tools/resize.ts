import type { CropRect, ImageMime } from '../types'
import { renderImage } from './crop'

type TargetOptions = {
  bitmap: ImageBitmap
  crop: CropRect
  mime: ImageMime
  targetBytes: number
  onProgress?: (progress: number) => void
}

export type TargetResult = {
  blob: Blob
  width: number
  height: number
  quality: number
}

export async function resizeToTarget({ bitmap, crop, mime, targetBytes, onProgress }: TargetOptions): Promise<TargetResult> {
  const lossy = mime !== 'image/png'
  let width = Math.round(crop.width)
  let height = Math.round(crop.height)
  let closest: TargetResult | null = null
  let smallest: TargetResult | null = null
  const dimensionRounds = 7
  const qualitySteps = lossy ? 8 : 1
  const totalSteps = dimensionRounds * qualitySteps
  let completed = 0

  for (let round = 0; round < dimensionRounds; round += 1) {
    let low = 0.12
    let high = 0.96
    let last: TargetResult | null = null

    for (let step = 0; step < qualitySteps; step += 1) {
      const quality = lossy ? (low + high) / 2 : 1
      const blob = await renderImage({ bitmap, crop, width, height, mime, quality })
      const result = { blob, width, height, quality }
      last = result

      if (!smallest || blob.size < smallest.blob.size) smallest = result
      if (blob.size <= targetBytes && (!closest || blob.size > closest.blob.size)) closest = result

      if (lossy) {
        if (blob.size <= targetBytes) low = quality
        else high = quality
      }

      completed += 1
      onProgress?.(completed / totalSteps)
    }

    if (closest && closest.width === width && closest.blob.size >= targetBytes * 0.82) return closest
    if (!last) break

    const scale = Math.min(0.9, Math.sqrt(targetBytes / last.blob.size) * 0.94)
    width = Math.max(1, Math.floor(width * scale))
    height = Math.max(1, Math.floor(height * scale))
  }

  onProgress?.(1)
  return closest ?? smallest ?? {
    blob: await renderImage({ bitmap, crop, width: 1, height: 1, mime, quality: 0.12 }),
    width: 1,
    height: 1,
    quality: 0.12,
  }
}
