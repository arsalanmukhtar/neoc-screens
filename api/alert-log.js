// Alert record: what was sent, and who acknowledged it.
//
// GET  /api/alert-log?station=G-7&limit=30 → { alerts: [ { id, at, pc, target, ack } ] }
// POST /api/alert-log { alertId, by, note } → records the acknowledgement (note optional)
//
// An acknowledgement is written once and never changed: the first one wins, so the record
// of who answered an alert, and when, can be trusted. Alerts are kept per station
// (list alert:log:<station>, newest first, 50 max); acknowledgements live in the hash alert:ack.

import { redis, pushReady, isStationId, clean } from './_push.js';

const LOG_MAX = 50;
export const logKey = id => `alert:log:${id}`;
export const ACK_KEY = 'alert:ack';

// The comment is free text, so only control characters go; the app escapes it when it is shown
const cleanNote = value => String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);

const parse = value => {
    if (!value) return null;
    try {
        return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (e) {
        return null;
    }
};

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (!pushReady) return res.status(200).json({ alerts: [] });

    try {
        if (req.method === 'GET') {
            const station = String(req.query.station || '');
            if (!isStationId(station)) return res.status(400).json({ error: 'Unknown station' });
            const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), LOG_MAX);
            const rows = (await redis.lrange(logKey(station), 0, limit - 1)) || [];
            const alerts = rows.map(parse).filter(Boolean);
            const acks = (await redis.hgetall(ACK_KEY)) || {};
            return res.status(200).json({
                alerts: alerts.map(alert => ({ ...alert, ack: parse(acks[alert.id]) || null })),
            });
        }

        if (req.method === 'POST') {
            const { alertId } = req.body || {};
            if (typeof alertId !== 'string' || !/^[A-Za-z0-9|.-]{6,80}$/.test(alertId)) {
                return res.status(400).json({ error: 'Unknown alert' });
            }
            const note = cleanNote((req.body || {}).note);
            const ack = { at: new Date().toISOString(), by: clean((req.body || {}).by, 60) || 'Unknown device' };
            if (note) ack.note = note;
            const first = await redis.hsetnx(ACK_KEY, alertId, JSON.stringify(ack));
            const stored = first ? ack : parse(await redis.hget(ACK_KEY, alertId)) || ack;
            return res.status(200).json({ ok: true, alertId, ack: stored, already: !first });
        }

        res.setHeader('Allow', 'GET, POST');
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('[alert-log]', err);
        return res.status(500).json({ error: 'Storage error' });
    }
}
