import type { FFmpeg } from '@ffmpeg/ffmpeg'

let instance: FFmpeg | null = null
let loading: Promise<FFmpeg> | null = null

export function isMultithreadedFfmpegAvailable() {
  return window.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined'
}

export function getFfmpeg(onProgress?: (progress: number) => void) {
  if (instance?.loaded) return Promise.resolve(instance)
  if (loading) return loading

  loading = (async () => {
    if (!isMultithreadedFfmpegAvailable()) {
      throw new Error('Fast media tools need cross-origin isolation. Open the deployed Cloudflare Pages build or use the local preview server.')
    }

    const { FFmpeg } = await import('@ffmpeg/ffmpeg')
    const ffmpeg = new FFmpeg()
    ffmpeg.on('progress', ({ progress }) => onProgress?.(progress))
    const base = new URL('/ffmpeg-core/', window.location.origin)
    await ffmpeg.load({
      coreURL: new URL('ffmpeg-core.js', base).toString(),
      wasmURL: new URL('ffmpeg-core.wasm', base).toString(),
      workerURL: new URL('ffmpeg-core.worker.js', base).toString(),
    })
    instance = ffmpeg
    return ffmpeg
  })().catch((error) => {
    loading = null
    throw error
  })

  return loading
}
