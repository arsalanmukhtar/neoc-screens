// ─── Phone app layout ─────────────────────────────────────────────────────────
// On phones (see the check in index.html) the dashboard becomes an app: a top bar,
// bottom navigation with a raised Alert button, and bottom sheets. Stations, alerts,
// mail, sign-in and push all reuse the logic in app.js; only the layout lives here.
// Try it on a PC with ?mobile=1 (and ?mobile=0 to go back).

const IS_M = document.documentElement.classList.contains('m-app');

Object.assign(ICONS, {
    'home': '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    'menu': '<path d="M4 12h16"/><path d="M4 6h16"/><path d="M4 18h16"/>',
    'bell-ring': '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M22 8c0-2.3-.8-4.3-2-6"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/><path d="M4 2C2.8 3.7 2 5.7 2 8"/>',
    'smartphone': '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
    'volume-2': '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>',
    'vibrate': '<path d="m2 8 2 2-2 2 2 2-2 2"/><path d="m22 8-2 2 2 2-2 2 2 2"/><rect width="8" height="14" x="8" y="5" rx="1"/>',
    'send': '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
    'share': '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/>',
    'plus-square': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/>',
    'history': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    'laptop': '<path d="M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z"/><path d="M20.054 15.987H3.946"/>',
});

// ─── State ────────────────────────────────────────────────────────────────────
const M = {
    tab: 'home',        // 'home' | 'stations' | 'team' | 'more'
    query: '',          // Stations search
    grid: 'all',        // Stations filter: 'all' or a subgrid id
    teamQuery: '',      // Team search
    revealed: null,     // station whose system password is shown
};

const M_TABS = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'stations', label: 'Stations', icon: 'layout-grid' },
    { id: 'alert', label: 'Alert', icon: 'bell-ring' },       // centre button: opens the Send alert sheet
    { id: 'team', label: 'Team', icon: 'users' },
    { id: 'more', label: 'More', icon: 'menu' },
];

const M_PREFS = 'ndma_alarm_prefs';      // { sound, vibrate }
const M_LOG = 'ndma_alert_log';          // earlier in-page history (moved into the log below)

// Alerts received on this phone: the service worker (sw.js) writes them to this cache as they
// arrive, even when the app is closed; the app reads them and marks them acknowledged.
const LOG_CACHE = 'neoc-alert-log';
const LOG_KEY = `${location.origin}/__neoc/alert-log`;
let mAlertLog = [];

async function mReadLog() {
    try {
        const cache = await caches.open(LOG_CACHE);
        const hit = await cache.match(LOG_KEY);
        let log = hit ? await hit.json() : [];
        const old = mLoad(M_LOG, null);
        if (old && old.length) {
            // One-time move of the older in-page history
            const seen = new Set(log.map(i => `${i.stationId}|${i.at}`));
            log = [...log, ...old.filter(i => !seen.has(`${i.stationId}|${i.at}`))]
                .sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 20);
            await mWriteLog(log);
            localStorage.removeItem(M_LOG);
        }
        mAlertLog = log;
    } catch (e) {
        mAlertLog = mLoad(M_LOG, []);
    }
    return mAlertLog;
}

async function mWriteLog(log) {
    mAlertLog = log.slice(0, 20);
    try {
        const cache = await caches.open(LOG_CACHE);
        await cache.put(LOG_KEY, new Response(JSON.stringify(mAlertLog), { headers: { 'Content-Type': 'application/json' } }));
    } catch (e) {
        mSave(M_LOG, mAlertLog);
    }
}

// Re-read the history and redraw (after an alert, or when the app comes back to the front)
function mReloadLog() {
    return mReadLog().then(mRefresh);
}

function mLoad(key, fallback) {
    try {
        const v = JSON.parse(localStorage.getItem(key));
        return v == null ? fallback : v;
    } catch (e) {
        return fallback;
    }
}

function mSave(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
}

const alarmPrefs = () => ({ sound: true, vibrate: true, ...mLoad(M_PREFS, {}) });

// ─── Helpers ──────────────────────────────────────────────────────────────────
const mCfgOf = cell => GRID_CONFIG.find(g => GRID_DATA[g.id].includes(cell));
const mStation = number => findWallStation(number);
const mDevices = id => (pushStatusValue && pushStatusValue.stations && pushStatusValue.stations[id]) || 0;
const mStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const mIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function mBadge(cell, size = '') {
    const cfg = mCfgOf(cell);
    return `<span class="m-badge${size ? ` is-${size}` : ''}" data-color="${cfg ? cfg.colorKey : 'mid'}">${escHtml(displayNumber(cell))}</span>`;
}

function mEmpty(icon, title, text) {
    return `
    <div class="m-empty">
        <div class="m-empty-icon">${ic(icon, 22)}</div>
        <div class="m-empty-title">${escHtml(title)}</div>
        ${text ? `<p>${escHtml(text)}</p>` : ''}
    </div>`;
}

// ─── Shell ────────────────────────────────────────────────────────────────────
function mInit() {
    const root = $('m-root');
    root.hidden = false;
    root.innerHTML = `
        <header class="m-topbar" id="m-topbar"></header>
        <main class="m-main" id="m-main"></main>
        <nav class="m-nav" id="m-nav" aria-label="Main"></nav>
        <button id="m-fab" class="m-fab" type="button" data-m="alert-sheet" aria-label="Send alert">
            ${ic('bell-ring', 26)}
        </button>`;

    $('m-main').addEventListener('scroll', () => {
        $('m-topbar').classList.toggle('is-scrolled', $('m-main').scrollTop > 4);
    }, { passive: true });

    document.addEventListener('click', mOnClick);
    document.addEventListener('input', mOnInput);
    document.addEventListener('change', mOnChange);
    window.addEventListener('popstate', mOnPopState);

    // Shared state changed in app.js → redraw what shows it
    ['auth', 'secrets', 'push', 'station', 'office'].forEach(name => window.addEventListener(`neoc:${name}`, mRefresh));
    window.addEventListener('neoc:alert-shown', e => mAlarmStart(e.detail));
    window.addEventListener('neoc:alert-ack', mAlarmStop);
    window.addEventListener('beforeinstallprompt', () => setTimeout(mRefresh));

    // Sound can only start after the first tap: unlock it early so alarms can play later
    document.addEventListener('pointerdown', mUnlockAudio, { passive: true });

    getPushStatus().then(mRefresh);
    mReloadLog();
    // Alerts may have arrived while the app was in the background
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            mReloadLog();
            getPushStatus(true).then(mRefresh);
        }
    });
    setInterval(() => { if (!document.hidden) getPushStatus(true).then(mRefresh); }, 60000);
    setInterval(mTickClock, 1000);
    mRender();
}

function mRender() {
    mRenderTopbar();
    mRenderNav();
    const main = $('m-main');
    main.innerHTML = { home: mHome, stations: mStations, team: mTeam, more: mMore }[M.tab]();
    mTickClock();
}

