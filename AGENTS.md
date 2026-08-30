# AGENTS.md — Concise

## What this is
A single static site at **concise.ai9an.com**: one place for the file busywork you'd otherwise Google a different tool for every time. Crop, trim video, resize (to exact pixels or to hit a file size), convert format. The name doesn't describe the tool — the tool should just obviously do its job.

## Non-negotiables
- **100% client-side.** No file the user opens ever leaves the browser. No backend, no upload endpoint, no analytics that touch file content.
- Every tool must work with the page loaded and no network afterward — treat it like an offline-capable app even if you don't ship a full PWA/service-worker cache layer.
- No accounts, no server-side storage.

## Tech stack
- Static site. No build-dependent backend. Framework choice (vanilla JS, or something like Vite + a light framework) is Codex's call — but the *output* must be static files, zero server.
- **ffmpeg.wasm** (`@ffmpeg/ffmpeg` + `@ffmpeg/core`, multi-threaded build) for all video/audio work and any format conversion the Canvas/Image APIs can't handle.
- Browser-native `Canvas`/`OffscreenCanvas`/`createImageBitmap` for still-image crop/resize/convert where that's sufficient and faster than spinning up ffmpeg.

### Cross-origin isolation (important, don't skip this)
Multi-threaded ffmpeg.wasm requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` response headers. GitHub Pages can't set custom headers natively. Options, in order of preference:

1. **Deploy to Cloudflare Pages instead of GitHub Pages.** DNS for ai9an.com is already on Cloudflare, so wiring `concise.ai9an.com` to a Pages project is trivial, it's still free, and a `_headers` file lets you set COOP/COEP cleanly. **Default to this.**
2. Stay on GitHub Pages and use the `coi-serviceworker` polyfill trick to fake the headers client-side.
3. Fall back to the single-threaded ffmpeg-core build (no special headers needed, but noticeably slower on big files).

Pick (1) unless told otherwise.

## Suggested structure
```
/index.html
/src/
  main.js
  lib/ffmpeg.js          # ffmpeg.wasm load/wrapper
  tools/
    crop.js
    trim.js
    resize.js
    convert.js
    (extras...)
  ui/                     # shared components: dropzone, theme toggle, settings panel
  styles/
/public/
  ffmpeg-core files, icons, etc.
_headers                  # Cloudflare Pages COOP/COEP if using option 1
```

## Design direction
- Should have a real, noticeable visual identity — not a generic drag-and-drop utility template. Deliberate type, color, and motion choices.
- **Usability wins every time it conflicts with style.** The core loop — drop file → adjust → export — should never take more than a couple of clicks to reach. Style should be felt, not be an obstacle.
- Light/dark theme minimum, remembered locally (no server, so `localStorage`).
- Settings panel: theme, default output format/quality preferences, maybe "remember last tool used."

## Core features (must-have)
1. **Crop** — freeform + common aspect-ratio presets, live preview, works on images (video frame crop if time allows).
2. **Video trim** — in/out point selection with scrubber and live preview, export trimmed clip.
3. **Resize** — two modes:
   - Exact pixel dimensions, with an aspect-lock toggle.
   - Target file size — iteratively adjust quality/dimensions (or bitrate for video) to land under a size ceiling the user sets.
4. **Convert** — format conversion for images, video, and audio. Floor to support:
   - Images: JPEG, PNG, WebP, AVIF, GIF, BMP, TIFF
   - Video: MP4, WebM, MOV, MKV, AVI, GIF (as export target)
   - Audio: MP3, WAV, OGG, FLAC, M4A
   - Go wider than this list if it's cheap to add via ffmpeg.

## Suggested adjacent tools (nice-to-have — add if time/scope allows)
- QR code generator
- Colour picker / palette extractor from an image
- PDF ⇄ image (PDF page → image, images → PDF)
- Base64 / hash (MD5, SHA-1/256) encode-decode
- EXIF viewer + stripper

## Skill usage
- Use the installed **"impeccable"** skill for this build. *(Placeholder — description of what this skill does/enforces still needed before Codex runs; fill in below or tell Codex directly.)*

## Out of scope for v1
- Accounts, cloud sync/storage, server-side processing of any kind, native mobile apps.

## Before writing code
Ask any remaining questions rather than guessing on: exact format list per tool, whether video crop is in v1 or a fast-follow, and what the "impeccable" skill requires of the build.
