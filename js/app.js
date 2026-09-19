/* ═══════════════════════════════════════════════════════
   NEOC Tech (EW) Dashboard – Application Logic
   Wall overview → block browser → side panel (no popups)
   ═══════════════════════════════════════════════════════ */

// ─── App State ────────────────────────────────────────────────────────────────
const state = {
    view: 'wall',             // 'wall' | 'archive'
    activeIndex: Math.max(0, GRID_CONFIG.findIndex(g => g.id === 'COP')),   // focused block (index into GRID_CONFIG); COP by default
    selected: null,           // { gridId, cellId } shown in the side panel
    panelTab: 'overview',     // 'overview' | 'description'
    searchQuery: '',
    blockFilter: '',
    sortBy: 'portal',         // 'portal' | 'pc'
    archiveFilter: 'all',     // 'all' | 'global' | 'national' | 'cop'
    devQuery: '',             // Developers widget search
    devId: null,              // developer shown in the widget
    devPortal: null,          // { devId, portalId } shown in the side panel
};

// ─── EmailJS Config (hardcoded) ───────────────────────────────────────────────
// Sign up at https://www.emailjs.com — free tier: 200 emails/month
// Create a Service (Gmail/Outlook), an Email Template, then paste the IDs below.
const EJS_PUBLIC_KEY = 'Hf7j1r_wnpLPK0CLf';   // Account → API Keys
const EJS_SERVICE_ID = 'service_c59muoj';            // Email Services tab
const EJS_TEMPLATE_ID = 'template_vofg9ml';           // Email Templates tab

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ─── Icons (Lucide) ───────────────────────────────────────────────────────────
const ICONS = {
    'search': '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>',
    'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    'moon': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    'layout-grid': '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    'archive': '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8m-10 4h4"/>',
    'download': '<path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/>',
    'trash': '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    'bell-off': '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M17 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 .258-1.742"/><path d="m2 2 20 20"/><path d="M8.668 3.01A6 6 0 0 1 18 8c0 2.687.77 4.653 1.707 6.05"/>',
    'bell': '<path d="M10.268 21a2 2 0 0 0 3.464 0m-10.47-5.674A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'arrow-left': '<path d="M19 12H5m7 7-7-7 7-7"/>',
    'arrow-right': '<path d="M5 12h14m-7-7 7 7-7 7"/>',
    'sort': '<path d="m3 16 4 4 4-4m-4 4V4m4 0h10M11 8h7m-7 4h4"/>',
    'pointer': '<path d="M14 4.1 12 6M5.1 8l-2.9-.8M6 12l-1.9 2M7.2 2.2 8 5.1"/><path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"/>',
    'monitor': '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8m-4-4v4"/>',
    'x': '<path d="M18 6 6 18M6 6l12 12"/>',
    'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>',
    'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8m8 4H8m8 4H8"/>',
    'globe': '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
    'external-link': '<path d="M15 3h6v6m-11 5L21 3m-3 10v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4m0 4h.01"/>',
    'alert-circle': '<circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>',
    'check-circle': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    'mail': '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    'radio': '<path d="M16.247 7.761a6 6 0 0 1 0 8.478m2.828-11.306a10 10 0 0 1 0 14.134m-14.15 0a10 10 0 0 1 0-14.134m2.828 11.306a6 6 0 0 1 0-8.478"/><circle cx="12" cy="12" r="2"/>',
    'clock': '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    'code': '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
};

// Stroke scales with size so every icon renders at the same visual weight
function svgIcon(name, size = 16) {
    const sw = (1.75 * 24 / size).toFixed(2);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

// Solid red bell on the wall cell whose alerts this browser receives
const BELL_SOLID = '<svg viewBox="0 0 24 24" width="14.3" height="14.3" fill="currentColor" aria-hidden="true">'
    + '<path d="M12 2a6 6 0 0 0-6 6c0 4.5-1.4 6-2.7 7.3A1 1 0 0 0 4 17h16a1 1 0 0 0 .7-1.7C19.4 14 18 12.5 18 8a6 6 0 0 0-6-6z"/>'
    + '<path d="M9.3 19a2.7 2.7 0 0 0 5.4 0z"/></svg>';

function ic(name, size = 16) {
    return `<span data-icon="${name}" data-size="${size}">${svgIcon(name, size)}</span>`;
}

function hydrateIcons(root = document) {
    root.querySelectorAll('[data-icon]').forEach(el => {
        el.innerHTML = svgIcon(el.dataset.icon, Number(el.dataset.size) || 16);
    });
}

// ─── Data helpers ─────────────────────────────────────────────────────────────
const cfgIndex = gridId => GRID_CONFIG.findIndex(c => c.id === gridId);
const findCell = (gridId, cellId) => (GRID_DATA[gridId] || []).find(c => c.id === cellId) || null;
const visibleCells = gridId => GRID_DATA[gridId].filter(c => !c.archived);
const allVisibleCells = () => GRID_CONFIG.flatMap(cfg => visibleCells(cfg.id));
const displayNumber = cell => cell.cellLabel || cell.portalNumber;
const isConfigured = cell => Boolean(cell.portalPort || cell.serverType);
const hasDescription = cell => Boolean(cell.portalDescription) && cell.portalDescription !== cell.portalName;

// Cells are stored in layout (row-by-row) order; lists should follow portal order (G-1, G-2, …)
function inPortalOrder(cells) {
    return [...cells].sort((a, b) => a.order - b.order);
}

function sortCells(cells) {
    if (state.sortBy === 'pc') {
        const pcNum = c => parseInt(c.pcNumber.replace('PC-', ''), 10) || 0;
        return [...cells].sort((a, b) => pcNum(a) - pcNum(b) || a.order - b.order);
    }
    return inPortalOrder(cells);
}

// ─── Rich text (portal descriptions) ─────────────────────────────────────────
// Descriptions may contain basic HTML. Only these tags survive; every attribute is
// dropped except a safe href on links. Unknown tags are unwrapped (their text is kept),
// dangerous ones are removed with their content.
const RICH_TAGS = new Set(['P', 'BR', 'H4', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'MARK', 'CODE',
    'UL', 'OL', 'LI', 'BLOCKQUOTE', 'A']);
const RICH_DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE', 'SVG', 'MATH']);

function sanitizeNode(node) {
    [...node.childNodes].forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) return;
        if (child.nodeType !== Node.ELEMENT_NODE || RICH_DROP.has(child.tagName)) {
            child.remove();
            return;
        }
        sanitizeNode(child);
        if (!RICH_TAGS.has(child.tagName)) {
            child.replaceWith(...child.childNodes);
            return;
        }
        const href = child.tagName === 'A' ? child.getAttribute('href') || '' : '';
        [...child.attributes].forEach(a => child.removeAttribute(a.name));
        if (/^(https?:|mailto:)/i.test(href.trim())) {
            child.setAttribute('href', href.trim());
            child.setAttribute('target', '_blank');
            child.setAttribute('rel', 'noopener');
        }
    });
}

function richText(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = String(html ?? '');
    sanitizeNode(tpl.content);
    return tpl.innerHTML;
}

// Text only — for search
function plainText(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = String(html ?? '');
    return tpl.content.textContent.replace(/\s+/g, ' ').trim();
}

function matchesQuery(cell, q) {
    if (!q) return true;
    return [cell.pcNumber, cell.user, developerName(cell), cell.ipAddress, cell.portalName, cell.category,
        cell.portalNumber, cell.cellLabel, plainText(cell.portalDescription)]
        .join(' ').toLowerCase().includes(q);
}

function getSelected() {
    if (!state.selected) return null;
    const cell = findCell(state.selected.gridId, state.selected.cellId);
    if (!cell) return null;
    return { cell, cfg: GRID_CONFIG[cfgIndex(state.selected.gridId)] };
}

// How a station's portal is started and opened
const ACCESS_TYPES = {
    vscode: {
        label: 'VS Code Live Server',
        steps: ['Open the project folder in VS Code on this PC', 'Right-click index.html in the Explorer', 'Choose "Open with Live Server"'],
    },
    npm: {
        label: 'npm',
        steps: ['Open a terminal in the project folder on this PC', 'Run npm start (or npm run dev)', 'Open the URL below'],
    },
    browser: {
        label: 'Browser',
        steps: ['No setup needed on this PC', 'Open the URL below from any PC on the network'],
    },
};

