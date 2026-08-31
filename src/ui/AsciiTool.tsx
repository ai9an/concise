import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { asciiFontGroups, canvasToBlob, drawAsciiFrame, makeAscii, sizeAsciiCanvas, terminalCode, type AsciiAnimation, type AsciiFont, type AsciiSettings, type GradientMode } from '../tools/ascii'

const defaultSettings: AsciiSettings = {
  font: 'Bloody',
  columns: 100,
  horizontalLayout: 'default',
  verticalLayout: 'default',
  direction: 0,
  whitespaceBreak: true,
  fontSize: 28,
  lineHeight: 1,
  padding: 30,
  transparent: true,
  background: '#000000',
  primary: '#ffb000',
  secondary: '#e6e2d6',
  gradient: 'solid',
  animation: 'none',
  duration: 2.4,
  fps: 24,
}

const animations: Array<{ id: AsciiAnimation; label: string }> = [
  { id: 'none', label: 'still' },
  { id: 'type-on', label: 'type on' },
  { id: 'wipe', label: 'column reveal' },
  { id: 'shine', label: 'metallic shine' },
  { id: 'pulse', label: 'colour pulse' },
]

const featuredFonts: AsciiFont[] = ['Bloody', 'Delta Corps Priest 1', 'ANSI Shadow', 'Doom', 'Slant']

