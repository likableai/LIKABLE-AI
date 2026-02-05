# Meme Studio API

## Overview

Meme Studio supports **image** (Gemini Flash/Pro or Reve AI), **video** (LTX Studio), and **GIF** (LTX Studio + FFmpeg). DALL-E is not used.

- **Images:** Google Gemini (Flash 2.5 or Pro) or Reve AI. At least one of `GOOGLE_GEMINI_API_KEY` or `REVE_API_KEY` must be set.
- **Video:** LTX Studio (LTX-2). Requires `LTX_API_KEY`.
- **GIF:** Short video from LTX, then converted to GIF on the server. Requires `LTX_API_KEY` and FFmpeg on PATH (or use format `video` and convert elsewhere).

## Environment

| Variable | Required | Purpose |
|----------|----------|---------|
| `GOOGLE_GEMINI_API_KEY` | For image (Gemini) | Gemini image generation (Flash / Pro) |
| `REVE_API_KEY` | For image (Reve) | Reve AI image generation |
| `LTX_API_KEY` | For video/GIF | LTX Studio text-to-video / image-to-video |
| FFmpeg on PATH | For GIF only | Convert MP4 to GIF; omit to disable GIF and use `format: 'video'` |

At least one of `GOOGLE_GEMINI_API_KEY` or `REVE_API_KEY` is needed for image generation. Both can be set; the client chooses provider via `imageProvider`.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/meme/templates` | List crypto meme templates |
| GET | `/api/meme/styles` | List meme styles (e.g. Classic, DeFi, NGMI) |
| GET | `/api/meme/providers` | List image providers: `[{ value, label }]` (Gemini, Reve) |
| POST | `/api/meme/generate` | Generate meme; returns `{ url, format }` |
| GET | `/api/meme/file/:filename` | Serve generated file (image, video, or GIF) by filename |

## POST /api/meme/generate

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `idea` | string | Yes | Meme idea or caption |
| `format` | string | No | `image` (default), `gif`, or `video` |
| `style` | string | No | Meme style (default `Classic`) |
| `imageProvider` | string | No | `gemini` (default) or `reve`; used when `format === 'image'` |
| `geminiModel` | string | No | `flash` (default) or `pro`; used when `imageProvider === 'gemini'` |
| `templateId` | string | No | Template id (e.g. `custom`, `drake`) |
| `topText` | string | No | Top overlay text |
| `bottomText` | string | No | Bottom overlay text |
| `referenceUrl` | string | No | URL of reference image/video (e.g. for image-to-video) |
| `referenceType` | string | No | `image`, `gif`, or `video` |

**Example**

```json
{
  "idea": "Crypto trader checking portfolio at 3am",
  "format": "image",
  "style": "Stonks",
  "imageProvider": "gemini",
  "geminiModel": "flash"
}
```

**Response**

```json
{
  "url": "https://cdn.reveai.org/...",
  "format": "image"
}
```

or for Gemini / video / GIF (server-saved files):

```json
{
  "url": "/api/meme/file/550e8400-e29b-41d4-a716-446655440000.png",
  "format": "image"
}
```

When `url` is a relative path starting with `/api/meme/file/`, the frontend must resolve it against the backend base URL (e.g. `BACKEND_ORIGIN + url`) before using it for display or download. Reve returns a full URL; use it as-is.

## GET /api/meme/file/:filename

Serves a generated file from the server `generated/` directory. `filename` must match `[a-zA-Z0-9-]+\.(mp4|gif|png|jpg|jpeg)` (no path traversal). Response is the raw file with appropriate `Content-Type` (e.g. `image/png`, `video/mp4`, `image/gif`).

## Frontend

The app uses the endpoints above: it loads templates, styles, and providers; sends `idea`, `format`, `style`, `imageProvider`, and `geminiModel` (for image) to `POST /api/meme/generate`; and resolves relative `url` values to the backend origin for preview and download. For image format it shows provider and Gemini model dropdowns; for video/GIF it displays `<video>` or `<img>` and offers download via the resolved URL.