function accessInfo(cell) {
    if (!isConfigured(cell)) return null;
    const type = cell.serverType;
    const port = cell.portalPort;
    const path = cell.portalPath ? '/' + cell.portalPath.replace(/^\//, '') : '';
    let url = '';
    if (port) {
        const host = type === 'vscode' ? '127.0.0.1'
            : type === 'browser' && cell.ipAddress ? cell.ipAddress
                : 'localhost';
        url = `http://${host}:${port}${path}`;
    }
    return { type, port, url, ...(ACCESS_TYPES[type] || { label: type || 'Custom', steps: [] }) };
}

// ─── Developers (config in js/developers.js) ─────────────────────────────────
const DEV_STATUS = {
    live: 'Live',
    development: 'In development',
    archived: 'Archived',
};

let DEV = { devs: [], byWall: new Map() };   // built once on load

const slugify = str => String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Find a wall station by its portal number ('G-7') or COP label ('GCOP')
function findWallStation(number) {
    const key = String(number || '').trim().toUpperCase();
    if (!key) return null;
    for (const cfg of GRID_CONFIG) {
        const cell = GRID_DATA[cfg.id].find(c => displayNumber(c).toUpperCase() === key);
        if (cell) return { cell, cfg };
    }
    return null;
}

// Merge a configured portal with its wall station (config values win)
function resolveDevPortal(devId, p, i) {
    const hit = findWallStation(p.wall);
    const cell = hit ? hit.cell : null;
    const access = cell ? accessInfo(cell) : null;
    return {
        id: p.id || `${devId}-${i + 1}`,
        name: p.name || (cell ? cell.portalName : 'Untitled portal'),
        category: p.category || (cell ? cell.category : ''),
        wall: hit ? displayNumber(cell) : '',
        cell,
        gridId: hit ? hit.cfg.id : null,
        colorKey: hit ? hit.cfg.colorKey : null,
        status: DEV_STATUS[p.status] ? p.status : (hit ? 'live' : 'development'),
        description: p.description || (cell && hasDescription(cell) ? cell.portalDescription : ''),
        stack: p.stack || '',
        projectDir: p.projectDir || (cell ? cell.projectDir : ''),
        serverType: p.serverType || (cell ? cell.serverType : ''),
        port: p.port || (cell ? cell.portalPort : ''),
        url: p.url || (access ? access.url : ''),
        updated: p.updated || '',
    };
}

function buildDevIndex() {
    const source = typeof DEVELOPERS !== 'undefined' && Array.isArray(DEVELOPERS) ? DEVELOPERS : [];
    const devs = source
        .filter(d => d && d.name)
        .map(d => {
            const id = d.id || slugify(d.name);
            return {
                id,
                name: d.name,
                role: d.role || '',
                email: d.email || '',
                portals: (d.portals || []).map((p, i) => resolveDevPortal(id, p, i)),
            };
        })
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    const byWall = new Map();
    devs.forEach(d => d.portals.forEach(p => { if (p.wall) byWall.set(p.wall, d.name); }));
    return { devs, byWall };
}

function findDev(devId) {
    return DEV.devs.find(d => d.id === devId) || null;
}

function getDevPortal() {
    if (!state.devPortal) return null;
    const dev = findDev(state.devPortal.devId);
    const portal = dev && dev.portals.find(p => p.id === state.devPortal.portalId);
    return portal ? { dev, portal } : null;
}

// A station's developer: its own `developer` field, else the developer config
function developerName(cell) {
    return cell.developer || DEV.byWall.get(displayNumber(cell)) || '';
}

// First and last name initials ("Muhammad Arsalan Mukhtar" → "MM")
const initials = name => {
    const words = name.split(/\s+/).filter(Boolean);
    return (words.length > 1 ? [words[0], words[words.length - 1]] : words).map(w => w[0].toUpperCase()).join('');
};

const portalMatches = (p, q) =>
    [p.name, p.wall, p.category, p.stack, DEV_STATUS[p.status]].join(' ').toLowerCase().includes(q);

const devNameMatches = (d, q) => [d.name, d.role].join(' ').toLowerCase().includes(q);

const devMatches = (d, q) => !q || devNameMatches(d, q) || d.portals.some(p => portalMatches(p, q));

function renderDevWidget() {
    const q = state.devQuery;
    const shown = DEV.devs.filter(d => devMatches(d, q));

    $('dev-count').textContent = q ? `${shown.length} of ${DEV.devs.length}` : `${DEV.devs.length}`;

    if (!DEV.devs.length) {
        $('dev-list').innerHTML = '';
        $('dev-portals').innerHTML = `
            <div class="dev-empty">No developers configured yet. Add them in <code>js/developers.js</code>.</div>`;
        return;
    }

    // Keep the selection on a visible developer
    if (!shown.some(d => d.id === state.devId)) state.devId = shown.length ? shown[0].id : null;

    $('dev-list').innerHTML = shown.map(d => {
        const onWall = d.portals.filter(p => p.wall).length;
        const active = d.id === state.devId;
        return `
        <button class="dev-item${active ? ' is-active' : ''}" type="button" role="option"
            aria-selected="${active}" data-dev-id="${escHtml(d.id)}" title="${escHtml(d.name)}">
            <span class="dev-avatar" aria-hidden="true">${escHtml(initials(d.name))}</span>
            <span class="dev-item-text">
                <span class="dev-name">${escHtml(d.name)}</span>
                <span class="dev-meta">${d.portals.length
                    ? `${d.portals.length} ${d.portals.length === 1 ? 'portal' : 'portals'} · ${onWall} on wall`
                    : 'No portals yet'}</span>
            </span>
        </button>`;
    }).join('');

    const dev = findDev(state.devId);
    if (!dev) {
        $('dev-portals').innerHTML = `<div class="dev-empty">No developer or portal matches “${escHtml(q)}”.</div>`;
        return;
    }

    // When the query matched portals (not the developer's name), fade the non-matching ones
    const fadeMisses = q && !devNameMatches(dev, q);
    const sel = state.devPortal;
    const rows = dev.portals.map(p => {
        const isSel = sel && sel.devId === dev.id && sel.portalId === p.id;
        const dim = fadeMisses && !portalMatches(p, q);
        const where = p.wall
            ? `<span class="dp-where" data-color="${p.colorKey}">${ic('monitor', 12)}${escHtml(p.wall)} · ${escHtml(p.cell.pcNumber)}</span>`
            : `<span class="dp-where is-off">${ic('monitor', 12)}Not on wall</span>`;
        const extra = [p.stack && escHtml(p.stack), p.updated && `Updated ${escHtml(p.updated)}`].filter(Boolean);
        return `
        <button class="dp-row${isSel ? ' is-selected' : ''}${dim ? ' is-dim' : ''}" type="button"
            data-dev-id="${escHtml(dev.id)}" data-portal-id="${escHtml(p.id)}">
            <span class="dp-name">${escHtml(p.name)}</span>
            <span class="dp-status" data-status="${p.status}">${DEV_STATUS[p.status]}</span>
            <span class="dp-meta">${where}${extra.map(x => `<span class="dp-sep">·</span><span>${x}</span>`).join('')}</span>
        </button>`;
    }).join('');

    const sub = [dev.role, `${dev.portals.length} ${dev.portals.length === 1 ? 'portal' : 'portals'}`]
        .filter(Boolean).map(escHtml).join(' · ');

    $('dev-portals').innerHTML = `
        <div class="dev-portals-head">
            <div class="dev-portals-title">${escHtml(dev.name)}</div>
            <div class="dev-portals-sub">${sub}</div>
        </div>
        <div class="dp-list">${rows || '<div class="dev-empty">No portals added yet — list them in <code>js/developers.js</code>.</div>'}</div>`;
}

function selectDevPortal(devId, portalId) {
    state.devPortal = { devId, portalId };
    state.devId = devId;
    state.selected = null;
    refreshSelection();
}

// Side panel for a developer's portal — build info rather than live station info
function renderDevPortalPanel(panel, { dev, portal: p }) {
    if (p.colorKey) panel.dataset.color = p.colorKey;
    else panel.removeAttribute('data-color');

    const server = p.serverType || p.port
        ? `${escHtml((ACCESS_TYPES[p.serverType] || { label: p.serverType || 'Server' }).label)}${p.port ? ` · Port ${escHtml(p.port)}` : ''}`
        : '';
    const details = [
        p.category && kv('Category', escHtml(p.category)),
        p.stack && kv('Stack', escHtml(p.stack)),
        p.projectDir && kv('Folder', escHtml(p.projectDir)),
        server && kv('Server', `<span class="type-badge" data-type="${escHtml(p.serverType)}">${server}</span>`),
        p.updated && kv('Updated', escHtml(p.updated)),
    ].filter(Boolean).join('');
    const url = p.url ? `
        <a class="url-box" href="${escHtml(p.url)}" target="_blank" rel="noopener">
            ${ic('globe', 14)}<span>${escHtml(p.url.replace(/^https?:\/\//, ''))}</span>${ic('external-link', 13)}
        </a>` : '';

    const wall = p.wall
        ? `
        <div class="inset">
            ${kv('Position', `Portal ${escHtml(p.wall)} · Subgrid ${escHtml(p.gridId)}`)}
            ${kv('Station', `${escHtml(p.cell.pcNumber)} · ${escHtml(p.cell.ipAddress)}`)}
            ${kv('Operator', escHtml(p.cell.user || '—'))}
            <button class="link-btn" type="button" data-show-wall="${escHtml(p.gridId)}|${escHtml(p.cell.id)}">
                Show on wall ${ic('arrow-right', 14)}
            </button>
        </div>`
        : `<div class="note">${ic('monitor', 13)}This portal is not on the screen wall.</div>`;

    const others = dev.portals.filter(o => o.id !== p.id);
    const more = others.length ? `
        <div>
            <div class="section-label">More by ${escHtml(dev.name)}</div>
            <div class="chip-list">
                ${others.map(o => `
                <button class="chip-btn" type="button" data-dev-id="${escHtml(dev.id)}" data-portal-id="${escHtml(o.id)}">
                    <span class="chip-dot" data-status="${o.status}"></span>${escHtml(o.name)}
                </button>`).join('')}
            </div>
        </div>` : '';

    const openBtn = p.url
        ? `<a class="btn btn-primary btn-lg" href="${escHtml(p.url)}" target="_blank" rel="noopener">${ic('external-link', 14)}Open portal</a>`
        : `<button class="btn btn-primary btn-lg" type="button" disabled title="No URL configured">${ic('external-link', 14)}Open portal</button>`;
    const mailBtn = dev.email
        ? `<a class="btn btn-muted btn-lg" href="mailto:${escHtml(dev.email)}">${ic('mail', 14)}Email</a>`
        : `<button class="btn btn-muted btn-lg" type="button" disabled title="No email on file for this developer">${ic('mail', 14)}Email</button>`;

    panel.innerHTML = `
    <div class="panel-head">
        <div class="panel-icon">${ic('code', 18)}</div>
        <div class="panel-heading">
            <div class="panel-title">${escHtml(p.name)}</div>
            <div class="panel-sub">Developed by ${escHtml(dev.name)}</div>
        </div>
        <button id="panel-close" class="icon-btn icon-btn-sm" type="button" aria-label="Clear selection" title="Clear selection (Esc)">${ic('x', 14)}</button>
    </div>
    <div class="panel-body">
        <div class="tiles">
            <div class="tile">
                <div class="tile-label">Developer</div>
                <div class="tile-value" title="${escHtml(dev.name)}">${escHtml(dev.name)}</div>
                <div class="tile-meta" title="${escHtml(dev.email || dev.role)}">${escHtml(dev.email || dev.role || 'No contact on file')}</div>
            </div>
            <div class="tile">
                <div class="tile-label">Status</div>
                <div class="tile-value"><span class="dp-status" data-status="${p.status}">${DEV_STATUS[p.status]}</span></div>
                <div class="tile-meta">${p.updated ? `Updated ${escHtml(p.updated)}` : 'No update date'}</div>
            </div>
        </div>
        <div>
            <div class="section-label">Description</div>
            <div class="about-box">
                ${p.description
                    ? `<div class="about-text rich-text">${richText(p.description)}</div>`
                    : '<div class="about-text is-empty">No description added yet.</div>'}
            </div>
        </div>
        <div>
            <div class="section-label">Build details</div>
            ${details || url
                ? `<div class="inset">${details}${url}</div>`
                : `<div class="note">${ic('info', 13)}No build details recorded for this portal.</div>`}
        </div>
        <div>
            <div class="section-label">Screen wall</div>
            ${wall}
        </div>
        ${more}
    </div>
    <div class="panel-foot">
        ${openBtn}
        ${mailBtn}
    </div>`;
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') || 'light', false);
    hydrateIcons();
    DEV = buildDevIndex();
    state.devId = DEV.devs.length ? DEV.devs[0].id : null;
    renderWall();
    renderBrowser();
    renderDevWidget();
    renderPanel();
    renderStatusBar();
    attachListeners();
    initPwa();
    initAlertOverlay();
    initSheetGestures();
    refreshPushRegistrations();
    tickClock();
    setInterval(tickClock, 1000);
});

