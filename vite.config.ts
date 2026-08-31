import { copyFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'same-origin',
}

export default defineConfig({
  optimizeDeps: { exclude: ['@ffmpeg/ffmpeg'] },
  server: { headers: isolationHeaders },
  preview: { headers: isolationHeaders },
  plugins: [
    react(),
    {
      name: 'copy-cloudflare-headers',
      async writeBundle() {
        const output = resolve(import.meta.dirname, 'dist')
        await mkdir(output, { recursive: true })
        await copyFile(resolve(import.meta.dirname, '_headers'), resolve(output, '_headers'))
      },
    },
  ],
})
