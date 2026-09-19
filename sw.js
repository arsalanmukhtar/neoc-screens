// ─── Service worker ───────────────────────────────────────────────────────────
// Makes the dashboard installable as a desktop app and shows system notifications.
// Same-origin files are fetched network-first (so edits to data.js show up at once)
// and fall back to the cached copy when offline. Other origins (fonts, EmailJS) pass through.

const CACHE = 'neoc-cd-v7';
const SHELL = [
    './',
    'index.html',
    'css/variables.css',
    'css/main.css',
    'js/data.js',
    'js/developers.js',
    'js/app.js',
    'manifest.webmanifest',
    'icons/icon-192.png',
    'icons/icon-512.png',
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

    event.respondWith(
        fetch(request)
            .then(response => {
                if (response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE).then(cache => cache.put(request, copy));
                }
                return response;
            })
            .catch(() => caches.match(request)
                .then(hit => hit || (request.mode === 'navigate' ? caches.match('index.html') : undefined))
                .then(hit => hit || Response.error()))
    );
});

// Alert pushed from another PC (api/push-notify) → system notification that stays until dismissed
self.addEventListener('push', event => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (e) {
        data = { body: event.data ? event.data.text() : '' };
    }
    const alert = {
        type: 'neoc-alert',
        title: data.title || 'NEOC alert',
        body: data.body || '',
        stationId: data.stationId || '',
        pc: data.pc || '',
        at: data.at || new Date().toISOString(),
    };
    event.waitUntil(Promise.all([
        self.registration.showNotification(alert.title, {
            body: alert.body,
            tag: data.tag || 'neoc-alert',
            renotify: true,
            requireInteraction: true,
            icon: 'icons/icon-192.png',
            badge: 'icons/icon-192.png',
            data: alert,
        }),
        // Open dashboard windows show the pulsing alert in the middle of the screen
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(windows => windows.forEach(w => w.postMessage(alert))),
        // Badge on the installed app's taskbar icon
        self.navigator.setAppBadge ? self.navigator.setAppBadge(1).catch(() => {}) : null,
        // Full-screen alert via the NEOC Alert Helper, if it runs on this PC
        fetch('http://127.0.0.1:47800/alert', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(alert),
        }).catch(() => {}),
    ]));
});

// Clicking a notification brings the dashboard to the front (or opens it) with the alert showing
self.addEventListener('notificationclick', event => {
    event.notification.close();
    const alert = event.notification.data;
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
            const open = windows.find(w => 'focus' in w);
            if (open) {
                if (alert) open.postMessage(alert);
                return open.focus();
            }
            const query = alert && alert.stationId
                ? `?alert=${encodeURIComponent(alert.stationId)}&at=${encodeURIComponent(alert.at)}`
                : '';
            return self.clients.openWindow('./' + query);
        })
    );
});
