# NDMA Control Dashboard

A command-center style monitoring dashboard for NDMA screen grid management.

## Setup Commands

Run the following from your terminal to scaffold and serve the project:

```bash
# 1. Create project directory
mkdir ndma-dashboard
cd ndma-dashboard

# 2. Create subdirectories
mkdir css js

# 3. Create all files
touch index.html css/variables.css css/main.css js/data.js js/app.js

# 4. Paste file contents (see files in this project)

# 5. Serve locally (pick one):

# Option A — Python (no install required)
python3 -m http.server 8080

# Option B — Node.js (if installed)
npx serve .

# Option C — VS Code Live Server
# Install "Live Server" extension → right-click index.html → Open with Live Server
```

Then open: http://localhost:8080

---

## Project Structure

```
ndma-dashboard/
├── index.html           ← Main entry point
├── css/
│   ├── variables.css    ← CSS custom properties, fonts, themes
│   └── main.css         ← All component styles
└── js/
    ├── data.js          ← Grid config, cell data, persistence
    └── app.js           ← All application logic
```

---

## Grid Layout

```
┌──────────┬──────────────────┬───────┬──────────────────┬──────────┐
│  L1 3×3  │     L2 4×4       │ M 2×1 │     R2 4×4       │  R1 3×3  │
│ (Violet) │     (Amber)      │(Cyan) │     (Amber)      │ (Violet) │
└──────────┴──────────────────┴───────┴──────────────────┴──────────┘
```

## Features

| Feature | Detail |
|---|---|
| Overview | All 5 subgrids in a single viewport row |
| Carousel | Click any subgrid or press ⊞ to zoom in, animate in detail cards |
| Navigation | Arrow keys ← → or click dots/arrows to cycle subgrids |
| Search | Search by PC number, user, IP, portal name/number/description |
| Dark/Light | Toggle with ☀️/🌙 button, persisted to localStorage |
| Auth | Sign in as `arsalan` / `developer.ndma@123` to enable field editing |
| Editing | Click any field value in a card (when signed in) to edit in-place |
| Persistence | All edits saved to localStorage |

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `←` `→` | Navigate carousel |
| `Esc` | Close carousel / clear search |
| `Enter` | Confirm field edit |