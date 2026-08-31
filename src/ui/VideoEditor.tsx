import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent, RefObject } from 'react'
import type { CropRect, VideoAsset, VideoFormat } from '../types'
import { inferVideoFormat, trimVideo, videoFormats } from '../tools/trim'

type Corner = 'nw' | 'ne' | 'se' | 'sw'
type Drag = {
  mode: 'move' | Corner
  startX: number
  startY: number
  rect: CropRect
}

type VideoEditorProps = {
  asset: VideoAsset
  onStatusChange: (status: string) => void
  onError: (error: string) => void
}

const aspectOptions = [
  { label: 'free', value: null },
  { label: 'original', value: 'original' },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '9:16', value: 9 / 16 },
  { label: '16:9', value: 16 / 9 },
] as const

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function formatTime(seconds: number) {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0)
  const minutes = Math.floor(safe / 60)
  const remaining = safe - minutes * 60
  return `${minutes}:${remaining.toFixed(2).padStart(5, '0')}`
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

type VideoCropPreviewProps = {
  asset: VideoAsset
  crop: CropRect
  aspect: number | null
  videoRef: RefObject<HTMLVideoElement | null>
  onCropChange: (crop: CropRect) => void
  onTimeUpdate: (time: number) => void
  onPlaybackChange: (playing: boolean) => void
}

function VideoCropPreview({ asset, crop, aspect, videoRef, onCropChange, onTimeUpdate, onPlaybackChange }: VideoCropPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<Drag | null>(null)
  const [viewport, setViewport] = useState({ width: 1, height: 1 })

  useEffect(() => {
    const preview = previewRef.current
    if (!preview) return
    const measure = () => setViewport({ width: preview.clientWidth, height: preview.clientHeight })
    const observer = new ResizeObserver(measure)
    observer.observe(preview)
    measure()
    return () => observer.disconnect()
  }, [])

  const scale = Math.min(viewport.width / asset.width, viewport.height / asset.height)
  const mediaWidth = asset.width * scale
  const mediaHeight = asset.height * scale
  const mediaX = (viewport.width - mediaWidth) / 2
  const mediaY = (viewport.height - mediaHeight) / 2
  const frame = {
    left: mediaX + crop.x * scale,
    top: mediaY + crop.y * scale,
    width: crop.width * scale,
    height: crop.height * scale,
  }
  const frameStyle = {
    '--crop-left': `${frame.left}px`,
    '--crop-top': `${frame.top}px`,
    '--crop-width': `${frame.width}px`,
    '--crop-height': `${frame.height}px`,
    '--media-left': `${mediaX}px`,
    '--media-top': `${mediaY}px`,
    '--media-width': `${mediaWidth}px`,
    '--media-height': `${mediaHeight}px`,
  } as CSSProperties

  const toMediaPoint = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    return {
      x: (event.clientX - bounds.left - mediaX) / scale,
      y: (event.clientY - bounds.top - mediaY) / scale,
    }
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const point = toMediaPoint(event)
    const radius = 16 / scale
    const right = crop.x + crop.width
    const bottom = crop.y + crop.height
    let mode: Drag['mode'] | null = null
    if (Math.abs(point.x - crop.x) <= radius && Math.abs(point.y - crop.y) <= radius) mode = 'nw'
    else if (Math.abs(point.x - right) <= radius && Math.abs(point.y - crop.y) <= radius) mode = 'ne'
    else if (Math.abs(point.x - right) <= radius && Math.abs(point.y - bottom) <= radius) mode = 'se'
    else if (Math.abs(point.x - crop.x) <= radius && Math.abs(point.y - bottom) <= radius) mode = 'sw'
    else if (point.x >= crop.x && point.x <= right && point.y >= crop.y && point.y <= bottom) mode = 'move'
    if (!mode) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { mode, startX: point.x, startY: point.y, rect: crop }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const point = toMediaPoint(event)
    const dx = point.x - drag.startX
    const dy = point.y - drag.startY
    if (drag.mode === 'move') {
      onCropChange({
        ...drag.rect,
        x: clamp(drag.rect.x + dx, 0, asset.width - drag.rect.width),
        y: clamp(drag.rect.y + dy, 0, asset.height - drag.rect.height),
      })
      return
    }

    const anchorX = drag.mode.includes('w') ? drag.rect.x + drag.rect.width : drag.rect.x
    const anchorY = drag.mode.includes('n') ? drag.rect.y + drag.rect.height : drag.rect.y
    const signX = drag.mode.includes('w') ? -1 : 1
    const signY = drag.mode.includes('n') ? -1 : 1
    let width = Math.max(24, Math.abs(point.x - anchorX))
    let height = Math.max(24, Math.abs(point.y - anchorY))
    if (aspect) {
      if (width / height > aspect) height = width / aspect
      else width = height * aspect
    }
    width = Math.min(width, signX > 0 ? asset.width - anchorX : anchorX)
    height = Math.min(height, signY > 0 ? asset.height - anchorY : anchorY)
    if (aspect) {
      width = Math.min(width, height * aspect)
      height = width / aspect
    }
    onCropChange({
      x: signX > 0 ? anchorX : anchorX - width,
      y: signY > 0 ? anchorY : anchorY - height,
      width,
      height,
    })
  }

  return (
    <div ref={previewRef} className="video-preview">
      <video
        ref={videoRef}
        src={asset.objectUrl}
        preload="auto"
        playsInline
        onLoadedMetadata={(event) => {
          if (event.currentTarget.currentTime === 0) event.currentTarget.currentTime = Math.min(0.001, asset.duration)
        }}
        onTimeUpdate={(event) => onTimeUpdate(event.currentTarget.currentTime)}
        onPlay={() => onPlaybackChange(true)}
        onPause={() => onPlaybackChange(false)}
        onEnded={() => onPlaybackChange(false)}
      />
      <div
        className="video-crop-layer"
        style={frameStyle}
        role="img"
        aria-label="Video crop preview. Drag the amber frame, or use the crop value fields for keyboard adjustments."
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => {
          dragRef.current = null
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
        }}
        onPointerCancel={() => { dragRef.current = null }}
      >
        <span className="crop-shade crop-shade-top" />
        <span className="crop-shade crop-shade-right" />
        <span className="crop-shade crop-shade-bottom" />
        <span className="crop-shade crop-shade-left" />
        <span className="video-crop-frame">
          <span className="third third-v one" />
          <span className="third third-v two" />
          <span className="third third-h one" />
          <span className="third third-h two" />
          <span className="crop-handle nw" />
          <span className="crop-handle ne" />
          <span className="crop-handle se" />
          <span className="crop-handle sw" />
        </span>
      </div>
    </div>
  )
}

