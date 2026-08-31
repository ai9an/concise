import { useDeferredValue, useEffect, useRef, useState } from 'react'

const draftKey = 'concise:markdown-draft'

const cheatsheet = [
  { label: 'heading', snippet: '## Section title\n' },
  { label: 'bold', snippet: '**important text**' },
  { label: 'italic', snippet: '_emphasised text_' },
  { label: 'link', snippet: '[link label](https://example.com)' },
  { label: 'image', snippet: '![alt text](https://example.com/image.png)' },
  { label: 'bullets', snippet: '- first item\n- second item\n- third item' },
  { label: 'steps', snippet: '1. First step\n2. Second step\n3. Third step' },
  { label: 'tasks', snippet: '- [x] Finished\n- [ ] Next task' },
  { label: 'quote', snippet: '> A useful note or quotation.' },
  { label: 'inline code', snippet: '`npm run build`' },
  { label: 'code block', snippet: '```ts\nconst ready = true\n```' },
  { label: 'table', snippet: '| Feature | Status |\n| --- | --- |\n| Local processing | Ready |\n| Uploads | Never |' },
  { label: 'divider', snippet: '---' },
  { label: 'details', snippet: '<details>\n<summary>More details</summary>\n\nHidden explanation.\n\n</details>' },
]

const readmeStarter = `# Project name

A single sentence explaining what this project does and why it is useful.

## Features

- Fast, focused workflow
- Clear local setup
- Sensible defaults

## Quick start

\`\`\`sh
npm install
npm run dev
\`\`\`

## Usage

Explain the shortest path to a useful result.

\`\`\`ts
const result = await doUsefulThing()
\`\`\`

## Configuration

| Option | Default | Purpose |
| --- | --- | --- |
| \`enabled\` | \`true\` | Enables the feature |

## Contributing

Contributions are welcome. Please run the checks before opening a pull request.

## License

MIT
`

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function MarkdownTool() {
  const [markdown, setMarkdown] = useState(() => localStorage.getItem(draftKey) ?? '')
  const deferredMarkdown = useDeferredValue(markdown)
  const [html, setHtml] = useState('')
  const [status, setStatus] = useState(markdown ? 'local draft restored' : 'start writing or insert the README starter')
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    localStorage.setItem(draftKey, markdown)
  }, [markdown])

  useEffect(() => {
    let cancelled = false
    const render = async () => {
      try {
        const [{ marked }, { default: DOMPurify }] = await Promise.all([import('marked'), import('dompurify')])
        const rendered = await marked.parse(deferredMarkdown, { gfm: true, breaks: false })
        if (!cancelled) {
          setHtml(DOMPurify.sanitize(rendered, { USE_PROFILES: { html: true } }))
          setError('')
        }
      } catch {
        if (!cancelled) setError('The Markdown preview could not be rendered.')
      }
    }
    void render()
    return () => { cancelled = true }
  }, [deferredMarkdown])

  const insert = (snippet: string) => {
    const textarea = textareaRef.current
    const start = textarea?.selectionStart ?? markdown.length
    const end = textarea?.selectionEnd ?? markdown.length
    const prefix = start > 0 && markdown[start - 1] !== '\n' && snippet.includes('\n') ? '\n\n' : ''
    const suffix = end < markdown.length && markdown[end] !== '\n' && snippet.includes('\n') ? '\n\n' : ''
    const next = `${markdown.slice(0, start)}${prefix}${snippet}${suffix}${markdown.slice(end)}`
    setMarkdown(next)
    setStatus('snippet inserted · draft saved locally')
    requestAnimationFrame(() => {
      const caret = start + prefix.length + snippet.length
      textarea?.focus()
      textarea?.setSelectionRange(caret, caret)
    })
  }

  const exportHtml = () => {
    const documentHtml = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Markdown export</title><style>body{max-width:760px;margin:48px auto;padding:0 24px;font:16px/1.65 system-ui;color:CanvasText;background:Canvas}pre,code{font-family:ui-monospace,monospace}pre{padding:16px;overflow:auto;background:ButtonFace}img{max-width:100%}table{border-collapse:collapse}th,td{padding:8px 12px;border:1px solid ButtonBorder}blockquote{margin-left:0;padding-left:16px;border-left:3px solid GrayText;color:GrayText}</style><main>${html}</main></html>`
    download(new Blob([documentHtml], { type: 'text/html' }), 'README.html')
    setStatus('HTML preview downloaded locally')
  }

  return (
    <section className="utility-workspace markdown-workspace">
      <div className="utility-heading markdown-heading">
        <div>
          <h1>markdown.</h1>
          <p>Write a clean README with a live, sanitised preview and the syntax you actually need.</p>
        </div>
        <div className="markdown-document-actions">
          <button type="button" onClick={() => {
            if (!markdown || window.confirm('Replace the current draft with a README starter?')) {
              setMarkdown(readmeStarter)
              setStatus('README starter inserted')
            }
          }}>README starter</button>
          <button type="button" disabled={!markdown} onClick={() => {
            download(new Blob([markdown], { type: 'text/markdown' }), 'README.md')
            setStatus('README.md downloaded locally')
          }}>download .md</button>
          <button type="button" disabled={!html} onClick={exportHtml}>download HTML</button>
        </div>
      </div>

      <div className="markdown-grid">
        <label className="markdown-editor">
          <span>markdown source</span>
          <textarea ref={textareaRef} value={markdown} onChange={(event) => setMarkdown(event.target.value)} spellCheck="true" placeholder="# Project name&#10;&#10;What does it do?" />
        </label>
        <div className="markdown-viewer">
          <section className="markdown-cheatsheet" aria-label="Markdown cheatsheet">
            <div>
              <h2>cheatsheet.</h2>
              <p>Select text or place the cursor.</p>
            </div>
            <div className="cheatsheet-actions">
              {cheatsheet.map((item) => <button key={item.label} type="button" onClick={() => insert(item.snippet)}>{item.label}</button>)}
            </div>
          </section>
          <section className="markdown-preview" aria-label="Rendered Markdown preview">
            <span>preview</span>
            {html ? <article dangerouslySetInnerHTML={{ __html: html }} /> : <div className="markdown-empty"><p>Your preview will appear here.</p><button type="button" onClick={() => setMarkdown(readmeStarter)}>&gt; begin with a README</button></div>}
          </section>
        </div>
      </div>

      <div className="markdown-status-line">
        <p className={error ? 'utility-status is-error' : 'utility-status'} aria-live="polite">{error || status}</p>
        <span>{markdown.length.toLocaleString()} characters · saved in this browser</span>
      </div>
    </section>
  )
}
