# NEOC Tech (EW) Control Dashboard

A command-center style monitoring dashboard for screen grid management — 5 subgrids, 46 stations, read-only static site.

---

## Run Locally

No install required. Pick any option:

**Option A — VS Code Live Server** (recommended)
1. Install the "Live Server" extension in VS Code
2. Right-click `index.html` → **Open with Live Server**

**Option B — Python**
```bash
python3 -m http.server 8080
```
Then open: http://localhost:8080

**Option C — Node (if you have it)**
```bash
npx serve .
```
Then open: http://localhost:3000

---

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [https://vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo
4. Leave all settings as default (Vercel auto-detects static HTML)
5. Click **Deploy**

Done. No build step, no environment variables, no server config needed.

---

## Project Structure

```
neoc-screens/
├── index.html        ← Main entry point
├── css/
│   ├── variables.css ← CSS custom properties, fonts, themes
│   └── main.css      ← All component styles
└── js/
    ├── data.js       ← Grid config, station data (edit here to update content)
    └── app.js        ← All application logic
```

---

## Updating Station Data

All station data lives in [js/data.js](js/data.js) inside the `GRID_CONFIG` array. Edit the stations directly and redeploy.

Each station supports these fields:

```js
{ id: 1, pc: 13, user: 'Name', portal: 'Portal Name', desc: 'Description' }
```

To **archive** a station (hide from main grid, show in Archive page), add `archived: true`:

```js
{ id: 5, pc: 3, user: 'Name', portal: 'Portal Name', archived: true }
```

---

## Grid Layout

```
┌──────────┬──────────────────┬───────┬──────────────────┬──────────┐
│  N1 3×2  │     N2 4×4       │ C 1×2 │     G2 4×4       │  G1 3×2  │
│(National)│   (National)     │ (COP) │    (Global)      │ (Global) │
└──────────┴──────────────────┴───────┴──────────────────┴──────────┘
```

- **G1 / G2** — Global side (prefix `G-`)
- **COP** — Common Operating Picture (prefix `C-`)
- **N2 / N1** — National side (prefix `N-`)

---

## Features

| Feature | Detail |
|---|---|
| Overview | All 5 subgrids in a single viewport row |
| Carousel | Click any subgrid to zoom in, animated detail cards |
| Navigation | Arrow keys ← → or click dots/arrows to cycle subgrids |
| Search | Filter by PC, user, IP, portal name/number/description |
| Dark/Light | Theme toggle, persisted to localStorage |
| Archive | Stations with `archived: true` in data.js appear on the Archive page |

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `←` `→` | Navigate carousel |
| `Esc` | Close carousel / close modal / clear search |
