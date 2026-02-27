/* ═══════════════════════════════════════════════════════
   NDMA Dashboard – Application Logic
   ═══════════════════════════════════════════════════════ */

// ─── App State ────────────────────────────────────────────────────────────────
const state = {
    theme: 'dark',
    isLoggedIn: false,
    carouselActive: false,
    archiveOpen: false,
    activeIndex: 0,
    searchQuery: '',
    searchResults: new Set(),
};

const CREDS = { user: 'arsalan', pass: 'developer.ndma@123' };

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    applyTheme(state.theme);
    renderOverview();
    renderCarouselDots();
    renderCarouselPanel();
    attachListeners();
    updateAuthUI();
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

        const totalCells = cfg.rows * cfg.cols;

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
        visibleCells.forEach((cell, ci) => {
            const div = document.createElement('div');
            div.className = 'grid-cell';
            div.id = `cell-ov-${cell.id}`;
            div.dataset.cellId = cell.id;
            div.dataset.gridId = cfg.id;

            const pcShort = cell.pcNumber.replace('PC-', '');
            const prefix = cfg.id[0] === 'L' ? 'N' : cfg.id[0]; // G, N (national), or C
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

        // Click on subgrid to open carousel
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
        dot.addEventListener('click', () => {
            openCarouselAt(idx);
        });
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
    $('stage').style.display = '';   // restores CSS class-driven display:flex
    $('btn-archive').classList.remove('active');
}

function renderArchivePage() {
    const filterEl = document.querySelector('.archive-filter-tab.active');
    const filterVal = filterEl ? filterEl.dataset.filter : 'all';
    const searchVal = ($('archive-search').value || '').trim().toLowerCase();

    // Collect all archived cells
    const archived = [];
    GRID_CONFIG.forEach(cfg => {
        GRID_DATA[cfg.id].forEach(cell => {
            if (cell.archived) archived.push({ cell, cfg });
        });
    });

    // Category filter
    const filtered = archived.filter(({ cfg }) => {
        if (filterVal === 'global')   return cfg.id === 'G1' || cfg.id === 'G2';
        if (filterVal === 'national') return cfg.id === 'L1' || cfg.id === 'L2';
        if (filterVal === 'cop')      return cfg.id === 'COP';
        return true; // 'all'
    });

    // Search filter
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
            : 'No archived stations yet.';
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

    // panel title
    $('panel-title').innerHTML =
        `Subgrid <strong>${cfg.label}</strong>`;
    $('panel-meta').textContent =
        `${cells.length} stations · ${cfg.rows} rows × ${cfg.cols} cols`;

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

    const editable = state.isLoggedIn;

    const fields = [
        { key: 'user', label: 'User', icon: '👤' },
        { key: 'ipAddress', label: 'IP Addr', icon: '🌐', mono: true },
        { key: 'portalName', label: 'Portal', icon: '🔗' },
        { key: 'portalNumber', label: 'Port No.', icon: '#' },
    ];

    const fieldsHTML = fields.map(f => {
        const val = escHtml(cell[f.key] || '—');
        const cls = [
            'card-field-value',
            f.mono ? 'card-ip' : '',
            editable ? 'editable' : '',
        ].filter(Boolean).join(' ');

        const attrs = editable
            ? `contenteditable="true" data-cell="${cell.id}" data-grid="${cell.id.split('-')[0]}" data-field="${f.key}" data-grid-id="${getGridIdFromCellId(cell.id)}"`
            : '';

        return `
      <div class="card-field">
        <span class="card-field-label">${f.label}</span>
        <span class="${cls}" ${attrs}>${val}</span>
      </div>
    `;
    }).join('');

    // Description as a hyperlink that opens the detail modal
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

    // attach edit listeners for non-description fields
    if (editable) {
        card.querySelectorAll('[contenteditable]').forEach(el => {
            el.addEventListener('blur', onFieldEdit);
            el.addEventListener('keydown', e => {
                if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
            });
        });
    }

    // description link → open detail modal
    card.querySelector('.card-desc-link').addEventListener('click', (e) => {
        e.stopPropagation();
        openDetailModal(cell.id, getGridIdFromCellId(cell.id), colorKey);
    });

    return card;
}

function getGridIdFromCellId(cellId) {
    // cellId like "L1-01" or "R2-09"
    const parts = cellId.split('-');
    return parts.length >= 2 ? parts[0] : cellId;
}

function onFieldEdit(e) {
    const el = e.currentTarget;
    const gridId = el.dataset.gridId;
    const cellId = el.dataset.cell;
    const field = el.dataset.field;
    const value = el.textContent.trim();

    if (!gridId || !cellId || !field) return;

    updateCell(gridId, cellId, field, value);

    // also update overview cell pc if pcNumber changed
    if (field === 'pcNumber') {
        const ovCell = $(`cell-ov-${cellId}`);
        if (ovCell) {
            const pcShort = value.replace('PC-', '');
            ovCell.querySelector('.cell-pc').textContent = pcShort;
        }
    }

    showToast('✏️', `${field} updated`, 'success');
}

function scrollToCard(cellId) {
    const card = $(`card-${cellId}`);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
        let gridHasMatch = false;

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
            if (matches) { gridHasMatch = true; matchedGrids.add(cfg.id); }
        });
    });

    // dim subgrids with no matches
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
    const editable = state.isLoggedIn;

    box.style.setProperty('--dm-color', `var(${cv.base})`);
    box.style.setProperty('--dm-color-glow', `var(${cv.glow})`);
    box.style.setProperty('--dm-color-muted', `var(${cv.muted})`);
    box.style.setProperty('--dm-color-text', `var(${cv.text})`);

    $('dm-pc-name').textContent = cell.pcNumber;
    $('dm-grid-label').textContent = `Subgrid ${gridId}`;

    const body = $('dm-body');
    body.innerHTML = '';

    if (editable) {
        const hint = document.createElement('div');
        hint.className = 'detail-edit-hint';
        hint.innerHTML = `<span>✏️</span> Click any field to edit — changes save on blur`;
        body.appendChild(hint);
    }

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
        const cls = ['detail-field-value', f.mono ? 'mono' : '', editable ? 'editable' : ''].filter(Boolean).join(' ');
        const attrs = editable
            ? `contenteditable="true" data-cell="${cell.id}" data-grid-id="${gridId}" data-field="${f.key}"`
            : '';
        row.innerHTML = `
      <span class="detail-field-label">${f.label}</span>
      <span class="${cls}" ${attrs}>${escHtml(cell[f.key] || '—')}</span>
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
    descBlock.className = 'detail-desc-block' + (editable ? ' editable' : '');
    if (editable) {
        descBlock.setAttribute('contenteditable', 'true');
        descBlock.dataset.cell = cell.id;
        descBlock.dataset.gridId = gridId;
        descBlock.dataset.field = 'portalDescription';
    }
    descBlock.textContent = cell.portalDescription || '—';
    body.appendChild(descBlock);

    if (editable) {
        const isArchived = !!cell.archived;
        const archiveBtn = document.createElement('button');
        archiveBtn.className = 'btn-archive-station';
        archiveBtn.innerHTML = isArchived ? '📤 Restore Station' : '📦 Archive Station';
        archiveBtn.addEventListener('click', () => {
            updateCell(gridId, cell.id, 'archived', !isArchived);
            closeDetailModal();
            renderOverview();
            if (state.carouselActive) renderCarouselPanel();
            if (state.archiveOpen) renderArchivePage();
            showToast(
                isArchived ? '📤' : '📦',
                isArchived ? 'Station restored' : 'Station archived',
                'success'
            );
        });
        body.appendChild(archiveBtn);
    }

    if (editable) {
        body.querySelectorAll('[contenteditable]').forEach(el => {
            el.addEventListener('blur', onFieldEdit);
            el.addEventListener('keydown', e => {
                if (e.key === 'Enter' && !e.shiftKey && el !== descBlock) {
                    e.preventDefault(); el.blur();
                }
            });
        });
    }

    $('detail-modal').classList.add('open');
}

function closeDetailModal() {
    $('detail-modal').classList.remove('open');
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
function openAuthModal() {
    if (state.isLoggedIn) {
        logout();
        return;
    }
    $('auth-modal').classList.add('open');
    setTimeout(() => $('auth-user-input').focus(), 150);
}

function closeAuthModal() {
    $('auth-modal').classList.remove('open');
    $('auth-error').classList.remove('show');
    $('auth-user-input').value = '';
    $('auth-pass-input').value = '';
}

function attemptLogin() {
    const u = $('auth-user-input').value.trim();
    const p = $('auth-pass-input').value;

    if (u === CREDS.user && p === CREDS.pass) {
        state.isLoggedIn = true;
        closeAuthModal();
        updateAuthUI();
        if (state.carouselActive) renderCarouselPanel();
        showToast('🔓', `Welcome back, ${u}!`, 'success');
    } else {
        $('auth-error').classList.add('show');
        $('auth-pass-input').value = '';
        $('auth-pass-input').focus();
    }
}

function logout() {
    state.isLoggedIn = false;
    updateAuthUI();
    if (state.carouselActive) renderCarouselPanel();
    showToast('🔒', 'Signed out', 'success');
}

function updateAuthUI() {
    const badge = $('auth-badge');
    const label = $('auth-label');
    if (state.isLoggedIn) {
        badge.classList.add('logged-in');
        label.textContent = 'arsalan';
        badge.setAttribute('data-tooltip', 'Click to sign out');
    } else {
        badge.classList.remove('logged-in');
        label.textContent = 'Sign In';
        badge.setAttribute('data-tooltip', 'Sign in to edit cells');
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

    // Auth
    $('auth-badge').addEventListener('click', openAuthModal);
    $('modal-close').addEventListener('click', closeAuthModal);
    $('auth-modal').addEventListener('click', e => {
        if (e.target === $('auth-modal')) closeAuthModal();
    });
    $('auth-submit').addEventListener('click', attemptLogin);
    $('auth-pass-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') attemptLogin();
    });
    $('auth-user-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') $('auth-pass-input').focus();
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
    }, true);  // capture so it fires even when carousel is active
    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT' || e.target.getAttribute('contenteditable')) return;
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