// Redraw the current tab and open sheets, keeping scroll positions
function mRefresh() {
    if (!IS_M || !$('m-main')) return;
    const main = $('m-main');
    const top = main.scrollTop;
    const active = document.activeElement && document.activeElement.id;
    mRender();
    main.scrollTop = top;
    sheetStack.forEach(renderSheet);
    if (active && $(active) && $(active).matches('input')) $(active).focus();
}

function mSetTab(tab) {
    if (tab === M.tab) {
        $('m-main').scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    M.tab = tab;
    mRender();
    $('m-main').scrollTop = 0;
}

function mRenderTopbar() {
    const titles = { home: 'NEOC', stations: 'Stations', team: 'Team', more: 'More' };
    const email = auth && auth.user ? auth.user.email : '';
    const account = auth
        ? `<button class="m-avatar-btn" type="button" data-m="tab" data-tab="more" aria-label="Account">
               <span class="account-avatar-sm">${escHtml((email[0] || 'A').toUpperCase())}</span></button>`
        : `<button class="m-icon-btn" type="button" data-m="signin" aria-label="Sign in">${ic('user', 20)}</button>`;
    const theme = document.documentElement.getAttribute('data-theme') === 'dark';
    $('m-topbar').innerHTML = `
        <div class="m-brand">
            ${M.tab === 'home' ? '<div class="brand-mark m-brand-mark">N</div>' : ''}
            <div>
                <div class="m-title">${titles[M.tab]}</div>
                ${M.tab === 'home' ? '<div class="m-subtitle">Tech (EW) · Control dashboard</div>' : ''}
            </div>
        </div>
        <div class="m-top-actions">
            <button class="m-icon-btn" type="button" data-m="theme" aria-label="Switch theme">${ic(theme ? 'sun' : 'moon', 20)}</button>
            ${account}
        </div>`;
}

function mRenderNav() {
    const closed = !inOfficeHours();
    $('m-fab').classList.toggle('is-off-hours', closed);
    $('m-fab').setAttribute('aria-disabled', String(closed));
    $('m-nav').classList.toggle('is-off-hours', closed);
    $('m-nav').innerHTML = M_TABS.map(t => t.id === 'alert'
        ? `<div class="m-nav-item m-nav-fab-slot" aria-hidden="true"><span class="m-nav-label">Alert</span></div>`
        : `<button class="m-nav-item${M.tab === t.id ? ' is-active' : ''}" type="button" data-m="tab" data-tab="${t.id}"
               aria-current="${M.tab === t.id ? 'page' : 'false'}">
               <span class="m-nav-pill">${ic(t.icon, 22)}</span>
               <span class="m-nav-label">${t.label}</span>
           </button>`).join('');
}

function mTickClock() {
    const el = $('m-clock');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const date = $('m-date');
    if (date) date.textContent = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ─── Home ─────────────────────────────────────────────────────────────────────
function mHome() {
    const cells = allVisibleCells();
    const configured = cells.filter(isConfigured).length;
    const ready = cells.filter(c => mDevices(displayNumber(c)) > 0).length;
    const log = mAlertLog.slice(0, 3);

    return `
    <section class="m-hero">
        <div>
            <div id="m-clock" class="m-clock">--:--</div>
            <div id="m-date" class="m-date"></div>
        </div>
        <span class="m-online">${ic('radio', 14)}Online</span>
    </section>

    ${mPhoneCard()}

    <section class="m-stats">
        <div class="m-stat"><div class="m-stat-value">${cells.length}</div><div class="m-stat-label">Stations</div></div>
        <div class="m-stat"><div class="m-stat-value">${configured}</div><div class="m-stat-label">Configured</div></div>
        <div class="m-stat"><div class="m-stat-value">${ready}</div><div class="m-stat-label">Alert-ready</div></div>
    </section>

    <h2 class="m-section-title">Subgrids</h2>
    <section class="m-grid-tiles">
        ${GRID_CONFIG.map(cfg => `
        <button class="m-grid-tile" type="button" data-m="open-grid" data-grid="${cfg.id}" data-color="${cfg.colorKey}">
            <span class="m-grid-tile-name">${escHtml(cfg.label)}</span>
            <span class="m-grid-tile-sub">${plural(visibleCells(cfg.id).length, 'station')}</span>
        </button>`).join('')}
    </section>

    <div class="m-section-row">
        <h2 class="m-section-title">Recent alerts</h2>
        ${log.length ? '<button class="m-text-btn" type="button" data-m="alert-log">See all</button>' : ''}
    </div>
    ${log.length ? `<div class="m-list">${log.map(mLogItem).join('')}</div>`
        : `<div class="m-card m-muted-card">${ic('history', 16)}No alerts received on this phone yet</div>`}`;
}

// The station this phone receives alerts for
function mPhoneCard() {
    const id = localPushStation();
    const hit = id ? mStation(id) : null;
    const denied = 'Notification' in window && Notification.permission === 'denied';

    let body;
    if (!pushSupported()) {
        body = mIOS() && !mStandalone()
            ? `<p class="m-card-text">On iPhone, alerts work in the installed app. Add NEOC to your Home Screen first.</p>
               <button class="m-btn m-btn-filled m-btn-block" type="button" data-m="install">${ic('plus-square', 18)}How to install</button>`
            : '<p class="m-card-text">This browser can’t receive alerts. Use Chrome on Android or the installed app on iPhone.</p>';
    } else if (hit) {
        body = `
            <div class="m-mine">
                ${mBadge(hit.cell, 'lg')}
                <div class="m-mine-text">
                    <div class="m-mine-title">${escHtml(hit.cell.portalName)}</div>
                    <div class="m-mine-sub">${escHtml(hit.cell.pcNumber)} · ${escHtml(hit.cell.user || 'No operator')}</div>
                </div>
                <span class="m-chip is-on">Active</span>
            </div>
            ${denied ? `<p class="m-card-warn">${ic('alert-triangle', 14)}Notifications are blocked. Allow them for this app in the phone settings.</p>` : ''}
            <div class="m-card-actions">
                <button class="m-btn m-btn-tonal" type="button" data-m="register-sheet">${ic('refresh-cw', 16)}Change</button>
                <button class="m-btn m-btn-outline" type="button" data-m="stop-alerts">${ic('bell-off', 16)}Stop</button>
                <button class="m-btn m-btn-outline" type="button" data-m="test-alarm">${ic('volume-2', 16)}Test</button>
            </div>`;
    } else {
        body = `
            <p class="m-card-text">Pick your station to get its alerts on this phone, with a full-screen alarm, sound and vibration.</p>
            ${denied ? `<p class="m-card-warn">${ic('alert-triangle', 14)}Notifications are blocked. Allow them for this app in the phone settings.</p>` : ''}
            <div class="m-card-actions">
                <button class="m-btn m-btn-filled" type="button" data-m="register-sheet">${ic('bell', 16)}Choose station</button>
                <button class="m-btn m-btn-outline" type="button" data-m="test-alarm">${ic('volume-2', 16)}Test</button>
            </div>`;
    }
    return `
    <section class="m-card m-phone-card${hit ? ' is-active' : ''}">
        <div class="m-card-head">
            <span class="m-card-icon">${ic('smartphone', 18)}</span>
            <div>
                <div class="m-card-title">Alerts on this phone</div>
                <div class="m-card-sub">${hit ? 'Receiving alerts' : 'Not receiving alerts'}</div>
            </div>
        </div>
        ${body}
    </section>`;
}

function mLogItem(entry) {
    const hit = mStation(entry.stationId);
    const when = new Date(entry.at);
    return `
    <button class="m-list-item" type="button" ${hit ? `data-m="station" data-id="${escHtml(entry.stationId)}"` : ''}>
        <span class="m-log-icon${entry.ack ? '' : ' is-new'}">${ic('bell-ring', 16)}</span>
        <span class="m-list-text">
            <span class="m-list-title">${escHtml(entry.stationId)}${entry.pc ? ` · ${escHtml(entry.pc)}` : ''}</span>
            <span class="m-list-sub">${when.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · ${entry.ack ? 'Acknowledged' : 'Not acknowledged'}</span>
        </span>
    </button>`;
}

// ─── Stations ─────────────────────────────────────────────────────────────────
function mStations() {
    return `
    <div class="m-sticky">
        <label class="m-search">
            ${ic('search', 18)}
            <input id="m-station-search" type="search" data-m-input="stations" value="${escHtml(M.query)}"
                placeholder="Search PC, operator, IP, portal" autocomplete="off" enterkeyhint="search" />
        </label>
        <div class="m-chips" role="tablist">
            ${[{ id: 'all', label: 'All' }, ...GRID_CONFIG.map(g => ({ id: g.id, label: g.label, color: g.colorKey }))].map(f => `
            <button class="m-filter${M.grid === f.id ? ' is-active' : ''}" type="button" role="tab" data-m="grid-filter" data-grid="${f.id}"
                ${f.color ? `data-color="${f.color}"` : ''} aria-selected="${M.grid === f.id}">
                ${f.color ? '<span class="dot"></span>' : ''}${escHtml(f.label)}
            </button>`).join('')}
        </div>
    </div>
    <div id="m-station-list">${mStationList()}</div>`;
}

function mStationList() {
    const q = M.query.trim().toLowerCase();
    const groups = GRID_CONFIG
        .filter(cfg => M.grid === 'all' || cfg.id === M.grid)
        .map(cfg => ({ cfg, cells: inPortalOrder(visibleCells(cfg.id)).filter(c => matchesQuery(c, q)) }))
        .filter(g => g.cells.length);
    if (!groups.length) return mEmpty('search', 'No stations found', 'Try another search or filter.');
    const mine = localPushStation();
    return groups.map(({ cfg, cells }) => `
        <div class="m-group-head" data-color="${cfg.colorKey}"><span class="dot"></span>${escHtml(cfg.label)}<span class="m-group-count">${cells.length}</span></div>
        <div class="m-list">
            ${cells.map(cell => {
                const id = displayNumber(cell);
                const devices = mDevices(id);
                return `
                <button class="m-list-item" type="button" data-m="station" data-id="${escHtml(id)}">
                    ${mBadge(cell)}
                    <span class="m-list-text">
                        <span class="m-list-title">${escHtml(cell.portalName || 'Untitled portal')}</span>
                        <span class="m-list-sub">${escHtml(cell.pcNumber)} · ${escHtml(cell.user || 'No operator')}</span>
                    </span>
                    <span class="m-list-trail">
                        ${mine === id ? `<span class="m-mine-bell" title="Alerts on this phone">${BELL_SOLID}</span>` : ''}
                        ${devices ? `<span class="m-dev-count" title="Devices that get this station's alerts">${ic('smartphone', 12)}${devices}</span>` : ''}
                        ${ic('chevron-right', 18)}
                    </span>
                </button>`;
            }).join('')}
        </div>`).join('');
}

// ─── Team (developers) ────────────────────────────────────────────────────────
function mTeam() {
    return `
    <div class="m-sticky">
        <label class="m-search">
            ${ic('search', 18)}
            <input id="m-team-search" type="search" data-m-input="team" value="${escHtml(M.teamQuery)}"
                placeholder="Search developer or portal" autocomplete="off" enterkeyhint="search" />
        </label>
    </div>
    <div id="m-team-list">${mTeamList()}</div>`;
}

function mTeamList() {
    const q = M.teamQuery.trim().toLowerCase();
    const devs = DEV.devs.filter(d => devMatches(d, q));
    if (!devs.length) return mEmpty('users', 'No developers found', 'Try another name or portal.');
    return `<div class="m-list">${devs.map(d => `
        <button class="m-list-item" type="button" data-m="dev" data-dev="${escHtml(d.id)}">
            <span class="m-initials">${escHtml(initials(d.name))}</span>
            <span class="m-list-text">
                <span class="m-list-title">${escHtml(d.name)}</span>
                <span class="m-list-sub">${escHtml(d.role || 'Developer')} · ${d.portals.length ? plural(d.portals.length, 'portal') : 'No portals yet'}</span>
            </span>
            <span class="m-list-trail">${ic('chevron-right', 18)}</span>
        </button>`).join('')}</div>`;
}

// ─── More ─────────────────────────────────────────────────────────────────────
function mMore() {
    const prefs = alarmPrefs();
    const theme = document.documentElement.getAttribute('data-theme');
    const perm = 'Notification' in window ? Notification.permission : 'unsupported';
    const permText = { granted: 'Allowed', denied: 'Blocked', default: 'Not asked yet', unsupported: 'Not supported' }[perm];
    const archived = GRID_CONFIG.reduce((n, g) => n + GRID_DATA[g.id].filter(c => c.archived).length, 0);
    const email = auth && auth.user ? auth.user.email : '';
    const since = auth && auth.user && auth.user.since
        ? new Date(auth.user.since).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '';
    const canInstall = !mStandalone() && (installPrompt || mIOS());

    return `
    <section class="m-card m-account">
        ${auth ? `
        <div class="m-account-head">
            <span class="account-avatar m-account-avatar">${escHtml((email[0] || 'A').toUpperCase())}</span>
            <div class="m-list-text">
                <span class="m-list-title">${escHtml(email.split('@')[0])}</span>
                <span class="m-list-sub">${escHtml(email)}</span>
            </div>
            <span class="account-badge">${ic('shield-check', 13)}Admin</span>
        </div>
        <div class="m-account-meta">Signed in ${escHtml(since)} · No expiry</div>
        <button class="m-btn m-btn-outline m-btn-block" type="button" data-m="signout">${ic('log-out', 16)}Sign out</button>`
        : `
        <div class="m-account-head">
            <span class="m-card-icon">${ic('user', 18)}</span>
            <div class="m-list-text">
                <span class="m-list-title">Not signed in</span>
                <span class="m-list-sub">Admins can edit IP addresses and see system passwords</span>
            </div>
        </div>
        <button class="m-btn m-btn-filled m-btn-block" type="button" data-m="signin">${ic('log-in', 16)}Sign in</button>`}
    </section>

    <h2 class="m-section-title">Alarm on this phone</h2>
    <div class="m-list">
        ${mSwitchRow('sound', 'volume-2', 'Siren sound', 'Plays while the alarm screen is open', prefs.sound)}
        ${mSwitchRow('vibrate', 'vibrate', 'Vibration', navigator.vibrate ? 'Pulses until you acknowledge' : 'Not supported on this phone', prefs.vibrate && Boolean(navigator.vibrate), !navigator.vibrate)}
        <button class="m-list-item" type="button" data-m="test-alarm">
            <span class="m-list-icon">${ic('bell-ring', 18)}</span>
            <span class="m-list-text"><span class="m-list-title">Test the alarm</span><span class="m-list-sub">Shows the full-screen alert here</span></span>
            <span class="m-list-trail">${ic('chevron-right', 18)}</span>
        </button>
        <div class="m-list-item is-static">
            <span class="m-list-icon">${ic('bell', 18)}</span>
            <span class="m-list-text"><span class="m-list-title">Notifications</span><span class="m-list-sub">${permText}</span></span>
        </div>
        <button class="m-list-item" type="button" data-m="alert-log">
            <span class="m-list-icon">${ic('history', 18)}</span>
            <span class="m-list-text"><span class="m-list-title">Alert history</span><span class="m-list-sub">${plural(mAlertLog.length, 'alert')} on this phone</span></span>
            <span class="m-list-trail">${ic('chevron-right', 18)}</span>
        </button>
    </div>

    <h2 class="m-section-title">App</h2>
    <div class="m-list">
        <div class="m-list-item is-static">
            <span class="m-list-icon">${ic(theme === 'dark' ? 'moon' : 'sun', 18)}</span>
            <span class="m-list-text"><span class="m-list-title">Theme</span></span>
            <span class="m-seg">
                <button class="m-seg-btn${theme === 'light' ? ' is-active' : ''}" type="button" data-m="set-theme" data-theme="light">Light</button>
                <button class="m-seg-btn${theme === 'dark' ? ' is-active' : ''}" type="button" data-m="set-theme" data-theme="dark">Dark</button>
            </span>
        </div>
        ${canInstall ? `
        <button class="m-list-item" type="button" data-m="install">
            <span class="m-list-icon">${ic('download', 18)}</span>
            <span class="m-list-text"><span class="m-list-title">Install app</span><span class="m-list-sub">Add NEOC to your home screen</span></span>
            <span class="m-list-trail">${ic('chevron-right', 18)}</span>
        </button>` : ''}
        <button class="m-list-item" type="button" data-m="archive">
            <span class="m-list-icon">${ic('archive', 18)}</span>
            <span class="m-list-text"><span class="m-list-title">Archive</span><span class="m-list-sub">${archived ? plural(archived, 'retired station') : 'No retired stations'}</span></span>
            <span class="m-list-trail">${ic('chevron-right', 18)}</span>
        </button>
        <button class="m-list-item" type="button" data-m="desktop-layout">
            <span class="m-list-icon">${ic('laptop', 18)}</span>
            <span class="m-list-text"><span class="m-list-title">Desktop layout</span><span class="m-list-sub">Screen wall view (for tablets)</span></span>
            <span class="m-list-trail">${ic('chevron-right', 18)}</span>
        </button>
    </div>
    <p class="m-footnote">NEOC Tech (EW) Control Dashboard</p>`;
}

function mSwitchRow(key, icon, title, sub, on, disabled = false) {
    return `
    <div class="m-list-item is-static">
        <span class="m-list-icon">${ic(icon, 18)}</span>
        <span class="m-list-text"><span class="m-list-title">${title}</span><span class="m-list-sub">${sub}</span></span>
        ${mSwitch(`data-m="pref" data-pref="${key}"`, on, disabled, title)}
    </div>`;
}

function mSwitch(attrs, on, disabled = false, label = '') {
    return `<button class="m-switch${on ? ' is-on' : ''}" type="button" role="switch" aria-checked="${on}"
        aria-label="${escHtml(label)}" ${attrs} ${disabled ? 'disabled' : ''}><span class="m-switch-thumb"></span></button>`;
}

// ─── Bottom sheets ────────────────────────────────────────────────────────────
// A stack of sheets; each one adds a history entry so the phone's Back button closes it.
const sheetStack = [];

function openSheet(render, data = {}, opts = {}) {
    const layer = document.createElement('div');
    layer.className = 'm-layer';
    layer.innerHTML = `
        <div class="m-scrim" data-m="close-sheet"></div>
        <section class="m-sheet${opts.full ? ' is-full' : ''}" role="dialog" aria-modal="true">
            <div class="m-sheet-grip" aria-hidden="true"></div>
            <div class="m-sheet-inner"></div>
        </section>`;
    $('m-sheets').appendChild(layer);
    const entry = { render, data, layer, sheet: layer.querySelector('.m-sheet') };
    sheetStack.push(entry);
    renderSheet(entry);
    mBindSheetDrag(entry);
    history.pushState({ mSheets: sheetStack.length }, '');
    requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.add('is-open')));
    return entry;
}

