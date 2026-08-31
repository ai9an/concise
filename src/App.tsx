import { useEffect, useMemo, useState } from 'react'
import asciiLogo from '../assets/ascii-logo.png'
import type { CropRect, ImageAsset, ImageMime, Settings, ToolId } from './types'
import { outputExtension, renderImage } from './tools/crop'
import { formatSupport } from './tools/convert'
import { resizeToTarget } from './tools/resize'
import { trimSupport } from './tools/trim'
import { CropCanvas } from './ui/CropCanvas'
import { Dropzone } from './ui/Dropzone'
import { SettingsPanel } from './ui/SettingsPanel'

const settingsKey = 'concise:settings'
const themeColors: Record<Settings['theme'], string> = {
  dark: '#000000',
  graphite: '#171816',
  ember: '#190b05',
  midnight: '#071018',
  forest: '#07120d',
  plum: '#140b18',
  light: '#f0eee7',
  paper: '#f4ead8',
}
const defaultSettings: Settings = {
  version: 1,
  theme: 'dark',
  defaultFormat: 'image/jpeg',
  quality: 0.88,
  rememberTool: true,
  lastTool: 'crop',
}

const aspectOptions = [
  { label: 'free', value: null },
  { label: 'original', value: 'original' },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:9', value: 16 / 9 },
] as const

const toolCopy: Record<ToolId, string> = {
  crop: 'crop',
  resize: 'resize',
  trim: 'trim',
  convert: 'convert',
}

