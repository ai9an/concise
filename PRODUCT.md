# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated: React with Vite and TypeScript, chosen for clear component and state boundaries across the canvas editor, export pipeline, settings, and later ffmpeg workflows while preserving a static output. Deployment targets Cloudflare Pages.

## Users

People who occasionally need to crop, trim, resize, or convert a local file and want to finish quickly without installing specialist software or trusting an upload service with their content.

## Product Purpose

Concise replaces the trail of single-purpose file utility sites people normally search for. Success means a user can open a file, make the required adjustment, and export it in a couple of clear steps.

## Positioning

One privacy-preserving workspace for common file transformations: processing happens entirely in the browser, remains usable after the page has loaded and the network disappears, and never sends opened file content to a server.

## Operating Context

Users arrive with a specific file task, often from search or a bookmark, and expect the shortest path from local file to downloaded result. The primary loop is drop file, adjust, preview, export.

## Capabilities and Constraints

- All processing is client-side; there are no upload endpoints, accounts, analytics touching file content, or server-side storage.
- Still-image crop, resize, and browser-supported conversion use Canvas, OffscreenCanvas, and createImageBitmap where appropriate.
- Video, audio, and formats unsupported by native browser APIs use the multi-threaded ffmpeg.wasm build.
- The deployed site uses COOP and COEP response headers on Cloudflare Pages for cross-origin isolation.
- Crop supports freeform and common aspect ratios for images. Video crop is a fast-follow after v1.
- Resize supports exact pixel dimensions with aspect locking and a target-file-size mode.
- V1 conversion supports images (JPEG, PNG, WebP, AVIF, GIF, BMP, TIFF), video (MP4, WebM, MOV, MKV, AVI, GIF), and audio (MP3, WAV, OGG, FLAC, M4A).
- V1 trim supports video in/out selection, live preview, and export.
- The tool bar is grouped into media, code, and writing queues so the library can expand without flattening every action into one row.
- Background removal handles edge-connected plain or already-transparent image backgrounds and offers a default-off ISNet AI matte mode. The model downloads once from Hugging Face and is cached; image inference stays on-device and exports transparent PNG or chroma green.
- Metadata inspection reads broad image, media, PDF, and office-document properties. Safe stripping preserves encoded pixels or media streams for JPEG, PNG, WebP, MP3, and audio/video containers, with cleaned-copy support for PDF and office packages.
- QR generation supports URLs, text, Wi-Fi, email, phone actions, and optional centre images with PNG and SVG export.
- The code and cipher workbench supports Base64/Base64URL, hex, URL and HTML entities, classical ciphers, hashes, and passphrase-based AES-256-GCM.
- The Markdown workspace provides a locally saved editor, sanitised preview, README starter, syntax cheatsheet, and Markdown or HTML downloads.
- Case conversion supports prose capitalization and common developer identifier styles.
- The ASCII lettering workspace supports multiple FIGlet fonts, width and fitting controls, per-glyph solid or stepped colour fades shared by still PNG and terminal previews, and executable ANSI animations exported as callable or runnable Bash and Python code.
- Adjacent utilities are optional only after the core workflow is solid.

## Brand Commitments

The product is named Concise and lives at concise.ai9an.com. Its voice should be direct, calm, and useful. The interface must have a recognizable identity, but usability always outranks decoration.

## Evidence on Hand

There are no testimonials, usage metrics, customer logos, or other commercial proof to present. Future work must not invent them.

## Product Principles

- Files remain private by design, not merely by policy.
- The useful action is always closer than an explanation of it.
- Prefer native browser processing when it is faster; use ffmpeg when it expands capability.
- Show meaningful progress and recovery guidance for expensive or unsupported operations.
- Make power available without making simple jobs feel complicated.

## Accessibility & Inclusion

The web interface must be keyboard accessible, responsive, usable at browser zoom, legible in light and dark themes, and respectful of reduced-motion preferences.