function renderSheet(entry) {
    const inner = entry.layer.querySelector('.m-sheet-inner');
    const old = inner.querySelector('.m-sheet-body');
    const top = old ? old.scrollTop : 0;
    const focused = document.activeElement && inner.contains(document.activeElement) && document.activeElement.id;
    inner.innerHTML = entry.render(entry);
    const body = inner.querySelector('.m-sheet-body');
    if (body) body.scrollTop = top;
    if (focused && $(focused)) $(focused).focus();
}

const topSheet = () => sheetStack[sheetStack.length - 1] || null;

function closeSheet() {
    if (!sheetStack.length) return;
    if (history.state && history.state.mSheets) history.back();   // popstate removes it
    else removeTopSheet();
}

function mOnPopState() {
    const want = (history.state && history.state.mSheets) || 0;
    while (sheetStack.length > want) removeTopSheet();
}

function removeTopSheet() {
    const entry = sheetStack.pop();
    if (!entry) return;
    entry.sheet.style.transform = '';
    entry.layer.classList.remove('is-open');
    setTimeout(() => entry.layer.remove(), 320);
    if (entry.onClose) entry.onClose();
}

// Drag a sheet down by its top (or its content when scrolled to the top) to close it
function mBindSheetDrag(entry) {
    const sheet = entry.sheet;
    let startY = null;
    let dy = 0;
    let dragging = false;
    sheet.addEventListener('touchstart', e => {
        const body = sheet.querySelector('.m-sheet-body');
        const onHead = e.target.closest('.m-sheet-grip, .m-sheet-head');
        const atTop = !body || body.scrollTop <= 0;
        if (!onHead && !(atTop && body && body.contains(e.target))) return;
        if (!onHead && e.target.closest('input, textarea, .m-picker-grid')) return;
        startY = e.touches[0].clientY;
        dy = 0;
        dragging = false;
    }, { passive: true });
    sheet.addEventListener('touchmove', e => {
        if (startY === null) return;
        dy = e.touches[0].clientY - startY;
        if (!dragging) {
            if (dy > 10) {
                dragging = true;
                sheet.classList.add('is-dragging');
            } else if (dy < -6) {
                startY = null;
                return;
            } else {
                return;
            }
        }
        e.preventDefault();
        sheet.style.transform = `translateY(${Math.max(0, dy)}px)`;
    }, { passive: false });
    const end = () => {
        if (startY === null) return;
        startY = null;
        sheet.classList.remove('is-dragging');
        if (dragging && dy > Math.min(140, sheet.offsetHeight * 0.25)) closeSheet();
        else sheet.style.transform = '';
        dragging = false;
    };
    sheet.addEventListener('touchend', end);
    sheet.addEventListener('touchcancel', end);
}