// ─── Theme ────────────────────────────────────────────────────────────────────
function applyTheme(theme, persist = true) {
    const root = document.documentElement;
    root.classList.add('theme-switching');
    root.setAttribute('data-theme', theme);
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')));
    const bar = document.querySelector('meta[name="theme-color"]');
    if (bar) bar.content = getComputedStyle(root).getPropertyValue('--elevated').trim() || '#ffffff';
    const btn = $('btn-theme');
    const next = theme === 'dark' ? 'light' : 'dark';
    btn.innerHTML = ic(theme === 'dark' ? 'sun' : 'moon');
    btn.title = `Switch to ${next} mode`;
    if (persist) {
        try { localStorage.setItem('ndma_theme', theme); } catch (e) { /* storage unavailable */ }
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ─── Views ────────────────────────────────────────────────────────────────────
function setView(view) {
    state.view = view;
    $('wall-view').hidden = view !== 'wall';
    $('archive-view').hidden = view !== 'archive';
    $('btn-wall').classList.toggle('is-active', view === 'wall');
    $('btn-archive').classList.toggle('is-active', view === 'archive');
    $('status-hint').hidden = view !== 'wall';
    $('open-archive-label').textContent = view === 'archive' ? 'Back to wall view' : 'Open archive view';
    $('open-archive-icon').innerHTML = svgIcon(view === 'archive' ? 'arrow-left' : 'arrow-right', 13);
    if (view === 'archive') renderArchive();
}

// ─── Screen wall ──────────────────────────────────────────────────────────────
function renderWall() {
    const wall = $('wall');

    wall.innerHTML = GRID_CONFIG.map((cfg, idx) => {
        const cells = visibleCells(cfg.id).map(cell => `
            <button class="cell" type="button" data-grid-id="${cfg.id}" data-cell-id="${cell.id}"
                data-title="${escHtml(cell.portalName)} — ${escHtml(cell.user)}"
                title="${escHtml(cell.portalName)} — ${escHtml(cell.user)}">
                <span class="cell-bell">${BELL_SOLID}</span>
                <span class="cell-num">${escHtml(displayNumber(cell))}</span>
                <span class="cell-pc">${escHtml(cell.pcNumber)}</span>
            </button>`).join('');

        return `
        <div class="block" data-color="${cfg.colorKey}" data-grid-id="${cfg.id}" data-index="${idx}">
            <div class="block-head">
                <span class="dot"></span>
                <span class="block-chip">${cfg.label}</span>
                <span class="block-size">${cfg.rows}×${cfg.cols}</span>
            </div>
            <div class="block-frame">
                <div class="cell-grid" style="grid-template-columns: repeat(${cfg.cols}, var(--cell-size))">${cells}</div>
            </div>
        </div>`;
    }).join('');

    updateWallState();
}

function updateWallState() {
    const q = state.searchQuery;
    const sel = state.selected;

    $$('.block').forEach(block => {
        const idx = Number(block.dataset.index);
        const gridId = block.dataset.gridId;
        let anyMatch = false;

        block.querySelectorAll('.cell').forEach(el => {
            const cell = findCell(gridId, el.dataset.cellId);
            const match = q && matchesQuery(cell, q);
            if (match) anyMatch = true;
            el.classList.toggle('is-match', Boolean(match));
            el.classList.toggle('is-miss', Boolean(q) && !match);
            el.classList.toggle('is-selected', Boolean(sel) && sel.cellId === cell.id);
            // Bell: the station whose alerts this browser receives (one per PC / device)
            const mine = localPushStation() === displayNumber(cell);
            el.classList.toggle('has-alerts', mine);
            el.title = el.dataset.title + (mine ? ` · alerts on this ${deviceWord()}` : '');
        });

        block.classList.toggle('is-focused', idx === state.activeIndex);
        block.classList.toggle('is-dimmed', Boolean(q) && !anyMatch);
    });
}

// ─── Block browser ────────────────────────────────────────────────────────────
function focusBlock(idx) {
    const n = GRID_CONFIG.length;
    state.activeIndex = (idx + n) % n;
    state.blockFilter = '';
    $('block-filter').value = '';
    renderBrowser();
    updateWallState();
    if (isNarrow()) {
        const block = document.querySelector(`.block[data-index="${state.activeIndex}"]`);
        if (block) block.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
}

function renderBrowser() {
    const cfg = GRID_CONFIG[state.activeIndex];
    const cells = visibleCells(cfg.id);
    const shown = sortCells(cells.filter(c => matchesQuery(c, state.blockFilter)));

    $('block-dots').innerHTML = GRID_CONFIG.map((c, i) => `
        <button class="block-dot${i === state.activeIndex ? ' is-active' : ''}" type="button" role="tab"
            data-color="${c.colorKey}" data-index="${i}" aria-selected="${i === state.activeIndex}"
            aria-label="${c.label}" title="${c.label}"></button>`).join('');

    const showing = state.blockFilter ? ` · showing ${shown.length} of ${cells.length}` : '';
    $('browser-label').innerHTML =
        `<strong>${cfg.label}</strong> — ${cfg.rows}×${cfg.cols} · ${cells.length} ${cells.length === 1 ? 'cell' : 'cells'}${showing}`;

    $$('#sort-label [data-sort]').forEach(el => {
        const active = el.dataset.sort === state.sortBy;
        el.classList.toggle('is-active', active);
        el.setAttribute('aria-hidden', String(!active));
    });

    const grid = $('card-grid');
    grid.innerHTML = shown.length
        ? shown.map(cell => cardHTML(cell, cfg)).join('')
        : `<div class="empty-state">No stations in ${cfg.label} match “${escHtml(state.blockFilter)}”.</div>`;
}

function cardHTML(cell, cfg) {
    const sel = state.selected;
    const isSel = sel && sel.cellId === cell.id;
    const fields = [
        ['Operator', cell.user],
        ['Developer', developerName(cell)],
        ['IP Addr', cell.ipAddress],
        ['Portal', cell.portalName],
    ];
    return `
    <article class="card${isSel ? ' is-selected' : ''}" tabindex="0" data-color="${cfg.colorKey}"
        data-grid-id="${cfg.id}" data-cell-id="${cell.id}" aria-label="${escHtml(cell.pcNumber)}, ${escHtml(cell.portalName)}">
        <div class="card-body">
            <div class="card-head">
                <span class="card-pc">${escHtml(cell.pcNumber)}</span>
                <span class="card-badge">${escHtml(displayNumber(cell))}</span>
            </div>
            <dl class="card-fields">
                ${fields.map(([k, v]) => `
                <div class="card-field"><dt>${k}</dt><dd title="${escHtml(v || '')}">${escHtml(v || '—')}</dd></div>`).join('')}
            </dl>
            <span class="card-link">View in panel ${ic('arrow-right', 14)}</span>
        </div>
    </article>`;
}

// ─── Archive ──────────────────────────────────────────────────────────────────
const ARCHIVE_GROUPS = {
    global: ['G1', 'G2'],
    national: ['N1', 'N2'],
    cop: ['COP'],
};

function renderArchive() {
    const q = ($('archive-search').value || '').trim().toLowerCase();
    const groups = ARCHIVE_GROUPS[state.archiveFilter];

    const items = [];
    GRID_CONFIG.forEach(cfg => {
        if (groups && !groups.includes(cfg.id)) return;
        inPortalOrder(GRID_DATA[cfg.id]).forEach(cell => {
            if (cell.archived && matchesQuery(cell, q)) items.push(cardHTML(cell, cfg));
        });
    });

    // Chip counts ignore the search, so they always show what each group holds
    const archivedIn = ids => GRID_CONFIG.filter(c => !ids || ids.includes(c.id))
        .reduce((n, c) => n + GRID_DATA[c.id].filter(cell => cell.archived).length, 0);
    const counts = { all: archivedIn(null) };
    Object.keys(ARCHIVE_GROUPS).forEach(k => { counts[k] = archivedIn(ARCHIVE_GROUPS[k]); });
    $$('#archive-tabs .filter-chip').forEach(t => {
        const on = t.dataset.filter === state.archiveFilter;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.querySelector('.filter-chip-count').textContent = counts[t.dataset.filter];
    });
    $('archive-sub').textContent = counts.all
        ? `${counts.all} retired ${counts.all === 1 ? 'station' : 'stations'} — no longer shown on the screen wall.`
        : 'No retired stations — every station is on the screen wall.';

    const filtered = q || state.archiveFilter !== 'all';
    $('archive-grid').innerHTML = items.length
        ? items.join('')
        : `<div class="empty-state">
            <div class="empty-state-icon">${ic(filtered ? 'search' : 'archive', 20)}</div>
            <div class="empty-state-title">${filtered ? 'No matches' : 'Nothing archived'}</div>
            <p>${filtered ? 'Try another filter or search.' : 'Retired stations will appear here.'}</p>
        </div>`;
}

// ─── Selection & side panel ───────────────────────────────────────────────────
function selectCell(gridId, cellId) {
    state.selected = { gridId, cellId };
    state.devPortal = null;
    const idx = cfgIndex(gridId);
    const cell = findCell(gridId, cellId);
    // Jump the browser to the station's block (archived stations stay in the archive list)
    if (idx !== state.activeIndex && cell && !cell.archived) {
        state.activeIndex = idx;
        state.blockFilter = '';
        $('block-filter').value = '';
    }
    refreshSelection();
}

function clearSelection() {
    state.selected = null;
    state.devPortal = null;
    refreshSelection();
}

function refreshSelection() {
    renderPanel();
    renderBrowser();
    renderDevWidget();
    updateWallState();
    if (state.view === 'archive') renderArchive();
}

const PANEL_TABS = [
    { id: 'overview', label: 'Overview', icon: 'info' },
    { id: 'description', label: 'Description', icon: 'file-text' },
];

// ─── Mobile: the side panel becomes a bottom sheet ───────────────────────────
const isNarrow = () => window.matchMedia('(max-width: 1080px)').matches;

function syncSheet() {
    const open = Boolean(getSelected() || getDevPortal());
    const sheet = open && isNarrow();
    $('panel').classList.toggle('is-open', open);
    $('sheet-backdrop').hidden = !sheet;
    document.body.classList.toggle('sheet-open', sheet);
}

// Drag the sheet down by its top edge to close it
function initSheetGestures() {
    const panel = $('panel');
    let startY = null;
    let dy = 0;
    panel.addEventListener('touchstart', e => {
        if (!isNarrow() || !panel.classList.contains('is-open')) return;
        const top = panel.getBoundingClientRect().top;
        if (e.touches[0].clientY - top > 72) return;   // only the handle / header area
        startY = e.touches[0].clientY;
        dy = 0;
        panel.style.transition = 'none';
    }, { passive: true });
    panel.addEventListener('touchmove', e => {
        if (startY === null) return;
        dy = Math.max(0, e.touches[0].clientY - startY);
        panel.style.transform = `translateY(${dy}px)`;
    }, { passive: true });
    panel.addEventListener('touchend', () => {
        if (startY === null) return;
        startY = null;
        panel.style.transition = '';
        panel.style.transform = '';
        if (dy > 90) clearSelection();
    });
    $('sheet-backdrop').addEventListener('click', clearSelection);
    window.matchMedia('(max-width: 1080px)').addEventListener('change', syncSheet);
}

function renderPanel() {
    renderPanelContent();
    syncSheet();
}

function renderPanelContent() {
    const panel = $('panel');
    const devSel = getDevPortal();
    if (devSel) {
        renderDevPortalPanel(panel, devSel);
        return;
    }
    const sel = getSelected();

    if (!sel) {
        panel.removeAttribute('data-color');
        panel.innerHTML = `
        <div class="panel-empty">
            <div class="panel-empty-icon">${ic('monitor', 22)}</div>
            <div class="panel-empty-title">No station selected</div>
            <p>Click a cell on the wall, a card below, or a developer's portal to see its details here.</p>
        </div>`;
        return;
    }

    const { cell, cfg } = sel;
    panel.dataset.color = cfg.colorKey;

    const tabs = PANEL_TABS.map(t => `
        <button class="panel-tab${t.id === state.panelTab ? ' is-active' : ''}" type="button" role="tab"
            data-tab="${t.id}" aria-selected="${t.id === state.panelTab}">${ic(t.icon, 14)}${t.label}</button>`).join('');

    const body = state.panelTab === 'description' ? panelDescriptionTab(cell) : panelOverviewTab(cell);


    panel.innerHTML = `
    <div class="panel-head">
        <div class="panel-icon">${ic('monitor', 18)}</div>
        <div class="panel-heading">
            <div class="panel-title">${escHtml(cell.pcNumber)}</div>
            <div class="panel-tags">
                <span class="panel-tag is-block"><span class="panel-tag-dot"></span>Subgrid ${cfg.label}</span>
                <span class="panel-tag"><span class="panel-tag-key">Portal</span>${escHtml(displayNumber(cell))}</span>
            </div>
        </div>
        <button id="panel-close" class="icon-btn icon-btn-sm" type="button" aria-label="Clear selection" title="Clear selection (Esc)">${ic('x', 14)}</button>
    </div>
    <div class="panel-tabs" role="tablist">${tabs}</div>
    <div class="panel-body${state.panelTab === 'description' ? ' is-desc' : ''}" role="tabpanel">${body}</div>
    <div class="panel-foot panel-foot-alerts">
        <div class="foot-label">Send alert</div>
        <div class="foot-actions">${desktopAlertButton(cell)}${mailAlertButton(cell)}</div>
    </div>`;
    updateDesktopButton(cell);
}

// Desktop: push notification to the PC(s) registered for this station
function desktopAlertButton(cell) {
    const id = displayNumber(cell);
    const known = pushStatusValue;
    const n = known && known.stations ? known.stations[id] || 0 : null;
    const off = known && (!known.enabled || !n);
    return `<button id="panel-alert-desktop" class="btn btn-danger btn-lg" type="button" data-station="${escHtml(id)}"
        ${off ? 'disabled' : ''} title="${escHtml(desktopAlertTitle(id, known, n))}">${ic('monitor', 15)}Desktop</button>`;
}

// Mail: email to the operator
function mailAlertButton(cell) {
    const attrs = cell.mail
        ? `title="Email ${escHtml(cell.user)} at ${escHtml(cell.mail)}"`
        : 'disabled title="No email on file for this operator"';
    return `<button id="panel-alert-mail" class="btn btn-danger btn-lg" type="button" ${attrs}>${ic('mail', 15)}Mail</button>`;
}

// One labelled row: label on the left, value (+ optional meta text / extra HTML) on the right
function infoRow(label, value, meta, extraHTML = '') {
    return `
    <div class="info-row">
        <div class="info-row-label">${label}</div>
        <div class="info-row-body">
            <div class="info-row-value" title="${escHtml(value)}">${escHtml(value || '—')}</div>
            ${meta ? `<div class="info-row-meta" title="${escHtml(meta)}">${escHtml(meta)}</div>` : ''}
            ${extraHTML}
        </div>
    </div>`;
}

function serverBadge(access) {
    if (!access) return '';
    const text = `${escHtml(access.label)}${access.port ? ` · Port ${escHtml(access.port)}` : ''}`;
    return `<span class="type-badge" data-type="${escHtml(access.type)}">${text}</span>`;
}

// Which station this PC receives alerts for (one station per PC)
function pushRow(cell) {
    if (!pushSupported()) return '';
    const id = displayNumber(cell);
    const current = localPushStation();
    const here = current === id;
    const text = here ? 'Activated'
        : current ? `Active for ${escHtml(current)}`
            : 'Not activated';
    const label = here ? 'Stop' : current ? `Switch to ${escHtml(id)}` : 'Receive alerts here';
    const title = here ? `Stop showing this station’s alerts on this ${deviceWord()}`
        : current ? `This ${deviceWord()} gets ${escHtml(current)}’s alerts. Switch it to ${escHtml(id)} instead`
            : `Show this station’s alerts as notifications on this ${deviceWord()}`;
    return `
    <div class="info-row">
        <div class="info-row-label">Alerts</div>
        <div class="info-row-body">
            <div class="info-row-meta${here ? ' is-on' : ''}">${text}</div>
            <button id="panel-push" class="btn btn-sm ${here ? 'btn-muted' : 'btn-primary'} push-btn" type="button" title="${title}">
                ${ic(here ? 'bell-off' : 'bell', 13)}${label}
            </button>
        </div>
    </div>`;
}

// Full-screen helper (Windows tray app) for the PC that receives this station's alerts
function helperRow(cell) {
    if (!pushSupported() || !isWindows() || localPushStation() !== displayNumber(cell)) return '';
    queueMicrotask(updateHelperRow);
    return `<div id="helper-row" class="info-row">${helperRowInner()}</div>`;
}

function helperRowInner() {
    const running = helperState === true;
    const outdated = running && helperVersion !== HELPER_VERSION;
    const text = helperState === null ? 'Checking…'
        : !running ? 'Not running'
        : outdated ? `Old version${helperVersion ? ` (v${helperVersion})` : ''}` : `Running · v${helperVersion}`;
    const test = running && !outdated
        ? `<button id="helper-test" class="btn btn-sm btn-muted btn-icon" type="button"
            aria-label="Test alert" title="Show a full-screen test alert on this PC">${ic('monitor', 14)}</button>`
        : '';
    const download = `<a class="btn btn-sm ${running && !outdated ? 'btn-muted' : 'btn-primary'} btn-icon"
            href="${HELPER_DOWNLOAD}?v=${HELPER_VERSION}" download="NEOC-Alert-Helper.exe" aria-label="Download the alert helper"
            title="${outdated ? `Download v${HELPER_VERSION}. Running it replaces the old version`
                : 'Download the Windows helper that shows alerts full-screen'}">${ic('download', 14)}</a>`;
    const uninstall = running
        ? `<button id="helper-uninstall" class="btn btn-sm btn-muted btn-icon helper-uninstall" type="button"
            aria-label="Uninstall the alert helper" title="Uninstall the helper from this PC">${ic('trash', 14)}</button>`
        : '';
    return `
        <div class="info-row-label">Helper</div>
        <div class="info-row-body">
            <div class="info-row-meta${outdated ? ' is-warn' : ''}">${text}</div>
            <div class="helper-actions">${test}${download}${uninstall}</div>
        </div>`;
}

async function updateHelperRow() {
    await pingHelper();
    const row = $('helper-row');
    if (row) row.innerHTML = helperRowInner();
}

function panelOverviewTab(cell) {
    return `
    <div class="panel-portal-name" title="${escHtml(cell.portalName)}">${escHtml(cell.portalName || 'Untitled portal')}</div>
    <div class="info-rows">
        ${infoRow('Category', cell.category)}
        ${infoRow('Operator', cell.user, cell.mail || 'No email on file')}
        ${infoRow('Network', cell.ipAddress, '', serverBadge(accessInfo(cell)))}
        ${pushRow(cell)}
        ${helperRow(cell)}
    </div>
    <div>
        <div class="section-label">Portal access</div>
        ${accessSection(cell)}
    </div>`;
}

function panelDescriptionTab(cell) {
    return hasDescription(cell)
        ? `<div class="desc-frame"><div class="desc-scroll"><div class="about-text rich-text">${richText(cell.portalDescription)}</div></div></div>`
        : `<div class="desc-frame"><div class="desc-scroll"><div class="about-text is-empty">No description added yet.</div></div></div>`;
}

// Label above its content (access box)
function field(label, contentHTML) {
    return `<div class="field"><div class="field-label">${label}</div>${contentHTML}</div>`;
}

function kv(key, valueHTML) {
    return `<div class="kv"><span class="kv-key">${key}</span><span class="kv-val">${valueHTML}</span></div>`;
}

function accessSection(cell) {
    const access = accessInfo(cell);
    if (!access) {
        return `
        <div class="callout">
            ${ic('alert-triangle', 15)}
            <div><strong>Access not configured.</strong> No port or server type is set for this station yet.</div>
        </div>`;
    }

    const folder = cell.projectDir && access.type !== 'browser'
        ? field('Folder', `<div class="field-val">${escHtml(cell.projectDir)}</div>`) : '';
    const steps = access.steps.length
        ? field('Steps', `<ol class="steps">${access.steps.map(s => `<li>${escHtml(s)}</li>`).join('')}</ol>`)
        : '';
    const url = access.url ? `
        <a class="url-box" href="${escHtml(access.url)}" target="_blank" rel="noopener">
            ${ic('globe', 14)}<span>${escHtml(access.url.replace(/^https?:\/\//, ''))}</span>${ic('external-link', 13)}
        </a>` : '';

    return `
    <div class="inset">
        ${folder}
        ${steps}
        ${url}
    </div>`;
}

// ─── Send alert: Desktop (push) and Mail (email) are separate buttons ────────
function setAlertBusy(btn, busy, idleHTML) {
    if (!btn) return;
    btn.disabled = busy;
    btn.setAttribute('aria-busy', String(busy));
    btn.innerHTML = busy ? '<span class="spinner" aria-hidden="true"></span>Sending' : idleHTML;
}

async function sendMailAlert(cell, gridId) {
    const toEmail = cell.mail;
    const toName = cell.user;
    if (!toEmail) {
        showToast('warn', `No email set for ${cell.pcNumber}`);
        return;
    }
    if (typeof emailjs === 'undefined') {
        showToast('error', 'Email service unavailable — check the internet connection');
        return;
    }
    const timestamp = new Date().toLocaleString('en-US', { hour12: false });
    const btn = $('panel-alert-mail');
    const idle = `${ic('mail', 15)}Mail`;
    setAlertBusy(btn, true, idle);
    try {
        await emailjs.send(
            EJS_SERVICE_ID,
            EJS_TEMPLATE_ID,
            {
                to_email: toEmail,
                to_name: toName,
                message: `You are requested to return to your workstation (${cell.pcNumber}) and resume operations on the ${cell.portalName} portal.`,
                pc_number: cell.pcNumber,
                portal: cell.portalName,
                subgrid: gridId,
                ip_address: cell.ipAddress,
                timestamp: timestamp,
            },
            EJS_PUBLIC_KEY
        );
        console.log(`[Alert] MAIL SENT | ${toName} <${toEmail}> | ${timestamp}`);
        showToast('success', `Mail alert sent to ${toName}`);
    } catch (err) {
        console.error(`[Alert] MAIL FAILED | ${toName} <${toEmail}> | ${timestamp} |`, err);
        showToast('error', 'Mail alert failed — see console');
    } finally {
        if ($('panel-alert-mail') === btn) setAlertBusy(btn, false, idle);   // the panel may show another station by now
    }
}

async function sendDesktopAlert(cell) {
    const id = displayNumber(cell);
    const btn = $('panel-alert-desktop');
    const idle = `${ic('monitor', 15)}Desktop`;
    setAlertBusy(btn, true, idle);
    const result = await pushAlert(cell);
    if ($('panel-alert-desktop') === btn) setAlertBusy(btn, false, idle);

    console.log(`[Alert] DESKTOP | ${id} |`, result);
    if (result.error) {
        showToast('error', `Desktop alert failed — ${result.error}`);
    } else if (result.sent) {
        showToast('success', `Desktop alert sent to ${cell.user} · ${result.sent} PC${result.sent === 1 ? '' : 's'}`);
    } else if (result.failed) {
        showToast('error', 'Desktop alert could not be delivered — see console');
    } else {
        showToast('warn', `No PC receives ${id}'s alerts yet`);
    }
    await getPushStatus(true);   // counts may have changed (expired devices are removed)
    updateDesktopButton(cell);
    updateWallState();
}

// ─── Push alerts: which PCs receive a station's alerts (server: api/) ────────
const PUSH_STORE = 'ndma_push_station';    // the one station this PC receives alerts for
const PUSH_STORE_OLD = 'ndma_push_stations';   // earlier list format (several stations)
let pushConfigPromise = null;

const pushSupported = () => window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window;

function localPushStation() {
    try {
        const id = localStorage.getItem(PUSH_STORE);
        if (id) return id;
        // Earlier versions kept a list; keep only the last station picked
        const old = JSON.parse(localStorage.getItem(PUSH_STORE_OLD));
        return Array.isArray(old) && old.length ? old[old.length - 1] : null;
    } catch (e) {
        return null;
    }
}

function saveLocalPushStation(id) {
    try {
        if (id) localStorage.setItem(PUSH_STORE, id);
        else localStorage.removeItem(PUSH_STORE);
        localStorage.removeItem(PUSH_STORE_OLD);
    } catch (e) { /* storage unavailable */ }
}

function getPushConfig() {
    if (!pushConfigPromise) {
        pushConfigPromise = fetch('api/push-config', { cache: 'no-store' })
            .then(r => (r.ok ? r.json() : { enabled: false }))
            .catch(() => ({ enabled: false }));
    }
    return pushConfigPromise;
}

function base64UrlToBytes(b64) {
    const pad = '='.repeat((4 - (b64.length % 4)) % 4);
    const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, ch => ch.charCodeAt(0));
}

async function currentSubscription(publicKey, create) {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing || !create) return existing;
    return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(publicKey) });
}

