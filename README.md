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
    ├── developers.js ← Developers and the portals they built (Developers widget)
    └── app.js        ← All application logic
```

---

## Updating Station Data

All station data lives in [js/data.js](js/data.js) inside the `GRID_CONFIG` array. Edit the stations directly and redeploy.

Each station supports these fields:

```js
{
    id: 1,                       // portal number within the side → shown as G-1, N-5, …
    pc: 13,                      // shown as PC-13
    user: 'Name',                // operator, shown as "Operator"
    developer: 'Name',           // portal developer, shown as "Developer" (optional)
    mail: 'name@example.com',    // operator's email, shown in the panel (optional)
    ip: '1.112',                 // last two octets → 172.18.1.112
    portal: 'Portal Name',
    category: 'Hydromet',        // portal category (optional)
    desc: '<p>…</p>',            // Description tab — basic HTML allowed (see top of data.js)
    portalPort: '5500',          // Portal Access section (all optional)
    portalPath: 'app/index.html#/map',   // everything after the port: folders, page and route
    serverType: 'vscode',        // 'vscode' | 'npm' | 'browser' | ''
    projectDir: 'D:\\Portals\\App',
}
```

Stations fill each subgrid **column by column, top to bottom**, in array order — so list them in portal-number order (G-1, G-2, …).

To **archive** a station (hide from main grid, show in Archive page), add `archived: true`:

```js
{ id: 5, pc: 3, user: 'Name', portal: 'Portal Name', archived: true }
```

---

## Developers

The **Developers** widget beside the screen wall lists each developer and the portals they built — including portals that are not on the wall. Selecting a portal opens its build details in the side panel.

Edit `DEVELOPERS` in [js/developers.js](js/developers.js). The widget lists developers alphabetically; add each one's portals like this:

```js
{
    name: 'Full Name',
    role: 'GIS Developer',            // optional
    email: 'name@example.com',        // optional — enables "Email"
    portals: [
        { wall: 'G-7', stack: 'Node.js + React', updated: '2026-07' },   // on the wall: details come from data.js
        { name: 'Off-wall Portal', status: 'development',                // not on the wall
          description: '…', stack: '…', projectDir: 'D:\\Portals\\X', url: '', updated: '2026-09' },
    ],
}
```

`status` is `live`, `development` or `archived`. A wall station's **Developer** on its card is taken from here unless the station sets `developer` in `data.js`.

---

## Desktop App & Notifications

The dashboard is a **Progressive Web App**: in Chrome or Edge, click **Install app** in the top bar (or the install icon in the address bar) to install it as a desktop app with its own window, Start-menu entry and taskbar icon.

- **Notifications:** a device asks to allow notifications when **Receive alerts here** is clicked for its station (see below).
- **Phones & tablets:** the layout adapts: tapping a station or portal opens the side panel as a bottom sheet (drag down or tap outside to close), and the wall swipes between blocks.
  - **Android (Chrome):** tap **Install** in the top bar or accept the install prompt.
  - **iPhone / iPad (Safari):** tap **Share → Add to Home Screen** (the Install button explains this). Device alerts on iOS need iOS 16.4+ and the app opened from the Home Screen.
- **Bell on the wall:** a red bell marks the station whose alerts **this** browser/device receives (one per device).
- **Offline:** the app keeps a copy of its files and opens without a connection (sending alerts still needs internet).
- Needs `https` (Vercel) or `localhost`. Opening `index.html` as a file works, but without install or notifications.

Files: `manifest.webmanifest`, `sw.js` (service worker) and `icons/`.

### Alerts on the operator's PC (push)

The side panel has two alert buttons, so each alert goes out on one channel only:

- **Desktop** rings only the station's registered **PCs**: a Windows notification that stays until dismissed, and the full-screen alert from the **NEOC Alert Helper** (below). Where the helper isn't running, the dashboard shows its own pulsing alert instead.
- **Mobile** rings only the station's registered **phones** (see Phone app): a notification, and the full-screen red alarm when the app is open.
- Both buttons stay available; the hint / tooltip says how many PCs or phones will ring. Every device records whether it is a PC or a phone when it registers.
- **Office hours only**: alerts can be sent Monday–Friday, 8:30 AM – 4:30 PM Pakistan time. Outside those hours the buttons (and the phone's Alert button) are grey and a click says "No alerts possible out of office hours"; the server refuses them too (`inOfficeHours()` in `api/_push.js` and `js/app.js`).

**Register a PC:** on the operator's PC, open the dashboard (or the installed app), select **their own** station, and click **Receive alerts here** in the side panel's **This PC** row. Allow notifications when asked. **Stop** removes it.

Each PC receives alerts for **one station only**. Picking another station (**Switch to …**) moves it; it no longer gets the old station's alerts. `https://<site>/api/push-status` shows how many PCs each station has.

**One-time server setup (Vercel):**
1. Vercel project → **Storage** → **Create Database** → **Upstash for Redis** (free plan) → connect it to this project. This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
2. Vercel project → **Settings → Environment Variables**: add `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` (`mailto:` + a contact email). Generate the keys with `npx web-push generate-vapid-keys`; keep the private key secret.
3. **Redeploy.** `https://<site>/api/push-config` should then show `"enabled": true`.

Until this is done, the Desktop and Mobile buttons stay greyed out.

### Full-screen alerts: NEOC Alert Helper (Windows)

A browser can't draw over other programs, so each operator PC can run a small tray app that shows Desktop alerts **full-screen, on top of every window, on every monitor**, flashing red with a repeating warning sound until **Acknowledge** is clicked (Alt+F4 won't close it).

