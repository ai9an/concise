import { fetchFile } from '@ffmpeg/util'
import { getFfmpeg } from '../lib/ffmpeg'
import type { CropRect, VideoFormat } from '../types'

export const videoFormats: { value: VideoFormat; label: string; mime: string }[] = [
  { value: 'mp4', label: 'MP4', mime: 'video/mp4' },
  { value: 'webm', label: 'WebM', mime: 'video/webm' },
  { value: 'mov', label: 'MOV', mime: 'video/quicktime' },
  { value: 'mkv', label: 'MKV', mime: 'video/x-matroska' },
  { value: 'avi', label: 'AVI', mime: 'video/x-msvideo' },
  { value: 'gif', label: 'GIF', mime: 'image/gif' },
]

const inputExtensionPattern = /\.([a-z0-9]+)$/i

function boundedProgress(value: number) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))
}

export async function createVideoPreview(file: File, onProgress?: (progress: number) => void) {
  const ffmpeg = await getFfmpeg((value) => onProgress?.(boundedProgress(value)))
  const token = crypto.randomUUID()
  const inputExtension = file.name.match(inputExtensionPattern)?.[1]?.toLowerCase() || 'video'
  const inputName = `preview-input-${token}.${inputExtension}`
  const outputName = `preview-output-${token}.mp4`

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file))
    const exitCode = await ffmpeg.exec([
      '-i', inputName,
      '-vf', 'fps=15,scale=854:480:force_original_aspect_ratio=decrease:force_divisible_by=2',
      '-an',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '28',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-y', outputName,
    ])
    if (exitCode !== 0) throw new Error('The lightweight preview could not be created.')
    const data = await ffmpeg.readFile(outputName)
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data)
    return new Blob([bytes], { type: 'video/mp4' })
  } finally {
    await Promise.allSettled([ffmpeg.deleteFile(inputName), ffmpeg.deleteFile(outputName)])
  }
}

export function inferVideoFormat(name: string): VideoFormat {
  const extension = name.match(inputExtensionPattern)?.[1]?.toLowerCase()
  return videoFormats.some(({ value }) => value === extension) ? extension as VideoFormat : 'mp4'
}

function codecArguments(format: VideoFormat) {
  if (format === 'webm') {
    return ['-c:v', 'libvpx-vp9', '-deadline', 'realtime', '-cpu-used', '8', '-crf', '32', '-b:v', '0', '-c:a', 'libopus', '-b:a', '128k']
  }
  if (format === 'avi') {
    return ['-c:v', 'mpeg4', '-q:v', '5', '-c:a', 'libmp3lame', '-b:a', '160k']
  }
  if (format === 'gif') return ['-an', '-loop', '0']
  return ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', '-c:a', 'aac', '-b:a', '160k', ...(format === 'mp4' || format === 'mov' ? ['-movflags', '+faststart'] : [])]
}

function normalizedCrop(crop: CropRect, width: number, height: number, format: VideoFormat) {
  const even = (value: number) => Math.max(2, Math.floor(value / 2) * 2)
  const cropWidth = format === 'gif' ? Math.max(1, Math.round(crop.width)) : even(crop.width)
  const cropHeight = format === 'gif' ? Math.max(1, Math.round(crop.height)) : even(crop.height)
  return {
    x: Math.min(Math.max(0, Math.round(crop.x)), width - cropWidth),
    y: Math.min(Math.max(0, Math.round(crop.y)), height - cropHeight),
    width: Math.min(cropWidth, width),
    height: Math.min(cropHeight, height),
  }
}

type TrimVideoOptions = {
  file: File
  start: number
  end: number
  crop: CropRect
  sourceWidth: number
  sourceHeight: number
  format: VideoFormat
  onProgress?: (progress: number) => void
}

export async function trimVideo({ file, start, end, crop, sourceWidth, sourceHeight, format, onProgress }: TrimVideoOptions) {
  const ffmpeg = await getFfmpeg((value) => onProgress?.(boundedProgress(value)))
  const token = crypto.randomUUID()
  const inputExtension = file.name.match(inputExtensionPattern)?.[1]?.toLowerCase() || 'video'
  const inputName = `input-${token}.${inputExtension}`
  const outputName = `output-${token}.${format}`
  const bounds = normalizedCrop(crop, sourceWidth, sourceHeight, format)
  const isFullFrame = bounds.x === 0 && bounds.y === 0 && bounds.width === sourceWidth && bounds.height === sourceHeight
  const filters = []

  if (!isFullFrame) filters.push(`crop=${bounds.width}:${bounds.height}:${bounds.x}:${bounds.y}`)
  if (format === 'gif') filters.push('fps=15', "scale='min(iw,960)':-2:flags=lanczos")

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file))
    const exitCode = await ffmpeg.exec([
      '-ss', start.toFixed(3),
      '-i', inputName,
      '-t', Math.max(0.05, end - start).toFixed(3),
      ...(filters.length ? ['-vf', filters.join(',')] : []),
      ...codecArguments(format),
      '-y', outputName,
    ])
    if (exitCode !== 0) throw new Error('FFmpeg could not encode this selection. Try MP4 or WebM output.')
    const data = await ffmpeg.readFile(outputName)
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data)
    const mime = videoFormats.find(({ value }) => value === format)?.mime ?? 'application/octet-stream'
    return new Blob([bytes], { type: mime })
  } finally {
    await Promise.allSettled([ffmpeg.deleteFile(inputName), ffmpeg.deleteFile(outputName)])
  }
}
