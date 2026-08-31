import { fetchFile } from '@ffmpeg/util'
import exifr from 'exifr'
import mediaInfoFactory from 'mediainfo.js'
import mediaInfoWasmUrl from 'mediainfo.js/MediaInfoModule.wasm?url'
import { unzipSync, zipSync } from 'fflate'
import { getFfmpeg } from '../lib/ffmpeg'

export type MetadataEntry = { key: string; value: string }
export type MetadataSection = { name: string; entries: MetadataEntry[] }
export type StripResult = { blob: Blob; detail: string }

const decoder = new TextDecoder()
const encoder = new TextEncoder()
const officePattern = /\.(docx|xlsx|pptx|odt|ods|odp|epub)$/i
const mediaPattern = /\.(mp4|m4v|mov|mkv|webm|avi|wmv|flv|mpeg|mpg|ts|mts|m2ts|mp3|wav|ogg|oga|opus|flac|m4a|aac|wma|aiff|aif|amr)$/i

function blobBuffer(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}

function cleanValue(value: unknown) {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value.replace(/\0/g, '').trim()
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value)
  if (value instanceof Uint8Array || value instanceof ArrayBuffer) return `[binary data · ${value.byteLength} bytes]`
  return ''
}

function flatten(value: unknown, prefix = '', depth = 0, entries: MetadataEntry[] = []) {
  if (entries.length >= 900 || depth > 5 || value === null || value === undefined) return entries
  const cleaned = cleanValue(value)
  if (cleaned) {
    entries.push({ key: prefix || 'value', value: cleaned })
    return entries
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => flatten(item, `${prefix}${prefix ? ' · ' : ''}${index + 1}`, depth + 1, entries))
    return entries
  }
  if (typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      if (key === 'data' && (item instanceof Uint8Array || typeof item === 'string' && item.length > 8000)) return
      flatten(item, `${prefix}${prefix ? ' · ' : ''}${key.replace(/_/g, ' ')}`, depth + 1, entries)
    })
  }
  return entries
}

function fileFacts(file: File): MetadataSection {
  return {
    name: 'file',
    entries: [
      { key: 'name', value: file.name },
      { key: 'reported type', value: file.type || 'not reported' },
      { key: 'size', value: `${file.size.toLocaleString()} bytes` },
      { key: 'last modified', value: new Date(file.lastModified).toISOString() },
    ],
  }
}

async function inspectExif(file: File) {
  try {
    const data = await exifr.parse(file, {
      tiff: true,
      xmp: true,
      icc: true,
      iptc: true,
      jfif: true,
      ihdr: true,
      translateKeys: true,
      translateValues: true,
      reviveValues: true,
      mergeOutput: false,
    })
    if (!data) return []
    const sections: MetadataSection[] = []
    for (const [name, value] of Object.entries(data as Record<string, unknown>)) {
      const entries = flatten(value)
      if (entries.length) sections.push({ name: name.toUpperCase(), entries })
    }
    if (!sections.length) {
      const entries = flatten(data)
      if (entries.length) sections.push({ name: 'embedded image metadata', entries })
    }
    return sections
  } catch {
    return []
  }
}

async function inspectMedia(file: File) {
  try {
    const mediaInfo = await mediaInfoFactory({ format: 'object', full: true, locateFile: () => mediaInfoWasmUrl })
    try {
      const result = await mediaInfo.analyzeData(file.size, async (size, offset) => new Uint8Array(await file.slice(offset, offset + size).arrayBuffer()))
      if (!result.media) return []
      const tracks = result.media.track
      return tracks.map((track, index) => ({
        name: `${track['@type'].toLowerCase()}${tracks.filter((item) => item['@type'] === track['@type']).length > 1 ? ` ${index + 1}` : ''}`,
        entries: flatten(track).filter((entry) => !/^(count|status|stream kind|stream count)/i.test(entry.key)),
      })).filter((section) => section.entries.length)
    } finally {
      mediaInfo.close()
    }
  } catch {
    return []
  }
}

async function inspectPdf(file: File) {
  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) return []
  try {
    const { PDFDocument } = await import('pdf-lib')
    const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true, updateMetadata: false })
    const entries = [
      ['pages', pdf.getPageCount()],
      ['title', pdf.getTitle()],
      ['author', pdf.getAuthor()],
      ['subject', pdf.getSubject()],
      ['keywords', pdf.getKeywords()],
      ['creator', pdf.getCreator()],
      ['producer', pdf.getProducer()],
      ['created', pdf.getCreationDate()],
      ['modified', pdf.getModificationDate()],
    ].flatMap(([key, value]) => value === undefined ? [] : [{ key: String(key), value: cleanValue(value) }])
    return entries.length ? [{ name: 'PDF document info', entries }] : []
  } catch {
    return []
  }
}