function readSettings(): Settings {
  try {
    const value = JSON.parse(localStorage.getItem(settingsKey) ?? '') as Partial<Settings>
    if (value.version === 1) return { ...defaultSettings, ...value }
  } catch {
    return defaultSettings
  }
  return defaultSettings
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

function fitAspect(width: number, height: number, aspect: number): CropRect {
  let cropWidth = width
  let cropHeight = cropWidth / aspect
  if (cropHeight > height) {
    cropHeight = height
    cropWidth = cropHeight * aspect
  }
  return {
    x: (width - cropWidth) / 2,
    y: (height - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
  }
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function App() {
  const [settings, setSettings] = useState<Settings>(() => readSettings())
  const [activeTool, setActiveTool] = useState<ToolId>(() => {
    const stored = readSettings()
    return stored.rememberTool ? stored.lastTool : 'crop'
  })
  const [file, setFile] = useState<File | null>(null)
  const [asset, setAsset] = useState<ImageAsset | null>(null)
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, width: 1, height: 1 })
  const [aspect, setAspect] = useState<number | null>(null)
  const [aspectLabel, setAspectLabel] = useState('free')
  const [resizeMode, setResizeMode] = useState<'exact' | 'target'>('exact')
  const [exactWidth, setExactWidth] = useState(1)
  const [exactHeight, setExactHeight] = useState(1)
  const [aspectLocked, setAspectLocked] = useState(true)
  const [targetKb, setTargetKb] = useState(500)
  const [format, setFormat] = useState<ImageMime>(() => readSettings().defaultFormat)
  const [quality, setQuality] = useState(() => readSettings().quality)
  const [status, setStatus] = useState('waiting for a local file')
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [lastOutput, setLastOutput] = useState<{ size: number; width: number; height: number } | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', themeColors[settings.theme] ?? themeColors.dark)
    localStorage.setItem(settingsKey, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    if (!settings.rememberTool) return
    setSettings((current) => (current.lastTool === activeTool ? current : { ...current, lastTool: activeTool }))
  }, [activeTool, settings.rememberTool])

  useEffect(() => () => {
    if (asset) {
      asset.bitmap.close()
      URL.revokeObjectURL(asset.objectUrl)
    }
  }, [asset])

  const sourceAspect = crop.width / crop.height
  const roundedCrop = useMemo(() => ({
    x: Math.round(crop.x),
    y: Math.round(crop.y),
    width: Math.round(crop.width),
    height: Math.round(crop.height),
  }), [crop])

  const chooseTool = (tool: ToolId) => {
    setActiveTool(tool)
    setError('')
    setLastOutput(null)
  }

  const handleFile = async (nextFile: File) => {
    setError('')
    setLastOutput(null)
    setFile(nextFile)
    setStatus('reading the file locally')

    if (!nextFile.type.startsWith('image/')) {
      setAsset(null)
      const tool: ToolId = nextFile.type.startsWith('video/') ? 'trim' : 'convert'
      chooseTool(tool)
      setStatus('file held locally · media engine is next in the queue')
      return
    }

    try {
      const [bitmap, objectUrl] = await Promise.all([
        createImageBitmap(nextFile, { imageOrientation: 'from-image' }),
        Promise.resolve(URL.createObjectURL(nextFile)),
      ])
      const nextAsset = { file: nextFile, bitmap, objectUrl, width: bitmap.width, height: bitmap.height }
      const fullCrop = { x: 0, y: 0, width: bitmap.width, height: bitmap.height }
      setAsset(nextAsset)
      setCrop(fullCrop)
      setAspect(null)
      setAspectLabel('free')
      setExactWidth(bitmap.width)
      setExactHeight(bitmap.height)
      setFormat(settings.defaultFormat)
      setQuality(settings.quality)
      if (activeTool === 'trim' || activeTool === 'convert') chooseTool('crop')
      setStatus('file ready · nothing uploaded')
    } catch {
      setAsset(null)
      setError('That image could not be decoded here. Try converting it to JPEG, PNG, or WebP first.')
      setStatus('file could not be opened')
    }
  }

  const changeAspect = (label: string, value: number | 'original' | null) => {
    if (!asset) return
    setAspectLabel(label)
    if (value === null) {
      setAspect(null)
      return
    }
    const ratio = value === 'original' ? asset.width / asset.height : value
    const nextCrop = fitAspect(asset.width, asset.height, ratio)
    setAspect(ratio)
    setCrop(nextCrop)
    setExactWidth(Math.round(nextCrop.width))
    setExactHeight(Math.round(nextCrop.height))
  }

  const changeCropField = (key: keyof CropRect, value: number) => {
    if (!asset || Number.isNaN(value)) return
    setCrop((current) => {
      const next = { ...current, [key]: Math.max(key === 'width' || key === 'height' ? 1 : 0, value) }
      next.width = Math.min(next.width, asset.width)
      next.height = Math.min(next.height, asset.height)
      next.x = Math.min(next.x, asset.width - next.width)
      next.y = Math.min(next.y, asset.height - next.height)
      return next
    })
  }

  const changeExactWidth = (value: number) => {
    const width = Math.max(1, value)
    setExactWidth(width)
    if (aspectLocked) setExactHeight(Math.max(1, Math.round(width / sourceAspect)))
  }

  const changeExactHeight = (value: number) => {
    const height = Math.max(1, value)
    setExactHeight(height)
    if (aspectLocked) setExactWidth(Math.max(1, Math.round(height * sourceAspect)))
  }

  const exportImage = async () => {
    if (!asset) return
    setExporting(true)
    setError('')
    setProgress(0.04)
    setLastOutput(null)
    setStatus('rendering in this browser')

    try {
      let blob: Blob
      let width: number
      let height: number

      if (activeTool === 'resize' && resizeMode === 'target') {
        const result = await resizeToTarget({
          bitmap: asset.bitmap,
          crop,
          mime: format,
          targetBytes: Math.max(1, targetKb) * 1024,
          onProgress: setProgress,
        })
        blob = result.blob
        width = result.width
        height = result.height
      } else {
        width = activeTool === 'resize' ? exactWidth : Math.round(crop.width)
        height = activeTool === 'resize' ? exactHeight : Math.round(crop.height)
        blob = await renderImage({ bitmap: asset.bitmap, crop, width, height, mime: format, quality })
        setProgress(1)
      }

      const stem = asset.file.name.replace(/\.[^/.]+$/, '') || 'concise-output'
      downloadBlob(blob, `${stem}-${activeTool}.${outputExtension(format)}`)
      setLastOutput({ size: blob.size, width, height })
      setStatus('export complete · downloaded locally')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The export failed in this browser. Try a smaller output.')
      setStatus('export stopped')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="top-line">
        <button className="wordmark" type="button" onClick={() => {
          setFile(null)
          setAsset(null)
          setStatus('waiting for a local file')
          setError('')
        }} aria-label="Return to open file — Concise">
          <img className="wordmark-logo" src={asciiLogo} alt="" />
        </button>
        <nav className="tool-nav" aria-label="File tools">
          {(Object.keys(toolCopy) as ToolId[]).map((tool, index) => (
            <button
              key={tool}
              type="button"
              className={activeTool === tool ? 'is-active' : ''}
              style={{ '--depth': index } as React.CSSProperties}
              onClick={() => chooseTool(tool)}
              aria-current={activeTool === tool ? 'page' : undefined}
            >
              {toolCopy[tool]}
            </button>
          ))}
        </nav>
        <SettingsPanel settings={settings} onChange={setSettings} />
      </header>

      <main>
        {!file ? (
          <div className="landing">
            <div className="depth-copy" aria-hidden="true">
              <span>crop precisely</span>
              <span>resize to the byte</span>
              <span>convert without sending</span>
            </div>
            <h1>your file.<br />your browser.</h1>
            <Dropzone onFile={handleFile} />
            <div className="trust-line">
              <span>local processing</span>
              <span>network after load: optional</span>
              <span>file uploads: none</span>
            </div>
          </div>
        ) : (
          <div className="workspace">
            <section className="file-line" aria-label="Current file">
              <button type="button" onClick={() => setFile(null)}>&gt; replace</button>
              <span className="file-name" title={file.name}>{file.name}</span>
              <span>{formatBytes(file.size)}</span>
              <span>{asset ? `${asset.width} × ${asset.height}` : file.type || 'unknown type'}</span>
              <span className="local-mark">local only</span>
            </section>

            {asset && (activeTool === 'crop' || activeTool === 'resize') ? (
              <div className="editor-grid">
                <section className="preview-plane">
                  <CropCanvas asset={asset} crop={crop} aspect={aspect} onCropChange={setCrop} />
                  <div className="preview-readout">
                    <span>x {roundedCrop.x}</span>
                    <span>y {roundedCrop.y}</span>
                    <span>w {roundedCrop.width}</span>
                    <span>h {roundedCrop.height}</span>
                  </div>
                  <button className="mobile-export" type="button" onClick={exportImage} disabled={exporting}>
                    <span aria-hidden="true">&gt;</span> {exporting ? `${Math.round(progress * 100)}%` : `export ${activeTool}`}
                  </button>
                </section>

                <aside className="control-rail">
                  {activeTool === 'crop' ? (
                    <>
                      <div className="control-heading">
                        <h1>crop.</h1>
                        <p>Drag the amber corners or set exact bounds.</p>
                      </div>
                      <fieldset>
                        <legend>aspect</legend>
                        <div className="option-line">
                          {aspectOptions.map((option) => (
                            <button key={option.label} type="button" className={aspectLabel === option.label ? 'is-active' : ''} onClick={() => changeAspect(option.label, option.value)}>
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </fieldset>
                      <div className="field-grid four">
                        {(['x', 'y', 'width', 'height'] as const).map((key) => (
                          <label key={key}>
                            <span>{key === 'width' ? 'w' : key === 'height' ? 'h' : key}</span>
                            <input type="number" min="0" value={roundedCrop[key]} onChange={(event) => changeCropField(key, Number(event.target.value))} />
                          </label>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="control-heading">
                        <h1>resize.</h1>
                        <p>Set the dimensions or make a strict size ceiling.</p>
                      </div>
                      <div className="mode-line" role="group" aria-label="Resize mode">
                        <button type="button" className={resizeMode === 'exact' ? 'is-active' : ''} onClick={() => setResizeMode('exact')}>exact pixels</button>
                        <button type="button" className={resizeMode === 'target' ? 'is-active' : ''} onClick={() => setResizeMode('target')}>target size</button>
                      </div>
                      {resizeMode === 'exact' ? (
                        <div className="dimension-controls">
                          <div className="field-grid two">
                            <label><span>width px</span><input type="number" min="1" value={exactWidth} onChange={(event) => changeExactWidth(Number(event.target.value))} /></label>
                            <label><span>height px</span><input type="number" min="1" value={exactHeight} onChange={(event) => changeExactHeight(Number(event.target.value))} /></label>
                          </div>
                          <label className="check-line">
                            <input type="checkbox" checked={aspectLocked} onChange={(event) => setAspectLocked(event.target.checked)} />
                            <span>lock {sourceAspect.toFixed(3)} ratio</span>
                          </label>
                        </div>
                      ) : (
                        <label className="target-field">
                          <span>maximum KB</span>
                          <input type="number" min="1" value={targetKb} onChange={(event) => setTargetKb(Number(event.target.value))} />
                          <small>Quality and dimensions are tested locally until the result fits.</small>
                        </label>
                      )}
                    </>
                  )}

                  <div className="export-controls">
                    <div className="field-grid two">
                      <label>
                        <span>format</span>
                        <select value={format} onChange={(event) => setFormat(event.target.value as ImageMime)}>
                          <option value="image/jpeg">JPEG</option>
                          <option value="image/png">PNG</option>
                          <option value="image/webp">WebP</option>
                        </select>
                      </label>
                      <label className={format === 'image/png' || (activeTool === 'resize' && resizeMode === 'target') ? 'is-muted' : ''}>
                        <span>quality · {Math.round(quality * 100)}%</span>
                        <input type="range" min="0.2" max="1" step="0.01" value={quality} disabled={format === 'image/png' || (activeTool === 'resize' && resizeMode === 'target')} onChange={(event) => setQuality(Number(event.target.value))} />
                      </label>
                    </div>
                    <button className="export-command" type="button" onClick={exportImage} disabled={exporting}>
                      <span aria-hidden="true">&gt;</span> {exporting ? `working ${Math.round(progress * 100)}%` : `export ${activeTool}`}
                      <span className="cursor" aria-hidden="true" />
                    </button>
                    {exporting ? <progress value={progress} max="1">{Math.round(progress * 100)}%</progress> : null}
                    {lastOutput ? <p className="success-line">downloaded · {lastOutput.width} × {lastOutput.height} · {formatBytes(lastOutput.size)}</p> : null}
                  </div>
                </aside>
              </div>
            ) : (
              <section className="queued-tool">
                <h1>{activeTool}.</h1>
                {activeTool === 'trim' ? (
                  <><p>{trimSupport.label}</p><p>{trimSupport.detail}</p></>
                ) : activeTool === 'convert' ? (
                  <>
                    <p>The local conversion engine is scaffolded after crop and resize.</p>
                    <dl>
                      <div><dt>image</dt><dd>{formatSupport.image.join(' · ')}</dd></div>
                      <div><dt>video</dt><dd>{formatSupport.video.join(' · ')}</dd></div>
                      <div><dt>audio</dt><dd>{formatSupport.audio.join(' · ')}</dd></div>
                    </dl>
                  </>
                ) : (
                  <p>Open an image to bring this tool forward.</p>
                )}
                <Dropzone onFile={handleFile} />
              </section>
            )}
          </div>
        )}
      </main>

      <footer className="status-line">
        <span aria-live="polite" className={error ? 'is-error' : ''}>{error || status}</span>
        <span>concise.ai9an.com</span>
      </footer>
    </div>
  )
}
