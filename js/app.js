/* ═══════════════════════════════════════════════════════
   NDMA Dashboard – Application Logic
   ═══════════════════════════════════════════════════════ */

// ─── App State ────────────────────────────────────────────────────────────────
const state = {
    theme: 'dark',
    carouselActive: false,
    archiveOpen: false,
    activeIndex: 0,
    searchQuery: '',
    searchResults: new Set(),
};

// Tracks which cell is currently open in the detail modal
let _currentModalCell      = null;
let _currentModalColorKey  = null;
let _currentModalGridId    = null;

// ─── EmailJS Config (hardcoded) ───────────────────────────────────────────────
// Sign up at https://www.emailjs.com — free tier: 200 emails/month
// Create a Service (Gmail/Outlook), an Email Template, then paste the IDs below.
const EJS_PUBLIC_KEY = 'Hf7j1r_wnpLPK0CLf';   // Account → API Keys
const EJS_SERVICE_ID = 'service_c59muoj';            // Email Services tab
const EJS_TEMPLATE_ID = 'template_vofg9ml';           // Email Templates tab

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(state.theme);
    renderOverview();
    renderCarouselDots();
    renderCarouselPanel();
    attachListeners();
    updateStatusBar();
});

// ─── Theme ────────────────────────────────────────────────────────────────────
function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    $('btn-theme').innerHTML = theme === 'dark' ? '☀️' : '🌙';
    $('btn-theme').setAttribute('data-tooltip', theme === 'dark' ? 'Light mode' : 'Dark mode');
    localStorage.setItem('ndma_theme', theme);
}

function toggleTheme() {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
}

// ─── Render overview grid ─────────────────────────────────────────────────────
function renderOverview() {
    const row = $('overview-row');
    row.innerHTML = '';

    GRID_CONFIG.forEach((cfg, idx) => {
        const cells = GRID_DATA[cfg.id];
        const wrap = document.createElement('div');
        wrap.className = 'subgrid-wrap';
        wrap.dataset.color = cfg.colorKey;
        wrap.dataset.gridId = cfg.id;
        wrap.dataset.index = idx;
        wrap.setAttribute('data-tooltip', `${cfg.label} — ${cfg.rows}×${cfg.cols}`);

        wrap.innerHTML = `
      <div class="subgrid-label">
        <div class="subgrid-label-dot"></div>
        ${cfg.label}
        <span style="font-weight:var(--fw-regular);color:var(--text-muted);font-size:var(--fs-xs);letter-spacing:0;">${cfg.rows}×${cfg.cols}</span>
      </div>
      <div class="subgrid-inner" id="inner-${cfg.id}">
        <div class="cell-grid" id="cellgrid-${cfg.id}"
          style="grid-template-columns: repeat(${cfg.cols}, 1fr);">
        </div>
      </div>
    `;

        row.appendChild(wrap);

        const cellGrid = wrap.querySelector(`#cellgrid-${cfg.id}`);
        const visibleCells = cells.filter(c => !c.archived);
        visibleCells.forEach((cell) => {
            const div = document.createElement('div');
            div.className = 'grid-cell';
            div.id = `cell-ov-${cell.id}`;
            div.dataset.cellId = cell.id;
            div.dataset.gridId = cfg.id;

            const pcShort = cell.cellLabel || cell.pcNumber.replace('PC-', '');
            const prefix = cfg.id[0] === 'N' ? 'N' : cfg.id[0];
            const idLine = !cell.cellLabel && cell.stationId != null ? `${prefix}-${cell.stationId}` : '';
            div.innerHTML = idLine
                ? `<span class="cell-id">${idLine}</span><span class="cell-pc">${pcShort}</span>`
                : `<span class="cell-pc">${pcShort}</span>`;

            div.addEventListener('click', (e) => {
                e.stopPropagation();
                openDetailModal(cell.id, cfg.id, cfg.colorKey);
            });

            cellGrid.appendChild(div);
        });

        wrap.addEventListener('click', () => openCarouselAt(idx));
    });
}

