# Concise

Private, browser-only file utilities for crop, resize, trim, and conversion.

## Local development

```sh
npm install
npm run dev
```

The ffmpeg multi-threaded core is copied from `@ffmpeg/core-mt` into `public/ffmpeg-core` during installation and before every production build. No runtime CDN is required.

## Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`
- Custom domain: `concise.ai9an.com`

The root `_headers` file is copied into `dist` by Vite. It sets COOP and COEP for the cross-origin isolation required by multi-threaded ffmpeg.wasm.

Direct deployment is also available with `npm run deploy` after authenticating Wrangler.