function sheetHead(title, sub, lead = '') {
    return `
    <div class="m-sheet-head">
        ${lead}
        <div class="m-sheet-titles">
            <div class="m-sheet-title">${title}</div>
            ${sub ? `<div class="m-sheet-sub">${sub}</div>` : ''}
        </div>
        <button class="m-icon-btn m-sheet-close" type="button" data-m="close-sheet" aria-label="Close">${ic('x', 20)}</button>
    </div>`;
}

// ─── Station sheet ────────────────────────────────────────────────────────────
function openStationSheet(number) {
    const hit = mStation(number);
    if (!hit) return;
    getPushStatus(true).then(() => renderSheet(entry));
    const entry = openSheet(renderStationSheet, { number, tab: 'overview' }, { full: true });
}

function renderStationSheet(entry) {
    const hit = mStation(entry.data.number);
    if (!hit) return sheetHead('Station not found', '');
    const { cell, cfg } = hit;
    const id = displayNumber(cell);
    const tab = entry.data.tab;
    const body = tab === 'description'
        ? (hasDescription(cell)
            ? `<div class="m-desc rich-text">${richText(cell.portalDescription)}</div>`
            : mEmpty('file-text', 'No description yet', ''))
        : mStationOverview(cell);

    return `
    ${sheetHead(escHtml(cell.portalName || 'Untitled portal'),
        `${escHtml(cell.pcNumber)} · Subgrid ${escHtml(cfg.label)}`, mBadge(cell, 'lg'))}
    <div class="m-sheet-tabs">
        <div class="m-seg m-seg-full">
            <button class="m-seg-btn${tab === 'overview' ? ' is-active' : ''}" type="button" data-m="sheet-tab" data-tab="overview">${ic('info', 16)}Overview</button>
            <button class="m-seg-btn${tab === 'description' ? ' is-active' : ''}" type="button" data-m="sheet-tab" data-tab="description">${ic('file-text', 16)}Description</button>
        </div>
    </div>
    <div class="m-sheet-body">${body}</div>
    <div class="m-sheet-foot">
        <div class="m-foot-label">Send alert to ${escHtml(cell.user || id)}</div>
        ${mAlertButtons(cell)}
    </div>`;
}