function xmlFields(xml: string) {
  const entries: MetadataEntry[] = []
  const fieldPattern = /<(?:dc|dcterms|cp|meta):([\w-]+)(?:\s[^>]*)?>([\s\S]*?)<\/(?:dc|dcterms|cp|meta):\1>/gi
  for (const match of xml.matchAll(fieldPattern)) {
    const value = match[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()
    if (value) entries.push({ key: match[1].replace(/-/g, ' '), value })
  }
  return entries
}

async function inspectOffice(file: File) {
  if (!officePattern.test(file.name)) return []
  try {
    const archive = unzipSync(new Uint8Array(await file.arrayBuffer()))
    const entries: MetadataEntry[] = []
    for (const path of ['docProps/core.xml', 'docProps/app.xml', 'docProps/custom.xml', 'meta.xml', 'META-INF/metadata.xml']) {
      if (archive[path]) entries.push(...xmlFields(decoder.decode(archive[path])).map((entry) => ({ ...entry, key: `${path} · ${entry.key}` })))
    }
    return entries.length ? [{ name: 'document properties', entries }] : []
  } catch {
    return []
  }
}

export async function inspectMetadata(file: File) {
  const [exif, media, pdf, office] = await Promise.all([
    inspectExif(file),
    inspectMedia(file),
    inspectPdf(file),
    inspectOffice(file),
  ])
  const sections = [fileFacts(file), ...exif, ...media, ...pdf, ...office]
  const seen = new Set<string>()
  return sections.map((section) => ({
    ...section,
    entries: section.entries.filter((entry) => {
      const id = `${section.name}\0${entry.key}\0${entry.value}`
      if (seen.has(id)) return false
      seen.add(id)
      return true
    }),
  })).filter((section) => section.entries.length)
}

function stripJpeg(bytes: Uint8Array) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('Invalid JPEG data.')
  const chunks: Uint8Array[] = [bytes.slice(0, 2)]
  let offset = 2
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) break
    const marker = bytes[offset + 1]
    if (marker === 0xda) {
      chunks.push(bytes.slice(offset))
      break
    }
    if (marker === 0xd9) {
      chunks.push(bytes.slice(offset, offset + 2))
      break
    }
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3]
    if (length < 2 || offset + length + 2 > bytes.length) throw new Error('Malformed JPEG segment.')
    const removable = marker === 0xfe || marker === 0xe1 || marker === 0xed
    if (!removable) chunks.push(bytes.slice(offset, offset + length + 2))
    offset += length + 2
  }
  return new Blob(chunks.map(blobBuffer), { type: 'image/jpeg' })
}

function stripPng(bytes: Uint8Array) {
  const signature = bytes.slice(0, 8)
  if (decoder.decode(signature.slice(1, 4)) !== 'PNG') throw new Error('Invalid PNG data.')
  const chunks: Uint8Array[] = [signature]
  const removable = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt', 'tIME'])
  let offset = 8
  while (offset + 12 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 4)
    const length = view.getUint32(0)
    const end = offset + 12 + length
    if (end > bytes.length) throw new Error('Malformed PNG chunk.')
    const type = decoder.decode(bytes.slice(offset + 4, offset + 8))
    if (!removable.has(type)) chunks.push(bytes.slice(offset, end))
    offset = end
    if (type === 'IEND') break
  }
  return new Blob(chunks.map(blobBuffer), { type: 'image/png' })
}

function stripWebp(bytes: Uint8Array) {
  if (decoder.decode(bytes.slice(0, 4)) !== 'RIFF' || decoder.decode(bytes.slice(8, 12)) !== 'WEBP') throw new Error('Invalid WebP data.')
  const body: Uint8Array[] = []
  let offset = 12
  let total = 4
  while (offset + 8 <= bytes.length) {
    const type = decoder.decode(bytes.slice(offset, offset + 4))
    const length = new DataView(bytes.buffer, bytes.byteOffset + offset + 4, 4).getUint32(0, true)
    const padded = length + (length % 2)
    const end = offset + 8 + padded
    if (end > bytes.length) throw new Error('Malformed WebP chunk.')
    if (type !== 'EXIF' && type !== 'XMP ') {
      const chunk = bytes.slice(offset, end)
      if (type === 'VP8X' && length >= 1) chunk[8] &= ~0x0c
      body.push(chunk)
      total += chunk.length
    }
    offset = end
  }
  const header = new Uint8Array(12)
  header.set(encoder.encode('RIFF'), 0)
  new DataView(header.buffer).setUint32(4, total, true)
  header.set(encoder.encode('WEBP'), 8)
  return new Blob([blobBuffer(header), ...body.map(blobBuffer)], { type: 'image/webp' })
}

function synchsafe(bytes: Uint8Array, offset: number) {
  return ((bytes[offset] & 0x7f) << 21) | ((bytes[offset + 1] & 0x7f) << 14) | ((bytes[offset + 2] & 0x7f) << 7) | (bytes[offset + 3] & 0x7f)
}

