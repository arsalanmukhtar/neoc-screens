// ─── Developers & the portals they built ──────────────────────────────────────
// Shown in the "Developers" widget beside the screen wall. Selecting a portal
// opens its details in the side panel.
//
// The widget lists developers alphabetically, so the order here doesn't matter.
//
// Developer fields
//   name       (required)  Full name, shown in the list and on station cards
//   role       (optional)  e.g. 'GIS Developer'
//   email      (optional)  Enables the "Email developer" button
//   portals    (required)  Array of portals (see below)
//
// Portal example
//   portals: [
//       { wall: 'G-7', stack: 'Node.js + React', updated: '2026-07' },
//       { name: 'Glacier Lake Inventory', status: 'development', stack: 'Python + PostGIS' },
//   ]
//
// Portal fields
//   wall       Portal number if the portal runs on the screen wall ('G-7', 'N-2', 'GCOP').
//              Name, description, folder, URL, server type and port are then read
//              from js/data.js — anything set here overrides them.
//   name       Required for portals that are NOT on the wall
//   status     'live' | 'development' | 'archived'   (default: live if on the wall)
//   category, description, stack ('Vue + Chart.js'), projectDir, url,
//   serverType ('vscode' | 'npm' | 'browser'),
//   port, updated (free text, e.g. '2026-08')        — all optional
//
// A wall station's "Developer" on its card comes from here unless the station
// sets `developer` itself in js/data.js.

const DEVELOPERS = [
    { name: 'Abdul Sattar Sheikh', role: '', email: '', portals: [] },
    { name: 'Ibrahim Abdullah', role: '', email: '', portals: [] },
    { name: 'Muddasir Shah', role: '', email: '', portals: [] },
    { name: 'Muhammad Ahad Khan', role: '', email: '', portals: [] },
    { name: 'Muhammad Arsalan Mukhtar', role: '', email: '', portals: [] },
    { name: 'Muhammad Osama Khan', role: '', email: '', portals: [] },
    { name: 'Muqeet Ahmad', role: '', email: '', portals: [] },
    { name: 'Seemal Naeem', role: '', email: '', portals: [] },
    { name: 'Shehzad Ali', role: '', email: '', portals: [] },
    { name: 'Syed Mustafa Haider', role: '', email: '', portals: [] },
    { name: 'Talha Rizwan', role: '', email: '', portals: [] },
    { name: 'Usama bin Umar', role: '', email: '', portals: [] },
    { name: 'Zainab Ali', role: '', email: '', portals: [] },
    { name: 'Zeeshan Nasir', role: '', email: '', portals: [] },
];
