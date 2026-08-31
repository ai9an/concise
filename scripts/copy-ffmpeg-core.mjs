import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = resolve(projectRoot, 'node_modules/@ffmpeg/core-mt/dist/esm')
const outputRoot = resolve(projectRoot, 'public/ffmpeg-core')
const files = ['ffmpeg-core.js', 'ffmpeg-core.worker.js']
const wasmSource = resolve(sourceRoot, 'ffmpeg-core.wasm')
const wasmOutput = resolve(outputRoot, 'ffmpeg-core.wasm')
const wasmParts = ['ffmpeg-core.wasm.part-0', 'ffmpeg-core.wasm.part-1']
const cloudflareAssetLimit = 25 * 1024 * 1024

await mkdir(outputRoot, { recursive: true })
await Promise.all(files.map((file) => copyFile(resolve(sourceRoot, file), resolve(outputRoot, file))))

const wasm = await readFile(wasmSource)
const splitAt = Math.ceil(wasm.byteLength / 2)
const chunks = [wasm.subarray(0, splitAt), wasm.subarray(splitAt)]

if (chunks.some((chunk) => chunk.byteLength >= cloudflareAssetLimit)) {
  throw new Error('FFmpeg WASM chunks exceed Cloudflare\'s 25 MiB per-file limit.')
}

await Promise.all(wasmParts.map((file, index) => writeFile(resolve(outputRoot, file), chunks[index])))
await rm(wasmOutput, { force: true })