1. On the operator's PC, open the station in the dashboard. Below **Alerts**, the **Helper** row shows **Download** → run `NEOC-Alert-Helper.exe` (Windows may warn about an unrecognised app: **More info → Run anyway**).
2. It sits in the system tray and starts with Windows (right-click the tray icon to change that, show a test alert, or exit).
3. The **Helper** row then shows **Running · v1.1** with **Check again** (refresh), **Test**, **Download** and **Uninstall** buttons. After Download the row also checks by itself every few seconds, so no page reload is needed. The first time, Chrome/Edge may ask to let the site **access apps on this device**: choose **Allow**.

**Updating.** If the row says **Old version**, click **Download** and run the new exe: it stops the older copy and takes over (v1.0 can't uninstall itself, so this is the way to replace it). **Uninstall** (also in the tray menu) stops the helper, removes it from Windows startup and deletes its exe. After changing the helper, bump `Version` in `helper/NeocAlertHelper.cs` and `HELPER_VERSION` in `js/app.js` together.

The helper only listens on `127.0.0.1:47800`, accepts requests from the dashboard's own site, and never connects to the internet. The browser (or installed app) must be running to receive the alert and hand it over. Source: `helper/NeocAlertHelper.cs`; rebuild with `helper\build.cmd` (uses the C# compiler built into Windows) → `downloads/NEOC-Alert-Helper.exe`.

Server code: `api/` (Vercel functions) and `package.json`. Notifications only arrive while Edge/Chrome is running (it can run in the background).

---

## Phone app (Android / iPhone)

On a phone the same URL opens an app-style layout (`js/mobile.js`, `css/mobile.css`) for operators away from their PC:

- **Bottom navigation**: Home, Stations, the red **Alert** button in the middle, Team, More. Details open in bottom sheets (drag down or press Back to close).
- **Home → Alerts on this phone → Choose station**: this phone then rings for that station (one station per phone, same as PCs).
- **Alert** button: pick a station, then **Desktop** (rings its PCs) or **Mobile** (rings its phones).
- **Incoming alert**: full-screen flashing red screen with a siren and vibration until **Acknowledge**; when the app is closed, a notification (vibrates on Android) opens it. Sound and vibration can be switched off under **More**, where there is also a test.

Install: Android (Chrome) → menu → **Install app**. iPhone (Safari, iOS 16.4+) → **Share → Add to Home Screen**; on iPhone alerts only work in the installed app, and the phone vibrates only for the notification (iOS doesn't let web apps vibrate).

The layout switches automatically on phones. `?mobile=1` shows it on a PC for testing, `?mobile=0` switches back (More → **Desktop layout** does the same on a phone).

---

## Admin: sign in, IP addresses and system passwords

The person icon at the top right opens the **Sign in** screen (one admin account). Once signed in it shows the account's initial; click it for the email, **Admin** status and **Sign out**. A sign-in has no expiry: the browser stays signed in until Sign out.

Signed in, a station's **Overview** tab lets you:

- **Network**: click the pencil to change the IP. Saving commits the new `ip` to `js/data.js` on GitHub, and Vercel redeploys it for everyone in about a minute.
- **Password**: show, copy or edit the PC's system password. Signed out, it stays hidden.

System passwords are kept in Upstash Redis (`station:passwords`), **not** in `data.js`: this repository and the site are public, so anything in `data.js` can be read by anyone.

Vercel → Settings → Environment Variables (then redeploy):

| Variable | Value |
| --- | --- |
| `ADMIN_EMAIL` | `developer.ndma@gmail.com` (the default if left out) |
| `ADMIN_PASSWORD` | the admin password. Keep it only here, never in the code |
| `GITHUB_TOKEN` | GitHub → Settings → Developer settings → Fine-grained tokens: only this repository, **Contents: Read and write** |
| `AUTH_SECRET` | optional. By default derived from `ADMIN_PASSWORD`, so changing the password signs every browser out |

Because IP edits commit to `main`, run `git pull` before pushing local changes.

---

## Grid Layout

```
┌──────────┬──────────────────┬───────┬──────────────────┬──────────┐
│  G1 3×2  │     G2 4×4       │ C 1×2 │     N2 4×4       │  N1 3×2  │
│ (Global) │    (Global)      │ (COP) │   (National)     │(National)│
│ G-1…G-6  │   G-7…G-22       │GCOP / │   N-1…N-16       │N-17…N-22 │
│          │                  │ NCOP  │                  │          │
└──────────┴──────────────────┴───────┴──────────────────┴──────────┘
```

- **G1 / G2** — Global side (prefix `G-`)
- **COP** — Common Operating Picture (cells labelled `GCOP` / `NCOP`)
- **N2 / N1** — National side (prefix `N-`)

---

## Features

| Feature | Detail |
|---|---|
| Screen wall | All 5 blocks in one row, drawn to scale; each cell shows portal number + PC |
| Block browser | Cards for the focused block, with per-block filter and sort (portal / PC) |
| Side panel | Click any cell or card — Overview / Access / About tabs, no popups |
| Send alert | **Desktop** (the station's PCs) or **Mobile** (the station's phones), asking the operator to return to their workstation |
| Search | Highlights cells by PC, user, IP, portal name/number/description; Enter selects the first match |
| Dark/Light | Theme toggle; follows the system theme until changed, then persisted to localStorage |
| Archive | Stations with `archived: true` in data.js appear in the Archive view |
| Status bar | Station count, how many have portal access configured / need setup, clock |

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `←` `→` | Move between blocks |
| `Enter` (in search) | Select the first matching station |
| `Esc` | Clear the focused input, otherwise clear the selection |