function mStationOverview(cell) {
    const id = displayNumber(cell);
    const access = accessInfo(cell);
    const password = stationSecrets[id] || '';
    const shown = M.revealed === id;
    const dev = developerName(cell);

    let pwValue;
    let pwActions = '';
    if (!isAdmin()) {
        pwValue = '<span class="m-secret">••••••••</span>';
        pwActions = `<button class="m-btn m-btn-tonal m-btn-sm" type="button" data-m="signin">${ic('lock', 14)}Sign in</button>`;
    } else if (!secretsLoaded) {
        pwValue = '<span class="m-kv-muted">Loading…</span>';
    } else if (!password) {
        pwValue = '<span class="m-kv-muted">Not set</span>';
        pwActions = mRowIcon('edit', 'pencil', 'Set password', `data-field="password"`);
    } else {
        pwValue = shown ? `<span class="m-secret-plain">${escHtml(password)}</span>` : '<span class="m-secret">••••••••</span>';
        pwActions = mRowIcon('reveal', shown ? 'eye-off' : 'eye', shown ? 'Hide password' : 'Show password')
            + mRowIcon('copy', 'copy', 'Copy password')
            + mRowIcon('edit', 'pencil', 'Edit password', `data-field="password"`);
    }

    const mine = localPushStation();
    const here = mine === id;
    const pushOk = pushSupported();

    return `
    <div class="m-kv-list">
        ${mKv('Operator', escHtml(cell.user || '—'), cell.mail ? `<a class="m-kv-link" href="mailto:${escHtml(cell.mail)}">${escHtml(cell.mail)}</a>` : 'No email on file')}
        ${mKv('Network', escHtml(cell.ipAddress || '—'), '', isAdmin() ? mRowIcon('edit', 'pencil', 'Edit IP address', `data-field="ip"`) : '')}
        ${mKv('Server', access ? serverBadge(access) : '<span class="m-kv-muted">Not configured</span>')}
        ${mKv('PC Password', pwValue, '', pwActions)}
        ${mKv('Category', escHtml(cell.category || '—'))}
        ${dev ? mKv('Developer', escHtml(dev)) : ''}
    </div>

    <div class="m-card m-here">
        <div class="m-here-row">
            <span class="m-card-icon">${ic('smartphone', 18)}</span>
            <div class="m-list-text">
                <span class="m-list-title">Alerts on this phone</span>
                <span class="m-list-sub">${!pushOk ? (mIOS() && !mStandalone() ? 'Install the app first (More → Install app)' : 'Not supported in this browser')
                    : here ? 'This phone gets this station’s alerts'
                    : mine ? `Now on ${escHtml(mine)}. Turning on moves it here`
                    : 'Get this station’s alarm on this phone'}</span>
            </div>
            ${mSwitch(`data-m="toggle-here" data-id="${escHtml(id)}"`, here, !pushOk, 'Alerts on this phone')}
        </div>
    </div>`;
}

function mKv(label, valueHTML, sub = '', actions = '') {
    return `
    <div class="m-kv">
        <div class="m-kv-label">${label}</div>
        <div class="m-kv-main">
            <div class="m-kv-value">${valueHTML}</div>
            ${sub ? `<div class="m-kv-sub">${sub}</div>` : ''}
        </div>
        ${actions ? `<div class="m-kv-actions">${actions}</div>` : ''}
    </div>`;
}

function mRowIcon(action, icon, label, extra = '') {
    return `<button class="m-icon-btn m-icon-btn-sm" type="button" data-m="${action}" ${extra} aria-label="${label}">${ic(icon, 18)}</button>`;
}

// Desktop rings the station's PCs, Mobile its phones
function mAlertButtons(cell) {
    const id = displayNumber(cell);
    const closed = !inOfficeHours();
    return `
    ${closed ? `<div class="m-off-hours">${ic('clock', 14)}Office hours only · ${OFFICE_HOURS_TEXT}</div>` : ''}
    <div class="m-alert-actions${closed ? ' is-off-hours' : ''}">
        ${Object.keys(ALERT_KINDS).map(kind => {
            const n = deviceCount(id, kind);
            const enabled = pushStatusValue ? pushStatusValue.enabled : true;
            const { label, icon, device } = ALERT_KINDS[kind];
            return `
            <button class="m-btn m-btn-danger m-btn-xl${closed ? ' is-off-hours' : ''}" type="button" data-m="send-push" data-kind="${kind}" data-id="${escHtml(id)}"
                ${enabled ? '' : 'disabled'} ${closed ? 'aria-disabled="true"' : ''}>
                ${ic(icon, 20)}<span class="m-btn-stack"><span>${label}</span>
                <small>${closed ? 'Out of office hours' : pushStatusValue ? (n ? `${plural(n, device)} will ring` : `No ${device} registered`) : 'Checking…'}</small></span>
            </button>`;
        }).join('')}
    </div>`;
}

