import { useDeferredValue, useMemo, useState } from 'react'
import { convertCase, countText, type CaseMode } from '../tools/case'

const modes: Array<{ id: CaseMode; label: string }> = [
  { id: 'sentence', label: 'Sentence case' },
  { id: 'title', label: 'Title Case' },
  { id: 'upper', label: 'UPPER CASE' },
  { id: 'lower', label: 'lower case' },
  { id: 'camel', label: 'camelCase' },
  { id: 'pascal', label: 'PascalCase' },
  { id: 'snake', label: 'snake_case' },
  { id: 'kebab', label: 'kebab-case' },
  { id: 'constant', label: 'CONSTANT_CASE' },
  { id: 'dot', label: 'dot.case' },
  { id: 'path', label: 'path/case' },
  { id: 'alternating', label: 'aLtErNaTiNg' },
  { id: 'inverse', label: 'iNVERSE cASE' },
]

function downloadText(value: string) {
  const url = URL.createObjectURL(new Blob([value], { type: 'text/plain;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'concise-case.txt'
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function CaseTool() {
  const [input, setInput] = useState('Make this text exactly how you need it.')
  const [mode, setMode] = useState<CaseMode>('sentence')
  const [status, setStatus] = useState('ready · text stays in this browser')
  const deferredInput = useDeferredValue(input)
  const output = useMemo(() => convertCase(deferredInput, mode), [deferredInput, mode])
  const counts = useMemo(() => countText(output), [output])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output)
      setStatus('copied to clipboard')
    } catch {
      setStatus('clipboard access was blocked · select the output manually')
    }
  }

  return (
    <section className="utility-workspace case-workspace">
      <div className="utility-heading">
        <h1>case.</h1>
        <p>Reshape prose, identifiers, filenames, and paths without changing the words.</p>
      </div>

      <div className="case-mode-line" role="group" aria-label="Case conversion">
        {modes.map((item) => (
          <button key={item.id} type="button" className={mode === item.id ? 'is-active' : ''} onClick={() => setMode(item.id)}>{item.label}</button>
        ))}
      </div>

      <div className="codec-grid case-grid">
        <label className="text-plane">
          <span>source</span>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} spellCheck="true" />
        </label>
        <label className="text-plane">
          <span>converted · {modes.find((item) => item.id === mode)?.label}</span>
          <textarea value={output} readOnly aria-live="polite" />
        </label>
      </div>

      <div className="utility-action-line">
        <div className="dual-command">
          <button className="export-command utility-export" type="button" onClick={copy} disabled={!output}><span aria-hidden="true">&gt;</span> copy result</button>
          <button className="secondary-command" type="button" onClick={() => downloadText(output)} disabled={!output}>download .txt</button>
          <button className="secondary-command" type="button" onClick={() => setInput('')} disabled={!input}>clear</button>
        </div>
        <p className="utility-status" aria-live="polite">{counts.characters} chars · {counts.words} words · {counts.lines} lines · {status}</p>
      </div>
    </section>
  )
}