export function VideoEditor({ asset, onStatusChange, onError }: VideoEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [crop, setCrop] = useState<CropRect>(() => ({ x: 0, y: 0, width: asset.width, height: asset.height }))
  const [aspect, setAspect] = useState<number | null>(null)
  const [aspectLabel, setAspectLabel] = useState('free')
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(asset.duration)
  const [currentTime, setCurrentTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [format, setFormat] = useState<VideoFormat>(() => inferVideoFormat(asset.file.name))
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [lastOutput, setLastOutput] = useState<{ size: number; duration: number } | null>(null)

  useEffect(() => {
    setCrop({ x: 0, y: 0, width: asset.width, height: asset.height })
    setAspect(null)
    setAspectLabel('free')
    setStart(0)
    setEnd(asset.duration)
    setCurrentTime(0)
    setFormat(inferVideoFormat(asset.file.name))
    setLastOutput(null)
  }, [asset])

  const roundedCrop = useMemo(() => ({
    x: Math.round(crop.x),
    y: Math.round(crop.y),
    width: Math.round(crop.width),
    height: Math.round(crop.height),
  }), [crop])

  const seek = (time: number) => {
    const next = clamp(time, 0, asset.duration)
    if (videoRef.current) videoRef.current.currentTime = next
    setCurrentTime(next)
  }

  const changeStart = (value: number) => {
    const next = clamp(value, 0, Math.max(0, end - 0.05))
    setStart(next)
    if (currentTime < next) seek(next)
  }

  const changeEnd = (value: number) => {
    const next = clamp(value, Math.min(asset.duration, start + 0.05), asset.duration)
    setEnd(next)
    if (currentTime > next) seek(next)
  }

  const changeAspect = (label: string, value: number | 'original' | null) => {
    setAspectLabel(label)
    if (value === null) {
      setAspect(null)
      return
    }
    const ratio = value === 'original' ? asset.width / asset.height : value
    setAspect(ratio)
    setCrop(fitAspect(asset.width, asset.height, ratio))
  }

  const changeCropField = (key: keyof CropRect, value: number) => {
    if (Number.isNaN(value)) return
    setCrop((current) => {
      const next = { ...current, [key]: Math.max(key === 'width' || key === 'height' ? 1 : 0, value) }
      next.width = Math.min(next.width, asset.width)
      next.height = Math.min(next.height, asset.height)
      next.x = Math.min(next.x, asset.width - next.width)
      next.y = Math.min(next.y, asset.height - next.height)
      return next
    })
  }

  const togglePlayback = async () => {
    const video = videoRef.current
    if (!video) return
    if (!video.paused) {
      video.pause()
      return
    }
    if (video.currentTime < start || video.currentTime >= end) seek(start)
    try {
      await video.play()
    } catch {
      onError('Playback was blocked by the browser. Press play again to preview the selection.')
    }
  }

  const handleTimeUpdate = (time: number) => {
    if (time >= end && videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause()
      seek(start)
      return
    }
    setCurrentTime(time)
  }

  const exportSelection = async () => {
    setExporting(true)
    setProgress(0.01)
    setLastOutput(null)
    onError('')
    onStatusChange('loading the local media engine')
    try {
      const blob = await trimVideo({
        file: asset.file,
        start,
        end,
        crop,
        sourceWidth: asset.width,
        sourceHeight: asset.height,
        format,
        onProgress: (value) => {
          setProgress(value)
          onStatusChange(`encoding locally · ${Math.round(value * 100)}%`)
        },
      })
      const stem = asset.file.name.replace(/\.[^/.]+$/, '') || 'concise-output'
      downloadBlob(blob, `${stem}-trim.${format}`)
      setProgress(1)
      setLastOutput({ size: blob.size, duration: end - start })
      onStatusChange('export complete · downloaded locally')
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'The video export failed in this browser. Try a shorter MP4 selection.')
      onStatusChange('export stopped')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="editor-grid video-editor-grid">
      <section className="preview-plane">
        <VideoCropPreview
          asset={asset}
          crop={crop}
          aspect={aspect}
          videoRef={videoRef}
          onCropChange={setCrop}
          onTimeUpdate={handleTimeUpdate}
          onPlaybackChange={setPlaying}
        />
        <div className="video-transport">
          <button type="button" onClick={togglePlayback}>{playing ? 'pause' : 'play'}</button>
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={asset.duration}
            step="0.01"
            value={currentTime}
            aria-label="Video playhead"
            onChange={(event) => seek(Number(event.target.value))}
          />
          <span>{formatTime(asset.duration)}</span>
        </div>
        <div className="preview-readout">
          <span>x {roundedCrop.x}</span>
          <span>y {roundedCrop.y}</span>
          <span>w {roundedCrop.width}</span>
          <span>h {roundedCrop.height}</span>
        </div>
        <button className="mobile-export" type="button" onClick={exportSelection} disabled={exporting}>
          <span aria-hidden="true">&gt;</span> {exporting ? `${Math.round(progress * 100)}%` : 'export trim'}
        </button>
      </section>

      <aside className="control-rail">
        <div className="control-heading">
          <h1>trim.</h1>
          <p>Mark the moment, frame the picture, export only what remains.</p>
        </div>

        <fieldset className="trim-controls">
          <legend>selection · {formatTime(end - start)}</legend>
          <div className="trim-point">
            <label>
              <span>in · {formatTime(start)}</span>
              <input type="range" min="0" max={asset.duration} step="0.01" value={start} onChange={(event) => changeStart(Number(event.target.value))} />
            </label>
            <button type="button" onClick={() => changeStart(currentTime)}>set in here</button>
          </div>
          <div className="trim-point">
            <label>
              <span>out · {formatTime(end)}</span>
              <input type="range" min="0" max={asset.duration} step="0.01" value={end} onChange={(event) => changeEnd(Number(event.target.value))} />
            </label>
            <button type="button" onClick={() => changeEnd(currentTime)}>set out here</button>
          </div>
          <div className="field-grid two trim-time-fields">
            <label><span>in seconds</span><input type="number" min="0" max={end - 0.05} step="0.01" value={start.toFixed(2)} onChange={(event) => changeStart(Number(event.target.value))} /></label>
            <label><span>out seconds</span><input type="number" min={start + 0.05} max={asset.duration} step="0.01" value={end.toFixed(2)} onChange={(event) => changeEnd(Number(event.target.value))} /></label>
          </div>
        </fieldset>

        <fieldset>
          <legend>crop aspect</legend>
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

        <div className="export-controls">
          <label>
            <span>format</span>
            <select value={format} onChange={(event) => setFormat(event.target.value as VideoFormat)}>
              {videoFormats.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <button className="export-command" type="button" onClick={exportSelection} disabled={exporting}>
            <span aria-hidden="true">&gt;</span> {exporting ? `working ${Math.round(progress * 100)}%` : 'export trim'}
            <span className="cursor" aria-hidden="true" />
          </button>
          {exporting ? <progress value={progress} max="1">{Math.round(progress * 100)}%</progress> : null}
          {lastOutput ? <p className="success-line">downloaded · {formatTime(lastOutput.duration)} · {(lastOutput.size / 1024 / 1024).toFixed(1)} MB</p> : null}
        </div>
      </aside>
    </div>
  )
}