// ─── Station picker (Send alert FAB, and choosing this phone's station) ───────
function openPickerSheet(mode) {
    getPushStatus(true).then(() => { const e = topSheet(); if (e && e.data.picker) renderSheet(e); });
    openSheet(renderPickerSheet, { picker: true, mode, query: '', selected: null }, { full: true });
}

function renderPickerSheet(entry) {
    const { mode, selected } = entry.data;
    if (mode === 'alert' && selected) return renderAlertConfirm(entry);
    const title = mode === 'alert' ? 'Send alert' : 'Choose your station';
    const sub = mode === 'alert' ? 'Pick the station to alert' : 'This phone will ring for that station’s alerts';
    return `
    ${sheetHead(title, sub, `<span class="m-card-icon${mode === 'alert' ? ' is-danger' : ''}">${ic(mode === 'alert' ? 'bell-ring' : 'smartphone', 18)}</span>`)}
    <div class="m-sheet-tabs">
        <label class="m-search">
            ${ic('search', 18)}
            <input id="m-picker-search" type="search" data-m-input="picker" value="${escHtml(entry.data.query)}"
                placeholder="Search number, PC or name" autocomplete="off" enterkeyhint="search" />
        </label>
    </div>
    <div class="m-sheet-body"><div id="m-picker-grid" class="m-picker-grid">${mPickerGrid(entry)}</div></div>`;
}

function mPickerGrid(entry) {
    const q = entry.data.query.trim().toLowerCase();
    const mine = localPushStation();
    const groups = GRID_CONFIG
        .map(cfg => ({ cfg, cells: inPortalOrder(visibleCells(cfg.id)).filter(c => matchesQuery(c, q)) }))
        .filter(g => g.cells.length);
    if (!groups.length) return mEmpty('search', 'No stations found', '');
    return groups.map(({ cfg, cells }) => `
        <div class="m-group-head" data-color="${cfg.colorKey}"><span class="dot"></span>${escHtml(cfg.label)}</div>
        <div class="m-picker-row" data-color="${cfg.colorKey}">
            ${cells.map(cell => {
                const id = displayNumber(cell);
                const n = mDevices(id);
                const isMine = entry.data.mode === 'register' && mine === id;
                return `
                <button class="m-pick${isMine ? ' is-mine' : ''}" type="button" data-m="pick" data-id="${escHtml(id)}">
                    <span class="m-pick-num">${escHtml(id)}</span>
                    <span class="m-pick-pc">${escHtml(cell.pcNumber)}</span>
                    ${entry.data.mode === 'alert' && n ? '<span class="m-pick-dot" title="Has registered devices"></span>' : ''}
                    ${isMine ? `<span class="m-pick-bell">${BELL_SOLID}</span>` : ''}
                </button>`;
            }).join('')}
        </div>`).join('');
}

function renderAlertConfirm(entry) {
    const hit = mStation(entry.data.selected);
    if (!hit) return '';
    const { cell, cfg } = hit;
    return `
    ${sheetHead('Send alert', 'Check the station, then send',
        `<button class="m-icon-btn" type="button" data-m="pick-back" aria-label="Back">${ic('arrow-left', 20)}</button>`)}
    <div class="m-sheet-body">
        <div class="m-card m-confirm" data-color="${cfg.colorKey}">
            ${mBadge(cell, 'xl')}
            <div class="m-confirm-name">${escHtml(cell.portalName || 'Untitled portal')}</div>
            <div class="m-confirm-sub">${escHtml(cell.pcNumber)} · Subgrid ${escHtml(cfg.label)}</div>
            <div class="m-confirm-user">${ic('user', 16)}${escHtml(cell.user || 'No operator')}</div>
        </div>
        <p class="m-help">“Desktop” rings the PCs and “Mobile” the phones that get ${escHtml(displayNumber(cell))}’s alerts, with a full-screen alarm.</p>
    </div>
    <div class="m-sheet-foot">${mAlertButtons(cell)}</div>`;
}

// ─── Developer sheets ─────────────────────────────────────────────────────────
function openDevSheet(devId) {
    openSheet(entry => {
        const dev = findDev(entry.data.devId);
        if (!dev) return sheetHead('Developer not found', '');
        return `
        ${sheetHead(escHtml(dev.name), escHtml(dev.role || 'Developer'), `<span class="m-initials is-lg">${escHtml(initials(dev.name))}</span>`)}
        <div class="m-sheet-body">
            ${dev.email ? `<a class="m-card m-mail-card" href="mailto:${escHtml(dev.email)}">${ic('mail', 18)}${escHtml(dev.email)}</a>` : ''}
            <h3 class="m-section-title">Portals</h3>
            ${dev.portals.length ? `<div class="m-list">${dev.portals.map(p => `
                <button class="m-list-item" type="button" data-m="dev-portal" data-dev="${escHtml(dev.id)}" data-portal="${escHtml(p.id)}">
                    ${p.cell ? mBadge(p.cell) : `<span class="m-list-icon">${ic('code', 18)}</span>`}
                    <span class="m-list-text">
                        <span class="m-list-title">${escHtml(p.name)}</span>
                        <span class="m-list-sub">${escHtml(DEV_STATUS[p.status])}${p.wall ? ` · On the wall (${escHtml(p.wall)})` : ' · Off the wall'}</span>
                    </span>
                    <span class="m-list-trail">${ic('chevron-right', 18)}</span>
                </button>`).join('')}</div>`
                : mEmpty('code', 'No portals yet', 'Portals are added in js/developers.js.')}
        </div>`;
    }, { devId });
}

