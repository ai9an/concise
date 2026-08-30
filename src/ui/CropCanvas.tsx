import { useEffect, useRef } from 'react'
import type { CropRect, ImageAsset } from '../types'

type Corner = 'nw' | 'ne' | 'se' | 'sw'
type Drag = {
  mode: 'move' | Corner
  startX: number
  startY: number
  rect: CropRect
}

type ViewTransform = {
  scale: number
  x: number
  y: number
}

type CropCanvasProps = {
  asset: ImageAsset
  crop: CropRect
  aspect: number | null
  onCropChange: (crop: CropRect) => void
}

const minimumCrop = 24

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function near(value: number, target: number, radius: number) {
  return Math.abs(value - target) <= radius
}

export function CropCanvas({ asset, crop, aspect, onCropChange }: CropCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const transformRef = useRef<ViewTransform>({ scale: 1, x: 0, y: 0 })
  const dragRef = useRef<Drag | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const render = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, width, height)

      const scale = Math.min(width / asset.width, height / asset.height)
      const drawWidth = asset.width * scale
      const drawHeight = asset.height * scale
      const x = (width - drawWidth) / 2
      const y = (height - drawHeight) / 2
      transformRef.current = { scale, x, y }

      context.fillStyle = '#080808'
      context.fillRect(0, 0, width, height)
      context.drawImage(asset.bitmap, x, y, drawWidth, drawHeight)

      const left = x + crop.x * scale
      const top = y + crop.y * scale
      const cropWidth = crop.width * scale
      const cropHeight = crop.height * scale
      const right = left + cropWidth
      const bottom = top + cropHeight

      context.fillStyle = 'rgba(0,0,0,.62)'
      context.fillRect(x, y, drawWidth, top - y)
      context.fillRect(x, bottom, drawWidth, y + drawHeight - bottom)
      context.fillRect(x, top, left - x, cropHeight)
      context.fillRect(right, top, x + drawWidth - right, cropHeight)

      context.strokeStyle = '#ffb000'
      context.lineWidth = 2
      context.strokeRect(left, top, cropWidth, cropHeight)
      context.strokeStyle = 'rgba(230,226,214,.38)'
      context.lineWidth = 1
      context.beginPath()
      context.moveTo(left + cropWidth / 3, top)
      context.lineTo(left + cropWidth / 3, bottom)
      context.moveTo(left + (cropWidth * 2) / 3, top)
      context.lineTo(left + (cropWidth * 2) / 3, bottom)
      context.moveTo(left, top + cropHeight / 3)
      context.lineTo(right, top + cropHeight / 3)
      context.moveTo(left, top + (cropHeight * 2) / 3)
      context.lineTo(right, top + (cropHeight * 2) / 3)
      context.stroke()

      context.fillStyle = '#ffb000'
      for (const [handleX, handleY] of [[left, top], [right, top], [right, bottom], [left, bottom]]) {
        context.fillRect(handleX - 5, handleY - 5, 10, 10)
      }
    }

    const observer = new ResizeObserver(render)
    observer.observe(canvas)
    render()
    return () => observer.disconnect()
  }, [asset, crop])

  const toImagePoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const view = transformRef.current
    return {
      x: (event.clientX - bounds.left - view.x) / view.scale,
      y: (event.clientY - bounds.top - view.y) / view.scale,
    }
  }

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = toImagePoint(event)
    const radius = 14 / transformRef.current.scale
    const right = crop.x + crop.width
    const bottom = crop.y + crop.height
    let mode: Drag['mode'] | null = null
    if (near(point.x, crop.x, radius) && near(point.y, crop.y, radius)) mode = 'nw'
    else if (near(point.x, right, radius) && near(point.y, crop.y, radius)) mode = 'ne'
    else if (near(point.x, right, radius) && near(point.y, bottom, radius)) mode = 'se'
    else if (near(point.x, crop.x, radius) && near(point.y, bottom, radius)) mode = 'sw'
    else if (point.x >= crop.x && point.x <= right && point.y >= crop.y && point.y <= bottom) mode = 'move'
    if (!mode) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { mode, startX: point.x, startY: point.y, rect: crop }
  }

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const point = toImagePoint(event)
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
    let width = Math.max(minimumCrop, Math.abs(point.x - anchorX))
    let height = Math.max(minimumCrop, Math.abs(point.y - anchorY))

    if (aspect) {
      if (width / height > aspect) height = width / aspect
      else width = height * aspect
    }

    width = Math.min(width, signX > 0 ? asset.width - anchorX : anchorX)
    height = Math.min(height, signY > 0 ? asset.height - anchorY : anchorY)
    if (aspect) {
      const fittedWidth = Math.min(width, height * aspect)
      width = fittedWidth
      height = fittedWidth / aspect
    }

    onCropChange({
      x: signX > 0 ? anchorX : anchorX - width,
      y: signY > 0 ? anchorY : anchorY - height,
      width,
      height,
    })
  }

  return (
    <canvas
      ref={canvasRef}
      className="crop-canvas"
      aria-label="Image crop preview. Use the crop value fields for keyboard adjustments."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => {
        dragRef.current = null
        event.currentTarget.releasePointerCapture(event.pointerId)
      }}
      onPointerCancel={() => {
        dragRef.current = null
      }}
    />
  )
}
