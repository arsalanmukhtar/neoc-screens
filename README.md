# NEOC Tech (EW) Control Dashboard

A command-center style monitoring dashboard for screen grid management — 5 subgrids, 46 stations, real-time editing with persistent server-side storage.

---

## Prerequisites

- **Node.js 18+** — [https://nodejs.org](https://nodejs.org)
- **npm** (comes with Node.js)

---

## Run Locally

```bash
# 1. Clone / copy the project folder
cd neoc-screens

# 2. Install dependencies
npm install

# 3. Start the server
npm start
```

Then open: **http://localhost:3000**

Edits are saved to `data/grid-data.json` automatically. The file is created on first save and persists across restarts.

---

## Project Structure

```
neoc-screens/
├── index.html           ← Main entry point (SPA)
├── server.js            ← Express server (API + static file serving)
├── package.json         ← Node dependencies & start script
├── .env.example         ← Template for cloud deployment env vars
├── .gitignore
├── css/
│   ├── variables.css    ← CSS custom properties, fonts, themes
│   └── main.css         ← All component styles
├── js/
│   ├── data.js          ← Grid config, station data, load/save API calls
│   └── app.js           ← All application logic (render, modal, archive)
└── data/                ← Auto-created on first save (gitignored)
    └── grid-data.json   ← Persisted grid state (local dev only)
```

---

## Grid Layout

```
┌──────────┬──────────────────┬───────┬──────────────────┬──────────┐
│  L1 3×3  │     L2 4×4       │ C 2×2 │     G2 4×4       │  G1 3×3  │
│(National)│   (National)     │ (COP) │    (Global)      │ (Global) │
└──────────┴──────────────────┴───────┴──────────────────┴──────────┘
```

- **G1 / G2** — Global side (9 + 16 = 25 stations, prefix `G-`)
- **COP** — Common Operating Picture (4 stations, prefix `C-`)
- **L2 / L1** — National side (16 + 9 = 25 stations, prefix `N-`)

---

## Features

| Feature | Detail |
|---|---|
| Overview | All 5 subgrids in a single viewport row |
| Carousel | Click any subgrid to zoom in, animated detail cards |
| Navigation | Arrow keys ← → or click dots/arrows to cycle subgrids |
| Search | Filter by PC, user, IP, portal name/number/description |
| Dark/Light | Theme toggle, persisted to localStorage |
| Auth | Sign in as `arsalan` / `developer.ndma@123` to enable editing |
| Editing | Click any field value in a card (when signed in) to edit in-place |
| Persistence | Edits POST to `/api/save` → saved to disk (local) or Redis (cloud) |
| Archive | Archive inactive stations; filter/search them on a dedicated Archive page |

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `←` `→` | Navigate carousel |
| `Esc` | Close carousel / close modal / clear search |
| `Enter` | Confirm field edit |

---

## Cloud Deployment (Railway + Upstash Redis)

For persistent storage across deployments (no local disk), use **Upstash Redis** as the storage backend.

### Step 1 — Create a free Upstash Redis database

1. Go to [https://console.upstash.com](https://console.upstash.com) and sign up (free)
2. Click **Create Database** → choose a region → create
3. Copy the **REST URL** and **REST Token** from the database page

### Step 2 — Deploy to Railway

1. Push this repo to GitHub
2. Go to [https://railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Select your repo → Railway auto-detects Node.js and runs `npm start`
4. In Railway project settings → **Variables**, add:

```
UPSTASH_REDIS_REST_URL=https://your-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

5. Redeploy — the server will log `Storage: Upstash Redis` on startup

> **Local dev**: leave `.env` absent (or omit those vars) and the server falls back to `data/grid-data.json` automatically. No Redis needed locally.

### Environment Variables

| Variable | Required for | Description |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | Cloud only | REST endpoint from Upstash console |
| `UPSTASH_REDIS_REST_TOKEN` | Cloud only | Auth token from Upstash console |
| `PORT` | Optional | Override default port 3000 |

Copy `.env.example` to `.env` and fill in values for local Redis testing:

```bash
cp .env.example .env
# then edit .env with your actual credentials
```

---

## Storage Behaviour

| Environment | Storage | How edits persist |
|---|---|---|
| Local dev | `data/grid-data.json` | Written to disk on every save |
| Railway / Render | Upstash Redis | Written to Redis KV on every save |

The server auto-detects which backend to use at startup based on env vars.
