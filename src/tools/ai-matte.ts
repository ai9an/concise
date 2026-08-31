type ProgressUpdate = {
  ratio: number | null
  message: string
}

type OrtModule = typeof import('onnxruntime-web/wasm')
type InferenceSession = Awaited<ReturnType<OrtModule['InferenceSession']['create']>>

const modelUrl = 'https://huggingface.co/Ko033/isnet-general-use-onnx/resolve/main/onnx/model_quantized.onnx?download=true'
const cacheName = 'concise-local-ai-v1'
const matteSize = 512
let sessionPromise: Promise<{ ort: OrtModule; session: InferenceSession }> | null = null

async function responseBuffer(response: Response, onProgress?: (update: ProgressUpdate) => void) {
  const total = Number(response.headers.get('content-length')) || 0
  if (!response.body) return response.arrayBuffer()
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let loaded = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    loaded += value.byteLength
    onProgress?.({
      ratio: total ? loaded / total : null,
      message: total ? `downloading local matte model · ${Math.round(loaded / total * 100)}%` : `downloading local matte model · ${(loaded / 1024 / 1024).toFixed(1)} MB`,
    })
  }
  const joined = new Uint8Array(loaded)
  let offset = 0
  for (const chunk of chunks) {
    joined.set(chunk, offset)
    offset += chunk.byteLength
  }
  return joined.buffer
}

async function modelBuffer(onProgress?: (update: ProgressUpdate) => void) {
  const cache = 'caches' in window ? await caches.open(cacheName) : null
  const cached = await cache?.match(modelUrl)
  if (cached) {
    onProgress?.({ ratio: 1, message: 'loading cached local matte model' })
    return cached.arrayBuffer()
  }
  const response = await fetch(modelUrl, { mode: 'cors', credentials: 'omit' })
  if (!response.ok) throw new Error(`The matte model download failed (${response.status}).`)
  const cacheWrite = cache?.put(modelUrl, response.clone()).catch(() => undefined)
  const buffer = await responseBuffer(response, onProgress)
  await cacheWrite
  return buffer
}

async function loadSession(onProgress?: (update: ProgressUpdate) => void) {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const [ort, model] = await Promise.all([
        import('onnxruntime-web/wasm'),
        modelBuffer(onProgress),
      ])
      ort.env.logLevel = 'fatal'
      ort.env.wasm.numThreads = 1
      ort.env.wasm.proxy = false
      onProgress?.({ ratio: 1, message: 'starting local matte engine · compatible WASM' })
      const session = await ort.InferenceSession.create(model, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      })
      return { ort, session }
    })().catch((error) => {
      sessionPromise = null
      throw error
    })
  }
  return sessionPromise
}

async function inputTensor(file: File, ort: OrtModule) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const canvas = document.createElement('canvas')
  canvas.width = matteSize
  canvas.height = matteSize
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas processing is unavailable in this browser.')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
  const plane = canvas.width * canvas.height
  const data = new Float32Array(plane * 3)
  for (let index = 0; index < plane; index += 1) {
    const source = index * 4
    data[index] = pixels[source] / 255 - 0.5
    data[plane + index] = pixels[source + 1] / 255 - 0.5
    data[plane * 2 + index] = pixels[source + 2] / 255 - 0.5
  }
  return { bitmap, tensor: new ort.Tensor('float32', data, [1, 3, matteSize, matteSize]) }
}

function matteCanvas(values: Float32Array | Uint8Array, width: number, height: number) {
  let minimum = Number.POSITIVE_INFINITY
  let maximum = Number.NEGATIVE_INFINITY
  for (const value of values) {
    if (value < minimum) minimum = value
    if (value > maximum) maximum = value
  }
  const range = Math.max(0.000001, maximum - minimum)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas processing is unavailable in this browser.')
  const image = context.createImageData(width, height)
  for (let index = 0; index < width * height; index += 1) {
    const alpha = Math.max(0, Math.min(255, Math.round((Number(values[index]) - minimum) / range * 255)))
    image.data[index * 4] = 255
    image.data[index * 4 + 1] = 255
    image.data[index * 4 + 2] = 255
    image.data[index * 4 + 3] = alpha
  }
  context.putImageData(image, 0, 0)
  return canvas
}

function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('The AI matte could not be encoded.')), 'image/png'))
}

export async function generateLocalMatte(file: File, onProgress?: (update: ProgressUpdate) => void) {
  const { ort, session } = await loadSession(onProgress)
  onProgress?.({ ratio: null, message: 'generating alpha matte on this device' })
  const { bitmap, tensor } = await inputTensor(file, ort)
  try {
    const output = await session.run({ [session.inputNames[0]]: tensor })
    const mask = output[session.outputNames[0]]
    const dimensions = mask.dims.map(Number)
    const height = dimensions.at(-2) || matteSize
    const width = dimensions.at(-1) || matteSize
    const maskCanvas = matteCanvas(mask.data as Float32Array | Uint8Array, width, height)
    const outputCanvas = document.createElement('canvas')
    outputCanvas.width = bitmap.width
    outputCanvas.height = bitmap.height
    const context = outputCanvas.getContext('2d')
    if (!context) throw new Error('Canvas processing is unavailable in this browser.')
    context.drawImage(bitmap, 0, 0)
    context.globalCompositeOperation = 'destination-in'
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(maskCanvas, 0, 0, outputCanvas.width, outputCanvas.height)
    context.globalCompositeOperation = 'source-over'
    const blob = await canvasBlob(outputCanvas)
    onProgress?.({ ratio: 1, message: 'local AI matte ready' })
    return blob
  } finally {
    bitmap.close()
    tensor.dispose()
  }
}