// ─── Carousel ─────────────────────────────────────────────────────────────────
function renderCarouselDots() {
    const container = $('carousel-dots');
    container.innerHTML = '';

    GRID_CONFIG.forEach((cfg, idx) => {
        const dot = document.createElement('div');
        dot.className = `carousel-dot${idx === state.activeIndex ? ' active' : ''}`;
        dot.dataset.color = cfg.colorKey;
        dot.dataset.index = idx;
        dot.addEventListener('click', () => openCarouselAt(idx));
        container.appendChild(dot);
    });
}

function openCarouselAt(idx) {
    state.carouselActive = true;
    state.activeIndex = idx;

    $('overview-row').classList.add('carousel-active');
    $('btn-carousel').classList.add('active');
    $('btn-carousel').innerHTML = `<svg viewBox="0 0 14 14" style="width:13px;height:13px;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;fill:none;display:block;"><line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/></svg>`;
    $('btn-carousel').setAttribute('data-tooltip', 'Exit carousel');

    renderCarouselPanel();
    $('carousel-panel').classList.add('open');
    $('carousel-controls').style.display = 'flex';

    updateCarouselFocus();
    updateCarouselLabel();
}

function closeCarousel() {
    state.carouselActive = false;

    $('overview-row').classList.remove('carousel-active');
    $('btn-carousel').classList.remove('active');
    $('btn-carousel').innerHTML = '⊞';
    $('btn-carousel').setAttribute('data-tooltip', 'Toggle carousel');

    $('carousel-panel').classList.remove('open');
    $('carousel-controls').style.display = 'none';

    $$('.subgrid-wrap').forEach(w => {
        w.classList.remove('carousel-focused', 'carousel-dimmed');
    });
}

function toggleCarousel() {
    if (state.carouselActive) closeCarousel();
    else openCarouselAt(state.activeIndex);
}

// ─── Archive page ──────────────────────────────────────────────────────────────
function openArchivePage() {
    state.archiveOpen = true;
    $('stage').style.display = 'none';
    $('archive-page').style.display = 'flex';
    $('btn-archive').classList.add('active');
    renderArchivePage();
}

function closeArchivePage() {
    state.archiveOpen = false;
    $('archive-page').style.display = 'none';
    $('stage').style.display = '';
    $('btn-archive').classList.remove('active');
}

function renderArchivePage() {
    const filterEl = document.querySelector('.archive-filter-tab.active');
    const filterVal = filterEl ? filterEl.dataset.filter : 'all';
    const searchVal = ($('archive-search').value || '').trim().toLowerCase();

    const archived = [];
    GRID_CONFIG.forEach(cfg => {
        GRID_DATA[cfg.id].forEach(cell => {
            if (cell.archived) archived.push({ cell, cfg });
        });
    });

    const filtered = archived.filter(({ cfg }) => {
        if (filterVal === 'global')   return cfg.id === 'G1' || cfg.id === 'G2';
        if (filterVal === 'national') return cfg.id === 'L1' || cfg.id === 'L2';
        if (filterVal === 'cop')      return cfg.id === 'COP';
        return true;
    });

    const results = searchVal
        ? filtered.filter(({ cell }) =>
            [cell.pcNumber, cell.user, cell.ipAddress,
             cell.portalName, cell.portalNumber, cell.portalDescription]
                .join(' ').toLowerCase().includes(searchVal))
        : filtered;

    const grid = $('archive-cards-grid');
    grid.innerHTML = '';

    if (results.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'archive-empty';
        empty.textContent = (searchVal || filterVal !== 'all')
            ? 'No archived stations match your filter.'
            : 'No archived stations.';
        grid.appendChild(empty);
        return;
    }

    results.forEach(({ cell, cfg }, ci) => {
        const card = createCellCard(cell, cfg.colorKey, ci);
        grid.appendChild(card);
    });
}

function navigateCarousel(dir) {
    const newIdx = (state.activeIndex + dir + GRID_CONFIG.length) % GRID_CONFIG.length;
    state.activeIndex = newIdx;
    updateCarouselFocus();
    updateCarouselLabel();
    renderCarouselPanel();
}

