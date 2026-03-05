# SlydeSync

**SlydeSync** is a lightweight slideshow controller built for running “TV / kiosk / display” image slideshows from a simple web UI.

- **Admin**: upload images, manage the queue (reorder/delete/clear), and tweak playback settings
- **Display**: fullscreen slideshow player designed for screens, with auto-refresh and fullscreen toggle

**Live demo**
- Admin: https://slyde-sync.vercel.app/admin :contentReference[oaicite:1]{index=1}
- Display: https://slyde-sync.vercel.app/display :contentReference[oaicite:2]{index=2}

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [How it works](#how-it-works)
- [Screenshots](#screenshots)
- [Project structure](#project-structure)
- [API](#api)
- [Local development](#local-development)
- [Deployment](#deployment)
- [Known limitations](#known-limitations)
- [Roadmap](#roadmap)

---

## Features

### Admin panel (`/admin`)
- Upload multiple images (drag/click upload UI)
- Maintains a slideshow **queue**
- Reorder queue items (move up/down)
- Delete single items
- Clear all items (with confirmation)
- Playback settings:
  - Interval (ms)
  - Transition (`fade` / `none`)
  - Fit mode (`contain` / `cover`)
  - Shuffle
  - Captions (show filename)
- Shows storage usage estimate and number of items :contentReference[oaicite:3]{index=3}

### Display mode (`/display`)
- Fullscreen slideshow playback
- Auto-hides controls after mouse inactivity
- Fullscreen toggle button
- Stays up-to-date with Admin changes using:
  - `BroadcastChannel` messages (fast cross-tab sync)
  - `localStorage` update key listeners
  - Polling fallback (interval refresh) :contentReference[oaicite:4]{index=4}

---

## Tech stack

- **Next.js** (App Router) :contentReference[oaicite:5]{index=5}
- **React 19** :contentReference[oaicite:6]{index=6}
- **Tailwind CSS** :contentReference[oaicite:7]{index=7}
- **lucide-react** icons :contentReference[oaicite:8]{index=8}

---

## How it works

SlydeSync is intentionally simple:

1. **Uploads** go to a server route (`/api/images/upload`) that:
   - accepts `multipart/form-data`
   - writes files to `public/uploads/`
   - appends metadata to a manifest file `data/images.json` :contentReference[oaicite:9]{index=9}

2. The **manifest** (`data/images.json`) is the source of truth for the queue:
   - `GET /api/images` returns the current list
   - `POST /api/images` replaces the list and also performs best-effort cleanup of removed upload files :contentReference[oaicite:10]{index=10}

3. The **Admin page** reads images/settings on mount, and persists changes:
   - images are saved through `saveImages()` which posts the updated queue to `/api/images`
   - settings are saved into browser `localStorage` :contentReference[oaicite:11]{index=11}

4. The **Display page** continuously refreshes so it can act like a kiosk:
   - refresh on window focus
   - listen for cross-tab updates (BroadcastChannel + storage key)
   - poll every ~1.5s as a fallback :contentReference[oaicite:12]{index=12}

---

## Screenshots

Add screenshots to make the README pop.

### Recommended screenshot files

Create these files in your repo:


docs/screenshots/admin.png
docs/screenshots/display.png


Then the images below will render automatically:

![Admin Panel](docs/screenshots/admin.png)
![Display Mode](docs/screenshots/display.png)

### How to capture screenshots from the hosted site

1. Open:
   - https://slyde-sync.vercel.app/admin
   - https://slyde-sync.vercel.app/display
2. Use your browser screenshot tooling:
   - **Mac**: `Shift + Cmd + 4` (or `Shift + Cmd + 5` for window/full-page tools)
   - **Windows**: Snipping Tool / `Win + Shift + S`
   - **Chrome**: DevTools → Command Menu → “Screenshot” / “Capture full size screenshot”
3. Save them as:
   - `admin.png`
   - `display.png`
4. Put them into `docs/screenshots/` and commit.

---

## Project structure

High-level layout (most relevant files):


app/
layout.jsx # App shell + NavBar
page.jsx # Redirects to /admin
admin/page.jsx # Admin panel UI
display/page.jsx # Display/kiosk UI
api/
images/
route.js # GET/POST images manifest
upload/route.js # Upload endpoint (multipart)
components/
NavBar.jsx
UploadBox.jsx
ImageList.jsx
SettingsPanel.jsx
SlideshowPlayer.jsx
utils/
storage.js # client storage helpers + cross-tab sync signals
data/
images.json # generated at runtime (manifest)
public/
uploads/ # uploaded images stored here


References:
- routes + layout: :contentReference[oaicite:13]{index=13}
- API manifest + upload: :contentReference[oaicite:14]{index=14}
- storage helper: :contentReference[oaicite:15]{index=15}

---

## API

### `GET /api/images`
Returns the current queue from `data/images.json`.
Also validates that previously uploaded `/uploads/*` files still exist. :contentReference[oaicite:16]{index=16}

**Response**
```json
{
  "images": [
    {
      "id": "uuid-or-fallback",
      "name": "my-photo.jpg",
      "url": "/uploads/12345-my-photo.jpg",
      "createdAt": "2026-03-05T12:34:56.000Z",
      "size": 123456
    }
  ]
}
POST /api/images

Replaces the manifest with a new queue.
Performs best-effort cleanup for removed items that were stored under /uploads/.

Body

{ "images": [/* same shape as above */] }

Response

{ "ok": true }
POST /api/images/upload

Uploads files (multipart/form-data) under key files.

Writes files to public/uploads/

Appends metadata into data/images.json

Returns only the newly uploaded items (not the entire queue)

Local development
1) Install dependencies
npm install
2) Run dev server
npm run dev

Open:

http://localhost:3000/admin

http://localhost:3000/display

3) Build & start (production)
npm run build
npm run start

Deployment

This repo is deployed on Vercel:

https://slyde-sync.vercel.app

Important note about persistence on Vercel:
Vercel serverless/edge environments may not guarantee durable filesystem writes across deployments/instances. Since SlydeSync currently writes uploads and the manifest to the local filesystem (public/uploads + data/images.json), production-grade deployments usually require external storage (e.g., S3, Cloudinary, Supabase Storage) and a real database.

Known limitations

Upload size mismatch

utils/storage.js uses a 50MB client-side limit.

app/api/images/upload/route.js defines UPLOAD_LIMIT_BYTES = 15 * 1024 * 1024 but returns an error message that says “50MB.”
✅ Recommended fix: make both limits consistent (either 15MB or 50MB) and update the message.

No authentication

/admin is public by default. Add auth if you plan to expose this beyond local networks.

Filesystem-based persistence

Great for local/self-hosted use.

For Vercel/scale: migrate to object storage + DB.

Settings are stored in browser localStorage

Settings are device/browser-specific (Admin and Display need to be on the same browser profile to share settings).

Roadmap (suggested)

Add authentication for /admin (password, magic link, etc.)

Replace filesystem storage with:

Object storage for images

Database for manifest and settings

Multiple playlists/albums

Remote pairing (Admin controls a Display running on another device)

Transition effects (slide, zoom, crossfade), per-slide duration, per-slide captions

“Preview mode” in Admin