async function pushApi(method, body) {
    const res = await fetch('api/push-subscribe', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${res.status} ${(await res.json().catch(() => ({}))).error || ''}`.trim());
}

const pcLabel = () => `${navigator.userAgentData?.platform || navigator.platform || 'PC'} · ${new Date().toLocaleDateString('en-GB')}`;

// Send the alert to every PC registered for this station → { total, sent, failed, expired } or { error }
async function pushAlert(cell) {
    if (!window.isSecureContext) return { error: 'only available on the website or installed app' };
    const cfg = await getPushConfig();
    if (!cfg.enabled) return { error: 'not set up on the server' };
    try {
        const res = await fetch('api/push-notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stationId: displayNumber(cell), pc: cell.pcNumber, portal: cell.portalName }),
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            console.warn('[Push] notify', res.status, body);
            return { error: body.error || `server error ${res.status}` };
        }
        return await res.json();
    } catch (err) {
        console.warn('[Push] notify', err);
        return { error: 'no connection' };
    }
}

// How many PCs each station has (api/push-status), cached for 30 s
let pushStatusValue = null;
let pushStatusCache = null;

function getPushStatus(force = false) {
    if (!force && pushStatusCache && Date.now() - pushStatusCache.at < 30000) return pushStatusCache.promise;
    const promise = (window.isSecureContext
        ? fetch('api/push-status', { cache: 'no-store' }).then(r => (r.ok ? r.json() : { enabled: false, stations: {} }))
        : Promise.resolve({ enabled: false, stations: {} }))
        .catch(() => ({ enabled: false, stations: {} }))
        .then(status => (pushStatusValue = status));
    pushStatusCache = { at: Date.now(), promise };
    return promise;
}

function desktopAlertTitle(id, status, n) {
    if (!status) return `Send a desktop notification to ${id}'s PC`;
    if (!status.enabled) return 'Desktop alerts are not available here';
    if (!n) return `No PC receives ${id}'s alerts yet. On the operator's PC: This PC → Receive alerts here`;
    return `Send a desktop notification to ${n} PC${n === 1 ? '' : 's'} for ${id}`;
}

// Enable the Desktop button only when the station has a registered PC
async function updateDesktopButton(cell) {
    const id = displayNumber(cell);
    const status = await getPushStatus();
    const btn = $('panel-alert-desktop');
    if (!btn || btn.dataset.station !== id || btn.getAttribute('aria-busy') === 'true') return;
    const n = (status.stations && status.stations[id]) || 0;
    btn.disabled = !status.enabled || !n;
    btn.title = desktopAlertTitle(id, status, n);
}

// Side panel "This PC" row: this PC receives ONE station's alerts as system notifications.
// Picking another station moves it there (the server removes it from the old one).
// Spinner on the Alerts button while this device registers / unregisters; the panel re-renders after
async function togglePushHere(cell) {
    const btn = $('panel-push');
    if (btn && btn.disabled) return;
    const stopping = localPushStation() === displayNumber(cell);
    if (btn) {
        btn.disabled = true;
        btn.setAttribute('aria-busy', 'true');
        btn.innerHTML = `<span class="spinner" aria-hidden="true"></span>${stopping ? 'Stopping' : 'Activating'}`;
    }
    try {
        await updatePushHere(cell);
    } finally {
        renderPanel();
    }
}

async function updatePushHere(cell) {
    const id = displayNumber(cell);
    const current = localPushStation();

    if (current === id) {
        try {
            const sub = await currentSubscription('', false);
            if (sub) {
                await pushApi('DELETE', { endpoint: sub.endpoint });
                await sub.unsubscribe();
            }
            saveLocalPushStation(null);
            await getPushStatus(true);
            updateWallState();
            showToast('info', `This ${deviceWord()} no longer receives alerts for ${id}`);
        } catch (err) {
            console.error('[Push]', err);
            showToast('error', `Could not update this ${deviceWord()} — see console`);
        }
        return;
    }

    const permission = await ensureNotifyPermission();
    if (permission !== 'granted') {
        showToast('warn', `Allow notifications to receive alerts on this ${deviceWord()}`);
        return;
    }
    const cfg = await getPushConfig();
    if (!cfg.enabled) {
        showToast('error', 'Device alerts are not set up on the server yet');
        return;
    }
    try {
        const sub = await currentSubscription(cfg.publicKey, true);
        await pushApi('POST', { stationId: id, subscription: sub.toJSON(), label: pcLabel() });
        saveLocalPushStation(id);
        await getPushStatus(true);
        updateWallState();
        showToast('success', current
            ? `This ${deviceWord()} now receives alerts for ${id} only (moved from ${current})`
            : `This ${deviceWord()} now receives alerts for ${id}`);
    } catch (err) {
        console.error('[Push]', err);
        showToast('error', `Could not register this ${deviceWord()} — see console`);
    }
}

// On start-up, re-send this PC's registration so the server has its current subscription
// (this also removes it from any other station it was linked to before)
async function refreshPushRegistrations() {
    const id = localPushStation();
    if (!id || !pushSupported() || Notification.permission !== 'granted') return;
    const cfg = await getPushConfig();
    if (!cfg.enabled) return;
    try {
        const sub = await currentSubscription(cfg.publicKey, true);
        await pushApi('POST', { stationId: id, subscription: sub.toJSON(), label: pcLabel() });
        saveLocalPushStation(id);
    } catch (err) {
        console.warn('[Push] refresh', err);
    }
}

// ─── Search ───────────────────────────────────────────────────────────────────
function handleSearch(query) {
    state.searchQuery = query.trim().toLowerCase();
    updateWallState();
}

function selectFirstMatch() {
    if (!state.searchQuery) return;
    for (const cfg of GRID_CONFIG) {
        const hit = inPortalOrder(visibleCells(cfg.id)).find(c => matchesQuery(c, state.searchQuery));
        if (hit) {
            if (state.view !== 'wall') setView('wall');
            selectCell(cfg.id, hit.id);
            return;
        }
    }
    showToast('info', 'No station matches that search');
}

// ─── Status bar ───────────────────────────────────────────────────────────────
function renderStatusBar() {
    const cells = allVisibleCells();
    const configured = cells.filter(isConfigured).length;
    const needSetup = cells.length - configured;

    $('status-stations').textContent = `${cells.length} stations · ${configured} configured`;
    $('status-grids').textContent = `${GRID_CONFIG.length} subgrids`;
    $('status-setup').textContent = `${needSetup} need setup`;
    $('status-setup-wrap').hidden = needSetup === 0;
    $('page-sub').textContent =
        `${GRID_CONFIG.length} blocks · ${cells.length} positions · click a cell to inspect it in the side panel`;
}

// Urbanist has no tabular figures, so each digit gets a fixed-width slot to keep the clock from shifting
function tickClock() {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    $('status-time').innerHTML = [...time]
        .map(ch => /\d/.test(ch) ? `<span class="clock-digit">${ch}</span>` : ch)
        .join('');
}

// ─── Toast ────────────────────────────────────────────────────────────────────
const TOAST_ICONS = { success: 'check-circle', error: 'alert-circle', warn: 'alert-triangle', info: 'info' };
let toastTimer;

const TOAST_MS = 5000;

function showToast(type, msg) {
    const toast = $('toast');
    $('toast-icon').innerHTML = svgIcon(TOAST_ICONS[type] || 'info', 16);
    $('toast-msg').textContent = msg;
    toast.className = `toast ${type}`;
    void toast.offsetWidth;                 // restart the entry animation
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), TOAST_MS);
}