function updateCarouselFocus() {
    $$('.subgrid-wrap').forEach((w, i) => {
        w.classList.remove('carousel-focused', 'carousel-dimmed');
        if (i === state.activeIndex) w.classList.add('carousel-focused');
        else w.classList.add('carousel-dimmed');
    });

    $$('.carousel-dot').forEach((d, i) => {
        d.classList.toggle('active', i === state.activeIndex);
    });
}

function updateCarouselLabel() {
    const cfg = GRID_CONFIG[state.activeIndex];
    const cells = GRID_DATA[cfg.id];
    $('carousel-label').innerHTML =
        `<strong>${cfg.label}</strong> — ${cfg.rows}×${cfg.cols} &nbsp;·&nbsp; ${cells.length} cells`;
}

function renderCarouselPanel() {
    const cfg = GRID_CONFIG[state.activeIndex];
    const cells = GRID_DATA[cfg.id];
    const body = $('cards-grid');
    body.innerHTML = '';

    $('panel-title').innerHTML = `Subgrid <strong>${cfg.label}</strong>`;
    $('panel-meta').textContent = `${cells.length} stations · ${cfg.rows} rows × ${cfg.cols} cols`;

    const visibleCells = cells.filter(c => !c.archived);
    visibleCells.forEach((cell, ci) => {
        const card = createCellCard(cell, cfg.colorKey, ci);
        body.appendChild(card);
    });
    $('panel-meta').textContent =
        `${visibleCells.length} stations · ${cfg.rows} rows × ${cfg.cols} cols`;
}

function createCellCard(cell, colorKey, animIdx) {
    const card = document.createElement('div');
    card.className = 'cell-card';
    card.id = `card-${cell.id}`;
    card.style.cssText = `
    --grid-base:  var(--c-${colorKey}-base);
    --grid-glow:  var(--c-${colorKey}-glow);
    --grid-muted: var(--c-${colorKey}-muted);
    --grid-text:  var(--c-${colorKey}-text);
    animation-delay: ${animIdx * 35}ms;
  `;

    const fields = [
        { key: 'user', label: 'User', icon: '👤' },
        { key: 'ipAddress', label: 'IP Addr', icon: '🌐', mono: true },
        { key: 'portalName', label: 'Portal', icon: '🔗' },
        { key: 'portalNumber', label: 'Port No.', icon: '#' },
    ];

    const fieldsHTML = fields.map(f => {
        const val = escHtml(cell[f.key] || '—');
        const cls = ['card-field-value', f.mono ? 'card-ip' : ''].filter(Boolean).join(' ');
        return `
      <div class="card-field">
        <span class="card-field-label">${f.label}</span>
        <span class="${cls}">${val}</span>
      </div>
    `;
    }).join('');

    const descLinkHTML = `
    <div class="card-field card-desc-only">
      <button class="card-desc-link" data-cell-id="${cell.id}" data-grid-id="${getGridIdFromCellId(cell.id)}">
        View Details
        <svg viewBox="0 0 12 12"><line x1="2" y1="10" x2="10" y2="2"/><polyline points="5,2 10,2 10,7"/></svg>
      </button>
    </div>
  `;

    card.innerHTML = `
    <div class="card-pc-num">
      <span>${cell.pcNumber}</span>
      <span class="card-pc-badge">#${cell.id.split('-').pop()}</span>
    </div>
    ${fieldsHTML}
    ${descLinkHTML}
  `;

    card.querySelector('.card-desc-link').addEventListener('click', (e) => {
        e.stopPropagation();
        openDetailModal(cell.id, getGridIdFromCellId(cell.id), colorKey);
    });

    return card;
}

function getGridIdFromCellId(cellId) {
    const parts = cellId.split('-');
    return parts.length >= 2 ? parts[0] : cellId;
}

// ─── Search ────────────────────────────────────────────────────────────────────
function handleSearch(query) {
    state.searchQuery = query.trim().toLowerCase();
    applySearch();
}

