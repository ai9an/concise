import { useState } from 'react'
import { base64ToBytes, bytesToBase64, runCodec, type CodecOperation } from '../tools/text-codec'

const operations: Array<{ value: CodecOperation; label: string; group: 'encode' | 'classic' | 'secure' }> = [
  { value: 'base64-encode', label: 'Base64 encode', group: 'encode' },
  { value: 'base64-decode', label: 'Base64 decode', group: 'encode' },
  { value: 'base64url-encode', label: 'Base64 URL encode', group: 'encode' },
  { value: 'base64url-decode', label: 'Base64 URL decode', group: 'encode' },
  { value: 'hex-encode', label: 'hex encode', group: 'encode' },
  { value: 'hex-decode', label: 'hex decode', group: 'encode' },
  { value: 'url-encode', label: 'URL encode', group: 'encode' },
  { value: 'url-decode', label: 'URL decode', group: 'encode' },
  { value: 'html-encode', label: 'HTML entities encode', group: 'encode' },
  { value: 'html-decode', label: 'HTML entities decode', group: 'encode' },
  { value: 'rot13', label: 'ROT13', group: 'classic' },
  { value: 'caesar-encode', label: 'Caesar encode', group: 'classic' },
  { value: 'caesar-decode', label: 'Caesar decode', group: 'classic' },
  { value: 'atbash', label: 'Atbash', group: 'classic' },
  { value: 'morse-encode', label: 'Morse encode', group: 'classic' },
  { value: 'morse-decode', label: 'Morse decode', group: 'classic' },
  { value: 'sha256', label: 'SHA-256 hash', group: 'secure' },
  { value: 'sha512', label: 'SHA-512 hash', group: 'secure' },
  { value: 'aes-encrypt', label: 'AES-256 encrypt', group: 'secure' },
  { value: 'aes-decrypt', label: 'AES-256 decrypt', group: 'secure' },
]

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function CryptoTool() {
  const [group, setGroup] = useState<'encode' | 'classic' | 'secure'>('encode')
  const [operation, setOperation] = useState<CodecOperation>('base64-encode')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [shift, setShift] = useState(3)
  const [passphrase, setPassphrase] = useState('')
  const [status, setStatus] = useState('nothing leaves this browser')
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)

  const selectGroup = (next: typeof group) => {
    setGroup(next)
    const first = operations.find((item) => item.group === next)
    if (first) setOperation(first.value)
  }

  const process = async () => {
    setWorking(true)
    setError('')
    try {
      const result = await runCodec(operation, input, shift, passphrase)
      setOutput(result)
      setStatus(`${operations.find((item) => item.value === operation)?.label ?? 'operation'} complete · local only`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That input could not be processed.')
    } finally {
      setWorking(false)
    }
  }

  const fileToDataUrl = async (file: File) => {
    const bytes = new Uint8Array(await file.arrayBuffer())
    setOutput(`data:${file.type || 'application/octet-stream'};base64,${bytesToBase64(bytes)}`)
    setStatus(`${file.name} encoded · ${(file.size / 1024).toFixed(1)} KB`)
    setError('')
  }

  const downloadDecoded = () => {
    try {
      download(new Blob([base64ToBytes(input)]), 'concise-decoded.bin')
      setStatus('decoded bytes downloaded locally')
      setError('')
    } catch {
      setError('The input is not valid Base64 data.')
    }
  }

  return (
    <section className="utility-workspace crypto-workspace">
      <div className="utility-heading">
        <h1>code & cipher.</h1>
        <p>Encode, decode, hash, and encrypt text or files with browser-native tools.</p>
      </div>

      <div className="codec-toolbar">
        <div className="mode-line" role="group" aria-label="Codec category">
          <button type="button" className={group === 'encode' ? 'is-active' : ''} onClick={() => selectGroup('encode')}>encode / decode</button>
          <button type="button" className={group === 'classic' ? 'is-active' : ''} onClick={() => selectGroup('classic')}>classic ciphers</button>
          <button type="button" className={group === 'secure' ? 'is-active' : ''} onClick={() => selectGroup('secure')}>hash / secure</button>
        </div>
        <label>
          <span>operation</span>
          <select value={operation} onChange={(event) => setOperation(event.target.value as CodecOperation)}>
            {operations.filter((item) => item.group === group).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        {operation.startsWith('caesar') ? <label><span>shift · {shift}</span><input type="range" min="1" max="25" value={shift} onChange={(event) => setShift(Number(event.target.value))} /></label> : null}
        {operation.startsWith('aes-') ? <label><span>passphrase</span><input type="password" autoComplete="off" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} /></label> : null}
      </div>

      <div className="codec-grid">
        <label className="text-plane">
          <span>input</span>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} spellCheck="false" placeholder="Paste text or encoded data here" />
        </label>
        <label className="text-plane">
          <span>output</span>
          <textarea value={output} readOnly spellCheck="false" placeholder="The result appears here" />
        </label>
      </div>

      <div className="codec-actions">
        <button className="export-command utility-export" type="button" onClick={process} disabled={working || !input}>
          <span aria-hidden="true">&gt;</span> {working ? 'working' : 'run operation'}
          <span className="cursor" aria-hidden="true" />
        </button>
        <button className="secondary-command" type="button" disabled={!output} onClick={() => {
          void navigator.clipboard.writeText(output).then(() => setStatus('output copied')).catch(() => setError('Clipboard permission was denied.'))
        }}>copy output</button>
        <button className="secondary-command" type="button" disabled={!output} onClick={() => {
          setInput(output)
          setOutput(input)
          setStatus('input and output swapped')
        }}>swap</button>
      </div>

      <div className="file-code-actions">
        <label className="inline-file-action">
          <span>&gt; file to data URL</span>
          <input type="file" onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void fileToDataUrl(file)
          }} />
        </label>
        <button className="quiet-action" type="button" onClick={downloadDecoded}>Base64 input to file</button>
        <button className="quiet-action" type="button" disabled={!output} onClick={() => download(new Blob([output], { type: 'text/plain' }), 'concise-output.txt')}>download text</button>
      </div>

      <p className="utility-note">ROT13, Caesar, Atbash, and Morse are reversible puzzles, not security. Secure encryption uses AES-256-GCM with a PBKDF2-derived key; Concise cannot recover a lost passphrase.</p>
      <p className={error ? 'utility-status is-error' : 'utility-status'} aria-live="polite">{error || status}</p>
    </section>
  )
}