// ─── Desktop notifications (Windows notification centre, macOS, …) ───────────
const canNotify = () => 'Notification' in window;

function ensureNotifyPermission() {
    if (!canNotify()) return Promise.resolve('unsupported');
    if (Notification.permission !== 'default') return Promise.resolve(Notification.permission);
    return Promise.resolve(Notification.requestPermission())
        .catch(() => Notification.permission);
}

// ─── Alert helper: Windows tray app that shows alerts full-screen ────────────
// downloads/NEOC-Alert-Helper.exe (source: helper/). It listens only on this PC (127.0.0.1).
const HELPER_URL = 'http://127.0.0.1:47800';
const HELPER_DOWNLOAD = 'downloads/NEOC-Alert-Helper.exe';
const HELPER_VERSION = '1.1';   // keep in step with Program.Version in helper/NeocAlertHelper.cs
let helperState = null;   // null = not checked yet, true = running, false = not found
let helperVersion = '';

const isWindows = () => /Windows/i.test(navigator.userAgent);
const isMobileDevice = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const deviceWord = () => (isMobileDevice() ? 'device' : 'PC');

async function pingHelper() {
    try {
        const res = await fetch(`${HELPER_URL}/ping`, { cache: 'no-store' });
        helperState = res.ok;
        helperVersion = res.ok ? ((await res.json().catch(() => ({}))).version || '') : '';
    } catch (e) {
        helperState = false;
    }
    return helperState;
}

