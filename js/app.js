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

            const pcShort = cell.pcNumber.replace('PC-', '');
            const prefix = cfg.id[0] === 'L' ? 'N' : cfg.id[0];
            const idLine = cell.stationId != null ? `${prefix}-${cell.stationId}` : '';
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
    <div class="card-field">
      <span class="card-field-label">Description</span>
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

    const descLabel = document.createElement('div');
    descLabel.className = 'detail-field-label';
    descLabel.style.marginBottom = 'var(--sp-2)';
    descLabel.textContent = 'Description';
    body.appendChild(descLabel);

    const descBlock = document.createElement('div');
    descBlock.className = 'detail-desc-block';
    descBlock.textContent = cell.portalDescription || '—';
    body.appendChild(descBlock);

    $('detail-modal').classList.add('open');
}

function closeDetailModal() {
    $('detail-modal').classList.remove('open');
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
}