function applySearch() {
    const q = state.searchQuery;

    if (!q) {
        $$('.grid-cell').forEach(c => c.classList.remove('search-match', 'search-miss'));
        $$('.subgrid-wrap').forEach(w => w.style.opacity = '');
        return;
    }

    const matchedGrids = new Set();

    GRID_CONFIG.forEach(cfg => {
        const cells = GRID_DATA[cfg.id];
        cells.forEach(cell => {
            const haystack = [
                cell.pcNumber, cell.user, cell.ipAddress,
                cell.portalName, cell.portalNumber, cell.portalDescription,
            ].join(' ').toLowerCase();

            const matches = haystack.includes(q);
            const ovCell = $(`cell-ov-${cell.id}`);
            if (ovCell) {
                ovCell.classList.toggle('search-match', matches);
                ovCell.classList.toggle('search-miss', !matches);
            }
            if (matches) matchedGrids.add(cfg.id);
        });
    });

    $$('.subgrid-wrap').forEach(w => {
        const gid = w.dataset.gridId;
        w.style.opacity = matchedGrids.has(gid) ? '' : '0.3';
    });
}

// ─── PC Detail Modal ──────────────────────────────────────────────────────────
const COLOR_VARS = {
    outer: { base: '--c-outer-base', glow: '--c-outer-glow', muted: '--c-outer-muted', text: '--c-outer-text' },
    inner: { base: '--c-inner-base', glow: '--c-inner-glow', muted: '--c-inner-muted', text: '--c-inner-text' },
    mid: { base: '--c-mid-base', glow: '--c-mid-glow', muted: '--c-mid-muted', text: '--c-mid-text' },
};

