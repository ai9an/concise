import { copyFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
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
