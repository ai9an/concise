<p align="center">
  <img src="assets/logo.png" width="350" alt="Concise" />
</p>
<p align="center">
  <img src="assets/ascii-logo.png" width="676" alt="Concise" />
</p>

<p align="center">
  Private, browser-only tools for the small file jobs that should take seconds.
</p>

<p align="center">
  <a href="https://concise.ai9an.com">concise.ai9an.com</a> -
  <a href="#preview">preview</a>
</p>

## What it is

Concise is a static file utility site for cropping, resizing, trimming, and converting files. Every operation happens in the browser: files are never uploaded, stored remotely, or sent to an API.

The core loop is deliberately short:

```text
open a local file → adjust it → export a local download
```

## Features
 - image cropping
 - image resizing (to maxium size or pixel count)
 - file converting, [supported formats](#Formats)
 - local-first
 - fast exports with quality and format controls

## Privacy and offline behavior

- No file upload endpoint
- No accounts or server-side storage
- No analytics that receive file content
- No runtime CDN dependency for FFmpeg: the multi-threaded core is copied into the static build
- Once the page and its local processing assets are loaded, file work continues without a network connection

## Formats

### image:
    jpeg, png, webp, avif, gif, bmp, tiff
### video:
    mp4, webm, mov, mkv, avi, gif
### audio:
    mp3, wav, ogg, flac, m4a


## Run or test locally

Requirements: Node.js 20+ and npm.

```sh
npm install
npm run dev
```

### Quality checks

```sh
npm run typecheck
npm run build
```
## Preview

<p align="center">
  <img src="assets/preview.png" width="4096" alt="Concise" />
</p>

## Project layout

```text
assets/                 Source brand assets
public/ffmpeg-core/     Locally served multi-threaded FFmpeg core files
src/
  lib/ffmpeg.ts         FFmpeg loader and wrapper foundation
  tools/                Crop, resize, trim, and conversion logic
  ui/                   Dropzone, crop canvas, and settings UI
  styles/               Global visual system
_headers                Cloudflare Pages security and isolation headers
wrangler.jsonc          Cloudflare Pages configuration
```

## Contributing

Keep file processing client-side. Do not add upload endpoints, server-side processing, account requirements, or tracking that can access user file content.

Run `npm run typecheck` and `npm run build` before opening a pull request.

## 

built with [codex](github.com/openai/codex) and [impeccable](https://github.com/pbakaus/impeccable)