function openDetailModal(cellId, gridId, colorKey) {
    const cell = (GRID_DATA[gridId] || []).find(c => c.id === cellId);
    if (!cell) return;

    _currentModalCell     = cell;
    _currentModalColorKey = colorKey;
    _currentModalGridId   = gridId;

    const cv = COLOR_VARS[colorKey] || COLOR_VARS.outer;
    const box = $('detail-modal-box');

    box.style.setProperty('--dm-color', `var(${cv.base})`);
    box.style.setProperty('--dm-color-glow', `var(${cv.glow})`);
    box.style.setProperty('--dm-color-muted', `var(${cv.muted})`);
    box.style.setProperty('--dm-color-text', `var(${cv.text})`);

    $('dm-pc-name').textContent = cell.pcNumber;
    $('dm-grid-label').textContent = `Subgrid ${gridId}`;

    const body = $('dm-body');
    body.innerHTML = '';

    const mainFields = [
        { key: 'pcNumber', label: 'PC Number', mono: true },
        { key: 'user', label: 'User' },
        { key: 'ipAddress', label: 'IP Address', mono: true },
        { key: 'portalName', label: 'Portal Name' },
        { key: 'portalNumber', label: 'Portal No.', mono: true },
    ];

    mainFields.forEach(f => {
        const row = document.createElement('div');
        row.className = 'detail-field-row';
        const cls = ['detail-field-value', f.mono ? 'mono' : ''].filter(Boolean).join(' ');
        row.innerHTML = `
      <span class="detail-field-label">${f.label}</span>
      <span class="${cls}">${escHtml(cell[f.key] || '—')}</span>
    `;
        body.appendChild(row);
    });

    const hr = document.createElement('hr');
    hr.className = 'detail-divider';
    body.appendChild(hr);

    // ── Portal Access ─────────────────────────────────────────
    const accessSection = document.createElement('div');
    accessSection.className = 'detail-access-section';

    const accessHeading = document.createElement('div');
    accessHeading.className = 'detail-section-heading';
    accessHeading.innerHTML = `
      <svg viewBox="0 0 14 14" style="width:10px;height:10px;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;fill:none;flex-shrink:0;">
        <rect x="1" y="3" width="12" height="9" rx="1.5"/>
        <path d="M1 7h12"/>
        <path d="M5 3V1M9 3V1"/>
      </svg>
      Portal Access`;
    accessSection.appendChild(accessHeading);

    const port     = cell.portalPort  || '';
    const ip       = cell.ipAddress   || '';
    const srvType  = cell.serverType  || '';
    const projDir  = cell.projectDir  || '';
    const pathSuffix = cell.portalPath ? '/' + cell.portalPath.replace(/^\//, '') : '';

    if (!port && !srvType) {
        const noInfo = document.createElement('p');
        noInfo.className = 'detail-access-empty';
        noInfo.textContent = 'No portal access configured for this station.';
        accessSection.appendChild(noInfo);
    } else {
        // ── Server type badge ──────────────────────────────────
        if (srvType) {
            const typeLabels = {
                vscode:  'VS Code Live Server',
                npm:     'Node (npm) Server',
                browser: 'Direct Browser Access',
            };
            const typeBadge = document.createElement('div');
            typeBadge.className = `detail-access-type-badge access-type-${srvType}`;
            typeBadge.textContent = typeLabels[srvType] || srvType;
            accessSection.appendChild(typeBadge);
        }

        // Helper: build a label + content row
        const mkRow = (label, contentEl) => {
            const row = document.createElement('div');
            row.className = 'detail-access-info-row';
            const lbl = document.createElement('span');
            lbl.className = 'access-info-label';
            lbl.textContent = label;
            row.appendChild(lbl);
            row.appendChild(contentEl);
            return row;
        };

        // ── Project folder (vscode / npm only) ────────────────
        if (projDir && (srvType === 'vscode' || srvType === 'npm')) {
            const val = document.createElement('span');
            val.className = 'access-info-value mono';
            val.textContent = projDir;
            accessSection.appendChild(mkRow('Folder', val));
        }

        // ── How to start ───────────────────────────────────────
        const howToMap = {
            vscode: [
                'Open the project folder in VS Code',
                'In the Explorer panel, right-click index.html',
                'Select "Open with Live Server"',
            ],
            npm: [
                'Open a terminal window',
                'Navigate (cd) to the project folder',
                'Run: npm start OR npm run dev',
            ],
            browser: [
                'No local setup required on this machine',
                'Open the URL below in any browser on this network',
            ],
        };
        const steps = howToMap[srvType];
        if (steps) {
            const ol = document.createElement('ol');
            ol.className = 'access-info-steps';
            steps.forEach(s => {
                const li = document.createElement('li');
                li.textContent = s;
                ol.appendChild(li);
            });
            accessSection.appendChild(mkRow('Start', ol));
        }

        // ── Browser URL ────────────────────────────────────────
        if (port) {
            let url;
            if (srvType === 'vscode') {
                url = `http://127.0.0.1:${port}${pathSuffix}`;
            } else if (srvType === 'npm') {
                url = `http://localhost:${port}${pathSuffix}`;
            } else if (srvType === 'browser') {
                url = ip ? `http://${ip}:${port}${pathSuffix}` : `http://localhost:${port}${pathSuffix}`;
            } else {
                url = `http://localhost:${port}${pathSuffix}`;
            }
            const val = document.createElement('span');
            val.className = 'access-info-value mono access-url';
            val.textContent = url;
            accessSection.appendChild(mkRow('Open in', val));
        }

        // ── IP : Port badge ────────────────────────────────────
        const ipBadge = document.createElement('div');
        ipBadge.className = 'detail-access-ip-badge';
        ipBadge.innerHTML = `
          <svg viewBox="0 0 14 14" style="width:11px;height:11px;stroke:currentColor;stroke-width:2;stroke-linecap:round;fill:none;flex-shrink:0;">
            <circle cx="7" cy="7" r="5.5"/>
            <path d="M7 1.5C5.5 3.5 4.5 5.2 4.5 7s1 3.5 2.5 5.5"/>
            <path d="M7 1.5C8.5 3.5 9.5 5.2 9.5 7s-1 3.5-2.5 5.5"/>
            <line x1="1.5" y1="7" x2="12.5" y2="7"/>
          </svg>
          <span class="access-ip">${ip || '—'}</span>
          <span class="access-sep">:</span>
          <span class="access-port">${port || '—'}</span>
        `;
        accessSection.appendChild(ipBadge);
    }

    body.appendChild(accessSection);

    // ── About ─────────────────────────────────────────────────
    const aboutSection = document.createElement('div');
    aboutSection.className = 'detail-about-section';

    const aboutHeading = document.createElement('div');
    aboutHeading.className = 'detail-section-heading';
    aboutHeading.innerHTML = `
      <svg viewBox="0 0 14 14" style="width:10px;height:10px;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;fill:none;flex-shrink:0;">
        <circle cx="7" cy="7" r="5.5"/>
        <line x1="7" y1="5" x2="7" y2="9.5"/>
        <line x1="7" y1="3.5" x2="7" y2="4.2"/>
      </svg>
      About`;
    aboutSection.appendChild(aboutHeading);

    const descBlock = document.createElement('div');
    descBlock.className = 'detail-desc-block';
    descBlock.textContent = cell.portalDescription || '—';
    aboutSection.appendChild(descBlock);

    const readMoreBtn = document.createElement('button');
    readMoreBtn.className = 'card-desc-link about-read-more';
    readMoreBtn.innerHTML = `Read More <svg viewBox="0 0 12 12" style="width:11px;height:11px;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;fill:none;display:inline-block;vertical-align:middle;"><line x1="2" y1="10" x2="10" y2="2"/><polyline points="5,2 10,2 10,7"/></svg>`;
    readMoreBtn.addEventListener('click', () => {
        closeDetailModal();
        openAboutModal(cell, colorKey, gridId);
    });
    aboutSection.appendChild(readMoreBtn);

    body.appendChild(aboutSection);

    $('detail-modal').classList.add('open');
}

function closeDetailModal() {
    $('detail-modal').classList.remove('open');
}

function openAboutModal(cell, colorKey, gridId) {
    const cv = COLOR_VARS[colorKey] || COLOR_VARS.outer;
    const box = $('about-modal-box');

    box.style.setProperty('--dm-color',       `var(${cv.base})`);
    box.style.setProperty('--dm-color-glow',  `var(${cv.glow})`);
    box.style.setProperty('--dm-color-muted', `var(${cv.muted})`);
    box.style.setProperty('--dm-color-text',  `var(${cv.text})`);

    $('am-portal-name').textContent = cell.portalName || '—';
    $('am-grid-label').textContent  = `Subgrid ${gridId}`;

    const body = $('am-body');
    body.innerHTML = '';

    const heading = document.createElement('div');
    heading.className = 'detail-section-heading';
    heading.innerHTML = `
      <svg viewBox="0 0 14 14" style="width:10px;height:10px;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;fill:none;flex-shrink:0;">
        <circle cx="7" cy="7" r="5.5"/>
        <line x1="7" y1="5" x2="7" y2="9.5"/>
        <line x1="7" y1="3.5" x2="7" y2="4.2"/>
      </svg>
      About`;
    body.appendChild(heading);

    const descBlock = document.createElement('div');
    descBlock.className = 'detail-desc-block';
    descBlock.textContent = cell.portalDescription || '—';
    body.appendChild(descBlock);

    $('about-modal').classList.add('open');
}

function closeAboutModal() {
    $('about-modal').classList.remove('open');
}

// ─── Send Alert Email ─────────────────────────────────────────────────────────
async function sendAlertEmail(cell, gridId) {
    const toEmail = cell.mail;
    const toName  = cell.user;
    if (!toEmail) {
        showToast('⚠️', `No email set for ${cell.pcNumber}`, 'warn');
        return;
    }
    const timestamp = new Date().toLocaleString('en-US', { hour12: false });
    const alertBtn  = $('dm-alert-btn');

    if (alertBtn) { alertBtn.disabled = true; alertBtn.textContent = 'Sending…'; }

    try {
        await emailjs.send(
            EJS_SERVICE_ID,
            EJS_TEMPLATE_ID,
            {
                to_email:   toEmail,
                to_name:    toName,
                message:    `You are requested to return to your workstation (${cell.pcNumber}) and resume operations on the ${cell.portalName} portal.`,
                pc_number:  cell.pcNumber,
                portal:     cell.portalName,
                subgrid:    gridId,
                ip_address: cell.ipAddress,
                timestamp:  timestamp,
            },
            EJS_PUBLIC_KEY
        );

        console.log(`[Alert] SUCCESS | ${toName} <${toEmail}> | ${timestamp}`);
        showToast('✅', `Alert sent to ${toName}`, 'success');
    } catch (err) {
        console.error(`[Alert] FAILED | ${toName} <${toEmail}> | ${timestamp} |`, err);
        showToast('❌', `Send failed — see console`, 'error');
    } finally {
        if (alertBtn) { alertBtn.disabled = false; alertBtn.textContent = 'Send Alert'; }
    }
}

// ─── Status bar ───────────────────────────────────────────────────────────────
function updateStatusBar() {
    const total = GRID_CONFIG.reduce((s, c) => s + c.rows * c.cols, 0);
    $('status-total').textContent = `${total} stations`;
    $('status-grids').textContent = `${GRID_CONFIG.length} subgrids`;
    $('status-time').textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
}

setInterval(() => {
    if ($('status-time')) {
        $('status-time').textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
    }
}, 1000);

// ─── Toast ────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(icon, msg, type = 'success') {
    const toast = $('toast');
    $('toast-icon').textContent = icon;
    $('toast-msg').textContent = msg;
    toast.className = `toast ${type} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ─── Utility ──────────────────────────────────────────────────────────────────
function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ─── Event listeners ──────────────────────────────────────────────────────────
function attachListeners() {
    // Theme
    $('btn-theme').addEventListener('click', toggleTheme);

    // Carousel toggle
    $('btn-carousel').addEventListener('click', toggleCarousel);

    // Carousel navigation
    $('carousel-prev').addEventListener('click', () => navigateCarousel(-1));
    $('carousel-next').addEventListener('click', () => navigateCarousel(+1));

    // Search
    $('search-input').addEventListener('input', e => handleSearch(e.target.value));
    $('search-input').addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            e.target.value = '';
            handleSearch('');
            e.target.blur();
        }
    });

    // Detail modal close
    $('detail-modal-close').addEventListener('click', closeDetailModal);
    $('detail-modal').addEventListener('click', e => {
        if (e.target === $('detail-modal')) closeDetailModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && $('detail-modal').classList.contains('open')) {
            closeDetailModal();
        }
    }, true);

    // About modal close
    $('about-modal-close').addEventListener('click', closeAboutModal);
    $('about-modal').addEventListener('click', e => {
        if (e.target === $('about-modal')) closeAboutModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && $('about-modal').classList.contains('open')) {
            closeAboutModal();
        }
    }, true);
    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT') return;
        if (!state.carouselActive) return;
        if (e.key === 'ArrowLeft') navigateCarousel(-1);
        if (e.key === 'ArrowRight') navigateCarousel(+1);
        if (e.key === 'Escape') closeCarousel();
    });

    // Archive page
    $('btn-archive').addEventListener('click', () => {
        if (state.archiveOpen) closeArchivePage();
        else openArchivePage();
    });
    $('archive-home-btn').addEventListener('click', closeArchivePage);
    $$('.archive-filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            $$('.archive-filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderArchivePage();
        });
    });
    $('archive-search').addEventListener('input', () => renderArchivePage());

    // Restore theme from storage
    const saved = localStorage.getItem('ndma_theme');
    if (saved) applyTheme(saved);

    // Alert button in detail modal — send directly, no modal
    $('dm-alert-btn').addEventListener('click', () => {
        if (!_currentModalCell) return;
        sendAlertEmail(_currentModalCell, _currentModalGridId);
    });

}
