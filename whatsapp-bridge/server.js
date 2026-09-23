// NEOC WhatsApp bridge
//
// Runs on the always-on VM, keeps one WhatsApp account linked (whatsapp-web.js drives a real
// WhatsApp Web session in Chromium) and sends the station alerts the dashboard asks for.
//
// The dashboard never sees a phone number: it asks for "an alert for G-7" and this service
// looks the number up in numbers.json, which stays on the VM.
//
//   POST /send    { stationId, alertId, text }   Bearer BRIDGE_TOKEN   → { ok, sent }
//   GET  /status                                 Bearer BRIDGE_TOKEN   → { ready, state, stations }
//   GET  /qr                                     Bearer BRIDGE_TOKEN   → the pairing QR as a PNG
//   GET  /health                                 (open) → { ok } so nginx/monitoring can check it
//
// A recipient can answer the alert with "ACK": the reply is recorded against that alert on the
// dashboard (api/alert-log), the same permanent record as the Acknowledge button in the app.

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import qrTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import pkg from 'whatsapp-web.js';

const { Client, LocalAuth } = pkg;

const PORT = Number(process.env.PORT || 47850);
const TOKEN = process.env.BRIDGE_TOKEN || '';
const DASHBOARD = (process.env.DASHBOARD_URL || 'https://neoc-screens.vercel.app').replace(/\/+$/, '');
const DATA_DIR = process.env.DATA_DIR || '/data';
const NUMBERS_FILE = process.env.NUMBERS_FILE || '/app/numbers.json';
const LAST_ALERT_FILE = path.join(DATA_DIR, 'last-alert.json');
const ACK_WINDOW_MS = 24 * 60 * 60 * 1000;    // an "ACK" answers the alert of the last 24 hours

if (!TOKEN) {
    console.error('[bridge] BRIDGE_TOKEN is not set — refusing to start');
    process.exit(1);
}

const log = (...args) => console.log(new Date().toISOString(), ...args);

// ─── Numbers: read from the file each time, so edits need no restart ─────────
async function stationNumber(stationId) {
    try {
        const raw = JSON.parse(await fs.readFile(NUMBERS_FILE, 'utf8'));
        const value = String(raw[stationId] || '').replace(/[^0-9]/g, '');
        return value || null;
    } catch (err) {
        log('[bridge] numbers.json', err.message);
        return null;
    }
}

// ─── Which alert each number was last sent, so a reply can acknowledge it ────
let lastAlert = {};

async function loadLastAlert() {
    try {
        lastAlert = JSON.parse(await fs.readFile(LAST_ALERT_FILE, 'utf8'));
    } catch (err) {
        lastAlert = {};
    }
}

async function rememberAlert(number, alertId, stationId) {
    lastAlert[number] = { alertId, stationId, at: Date.now() };
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(LAST_ALERT_FILE, JSON.stringify(lastAlert));
    } catch (err) {
        log('[bridge] could not save last-alert.json:', err.message);
    }
}

// ─── WhatsApp client ─────────────────────────────────────────────────────────
let ready = false;
let lastQr = null;

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(DATA_DIR, 'session') }),
    puppeteer: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    },
});

client.on('qr', qr => {
    lastQr = qr;
    log('[bridge] scan this QR with the sender phone (WhatsApp → Linked devices → Link a device):');
    qrTerminal.generate(qr, { small: true });
});

client.on('authenticated', () => log('[bridge] authenticated'));
client.on('ready', () => {
    ready = true;
    lastQr = null;
    log('[bridge] ready — the account is linked and alerts can be sent');
});
client.on('auth_failure', msg => {
    ready = false;
    log('[bridge] authentication failed:', msg);
});
client.on('disconnected', async reason => {
    ready = false;
    log('[bridge] disconnected:', reason, '— reconnecting');
    try {
        await client.initialize();
    } catch (err) {
        log('[bridge] reconnect failed:', err.message);
    }
});