function stripMp3(bytes: Uint8Array) {
  let start = 0
  let end = bytes.length
  if (decoder.decode(bytes.slice(0, 3)) === 'ID3' && bytes.length >= 10) start = 10 + synchsafe(bytes, 6) + (bytes[5] & 0x10 ? 10 : 0)
  if (end >= 128 && decoder.decode(bytes.slice(end - 128, end - 125)) === 'TAG') end -= 128
  return new Blob([blobBuffer(bytes.slice(start, end))], { type: 'audio/mpeg' })
}

async function stripPdf(file: File) {
  const { PDFDict, PDFDocument, PDFName } = await import('pdf-lib')
  const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true, updateMetadata: false })
  pdf.catalog.delete(PDFName.of('Metadata'))
  const infoRef = pdf.context.trailerInfo.Info
  if (infoRef) {
    const info = pdf.context.lookup(infoRef, PDFDict)
    for (const key of info.keys()) info.delete(key)
  }
  return new Blob([blobBuffer(await pdf.save({ useObjectStreams: true }))], { type: 'application/pdf' })
}

function scrubXml(xml: string) {
  const privateFields = '(?:dc:creator|cp:lastModifiedBy|dcterms:created|dcterms:modified|cp:keywords|dc:subject|dc:title|dc:description|meta:initial-creator|meta:creation-date|meta:printed-by|meta:editing-duration|meta:editing-cycles)'
  return xml
    .replace(new RegExp(`<(${privateFields})(?:\\s[^>]*)?>[\\s\\S]*?<\\/\\1>`, 'gi'), '<$1></$1>')
    .replace(/<meta:user-defined\b[\s\S]*?<\/meta:user-defined>/gi, '')
    .replace(/<property\b[\s\S]*?<\/property>/gi, '')
}

async function stripOffice(file: File) {
  const archive = unzipSync(new Uint8Array(await file.arrayBuffer()))
  for (const path of ['docProps/core.xml', 'docProps/custom.xml', 'meta.xml', 'META-INF/metadata.xml']) {
    if (archive[path]) archive[path] = encoder.encode(scrubXml(decoder.decode(archive[path])))
  }
  return new Blob([blobBuffer(zipSync(archive, { level: 6 }))], { type: file.type || 'application/zip' })
}

async function stripMedia(file: File, onProgress?: (value: number) => void) {
  const extension = file.name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() || 'bin'
  const input = `metadata-input.${extension}`
  const output = `metadata-stripped.${extension}`
  const ffmpeg = await getFfmpeg(onProgress)
  try {
    await ffmpeg.writeFile(input, await fetchFile(file))
    const code = await ffmpeg.exec(['-i', input, '-map', '0', '-map_metadata', '-1', '-map_chapters', '-1', '-c', 'copy', output])
    if (code !== 0) throw new Error('The media container refused a metadata-only remux.')
    const data = await ffmpeg.readFile(output)
    return new Blob([blobBuffer(data instanceof Uint8Array ? data : encoder.encode(data))], { type: file.type || 'application/octet-stream' })
  } finally {
    await Promise.allSettled([ffmpeg.deleteFile(input), ffmpeg.deleteFile(output)])
  }
}

export function canStripMetadata(file: File) {
  return /\.(jpe?g|png|webp|mp3|pdf)$/i.test(file.name) || officePattern.test(file.name) || mediaPattern.test(file.name) || file.type.startsWith('audio/') || file.type.startsWith('video/')
}

export async function stripMetadata(file: File, onProgress?: (value: number) => void): Promise<StripResult> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (/\.jpe?g$/i.test(file.name) || file.type === 'image/jpeg') return { blob: stripJpeg(bytes), detail: 'EXIF, XMP, IPTC, and comments removed without recompressing pixels' }
  if (/\.png$/i.test(file.name) || file.type === 'image/png') return { blob: stripPng(bytes), detail: 'EXIF, text, time, and XMP-style text chunks removed without recompressing pixels' }
  if (/\.webp$/i.test(file.name) || file.type === 'image/webp') return { blob: stripWebp(bytes), detail: 'EXIF and XMP chunks removed without recompressing pixels or animation' }
  if (/\.mp3$/i.test(file.name) || file.type === 'audio/mpeg') return { blob: stripMp3(bytes), detail: 'ID3v1 and ID3v2 tags removed without re-encoding audio' }
  if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') return { blob: await stripPdf(file), detail: 'document info and XMP catalog metadata removed; page content preserved' }
  if (officePattern.test(file.name)) return { blob: await stripOffice(file), detail: 'creator, timestamps, title, subject, keywords, and custom properties cleared from the document package' }
  if (mediaPattern.test(file.name) || file.type.startsWith('audio/') || file.type.startsWith('video/')) return { blob: await stripMedia(file, onProgress), detail: 'container metadata and chapters removed with stream copy; media was not re-encoded' }
  throw new Error('This format can be inspected here, but safe metadata stripping is not available yet.')
}
