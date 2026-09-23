// POST /api/whatsapp { stationId, pc, portal } → WhatsApp alert for that station
//
// The phone numbers are NOT kept here and never reach the browser: they live on the
// bridge (the always-on VM that runs whatsapp-web.js), which looks up the station's
// number itself. This function only says which station to alert, signs the request
// with a shared secret and records the alert so it can be acknowledged like any other.
//
// Env: WA_BRIDGE_URL   e.g. https://robotswithfeelspy.ndma.gov.pk/neoc-wa
//      WA_BRIDGE_TOKEN shared secret, same value on the bridge

import { redis, pushReady, isStationId, clean, inOfficeHours } from './_push.js';
import { logKey } from './alert-log.js';

const RATE_LIMIT = 10;              // alerts per station per minute
const TIMEOUT_MS = 20000;           // the bridge has to open a chat, so allow a little time

const bridgeUrl = (process.env.WA_BRIDGE_URL || '').replace(/\/+$/, '');
const bridgeToken = process.env.WA_BRIDGE_TOKEN || '';
export const whatsappReady = Boolean(bridgeUrl && bridgeToken);

// The wording of the alert is built here, so callers cannot send arbitrary messages
const alertText = (stationId, pc, portal) => [
    'NEOC ALERT',
    `${stationId}${pc ? ` · ${pc}` : ''}`,
    'RETURN TO YOUR WORKSTATION',
    portal ? `Portal: ${portal}` : '',
    '',
    'Reply ACK to acknowledge this alert.',
].filter(Boolean).join('\n');

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'GET') {
        return res.status(200).json({ enabled: whatsappReady });
    }
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'GET, POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }
    if (!whatsappReady) return res.status(503).json({ error: 'WhatsApp alerts are not set up yet' });

    const body = req.body || {};
    const stationId = body.stationId;
    if (!isStationId(stationId)) return res.status(400).json({ error: 'Unknown station' });
    if (!inOfficeHours()) return res.status(403).json({ error: 'No alerts possible out of office hours', offHours: true });

    try {
        if (pushReady) {
            const rateKey = `wa:rate:${stationId}`;
            const count = await redis.incr(rateKey);
            if (count === 1) await redis.expire(rateKey, 60);
            if (count > RATE_LIMIT) return res.status(429).json({ error: 'Too many alerts, try again in a minute' });
        }

        const pc = clean(body.pc, 20) || stationId;
        const portal = clean(body.portal, 60);
        const at = new Date().toISOString();
        const id = `${stationId}.${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 6)}`;

        const sent = await sendViaBridge({ stationId, alertId: id, text: alertText(stationId, pc, portal) });
        if (sent.error) return res.status(sent.status || 502).json({ error: sent.error });

        if (pushReady) {
            await redis.lpush(logKey(stationId), JSON.stringify({ id, at, pc, portal, target: 'whatsapp', sent: sent.sent }));
            await redis.ltrim(logKey(stationId), 0, 49);
        }
        return res.status(200).json({ id, target: 'whatsapp', sent: sent.sent, total: sent.sent });
    } catch (err) {
        console.error('[whatsapp]', err);
        return res.status(500).json({ error: 'WhatsApp error' });
    }
}

async function sendViaBridge(payload) {
    const control = new AbortController();
    const timer = setTimeout(() => control.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(`${bridgeUrl}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bridgeToken}` },
            body: JSON.stringify(payload),
            signal: control.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            console.warn('[whatsapp] bridge', res.status, data);
            // 404 from the bridge means the station has no number yet
            return { error: data.error || `bridge error ${res.status}`, status: res.status === 404 ? 404 : 502 };
        }
        return { sent: Number(data.sent) || 0 };
    } catch (err) {
        console.warn('[whatsapp] bridge', err.name, err.message);
        return { error: err.name === 'AbortError' ? 'WhatsApp bridge did not answer' : 'WhatsApp bridge is unreachable' };
    } finally {
        clearTimeout(timer);
    }
}
