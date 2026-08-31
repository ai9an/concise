import { useMemo, useState } from 'react'
import { canStripMetadata, inspectMetadata, stripMetadata, type MetadataSection } from '../tools/metadata'

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function MetadataTool() {
  const [file, setFile] = useState<File | null>(null)
  const [sections, setSections] = useState<MetadataSection[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('open a file to inspect it locally')
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const [progress, setProgress] = useState(0)

  const visibleSections = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    if (!needle) return sections
    return sections.map((section) => ({
      ...section,
      entries: section.entries.filter((entry) => `${section.name} ${entry.key} ${entry.value}`.toLocaleLowerCase().includes(needle)),
    })).filter((section) => section.entries.length)
  }, [query, sections])

  const entryCount = sections.reduce((total, section) => total + section.entries.length, 0)

  const openFile = async (next: File) => {
    setFile(next)
    setWorking(true)
    setError('')
    setProgress(0)
    setStatus('reading containers, streams, and embedded tags locally')
    try {
      const result = await inspectMetadata(next)
      setSections(result)
      const found = result.reduce((total, section) => total + section.entries.length, 0)
      setStatus(`${found} fields found across ${result.length} sections · nothing uploaded`)
    } catch (cause) {
      setSections([])
      setError(cause instanceof Error ? cause.message : 'The file could not be inspected.')
      setStatus('inspection stopped')
    } finally {
      setWorking(false)
    }
  }

  const strip = async () => {
    if (!file) return
    setWorking(true)
    setError('')
    setProgress(0.01)
    setStatus('creating a cleaned copy locally · original untouched')
    try {
      const result = await stripMetadata(file, setProgress)
      const dot = file.name.lastIndexOf('.')
      const name = dot > 0 ? `${file.name.slice(0, dot)}-stripped${file.name.slice(dot)}` : `${file.name}-stripped`
      download(result.blob, name)
      setProgress(1)
      setStatus(`cleaned copy downloaded · ${result.detail}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Metadata stripping failed.')
      setStatus('strip stopped · original file unchanged')
    } finally {
      setWorking(false)
    }
  }

  const exportReport = () => {
    if (!file) return
    const report = {
      file: file.name,
      inspectedAt: new Date().toISOString(),
      localOnly: true,
      sections: sections.reduce<Record<string, Record<string, string>>>((all, section) => {
        all[section.name] = Object.fromEntries(section.entries.map((entry) => [entry.key, entry.value]))
        return all
      }, {}),
    }
    download(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }), `${file.name}-metadata.json`)
    setStatus('metadata report downloaded as JSON')
  }

  return (
    <section className="utility-workspace metadata-workspace">
      <div className="utility-heading metadata-heading">
        <div><h1>metadata.</h1><p>Inspect hidden tags and technical details, then download a cleaned copy from the same workspace.</p></div>
        {file ? <label className="inline-file-action"><span>&gt; replace file</span><input type="file" onChange={(event) => { const next = event.target.files?.[0]; if (next) void openFile(next) }} /></label> : null}
      </div>

      {!file ? (
        <label className="utility-open metadata-open">
          <span className="utility-command"><b>&gt;</b> open any file</span>
          <span>images · video · audio · PDF · Office/OpenDocument · archives and unknown formats for basic facts</span>
          <input type="file" onChange={(event) => { const next = event.target.files?.[0]; if (next) void openFile(next) }} />
        </label>
      ) : (
        <>
          <div className="metadata-toolbar">
            <div className="metadata-file"><span>{file.name}</span><span>{file.size.toLocaleString()} bytes</span><span>{file.type || 'unknown MIME'}</span><span className="local-mark">local only</span></div>
            <label><span>filter {entryCount} fields</span><input type="search" value={query} placeholder="GPS, author, codec, date…" onChange={(event) => setQuery(event.target.value)} /></label>
          </div>

          <div className="metadata-sections" aria-busy={working}>
            {visibleSections.map((section) => (
              <section key={section.name} className="metadata-section">
                <h2>{section.name}<span>{section.entries.length}</span></h2>
                <dl>{section.entries.map((entry, index) => <div key={`${entry.key}-${index}`}><dt>{entry.key}</dt><dd>{entry.value}</dd></div>)}</dl>
              </section>
            ))}
            {!working && !visibleSections.length ? <p className="metadata-empty">No fields match that filter.</p> : null}
          </div>

          <div className="metadata-actions">
            <button className="export-command utility-export" type="button" onClick={strip} disabled={working || !canStripMetadata(file)}><span aria-hidden="true">&gt;</span> {working ? 'working' : 'strip metadata copy'}</button>
            <button className="secondary-command" type="button" onClick={exportReport} disabled={working}>download JSON report</button>
            {!canStripMetadata(file) ? <p className="utility-note">Inspection works for this file, but Concise cannot yet remove its metadata without risking its content.</p> : <p className="utility-note">The original is never changed. Colour profiles and media streams are preserved when the format allows lossless stripping.</p>}
            {working && progress > 0 ? <progress max="1" value={progress} aria-label="Metadata processing progress" /> : null}
            <p className={error ? 'utility-status is-error' : 'utility-status'} aria-live="polite">{error || status}</p>
          </div>
        </>
      )}
    </section>
  )
}