// text/plain keeps it a simple request; the helper ignores repeats of the same alert
function sendToHelper(alert) {
    return fetch(`${HELPER_URL}/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(alert),
    }).then(res => res.ok).catch(() => false);
}

async function testHelper() {
    const ok = await sendToHelper({
        title: 'NEOC alert · TEST',
        body: 'This is a test. Alerts for this PC will look like this. Click Acknowledge to close it.',
        stationId: 'TEST',
        at: new Date().toISOString(),
    });
    if (!ok) {
        helperState = false;
        const row = $('helper-row');
        if (row) row.innerHTML = helperRowInner();
        showToast('warn', 'Helper not running — download it and run it on this PC');
    }
}

// Stops the helper, removes it from Windows startup and deletes its exe (helper v1.1+)
async function uninstallHelper() {
    if (!confirm('Uninstall the NEOC Alert Helper from this PC?\n\nIt stops, no longer starts with Windows, and its file is deleted. You can download it again at any time.')) return;
    const res = await fetch(`${HELPER_URL}/uninstall`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' })
        .catch(() => null);
    if (res && res.ok) {
        helperState = false;
        helperVersion = '';
        showToast('success', 'Alert helper uninstalled from this PC');
    } else if (res && res.status === 404) {
        showToast('warn', 'This old helper can’t uninstall itself. Download the new one and run it: it replaces the old one');
    } else {
        showToast('error', 'Could not reach the alert helper');
        await pingHelper();
    }
    const row = $('helper-row');
    if (row) row.innerHTML = helperRowInner();
}

// ─── Incoming alert: pulsing overlay in the middle of the screen ─────────────
// Shown when a desktop alert arrives for this PC's station (from the service worker),
// or when the app is opened from the alert's notification.
const alertOverlay = { count: 0, titleTimer: null, baseTitle: document.title };

function showAlertOverlay(alert) {
    const overlay = $('alert-overlay');
    alertOverlay.count = overlay.hidden ? 1 : alertOverlay.count + 1;
    const when = alert.at ? new Date(alert.at) : new Date();
    $('alert-station').textContent = [alert.stationId, alert.pc].filter(Boolean).join(' · ').toUpperCase();
    $('alert-time').textContent = `RECEIVED ${when.toLocaleTimeString('en-US', { hour12: false })}`
        + (alertOverlay.count > 1 ? ` · ${alertOverlay.count} ALERTS` : '');
    overlay.hidden = false;
    $('alert-ack').focus();

    // Blink the window title so the alert is noticed from the taskbar
    clearInterval(alertOverlay.titleTimer);
    let on = false;
    alertOverlay.titleTimer = setInterval(() => {
        on = !on;
        document.title = on ? '⚠ NEOC ALERT' : alertOverlay.baseTitle;
    }, 1000);
}

async function acknowledgeAlert() {
    $('alert-overlay').hidden = true;
    alertOverlay.count = 0;
    clearInterval(alertOverlay.titleTimer);
    document.title = alertOverlay.baseTitle;
    if (navigator.clearAppBadge) navigator.clearAppBadge().catch(() => {});
    // Close the matching Windows notifications too
    try {
        const reg = await navigator.serviceWorker?.getRegistration();
        const open = reg ? await reg.getNotifications() : [];
        open.filter(n => n.data && n.data.type === 'neoc-alert').forEach(n => n.close());
    } catch (e) { /* nothing to close */ }
}

function initAlertOverlay() {
    $('alert-ack').addEventListener('click', acknowledgeAlert);
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', async e => {
            if (!e.data || e.data.type !== 'neoc-alert') return;
            // The desktop helper shows it full-screen; the browser only steps in when the helper isn't running
            if (await sendToHelper(e.data)) {
                if (navigator.clearAppBadge) navigator.clearAppBadge().catch(() => {});
                return;
            }
            showAlertOverlay(e.data);
        });
    }
    // Opened from an alert notification: ?alert=GCOP&at=…
    const params = new URLSearchParams(location.search);
    const station = params.get('alert');
    if (station) {
        const hit = findWallStation(station);
        const at = params.get('at');
        history.replaceState(null, '', location.pathname);
        pingHelper().then(running => {
            if (!running) showAlertOverlay({ stationId: station, pc: hit ? hit.cell.pcNumber : '', at });
        });
    }
}

// ─── Installable app (service worker + install button) ───────────────────────
let installPrompt = null;

function initPwa() {
    const secure = location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname);
    if ('serviceWorker' in navigator && secure) {
        navigator.serviceWorker.register('sw.js').catch(err => console.warn('[SW]', err));
    }
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        installPrompt = e;
        $('btn-install').hidden = false;
    });
    window.addEventListener('appinstalled', () => {
        installPrompt = null;
        $('btn-install').hidden = true;
        showToast('success', 'Installed — open NEOC Dashboard from the Start menu or taskbar');
    });
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    const iOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (iOS && !standalone) $('btn-install').hidden = false;
    $('btn-install').addEventListener('click', async () => {
        if (iOS && !installPrompt) {
            showToast('info', 'To install: tap the Share button, then “Add to Home Screen”');
            return;
        }
        if (!installPrompt) return;
        installPrompt.prompt();
        await installPrompt.userChoice;
        installPrompt = null;
        $('btn-install').hidden = true;
    });
}

// ─── Utility ──────────────────────────────────────────────────────────────────
function escHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ─── Event listeners ──────────────────────────────────────────────────────────
function attachListeners() {
    // Topbar
    $('btn-theme').addEventListener('click', toggleTheme);
    $('btn-wall').addEventListener('click', () => setView('wall'));
    $('btn-archive').addEventListener('click', () => setView(state.view === 'archive' ? 'wall' : 'archive'));

    $('search-input').addEventListener('input', e => {
        handleSearch(e.target.value);
        $('search-clear').hidden = !e.target.value;
    });
    $('search-clear').addEventListener('click', () => {
        const input = $('search-input');
        input.value = '';
        input.dispatchEvent(new Event('input'));
        input.focus();
    });
    $('search-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') selectFirstMatch();
    });

    // Wall: cell → select, block header/frame → focus block
    $('wall').addEventListener('click', e => {
        const cell = e.target.closest('.cell');
        if (cell) {
            selectCell(cell.dataset.gridId, cell.dataset.cellId);
            return;
        }
        const block = e.target.closest('.block');
        if (block && (e.target.closest('.block-head') || e.target.closest('.block-frame'))) {
            focusBlock(Number(block.dataset.index));
        }
    });

    // Block browser
    $('block-prev').addEventListener('click', () => focusBlock(state.activeIndex - 1));
    $('block-next').addEventListener('click', () => focusBlock(state.activeIndex + 1));
    $('block-dots').addEventListener('click', e => {
        const dot = e.target.closest('.block-dot');
        if (dot) focusBlock(Number(dot.dataset.index));
    });
    $('block-filter').addEventListener('input', e => {
        state.blockFilter = e.target.value.trim().toLowerCase();
        renderBrowser();
    });
    $('btn-sort').addEventListener('click', () => {
        state.sortBy = state.sortBy === 'portal' ? 'pc' : 'portal';
        renderBrowser();
    });
    $('open-archive').addEventListener('click', () => setView(state.view === 'archive' ? 'wall' : 'archive'));

    // Cards (wall browser + archive): click or Enter/Space → select
    ['card-grid', 'archive-grid'].forEach(id => {
        const grid = $(id);
        grid.addEventListener('click', e => {
            const card = e.target.closest('.card');
            if (card) selectCell(card.dataset.gridId, card.dataset.cellId);
        });
        grid.addEventListener('keydown', e => {
            const card = e.target.closest('.card');
            if (card && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                selectCell(card.dataset.gridId, card.dataset.cellId);
            }
        });
    });

    // Archive
    $('archive-back').addEventListener('click', () => setView('wall'));
    $('archive-tabs').addEventListener('click', e => {
        const tab = e.target.closest('.filter-chip');
        if (!tab) return;
        state.archiveFilter = tab.dataset.filter;
        renderArchive();
    });
    $('archive-search').addEventListener('input', renderArchive);

    // Developers widget
    $('dev-search').addEventListener('input', e => {
        state.devQuery = e.target.value.trim().toLowerCase();
        renderDevWidget();
    });
    $('dev-list').addEventListener('click', e => {
        const item = e.target.closest('.dev-item');
        if (!item) return;
        state.devId = item.dataset.devId;
        renderDevWidget();
    });
    $('dev-portals').addEventListener('click', e => {
        const row = e.target.closest('.dp-row');
        if (row) selectDevPortal(row.dataset.devId, row.dataset.portalId);
    });

    // Side panel (re-rendered, so delegate)
    $('panel').addEventListener('click', e => {
        const devChip = e.target.closest('[data-portal-id]');
        if (devChip) {
            selectDevPortal(devChip.dataset.devId, devChip.dataset.portalId);
            return;
        }
        const showWall = e.target.closest('[data-show-wall]');
        if (showWall) {
            const [gridId, cellId] = showWall.dataset.showWall.split('|');
            if (state.view !== 'wall') setView('wall');
            selectCell(gridId, cellId);
            return;
        }
        const tab = e.target.closest('[data-tab]');
        if (tab) {
            state.panelTab = tab.dataset.tab;
            renderPanel();
            return;
        }
        if (e.target.closest('#panel-close')) {
            clearSelection();
            return;
        }
        if (e.target.closest('#panel-alert-desktop')) {
            const sel = getSelected();
            if (sel) sendDesktopAlert(sel.cell);
            return;
        }
        if (e.target.closest('#panel-alert-mail')) {
            const sel = getSelected();
            if (sel) sendMailAlert(sel.cell, sel.cfg.id);
            return;
        }
        if (e.target.closest('#helper-test')) {
            testHelper();
            return;
        }
        if (e.target.closest('#helper-uninstall')) {
            uninstallHelper();
            return;
        }
        if (e.target.closest('#panel-push')) {
            const sel = getSelected();
            if (sel) togglePushHere(sel.cell);
        }
    });

    // Keyboard: ← → move between blocks, Esc clears input / selection
    document.addEventListener('keydown', e => {
        const typing = e.target.matches('input, textarea');
        if (e.key === 'Escape' && !$('alert-overlay').hidden) {
            acknowledgeAlert();
            return;
        }
        if (e.key === 'Escape') {
            if (typing) {
                e.target.value = '';
                e.target.dispatchEvent(new Event('input'));
                e.target.blur();
            } else if (state.selected || state.devPortal) {
                clearSelection();
            }
            return;
        }
        if (typing || state.view !== 'wall') return;
        if (e.key === 'ArrowLeft') focusBlock(state.activeIndex - 1);
        if (e.key === 'ArrowRight') focusBlock(state.activeIndex + 1);
    });
}
