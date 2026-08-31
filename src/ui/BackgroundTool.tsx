import { useEffect, useRef, useState } from 'react'
import { edgeSample, pixelColor, removeConnectedBackground, type Rgb } from '../tools/background'
import { generateLocalMatte } from '../tools/ai-matte'

type SourceImage = {
  bitmap: ImageBitmap
  file: File
}

type BackgroundToolProps = {
  initialFile?: File
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('This browser could not create the PNG.')), 'image/png')
  })
}

export default function BackgroundTool({ initialFile }: BackgroundToolProps) {
  const [source, setSource] = useState<SourceImage | null>(null)
  const [sample, setSample] = useState<Rgb>({ r: 255, g: 255, b: 255 })
  const [tolerance, setTolerance] = useState(44)
  const [feather, setFeather] = useState(18)
  const [greenScreen, setGreenScreen] = useState(false)
  const [precise, setPrecise] = useState(false)
  const [matte, setMatte] = useState<{ blob: Blob; bitmap: ImageBitmap } | null>(null)
  const [matteProgress, setMatteProgress] = useState<number | null>(null)
  const [status, setStatus] = useState('open a PNG, JPEG, or WebP')
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewSource = useRef<ImageData | null>(null)
  const initialName = useRef('')

  const openFile = async (file: File) => {
    setError('')
    setStatus('decoding locally')
    setPrecise(false)
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      setMatte(null)
      setSource({ bitmap, file })
      setStatus('background sampled from the image edges')
    } catch {
      setError('That image could not be decoded. Try PNG, JPEG, or WebP.')
      setStatus('image not opened')
    }
  }

  useEffect(() => {
    if (!initialFile || initialFile === source?.file || initialFile.name === initialName.current) return
    initialName.current = initialFile.name
    void openFile(initialFile)
  }, [initialFile, source?.file])

  useEffect(() => () => source?.bitmap.close(), [source])

  useEffect(() => () => matte?.bitmap.close(), [matte])

  useEffect(() => {
    if (!source || !canvasRef.current) return
    const canvas = canvasRef.current
    const scale = Math.min(1, 1100 / source.bitmap.width, 720 / source.bitmap.height)
    canvas.width = Math.max(1, Math.round(source.bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(source.bitmap.height * scale))
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(precise && matte ? matte.bitmap : source.bitmap, 0, 0, canvas.width, canvas.height)
    previewSource.current = context.getImageData(0, 0, canvas.width, canvas.height)
    setSample(edgeSample(previewSource.current))
  }, [source, precise, matte])

  useEffect(() => {
    const canvas = canvasRef.current
    const original = previewSource.current
    if (!canvas || !original || precise) return
    const frame = requestAnimationFrame(() => {
      const context = canvas.getContext('2d')
      context?.putImageData(removeConnectedBackground(original, sample, tolerance, feather, greenScreen), 0, 0)
    })
    return () => cancelAnimationFrame(frame)
  }, [sample, tolerance, feather, greenScreen, source, precise])

  useEffect(() => {
    if (!precise || !matte || !canvasRef.current) return
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(matte.bitmap, 0, 0, canvas.width, canvas.height)
    if (greenScreen) {
      context.globalCompositeOperation = 'destination-over'
      context.fillStyle = '#00ff00'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.globalCompositeOperation = 'source-over'
    }
  }, [greenScreen, matte, precise])

  const generateMatte = async () => {
    if (!source) return
    setWorking(true)
    setError('')
    setMatteProgress(0)
    setStatus('preparing the local AI matte model')
    try {
      const blob = await generateLocalMatte(source.file, ({ ratio, message }) => {
        setMatteProgress(ratio)
        setStatus(message)
      })
      const bitmap = await createImageBitmap(blob)
      setMatte({ blob, bitmap })
      setStatus('AI matte ready · image processed on this device')
    } catch (cause) {
      setPrecise(false)
      setError(cause instanceof Error ? `${cause.message} You can keep using edge removal.` : 'The local AI matte could not be generated. You can keep using edge removal.')
      setStatus('AI matte stopped · image was not uploaded')
    } finally {
      setWorking(false)
    }
  }

  const changePrecise = (enabled: boolean) => {
    setPrecise(enabled)
    if (enabled && source && !matte) void generateMatte()
    if (!enabled) setStatus('edge-connected removal active · local only')
  }

  const resampleEdges = () => {
    if (!previewSource.current) return
    setSample(edgeSample(previewSource.current))
    setStatus('background resampled from the image edges')
  }

  const sampleCanvas = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const original = previewSource.current
    if (!canvas || !original) return
    const bounds = canvas.getBoundingClientRect()
    setSample(pixelColor(
      original,
      (event.clientX - bounds.left) * original.width / bounds.width,
      (event.clientY - bounds.top) * original.height / bounds.height,
    ))
    setStatus('background sampled from the selected pixel')
  }

  const exportImage = async () => {
    if (!source) return
    setWorking(true)
    setError('')
    setStatus('rendering the full-resolution cutout locally')
    try {
      const canvas = document.createElement('canvas')
      canvas.width = source.bitmap.width
      canvas.height = source.bitmap.height
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) throw new Error('Canvas processing is unavailable in this browser.')
      context.drawImage(precise && matte ? matte.bitmap : source.bitmap, 0, 0)
      if (precise && matte) {
        if (greenScreen) {
          context.globalCompositeOperation = 'destination-over'
          context.fillStyle = '#00ff00'
          context.fillRect(0, 0, canvas.width, canvas.height)
          context.globalCompositeOperation = 'source-over'
        }
      } else {
        const original = context.getImageData(0, 0, canvas.width, canvas.height)
        context.putImageData(removeConnectedBackground(original, sample, tolerance, feather, greenScreen), 0, 0)
      }
      const blob = await canvasBlob(canvas)
      const stem = source.file.name.replace(/\.[^/.]+$/, '') || 'concise-cutout'
      saveBlob(blob, `${stem}-${greenScreen ? 'green-screen' : 'cutout'}.png`)
      setStatus(`downloaded locally · ${(blob.size / 1024).toFixed(0)} KB`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The cutout could not be exported.')
      setStatus('export stopped')
    } finally {
      setWorking(false)
    }
  }

  return (
    <section className="utility-workspace background-workspace">
      <div className="utility-heading">
        <h1>background.</h1>
        <p>Remove a plain background instantly, or opt into a more precise AI matte that runs on your device.</p>
      </div>

      <div className="utility-split">
        <div className="utility-preview background-preview">
          {source ? (
            <>
              <div className="background-canvas-stage">
                <canvas ref={canvasRef} onPointerDown={sampleCanvas} aria-label="Background removal preview. Select a background pixel to sample it." />
              </div>
              <p>select a background pixel to resample</p>
            </>
          ) : (
            <label className="utility-open">
              <span className="utility-command"><b>&gt;</b> open image</span>
              <span>PNG · JPEG · WebP · never uploaded</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => {
                const next = event.target.files?.[0]
                if (next) void openFile(next)
              }} />
            </label>
          )}
        </div>

        <aside className="utility-controls">
          {source ? (
            <label className="inline-file-action">
              <span>&gt; replace image</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => {
                const next = event.target.files?.[0]
                if (next) void openFile(next)
              }} />
            </label>
          ) : null}
          <fieldset>
            <legend>output</legend>
            <div className="mode-line">
              <button type="button" className={!greenScreen ? 'is-active' : ''} onClick={() => setGreenScreen(false)}>transparent PNG</button>
              <button type="button" className={greenScreen ? 'is-active' : ''} onClick={() => setGreenScreen(true)}>green screen</button>
            </div>
          </fieldset>
          <div className={precise ? 'precise-mode is-active' : 'precise-mode'}>
            <label className="check-line precise-check">
              <input type="checkbox" checked={precise} disabled={!source || working} onChange={(event) => changePrecise(event.target.checked)} />
              <span>use precise local AI matte</span>
            </label>
            <p>Off by default. The first use downloads a ~46 MB model from Hugging Face, then generates the matte in this browser. Your image is never sent to Hugging Face, Concise, or an API.</p>
            {precise && !matte && !working ? <button type="button" className="secondary-command" onClick={generateMatte}>generate matte</button> : null}
            {working && precise ? <progress max="1" value={matteProgress ?? undefined} aria-label="Local AI matte progress" /> : null}
          </div>
          <label className="range-field">
            <span>colour tolerance · {tolerance}</span>
            <input type="range" min="4" max="160" value={tolerance} disabled={precise} onChange={(event) => setTolerance(Number(event.target.value))} />
          </label>
          <label className="range-field">
            <span>edge feather · {feather}</span>
            <input type="range" min="0" max="80" value={feather} disabled={precise} onChange={(event) => setFeather(Number(event.target.value))} />
          </label>
          <div className={precise ? 'sample-line is-muted' : 'sample-line'}>
            <span className={sample.transparent ? 'sample-chip is-transparent' : 'sample-chip'} style={{ backgroundColor: sample.transparent ? undefined : `rgb(${sample.r} ${sample.g} ${sample.b})` }} aria-hidden="true" />
            <span>{sample.transparent ? 'sample · existing transparency' : `sample · ${sample.r}, ${sample.g}, ${sample.b}`}</span>
            <button type="button" onClick={resampleEdges} disabled={precise}>auto edge</button>
          </div>
          <p className="utility-note">Edge mode is fastest for studio, white, or green backgrounds. AI mode handles hair, products, and uneven scenes better, but transparent objects and very fine mesh can still need manual cleanup.</p>
          <button className="export-command utility-export" type="button" onClick={exportImage} disabled={!source || working}>
            <span aria-hidden="true">&gt;</span> {working ? 'working' : `export ${greenScreen ? 'green screen' : 'cutout'}`}
            <span className="cursor" aria-hidden="true" />
          </button>
          <p className={error ? 'utility-status is-error' : 'utility-status'} aria-live="polite">{error || status}</p>
        </aside>
      </div>
    </section>
  )
}
