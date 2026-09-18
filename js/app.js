/* ═══════════════════════════════════════════════════════
   NEOC Tech (EW) Dashboard – Application Logic
   Wall overview → block browser → side panel (no popups)
   ═══════════════════════════════════════════════════════ */

// ─── App State ────────────────────────────────────────────────────────────────
const state = {
    view: 'wall',             // 'wall' | 'archive'
    activeIndex: 0,           // focused block (index into GRID_CONFIG)
    selected: null,           // { gridId, cellId } shown in the side panel
    panelTab: 'overview',     // 'overview' | 'access' | 'about'
    searchQuery: '',
    blockFilter: '',
    sortBy: 'portal',         // 'portal' | 'pc'
    archiveFilter: 'all',     // 'all' | 'global' | 'national' | 'cop'
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
    'terminal': '<path d="m4 17 6-6-6-6m8 14h8"/>',
    'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8m8 4H8m8 4H8"/>',
    'globe': '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
    'external-link': '<path d="M15 3h6v6m-11 5L21 3m-3 10v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4m0 4h.01"/>',
    'alert-circle': '<circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>',
    'check-circle': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    'mail': '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    'phone': '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>',
    'radio': '<path d="M16.247 7.761a6 6 0 0 1 0 8.478m2.828-11.306a10 10 0 0 1 0 14.134m-14.15 0a10 10 0 0 1 0-14.134m2.828 11.306a6 6 0 0 1 0-8.478"/><circle cx="12" cy="12" r="2"/>',
    'clock': '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
};

// Stroke scales with size so every icon renders at the same visual weight
function svgIcon(name, size = 16) {
    const sw = (1.75 * 24 / size).toFixed(2);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

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

function matchesQuery(cell, q) {
    if (!q) return true;
    return [cell.pcNumber, cell.user, cell.ipAddress, cell.portalName,
        cell.portalNumber, cell.cellLabel, cell.portalDescription]
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
        start: 'VS Code → Open with Live Server',
        steps: ['Open the project folder in VS Code', 'Right-click index.html in the Explorer', 'Choose "Open with Live Server"'],
    },
    npm: {
        label: 'npm',
        start: 'npm start (or npm run dev)',
        steps: ['Open a terminal in the project folder', 'Run npm start (or npm run dev)', 'Open the URL below'],
    },
    browser: {
        label: 'Browser',
        start: 'Open the URL in any browser',
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
    return { type, port, url, ...(ACCESS_TYPES[type] || { label: type || 'Custom', start: '', steps: [] }) };
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') || 'light', false);
    hydrateIcons();
    renderWall();
    renderBrowser();
    renderPanel();
    renderStatusBar();
    attachListeners();
    tickClock();
    setInterval(tickClock, 1000);
});

// ─── Theme ────────────────────────────────────────────────────────────────────
function applyTheme(theme, persist = true) {
    const root = document.documentElement;
    root.classList.add('theme-switching');
    root.setAttribute('data-theme', theme);
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')));
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
                title="${escHtml(cell.portalName)} — ${escHtml(cell.user)}">
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
        ['User', cell.user],
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

    $$('#archive-tabs .seg-tab').forEach(t =>
        t.classList.toggle('is-active', t.dataset.filter === state.archiveFilter));

    $('archive-grid').innerHTML = items.length
        ? items.join('')
        : `<div class="empty-state">${q || state.archiveFilter !== 'all'
            ? 'No archived stations match your filter.'
            : 'No archived stations.'}</div>`;
}