const animationNotes: Record<AsciiAnimation, string> = {
  none: 'Prints once with no cursor control or frame loop.',
  'type-on': 'Reveals the real terminal characters over timed ANSI frames.',
  wipe: 'Redraws each line by terminal column until the full mark is visible.',
  shine: 'Runs a diagonal true-colour highlight over a darker row gradient.',
  pulse: 'Redraws the same characters through a terminal colour ramp.',
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function AsciiTool() {
  const [text, setText] = useState('CONCISE')
  const [settings, setSettings] = useState(defaultSettings)
  const [language, setLanguage] = useState<'sh' | 'python'>('sh')
  const [runnable, setRunnable] = useState(true)
  const [status, setStatus] = useState('ready · output generated locally')
  const [working, setWorking] = useState(false)
  const [previewMode, setPreviewMode] = useState<'artwork' | 'text' | 'code'>('artwork')
  const [reduceMotion, setReduceMotion] = useState(false)
  const [fontReady, setFontReady] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const deferredText = useDeferredValue(text)
  const ascii = useMemo(() => makeAscii(deferredText, settings), [deferredText, settings.font, settings.columns, settings.horizontalLayout, settings.verticalLayout, settings.direction, settings.whitespaceBreak])
  const canvasSize = useMemo(() => sizeAsciiCanvas(ascii, settings), [ascii, settings.fontSize, settings.lineHeight, settings.padding, settings.animation])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReduceMotion(media.matches)
    updatePreference()
    media.addEventListener('change', updatePreference)
    void document.fonts.ready.then(() => setFontReady(true))
    return () => media.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    const target = canvasRef.current
    if (!target) return
    target.width = canvasSize.width
    target.height = canvasSize.height
    let frame = 0
    const start = performance.now()
    const render = (time: number) => {
      const staticPreview = settings.animation === 'none' || reduceMotion
      const progress = staticPreview ? 1 : ((time - start) % (settings.duration * 1000)) / (settings.duration * 1000)
      drawAsciiFrame(target, ascii, settings, progress)
      if (!staticPreview) frame = requestAnimationFrame(render)
    }
    render(start)
    return () => cancelAnimationFrame(frame)
  }, [ascii, canvasSize, fontReady, reduceMotion, settings])

  const patchSettings = <Key extends keyof AsciiSettings>(key: Key, value: AsciiSettings[Key]) => setSettings((current) => ({ ...current, [key]: value }))

  const exportPng = async () => {
    setWorking(true)
    try {
      const stillSettings = { ...settings, animation: 'none' as const }
      const exportCanvas = sizeAsciiCanvas(ascii, stillSettings)
      drawAsciiFrame(exportCanvas, ascii, stillSettings, 1)
      download(await canvasToBlob(exportCanvas), 'concise-ascii.png')
      setStatus(`still PNG downloaded · ${exportCanvas.width} × ${exportCanvas.height} · ${settings.transparent ? 'transparent' : 'solid background'}`)
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : 'PNG export failed.')
    } finally {
      setWorking(false)
    }
  }

  const code = useMemo(() => terminalCode(ascii, settings, language, runnable), [ascii, settings, language, runnable])
  const exportCode = () => {
    const extension = language === 'python' ? 'py' : 'sh'
    download(new Blob([code], { type: 'text/plain;charset=utf-8' }), `concise-ascii.${extension}`)
    setStatus(`${runnable ? 'runnable file' : 'callable snippet'} downloaded for ${language}`)
  }

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setStatus(`${label} copied`)
    } catch {
      setStatus('clipboard access was blocked')
    }
  }

  const chooseFont = (font: AsciiFont) => {
    patchSettings('font', font)
    setStatus(`${font} selected`)
  }

  const chooseAnimation = (animation: AsciiAnimation) => {
    patchSettings('animation', animation)
    setPreviewMode('code')
    setStatus(animation === 'none' ? 'still terminal output selected' : `${animationNotes[animation]} Code updated.`)
  }

  const chooseLanguage = (nextLanguage: 'sh' | 'python') => {
    setLanguage(nextLanguage)
    setPreviewMode('code')
    setStatus(`${nextLanguage === 'sh' ? 'Bash / Konsole' : 'Python'} output selected`)
  }

  const resetStyle = () => {
    setSettings(defaultSettings)
    setStatus('style reset · Bloody selected')
  }

  return (
    <section className="utility-workspace ascii-workspace">
      <div className="utility-heading">
        <h1>ascii.</h1>
        <p>Build terminal-scale lettering, then copy the text, export still artwork, or run it as ANSI terminal code.</p>
      </div>

      <div className="ascii-layout">
        <div className="ascii-front-plane">
          <label className="ascii-source">
            <span className="ascii-plane-heading"><b>source text</b><small>{text.length} / 120</small></span>
            <textarea value={text} maxLength={120} rows={3} spellCheck={false} placeholder="Type something worth displaying…" onChange={(event) => setText(event.target.value)} />
          </label>

          <section className="ascii-output" aria-label="Generated output">
            <div className="ascii-output-heading">
              <span className="ascii-plane-heading"><b>{previewMode === 'artwork' ? 'terminal artwork' : 'live output'}</b><small>{previewMode === 'code' ? `${language === 'sh' ? 'Bash / Konsole' : 'Python'} · ${settings.animation}` : `${settings.font} · ${canvasSize.width} × ${canvasSize.height}px`}</small></span>
              <div className="mode-line ascii-preview-tabs" aria-label="Preview format">
                <button type="button" className={previewMode === 'artwork' ? 'is-active' : ''} aria-pressed={previewMode === 'artwork'} onClick={() => setPreviewMode('artwork')}>artwork</button>
                <button type="button" className={previewMode === 'text' ? 'is-active' : ''} aria-pressed={previewMode === 'text'} onClick={() => setPreviewMode('text')}>plain text</button>
                <button type="button" className={previewMode === 'code' ? 'is-active' : ''} aria-pressed={previewMode === 'code'} onClick={() => setPreviewMode('code')}>code</button>
              </div>
            </div>
            <div className={`ascii-canvas-stage${previewMode === 'artwork' ? '' : ' is-hidden'}`} aria-hidden={previewMode !== 'artwork'}><canvas ref={canvasRef} aria-label="ASCII artwork preview">{ascii}</canvas></div>
            {previewMode === 'text' ? <div className="ascii-text-preview"><pre aria-label="Plain ASCII output">{ascii}</pre></div> : null}
            {previewMode === 'code' ? <div className="ascii-text-preview ascii-code-preview"><pre aria-label={`Generated ${language} code`}>{code}</pre></div> : null}
            <div className="ascii-output-actions">
              <button className="ascii-output-command" type="button" onClick={() => copy(code, `${language} code`)}><span aria-hidden="true">&gt;</span> copy {language === 'sh' ? 'shell' : 'Python'} code</button>
              <button className="secondary-command" type="button" onClick={exportCode}>download .{language === 'sh' ? 'sh' : 'py'}</button>
              <button className="secondary-command" type="button" onClick={exportPng} disabled={working}>download still PNG</button>
              <button className="secondary-command" type="button" onClick={() => copy(ascii, 'plain ASCII')}>copy plain text</button>
            </div>
          </section>
          <p className="utility-status ascii-status" aria-live="polite"><span aria-hidden="true" />{status}</p>
        </div>

        <aside className="utility-controls ascii-controls">
          <fieldset className="ascii-settings-section">
            <legend><span>lettering</span><button type="button" className="quiet-action" onClick={resetStyle}>reset style</button></legend>
            <div className="ascii-featured-fonts" aria-label="Featured FIGlet fonts">
              {featuredFonts.map((font) => <button key={font} type="button" className={settings.font === font ? 'is-active' : ''} aria-pressed={settings.font === font} onClick={() => chooseFont(font)}>{font === 'Delta Corps Priest 1' ? 'Delta Corps' : font}</button>)}
            </div>
            <div className="ascii-control-grid">
              <label><span>FIGlet font · {asciiFontGroups.reduce((total, group) => total + group.fonts.length, 0)} available</span><select value={settings.font} onChange={(event) => chooseFont(event.target.value as AsciiFont)}>{asciiFontGroups.map((group) => <optgroup key={group.label} label={group.label}>{group.fonts.map((font) => <option key={font}>{font}</option>)}</optgroup>)}</select></label>
            <label><span>columns · {settings.columns}</span><input type="range" min="20" max="240" value={settings.columns} onChange={(event) => patchSettings('columns', Number(event.target.value))} /></label>
            <label><span>horizontal fit</span><select value={settings.horizontalLayout} onChange={(event) => patchSettings('horizontalLayout', event.target.value as AsciiSettings['horizontalLayout'])}><option>default</option><option>fitted</option><option>full</option><option>controlled smushing</option><option>universal smushing</option></select></label>
            <label><span>vertical fit</span><select value={settings.verticalLayout} onChange={(event) => patchSettings('verticalLayout', event.target.value as AsciiSettings['verticalLayout'])}><option>default</option><option>fitted</option><option>full</option><option>controlled smushing</option><option>universal smushing</option></select></label>
            </div>
            <div className="check-grid">
              <label className="check-line"><input type="checkbox" checked={settings.whitespaceBreak} onChange={(event) => patchSettings('whitespaceBreak', event.target.checked)} /><span>wrap at words</span></label>
              <label className="check-line"><input type="checkbox" checked={settings.direction === 1} onChange={(event) => patchSettings('direction', event.target.checked ? 1 : 0)} /><span>right-to-left</span></label>
            </div>
          </fieldset>

          <fieldset><legend>artwork</legend><div className="ascii-control-grid compact"><label><span>glyph size · {settings.fontSize}px</span><input type="range" min="10" max="128" value={settings.fontSize} onChange={(event) => patchSettings('fontSize', Number(event.target.value))} /></label><label><span>line spacing · {settings.lineHeight.toFixed(2)}</span><input type="range" min="0.7" max="1.8" step="0.05" value={settings.lineHeight} onChange={(event) => patchSettings('lineHeight', Number(event.target.value))} /></label><label><span>padding · {settings.padding}px</span><input type="range" min="0" max="160" value={settings.padding} onChange={(event) => patchSettings('padding', Number(event.target.value))} /></label><label><span>glyph colour</span><select value={settings.gradient} onChange={(event) => patchSettings('gradient', event.target.value as GradientMode)}><option value="solid">solid</option><option value="horizontal">column fade</option><option value="vertical">row fade</option><option value="diagonal">diagonal fade</option></select></label></div>
            <div className="colour-fields ascii-colours"><label><span>first colour</span><input type="color" value={settings.primary} onChange={(event) => patchSettings('primary', event.target.value)} /></label><label><span>second colour</span><input type="color" value={settings.secondary} onChange={(event) => patchSettings('secondary', event.target.value)} /></label><label><span>background</span><input type="color" value={settings.background} disabled={settings.transparent} onChange={(event) => patchSettings('background', event.target.value)} /></label></div>
            <label className="check-line"><input type="checkbox" checked={settings.transparent} onChange={(event) => patchSettings('transparent', event.target.checked)} /><span>transparent PNG background</span></label>
          </fieldset>

          <fieldset><legend>terminal animation</legend><div className="mode-line ascii-animation-line">{animations.map((animation) => <button key={animation.id} type="button" className={settings.animation === animation.id ? 'is-active' : ''} aria-pressed={settings.animation === animation.id} onClick={() => chooseAnimation(animation.id)}>{animation.label}</button>)}</div><p className="ascii-setting-note">{animationNotes[settings.animation]}{reduceMotion && settings.animation !== 'none' ? ' The browser preview is paused by your reduced-motion preference; generated code still includes the animation.' : ''}</p><div className="ascii-terminal-proof"><span aria-hidden="true" /><span>Preview, PNG, and code share the same per-glyph colour steps. Use <code>bash concise-ascii.sh</code> in Konsole. ANSI falls back to plain text when piped, too wide, or disabled by NO_COLOR.</span></div><div className="ascii-control-grid compact"><label className={settings.animation === 'none' ? 'is-disabled' : ''}><span>duration · {settings.duration.toFixed(1)}s</span><input type="range" min="0.6" max="8" step="0.1" value={settings.duration} disabled={settings.animation === 'none'} onChange={(event) => patchSettings('duration', Number(event.target.value))} /></label><label className={settings.animation === 'none' ? 'is-disabled' : ''}><span>terminal FPS · {settings.fps}</span><input type="range" min="8" max="30" value={Math.min(settings.fps, 30)} disabled={settings.animation === 'none'} onChange={(event) => patchSettings('fps', Number(event.target.value))} /></label></div></fieldset>

          <fieldset><legend>terminal code</legend><div className="mode-line"><button type="button" className={language === 'sh' ? 'is-active' : ''} aria-pressed={language === 'sh'} onClick={() => chooseLanguage('sh')}>Bash / Konsole</button><button type="button" className={language === 'python' ? 'is-active' : ''} aria-pressed={language === 'python'} onClick={() => chooseLanguage('python')}>Python</button></div><div className="mode-line"><button type="button" className={runnable ? 'is-active' : ''} aria-pressed={runnable} onClick={() => { setRunnable(true); setPreviewMode('code') }}>runs immediately</button><button type="button" className={!runnable ? 'is-active' : ''} aria-pressed={!runnable} onClick={() => { setRunnable(false); setPreviewMode('code') }}>function only</button></div></fieldset>
        </aside>
      </div>
    </section>
  )
}
