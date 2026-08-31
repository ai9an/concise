import { useEffect, useMemo, useRef, useState } from 'react'

type QrKind = 'url' | 'text' | 'wifi' | 'email' | 'phone'

function escapeWifi(value: string) {
  return value.replace(/([\\;,:"])/g, '\\$1')
}

function fileDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('The centre image could not be read.'))
    reader.readAsDataURL(file)
  })
}

function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('The QR image could not be created.')), 'image/png')
  })
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function drawLogo(canvas: HTMLCanvasElement, file: File) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const context = canvas.getContext('2d')
  if (!context) return
  const size = Math.round(canvas.width * 0.19)
  const inset = Math.round(size * 0.13)
  const x = Math.round((canvas.width - size) / 2)
  const y = Math.round((canvas.height - size) / 2)
  context.fillStyle = '#ffffff'
  context.fillRect(x - inset, y - inset, size + inset * 2, size + inset * 2)
  context.drawImage(bitmap, x, y, size, size)
  bitmap.close()
}

export default function QrTool() {
  const [kind, setKind] = useState<QrKind>('url')
  const [value, setValue] = useState('https://concise.ai9an.com')
  const [secondary, setSecondary] = useState('')
  const [password, setPassword] = useState('')
  const [wifiSecurity, setWifiSecurity] = useState('WPA')
  const [size, setSize] = useState(720)
  const [margin, setMargin] = useState(3)
  const [dark, setDark] = useState('#11110f')
  const [light, setLight] = useState('#ffffff')
  const [logo, setLogo] = useState<File | null>(null)
  const [status, setStatus] = useState('ready · generated locally')
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const payload = useMemo(() => {
    if (kind === 'wifi') return `WIFI:T:${wifiSecurity};S:${escapeWifi(value)};P:${escapeWifi(password)};;`
    if (kind === 'email') return `mailto:${value}${secondary ? `?subject=${encodeURIComponent(secondary)}` : ''}`
    if (kind === 'phone') return `tel:${value}`
    return value
  }, [kind, password, secondary, value, wifiSecurity])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        const QRCode = await import('qrcode')
        if (cancelled) return
        await QRCode.toCanvas(canvas, payload || ' ', {
          width: size,
          margin,
          errorCorrectionLevel: logo ? 'H' : 'M',
          color: { dark, light },
        })
        if (logo) await drawLogo(canvas, logo)
        if (!cancelled) {
          setError('')
          setStatus(`${payload.length} characters · ${logo ? 'high' : 'medium'} error correction`)
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'The QR code could not be generated.')
      }
    }, 120)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [dark, light, logo, margin, payload, size])

  const exportPng = async () => {
    if (!canvasRef.current) return
    try {
      download(await canvasBlob(canvasRef.current), 'concise-qr.png')
      setStatus('PNG downloaded locally')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The PNG could not be exported.')
    }
  }

  const exportSvg = async () => {
    try {
      const QRCode = await import('qrcode')
      let svg = await QRCode.toString(payload || ' ', {
        type: 'svg',
        margin,
        errorCorrectionLevel: logo ? 'H' : 'M',
        color: { dark, light },
      })
      if (logo) {
        const dataUrl = await fileDataUrl(logo)
        const viewBox = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
        const extent = Number(viewBox?.[1] ?? 41)
        const logoSize = extent * 0.19
        const backing = logoSize * 1.26
        const x = (extent - logoSize) / 2
        const y = (extent - logoSize) / 2
        svg = svg.replace('</svg>', `<rect x="${(extent - backing) / 2}" y="${(extent - backing) / 2}" width="${backing}" height="${backing}" fill="#fff"/><image href="${dataUrl}" x="${x}" y="${y}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid slice"/></svg>`)
      }
      download(new Blob([svg], { type: 'image/svg+xml' }), 'concise-qr.svg')
      setStatus('SVG downloaded locally')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The SVG could not be exported.')
    }
  }

  const chooseKind = (next: QrKind) => {
    setKind(next)
    setSecondary('')
    setPassword('')
    setValue(next === 'url' ? 'https://concise.ai9an.com' : '')
  }

  return (
    <section className="utility-workspace">
      <div className="utility-heading">
        <h1>qr code.</h1>
        <p>Turn a URL, message, contact action, or Wi-Fi login into a local PNG or infinitely sharp SVG.</p>
      </div>

      <div className="utility-split qr-layout">
        <div className="utility-preview qr-preview">
          <canvas ref={canvasRef} aria-label="Generated QR code preview" />
          <div className="preview-readout">
            <span>{size} × {size}</span>
            <span>{logo ? 'centre image on' : 'plain mark'}</span>
          </div>
        </div>

        <aside className="utility-controls">
          <fieldset>
            <legend>content</legend>
            <div className="mode-line">
              {(['url', 'text', 'wifi', 'email', 'phone'] as QrKind[]).map((item) => (
                <button key={item} type="button" className={kind === item ? 'is-active' : ''} onClick={() => chooseKind(item)}>{item}</button>
              ))}
            </div>
          </fieldset>

          <label>
            <span>{kind === 'wifi' ? 'network name' : kind === 'email' ? 'email address' : kind === 'phone' ? 'phone number' : kind}</span>
            {kind === 'text' ? (
              <textarea rows={5} value={value} onChange={(event) => setValue(event.target.value)} placeholder="Text encoded in the QR code" />
            ) : (
              <input type={kind === 'email' ? 'email' : kind === 'url' ? 'url' : 'text'} value={value} onChange={(event) => setValue(event.target.value)} placeholder={kind === 'url' ? 'https://example.com' : ''} />
            )}
          </label>
          {kind === 'wifi' ? (
            <div className="field-grid two">
              <label><span>security</span><select value={wifiSecurity} onChange={(event) => setWifiSecurity(event.target.value)}><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">open</option></select></label>
              <label><span>password</span><input type="text" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            </div>
          ) : null}
          {kind === 'email' ? <label><span>subject · optional</span><input type="text" value={secondary} onChange={(event) => setSecondary(event.target.value)} /></label> : null}

          <div className="field-grid two">
            <label><span>size</span><select value={size} onChange={(event) => setSize(Number(event.target.value))}><option value="360">360 px</option><option value="720">720 px</option><option value="1200">1200 px</option><option value="2000">2000 px</option></select></label>
            <label><span>quiet zone · {margin}</span><input type="range" min="1" max="8" value={margin} onChange={(event) => setMargin(Number(event.target.value))} /></label>
          </div>
          <div className="field-grid two colour-fields">
            <label><span>ink</span><input type="color" value={dark.slice(0, 7)} onChange={(event) => setDark(event.target.value)} /></label>
            <label><span>paper</span><input type="color" value={light.slice(0, 7)} onChange={(event) => setLight(event.target.value)} /></label>
          </div>
          <label className="inline-file-action">
            <span>{logo ? `centre image · ${logo.name}` : '> add centre image'}</span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => setLogo(event.target.files?.[0] ?? null)} />
          </label>
          {logo ? <button className="quiet-action" type="button" onClick={() => setLogo(null)}>remove centre image</button> : null}

          <div className="dual-command">
            <button className="export-command utility-export" type="button" onClick={exportPng}><span aria-hidden="true">&gt;</span> export PNG</button>
            <button className="secondary-command" type="button" onClick={exportSvg}>export SVG</button>
          </div>
          <p className={error ? 'utility-status is-error' : 'utility-status'} aria-live="polite">{error || status}</p>
        </aside>
      </div>
    </section>
  )
}