// ─── Selection & side panel ───────────────────────────────────────────────────
function selectCell(gridId, cellId) {
    state.selected = { gridId, cellId };
    const idx = cfgIndex(gridId);
    const cell = findCell(gridId, cellId);
    // Jump the browser to the station's block (archived stations stay in the archive list)
    if (idx !== state.activeIndex && cell && !cell.archived) {
        state.activeIndex = idx;
        state.blockFilter = '';
        $('block-filter').value = '';
    }
    refreshSelection();
    // Stacked layout: the panel sits below the lists, so bring it into view
    if (window.matchMedia('(max-width: 1080px)').matches) {
        $('panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function clearSelection() {
    state.selected = null;
    refreshSelection();
}

function refreshSelection() {
    renderPanel();
    renderBrowser();
    updateWallState();
    if (state.view === 'archive') renderArchive();
}

const PANEL_TABS = [
    { id: 'overview', label: 'Overview', icon: 'info' },
    { id: 'access', label: 'Access', icon: 'terminal' },
    { id: 'about', label: 'About', icon: 'file-text' },
];

function renderPanel() {
    const panel = $('panel');
    const sel = getSelected();

    if (!sel) {
        panel.removeAttribute('data-color');
        panel.innerHTML = `
        <div class="panel-empty">
            <div class="panel-empty-icon">${ic('monitor', 22)}</div>
            <div class="panel-empty-title">No station selected</div>
            <p>Click a cell on the wall or a card below to see its operator, network and portal access here.</p>
        </div>`;
        return;
    }

    const { cell, cfg } = sel;
    panel.dataset.color = cfg.colorKey;

    const tabs = PANEL_TABS.map(t => `
        <button class="panel-tab${t.id === state.panelTab ? ' is-active' : ''}" type="button" role="tab"
            data-tab="${t.id}" aria-selected="${t.id === state.panelTab}">${ic(t.icon, 14)}${t.label}</button>`).join('');

    const body = state.panelTab === 'access' ? panelAccessTab(cell)
        : state.panelTab === 'about' ? panelAboutTab(cell, cfg)
            : panelOverviewTab(cell);

    const alertAttrs = cell.mail ? '' : 'disabled title="No email on file for this operator"';

    panel.innerHTML = `
    <div class="panel-head">
        <div class="panel-icon">${ic('monitor', 18)}</div>
        <div class="panel-heading">
            <div class="panel-title">${escHtml(cell.pcNumber)}</div>
            <div class="panel-sub">Subgrid ${cfg.label} · Portal ${escHtml(displayNumber(cell))}</div>
        </div>
        <button id="panel-close" class="icon-btn icon-btn-sm" type="button" aria-label="Clear selection" title="Clear selection (Esc)">${ic('x', 14)}</button>
    </div>
    <div class="panel-tabs" role="tablist">${tabs}</div>
    <div class="panel-body" role="tabpanel">${body}</div>
    <div class="panel-foot">
        <button id="panel-alert" class="btn btn-danger btn-lg" type="button" ${alertAttrs}>${ic('mail', 15)}Send Alert</button>
        <button id="panel-recall" class="btn btn-muted btn-lg" type="button">${ic('phone', 14)}Recall</button>
    </div>`;
}

function panelOverviewTab(cell) {
    const access = accessInfo(cell);
    return `
    <div class="tiles">
        <div class="tile">
            <div class="tile-label">Operator</div>
            <div class="tile-value" title="${escHtml(cell.user)}">${escHtml(cell.user || '—')}</div>
            <div class="tile-meta" title="${escHtml(cell.mail)}">${escHtml(cell.mail || 'No email on file')}</div>
        </div>
        <div class="tile">
            <div class="tile-label">Network</div>
            <div class="tile-value">${escHtml(cell.ipAddress || '—')}</div>
            <div class="tile-meta">${access && access.port ? `Port ${escHtml(access.port)}` : 'No port configured'}</div>
        </div>
    </div>
    <div>
        <div class="section-label">Portal access</div>
        ${accessSection(cell, false)}
    </div>
    ${aboutSection(cell, true)}`;
}

function panelAccessTab(cell) {
    return `
    <div>
        <div class="section-label">Portal access</div>
        ${accessSection(cell, true)}
    </div>`;
}

function panelAboutTab(cell, cfg) {
    return `
    ${aboutSection(cell, false)}
    <div class="inset">
        ${kv('Portal no.', escHtml(displayNumber(cell)))}
        ${kv('Subgrid', `${cfg.label} · ${cfg.rows}×${cfg.cols}`)}
        ${kv('Position', `Row ${cell.row + 1} · Col ${cell.col + 1}`)}
    </div>`;
}

function kv(key, valueHTML) {
    return `<div class="kv"><span class="kv-key">${key}</span><span class="kv-val">${valueHTML}</span></div>`;
}

function accessSection(cell, detailed) {
    const access = accessInfo(cell);
    if (!access) {
        return `
        <div class="callout">
            ${ic('alert-triangle', 15)}
            <div><strong>Access not configured.</strong> No port or server type is set for this station yet.</div>
        </div>`;
    }

    const badge = `${escHtml(access.label)}${access.port ? ` · Port ${escHtml(access.port)}` : ''}`;
    const folder = cell.projectDir && access.type !== 'browser' ? kv('Folder', escHtml(cell.projectDir)) : '';
    const start = detailed && access.steps.length
        ? kv('Start', `<ol class="steps">${access.steps.map(s => `<li>${escHtml(s)}</li>`).join('')}</ol>`)
        : access.start ? kv('Start', escHtml(access.start)) : '';
    const url = access.url ? `
        <a class="url-box" href="${escHtml(access.url)}" target="_blank" rel="noopener">
            ${ic('globe', 14)}<span>${escHtml(access.url.replace(/^https?:\/\//, ''))}</span>${ic('external-link', 13)}
        </a>` : '';
    const where = access.type === 'browser'
        ? 'Reachable from any PC on the network'
        : `Runs locally on ${escHtml(cell.pcNumber)} · ${escHtml(cell.ipAddress)}`;

    return `
    <div class="inset">
        <span class="type-badge" data-type="${escHtml(access.type)}">${badge}</span>
        ${folder}
        ${start}
        ${url}
        <div class="note">${ic('monitor', 13)}${where}</div>
    </div>`;
}

function aboutSection(cell, compact) {
    const desc = hasDescription(cell);
    const long = desc && cell.portalDescription.length > 160;
    const text = desc
        ? `<div class="about-text${compact ? ' is-clamped' : ''}">${escHtml(cell.portalDescription)}</div>`
        : `<div class="about-text is-empty">No description added yet.</div>`;
    return `
    <div>
        <div class="section-label">About this portal</div>
        <div class="about-box">
            <div class="about-title">${escHtml(cell.portalName)}</div>
            ${text}
        </div>
        ${compact && long ? `<button class="link-btn" type="button" data-goto-tab="about" style="margin-top: var(--sp-2)">Read more ${ic('arrow-right', 14)}</button>` : ''}
    </div>`;
}

// ─── Send Alert Email ─────────────────────────────────────────────────────────
async function sendAlertEmail(cell, gridId) {
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
    const alertBtn = $('panel-alert');
    const setBusy = busy => {
        if (!alertBtn) return;
        alertBtn.disabled = busy;
        alertBtn.innerHTML = `${ic('mail', 15)}${busy ? 'Sending…' : 'Send Alert'}`;
    };

    setBusy(true);
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

        console.log(`[Alert] SUCCESS | ${toName} <${toEmail}> | ${timestamp}`);
        showToast('success', `Alert sent to ${toName}`);
    } catch (err) {
        console.error(`[Alert] FAILED | ${toName} <${toEmail}> | ${timestamp} |`, err);
        showToast('error', 'Send failed — see console');
    } finally {
        // The panel may have been re-rendered for another station meanwhile
        if ($('panel-alert') === alertBtn) setBusy(false);
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

function showToast(type, msg) {
    const toast = $('toast');
    $('toast-icon').innerHTML = svgIcon(TOAST_ICONS[type] || 'info', 16);
    $('toast-msg').textContent = msg;
    toast.className = `toast ${type} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
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
    $('btn-alerts').addEventListener('click', () =>
        showToast('info', 'Select a station, then use Send Alert in the side panel'));

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
        const tab = e.target.closest('.seg-tab');
        if (!tab) return;
        state.archiveFilter = tab.dataset.filter;
        renderArchive();
    });
    $('archive-search').addEventListener('input', renderArchive);

    // Side panel (re-rendered, so delegate)
    $('panel').addEventListener('click', e => {
        const tab = e.target.closest('[data-tab], [data-goto-tab]');
        if (tab) {
            state.panelTab = tab.dataset.tab || tab.dataset.gotoTab;
            renderPanel();
            return;
        }
        if (e.target.closest('#panel-close')) {
            clearSelection();
            return;
        }
        if (e.target.closest('#panel-alert')) {
            const sel = getSelected();
            if (sel) sendAlertEmail(sel.cell, sel.cfg.id);
            return;
        }
        if (e.target.closest('#panel-recall')) {
            showToast('info', 'Recall is not set up yet — use Send Alert to email the operator');
        }
    });

    // Keyboard: ← → move between blocks, Esc clears input / selection
    document.addEventListener('keydown', e => {
        const typing = e.target.matches('input, textarea');
        if (e.key === 'Escape') {
            if (typing) {
                e.target.value = '';
                e.target.dispatchEvent(new Event('input'));
                e.target.blur();
            } else if (state.selected) {
                clearSelection();
            }
            return;
        }
        if (typing || state.view !== 'wall') return;
        if (e.key === 'ArrowLeft') focusBlock(state.activeIndex - 1);
        if (e.key === 'ArrowRight') focusBlock(state.activeIndex + 1);
    });
}
