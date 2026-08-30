import { useRef, useState } from 'react'

type DropzoneProps = {
  onFile: (file: File) => void
}

export function Dropzone({ onFile }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const takeFirst = (files: FileList | null) => {
    const file = files?.item(0)
    if (file) onFile(file)
  }

  return (
    <section
      className={`drop-plane${dragging ? ' is-dragging' : ''}`}
      onDragEnter={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setDragging(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        takeFirst(event.dataTransfer.files)
      }}
    >
      <button className="open-command" type="button" onClick={() => inputRef.current?.click()}>
        <span aria-hidden="true">&gt;</span>
        <span>drop the file.</span>
        <span className="cursor" aria-hidden="true" />
      </button>
      <p>or press to choose from this device</p>
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/*,video/*,audio/*"
        onChange={(event) => takeFirst(event.target.files)}
      />
    </section>
  )
}
