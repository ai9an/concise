import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = resolve(projectRoot, 'node_modules/@ffmpeg/core-mt/dist/esm')
const outputRoot = resolve(projectRoot, 'public/ffmpeg-core')
const files = ['ffmpeg-core.js', 'ffmpeg-core.wasm', 'ffmpeg-core.worker.js']

await mkdir(outputRoot, { recursive: true })
await Promise.all(files.map((file) => copyFile(resolve(sourceRoot, file), resolve(outputRoot, file))))