// A reply of "ACK" (or "ACKNOWLEDGE", "OK") answers the alert this number last received
client.on('message', async msg => {
    try {
        if (!msg.from.endsWith('@c.us')) return;            // ignore groups and status updates
        const body = String(msg.body || '').trim();
        if (!/^(ack|acknowledge|ok|received)\b/i.test(body)) return;

        const number = msg.from.replace('@c.us', '');
        const entry = lastAlert[number];
        if (!entry || Date.now() - entry.at > ACK_WINDOW_MS) {
            await msg.reply('No recent alert to acknowledge.');
            return;
        }
        const recorded = await recordAck(entry.alertId, number);
        await msg.reply(recorded
            ? `Acknowledged. ${entry.stationId} alert recorded in your name.`
            : 'Could not record the acknowledgement. Please try again.');
    } catch (err) {
        log('[bridge] incoming message:', err.message);
    }
});

async function recordAck(alertId, number) {
    try {
        const res = await fetch(`${DASHBOARD}/api/alert-log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alertId, by: `WhatsApp · ${maskNumber(number)}` }),
        });
        if (!res.ok) {
            log('[bridge] ack rejected', res.status);
            return false;
        }
        const data = await res.json();
        log('[bridge] ack recorded', alertId, data.already ? '(already acknowledged)' : '');
        return true;
    } catch (err) {
        log('[bridge] ack failed:', err.message);
        return false;
    }
}

// Numbers are never logged or returned in full
const maskNumber = number => `…${String(number).slice(-4)}`;

// ─── HTTP API for the dashboard ──────────────────────────────────────────────
const json = (res, code, body) => {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(body));
};

const authorised = req => req.headers.authorization === `Bearer ${TOKEN}`;

function readBody(req, limit = 8192) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
            if (body.length > limit) {
                reject(new Error('body too large'));
                req.destroy();
            }
        });
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://bridge');
    const route = url.pathname.replace(/\/+$/, '') || '/';

    if (route === '/health') return json(res, 200, { ok: true, ready });

    if (!authorised(req)) return json(res, 401, { error: 'Unauthorised' });

    if (route === '/status') {
        let state = 'starting';
        try {
            state = ready ? await client.getState() : (lastQr ? 'waiting for the QR to be scanned' : 'connecting');
        } catch (err) {
            state = 'unknown';
        }
        let stations = 0;
        try {
            stations = Object.values(JSON.parse(await fs.readFile(NUMBERS_FILE, 'utf8'))).filter(Boolean).length;
        } catch (err) { /* no file yet */ }
        return json(res, 200, { ready, state, stations });
    }

    if (route === '/qr') {
        if (!lastQr) return json(res, 404, { error: ready ? 'Already linked' : 'No QR yet, try again in a moment' });
        const png = await QRCode.toBuffer(lastQr, { width: 400, margin: 2 });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-store');
        return res.end(png);
    }

    if (route === '/send' && req.method === 'POST') {
        let payload;
        try {
            payload = JSON.parse(await readBody(req) || '{}');
        } catch (err) {
            return json(res, 400, { error: 'Bad request' });
        }
        const stationId = String(payload.stationId || '');
        const text = String(payload.text || '');
        const alertId = String(payload.alertId || '');
        if (!stationId || !text) return json(res, 400, { error: 'stationId and text are required' });
        if (!ready) return json(res, 503, { error: 'WhatsApp is not linked yet' });

        const number = await stationNumber(stationId);
        if (!number) return json(res, 404, { error: `No WhatsApp number set for ${stationId}` });

        try {
            const contact = await client.getNumberId(number);
            if (!contact) return json(res, 404, { error: `${maskNumber(number)} is not on WhatsApp` });
            await client.sendMessage(contact._serialized, text);
            if (alertId) await rememberAlert(number, alertId, stationId);
            log('[bridge] sent', stationId, '→', maskNumber(number));
            return json(res, 200, { ok: true, sent: 1 });
        } catch (err) {
            log('[bridge] send failed:', err.message);
            return json(res, 502, { error: 'WhatsApp refused the message' });
        }
    }

    return json(res, 404, { error: 'Not found' });
});

await loadLastAlert();
server.listen(PORT, () => log(`[bridge] listening on ${PORT}, dashboard ${DASHBOARD}`));
client.initialize().catch(err => log('[bridge] could not start WhatsApp:', err.message));

for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, async () => {
        log('[bridge] stopping');
        server.close();
        try {
            await client.destroy();
        } catch (err) { /* already gone */ }
        process.exit(0);
    });
}