function openDevPortalSheet(devId, portalId) {
    openSheet(entry => {
        const dev = findDev(entry.data.devId);
        const p = dev && dev.portals.find(x => x.id === entry.data.portalId);
        if (!p) return sheetHead('Portal not found', '');
        return `
        ${sheetHead(escHtml(p.name), `By ${escHtml(dev.name)} · ${escHtml(DEV_STATUS[p.status])}`)}
        <div class="m-sheet-body">
            <div class="m-kv-list">
                ${p.wall ? mKv('Station', `${escHtml(p.wall)} · ${escHtml(p.cell.pcNumber)}`, '', `<button class="m-btn m-btn-tonal m-btn-sm" type="button" data-m="station" data-id="${escHtml(p.wall)}">Open</button>`) : ''}
                ${p.category ? mKv('Category', escHtml(p.category)) : ''}
                ${p.stack ? mKv('Stack', escHtml(p.stack)) : ''}
                ${p.url ? mKv('URL', `<a class="m-kv-link" href="${escHtml(p.url)}" target="_blank" rel="noopener">${escHtml(p.url.replace(/^https?:\/\//, ''))}</a>`) : ''}
                ${p.updated ? mKv('Updated', escHtml(p.updated)) : ''}
            </div>
            <h3 class="m-section-title">Description</h3>
            ${p.description ? `<div class="m-desc rich-text">${richText(p.description)}</div>` : mEmpty('file-text', 'No description yet', '')}
        </div>`;
    }, { devId, portalId }, { full: true });
}

// ─── Other sheets ─────────────────────────────────────────────────────────────
function openEditSheet(number, field) {
    const hit = mStation(number);
    if (!hit) return;
    const value = field === 'ip' ? hit.cell.ipAddress : (stationSecrets[number] || '');
    openSheet(entry => `
        ${sheetHead(field === 'ip' ? 'Edit IP address' : 'PC password', `${escHtml(number)} · ${escHtml(hit.cell.pcNumber)}`)}
        <div class="m-sheet-body">
            <label class="m-field">
                <span class="m-field-label">${field === 'ip' ? 'IP address' : 'PC password'}</span>
                <input id="m-edit-input" class="m-input" type="text" data-m-input="edit" value="${escHtml(entry.data.value)}"
                    ${field === 'ip' ? 'inputmode="decimal" placeholder="172.18.1.112"' : 'placeholder="PC password"'}
                    autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" />
            </label>
            <p class="m-help">${field === 'ip'
                ? 'Everyone sees the new IP in about a minute.'
                : 'Only signed-in admins can see it. Leave empty to clear it.'}</p>
        </div>
        <div class="m-sheet-foot">
            <button id="m-edit-save" class="m-btn m-btn-filled m-btn-block m-btn-lg" type="button" data-m="save-edit">${ic('check', 18)}Save</button>
        </div>`, { number, field, value });
    setTimeout(() => {
        const input = $('m-edit-input');
        if (input) {
            input.focus();
            input.select();
        }
    }, 350);
}

function openAlertLogSheet() {
    openSheet(() => {
        const log = mAlertLog;
        return `
        ${sheetHead('Alert history', 'Alerts received on this phone')}
        <div class="m-sheet-body">
            ${log.length ? `<div class="m-list">${log.map(mLogItem).join('')}</div>
                <button class="m-btn m-btn-outline m-btn-block m-log-clear" type="button" data-m="clear-log">${ic('trash', 16)}Clear history</button>`
                : mEmpty('history', 'No alerts yet', 'Alerts that reach this phone are listed here.')}
        </div>`;
    });
}

function openArchiveSheet() {
    openSheet(() => {
        const cells = GRID_CONFIG.flatMap(g => GRID_DATA[g.id].filter(c => c.archived));
        return `
        ${sheetHead('Archive', 'Retired stations, no longer on the screen wall')}
        <div class="m-sheet-body">
            ${cells.length ? `<div class="m-list">${cells.map(cell => `
                <div class="m-list-item is-static">
                    ${mBadge(cell)}
                    <span class="m-list-text">
                        <span class="m-list-title">${escHtml(cell.portalName)}</span>
                        <span class="m-list-sub">${escHtml(cell.pcNumber)} · ${escHtml(cell.user || 'No operator')}</span>
                    </span>
                </div>`).join('')}</div>`
                : mEmpty('archive', 'Nothing archived', 'Retired stations will appear here.')}
        </div>`;
    });
}

function openInstallSheet() {
    if (installPrompt) {
        installPrompt.prompt();
        installPrompt.userChoice.finally(() => {
            installPrompt = null;
            mRefresh();
        });
        return;
    }
    openSheet(() => `
        ${sheetHead('Install NEOC', mIOS() ? 'Add it to your Home Screen' : 'Add it to your home screen')}
        <div class="m-sheet-body">
            <ol class="m-steps">
                ${mIOS() ? `
                <li><span class="m-step-icon">${ic('share', 18)}</span><span>Open this page in <strong>Safari</strong> and tap <strong>Share</strong>.</span></li>
                <li><span class="m-step-icon">${ic('plus-square', 18)}</span><span>Choose <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</span></li>
                <li><span class="m-step-icon">${ic('bell', 18)}</span><span>Open NEOC from the Home Screen and turn on alerts for your station.</span></li>`
                : `
                <li><span class="m-step-icon">${ic('menu', 18)}</span><span>Open the browser menu <strong>⋮</strong>.</span></li>
                <li><span class="m-step-icon">${ic('download', 18)}</span><span>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</span></li>
                <li><span class="m-step-icon">${ic('bell', 18)}</span><span>Open NEOC from the home screen and turn on alerts for your station.</span></li>`}
            </ol>
            <p class="m-help">Alerts on iPhone need iOS 16.4 or later and work only in the installed app.</p>
        </div>`);
}

// ─── Actions ──────────────────────────────────────────────────────────────────
function mOnClick(e) {
    const el = e.target.closest('[data-m]');
    if (!el || !(el.closest('#m-root') || el.closest('#m-sheets'))) return;
    const act = el.dataset.m;
    const entry = el.closest('.m-layer') ? sheetStack.find(s => s.layer === el.closest('.m-layer')) : null;

    switch (act) {
        case 'tab': mSetTab(el.dataset.tab); break;
        case 'theme': applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); mRefresh(); break;
        case 'set-theme': applyTheme(el.dataset.theme); mRefresh(); break;
        case 'signin': openSignIn(); break;
        case 'signout': signOut(); break;
        case 'open-grid':
            M.grid = el.dataset.grid;
            M.query = '';
            mSetTab('stations');
            break;
        case 'grid-filter':
            M.grid = el.dataset.grid;
            mRender();
            break;
        case 'station': openStationSheet(el.dataset.id); break;
        case 'dev': openDevSheet(el.dataset.dev); break;
        case 'dev-portal': openDevPortalSheet(el.dataset.dev, el.dataset.portal); break;
        case 'close-sheet': closeSheet(); break;
        case 'sheet-tab':
            if (entry) {
                entry.data.tab = el.dataset.tab;
                renderSheet(entry);
                const body = entry.layer.querySelector('.m-sheet-body');
                if (body) body.scrollTop = 0;
            }
            break;
        case 'alert-sheet':
            if (inOfficeHours()) openPickerSheet('alert');
            else showToast('warn', OFF_HOURS_MSG);
            break;
        case 'register-sheet': openPickerSheet('register'); break;
        case 'pick': mPick(entry, el.dataset.id, el); break;
        case 'pick-back':
            if (entry) {
                entry.data.selected = null;
                renderSheet(entry);
            }
            break;
        case 'send-push': mSendPush(el); break;
        case 'toggle-here': mToggleHere(el); break;
        case 'stop-alerts': mStopAlerts(el); break;
        case 'test-alarm': showAlertOverlay({ stationId: 'TEST', pc: 'THIS PHONE', at: new Date().toISOString(), test: true }); break;
        case 'pref': {
            const prefs = alarmPrefs();
            prefs[el.dataset.pref] = !prefs[el.dataset.pref];
            mSave(M_PREFS, prefs);
            if (el.dataset.pref === 'vibrate' && prefs.vibrate && navigator.vibrate) navigator.vibrate(200);
            mRefresh();
            break;
        }
        case 'reveal': {
            const number = entry && entry.data.number;
            M.revealed = M.revealed === number ? null : number;
            renderSheet(entry);
            break;
        }
        case 'copy': {
            const hit = entry && mStation(entry.data.number);
            if (hit) copyPassword(hit.cell);
            break;
        }
        case 'edit': if (entry) openEditSheet(entry.data.number, el.dataset.field); break;
        case 'save-edit': mSaveEdit(entry); break;
        case 'alert-log': openAlertLogSheet(); break;
        case 'clear-log':
            mWriteLog([]).then(mRefresh);
            break;
        case 'archive': openArchiveSheet(); break;
        case 'install': openInstallSheet(); break;
        case 'desktop-layout':
            try { localStorage.setItem('ndma_layout', 'desktop'); } catch (err) { /* storage unavailable */ }
            location.reload();
            break;
        default: break;
    }
}

function mOnInput(e) {
    const kind = e.target.dataset && e.target.dataset.mInput;
    if (!kind) return;
    if (kind === 'stations') {
        M.query = e.target.value;
        $('m-station-list').innerHTML = mStationList();
    } else if (kind === 'team') {
        M.teamQuery = e.target.value;
        $('m-team-list').innerHTML = mTeamList();
    } else if (kind === 'edit') {
        const entry = topSheet();
        if (entry) entry.data.value = e.target.value;
    } else if (kind === 'picker') {
        const entry = topSheet();
        if (!entry) return;
        entry.data.query = e.target.value;
        $('m-picker-grid').innerHTML = mPickerGrid(entry);
    }
}

function mOnChange() { /* reserved for future inputs */ }

// Keyboard "Done" / Enter saves the edit sheet
document.addEventListener('keydown', e => {
    if (IS_M && e.key === 'Enter' && e.target.id === 'm-edit-input') {
        e.preventDefault();
        mSaveEdit(topSheet());
    }
});

async function mPick(entry, id, el) {
    if (!entry) return;
    if (entry.data.mode === 'alert') {
        entry.data.selected = id;
        renderSheet(entry);
        return;
    }
    // Register this phone for the station (or keep it if it already is)
    const hit = mStation(id);
    if (!hit) return;
    if (localPushStation() === id) {
        closeSheet();
        return;
    }
    mBusy(el, true);
    await updatePushHere(hit.cell);
    if (localPushStation() === id) closeSheet();
    else mBusy(el, false);
    mRefresh();
}

function mBusy(el, busy, label = '') {
    if (!el) return;
    el.disabled = busy;
    el.setAttribute('aria-busy', String(busy));
    if (busy) {
        el.dataset.idle = el.innerHTML;
        el.innerHTML = `<span class="spinner" aria-hidden="true"></span>${label}`;
    } else if (el.dataset.idle) {
        el.innerHTML = el.dataset.idle;
    }
}

async function mSendPush(el) {
    const hit = mStation(el.dataset.id);
    if (!hit) return;
    if (!inOfficeHours()) {
        showToast('warn', OFF_HOURS_MSG);
        return;
    }
    mBusy(el, true, 'Sending');
    await sendDeviceAlert(hit.cell, el.dataset.kind, null);
    mRefresh();
}

async function mToggleHere(el) {
    const hit = mStation(el.dataset.id);
    if (!hit || el.disabled) return;
    el.disabled = true;
    el.classList.add('is-busy');
    el.classList.toggle('is-on');     // move the thumb at once; the redraw below confirms it
    await updatePushHere(hit.cell);
    mRefresh();
}

async function mStopAlerts(el) {
    const id = localPushStation();
    const hit = id && mStation(id);
    if (!hit) return;
    mBusy(el, true, 'Stopping');
    await updatePushHere(hit.cell);
    mRefresh();
}

async function mSaveEdit(entry) {
    if (!entry || !entry.data.field) return;
    const input = $('m-edit-input');
    const btn = $('m-edit-save');
    const hit = mStation(entry.data.number);
    if (!input || !hit) return;
    entry.data.value = input.value;
    input.disabled = true;
    mBusy(btn, true, 'Saving');
    try {
        await updateStationField(hit.cell, entry.data.field, input.value);
        closeSheet();
    } catch (err) {
        if (err.status === 401) {
            closeSheet();
            return;
        }
        showToast('error', err.message);
        input.disabled = false;
        mBusy(btn, false);
        input.focus();
    }
}

// ─── Alarm: siren, vibration and screen kept on while the alert shows ────────
const alarm = { ctx: null, siren: null, buzz: null, lock: null };

function mUnlockAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!alarm.ctx) alarm.ctx = new AC();
    if (alarm.ctx.state === 'suspended') alarm.ctx.resume().catch(() => {});
    if (alarm.ctx.state === 'running') {
        // A silent blip finishes unlocking on iOS
        const src = alarm.ctx.createBufferSource();
        src.buffer = alarm.ctx.createBuffer(1, 1, 22050);
        src.connect(alarm.ctx.destination);
        src.start(0);
        document.removeEventListener('pointerdown', mUnlockAudio);
    }
}

// One two-tone siren cycle (~1.2 s)
function mSirenCycle() {
    const ctx = alarm.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    [0, 0.3, 0.6, 0.9].forEach((dt, i) => osc.frequency.setValueAtTime(i % 2 ? 700 : 960, t + dt));
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.16, t + 0.03);
    gain.gain.setValueAtTime(0.16, t + 1.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1.25);
}

async function mAlarmStart(alert) {
    if (!IS_M) return;
    mAlarmStop(false);
    const prefs = alarmPrefs();
    if (alert && !alert.test) mReloadLog();   // the service worker has recorded it
    if (prefs.sound) {
        mUnlockAudio();
        mSirenCycle();
        alarm.siren = setInterval(mSirenCycle, 1500);
    }
    if (prefs.vibrate && navigator.vibrate) {
        const buzz = () => navigator.vibrate([700, 300, 700, 300, 700]);
        buzz();
        alarm.buzz = setInterval(buzz, 3200);
    }
    try {
        if ('wakeLock' in navigator) alarm.lock = await navigator.wakeLock.request('screen');
    } catch (e) { /* not allowed right now */ }
    const bar = document.querySelector('meta[name="theme-color"]');
    if (bar) bar.content = '#b91c1c';
}

function mAlarmStop(acknowledged = true) {
    clearInterval(alarm.siren);
    clearInterval(alarm.buzz);
    alarm.siren = alarm.buzz = null;
    if (navigator.vibrate) navigator.vibrate(0);
    if (alarm.lock) {
        alarm.lock.release().catch(() => {});
        alarm.lock = null;
    }
    if (acknowledged) {
        applyTheme(document.documentElement.getAttribute('data-theme'), false);   // restores the status bar colour
        mReadLog().then(log => mWriteLog(log.map(item => ({ ...item, ack: true })))).then(mRefresh);
    }
}

if (IS_M) document.addEventListener('DOMContentLoaded', mInit);
