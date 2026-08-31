import { FFmpeg } from '@ffmpeg/ffmpeg'

let instance: FFmpeg | null = null
let loading: Promise<FFmpeg> | null = null
let wasmBlobURL: string | null = null
let progressHandler: ((progress: number) => void) | undefined

const wasmParts = ['ffmpeg-core.wasm.part-0', 'ffmpeg-core.wasm.part-1']

async function getWasmBlobURL(base: URL) {
  if (wasmBlobURL) return wasmBlobURL

  const responses = await Promise.all(wasmParts.map((part) => fetch(new URL(part, base))))
  const failedPart = responses.findIndex((response) => !response.ok)
  if (failedPart !== -1) {
    throw new Error(`The local media engine could not load WASM chunk ${failedPart + 1}. Reload the page and try again.`)
  }

  const chunks = await Promise.all(responses.map((response) => response.blob()))
  wasmBlobURL = URL.createObjectURL(new Blob(chunks, { type: 'application/wasm' }))
  return wasmBlobURL
}

export function isMultithreadedFfmpegAvailable() {
  return window.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined'
}

export function getFfmpeg(onProgress?: (progress: number) => void) {
  progressHandler = onProgress
  if (instance?.loaded) return Promise.resolve(instance)
  if (loading) return loading

  loading = (async () => {
    if (!isMultithreadedFfmpegAvailable()) {
      throw new Error('Fast media tools need cross-origin isolation. Open the deployed Cloudflare Pages build or use the local preview server.')
    }

    const ffmpeg = new FFmpeg()
    ffmpeg.on('progress', ({ progress }) => progressHandler?.(progress))
    const base = new URL('/ffmpeg-core/', window.location.origin)
    const wasmURL = await getWasmBlobURL(base)
    await ffmpeg.load({
      coreURL: new URL('ffmpeg-core.js', base).toString(),
      wasmURL,
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
