// POST /api/push-notify { stationId, pc, portal, target: 'desktop' | 'mobile' }
//   → push the alert to the station's PCs (desktop) or phones (mobile)
// The message text is built here, so callers cannot push arbitrary content.

import { redis, webpush, pushReady, isStationId, stationKey, parseRecord, clean, syncCounts, deviceKind, KINDS, inOfficeHours } from './_push.js';
import { logKey } from './alert-log.js';

const RATE_LIMIT = 10;   // alerts per station per minute

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }
    if (!pushReady) return res.status(503).json({ error: 'Push alerts are not configured on the server' });

    const body = req.body || {};
    const stationId = body.stationId;
    if (!isStationId(stationId)) return res.status(400).json({ error: 'Unknown station' });
    const target = KINDS.includes(body.target) ? body.target : null;   // null: every device (older callers)
    if (!inOfficeHours()) return res.status(403).json({ error: 'No alerts possible out of office hours', offHours: true });

    try {
        const rateKey = `push:rate:${stationId}`;
        const count = await redis.incr(rateKey);
        if (count === 1) await redis.expire(rateKey, 60);
        if (count > RATE_LIMIT) return res.status(429).json({ error: 'Too many alerts, try again in a minute' });

        const pc = clean(body.pc, 20) || stationId;
        const portal = clean(body.portal, 60);
        const at = new Date().toISOString();
        // Identifies this alert everywhere: in the payload, the record below and its acknowledgement
        const id = `${stationId}.${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 6)}`;
        const payload = JSON.stringify({
            id,
            title: `NEOC ALERT · ${stationId}`,
            body: `RETURN TO YOUR WORKSTATION (${pc.toUpperCase()})`,
            tag: `neoc-alert-${stationId}`,
            stationId,
            pc,
            portal,
            at,
        });

        const key = stationKey(stationId);
        const entries = Object.entries((await redis.hgetall(key)) || {})
            .filter(([, value]) => !target || deviceKind(parseRecord(value)) === target);
        const outcomes = await Promise.all(entries.map(async ([endpoint, value]) => {
            const record = parseRecord(value);
            if (!record || !record.subscription) {
                await redis.hdel(key, endpoint);
                return 'expired';
            }
            try {
                await webpush.sendNotification(record.subscription, payload, { TTL: 3600, urgency: 'high' });
                return 'sent';
            } catch (err) {
                // 404 / 410: the browser dropped this subscription — forget it
                if (err.statusCode === 404 || err.statusCode === 410) {
                    await redis.hdel(key, endpoint);
                    return 'expired';
                }
                console.error('[push-notify]', stationId, err.statusCode, err.body || err.message);
                return 'failed';
            }
        }));

        const tally = type => outcomes.filter(o => o === type).length;
        if (tally('expired')) await syncCounts([stationId]);

        // Keep the record (newest first, 50 per station) so acknowledgements can be tracked
        await redis.lpush(logKey(stationId), JSON.stringify({ id, at, pc, portal, target, sent: tally('sent') }));
        await redis.ltrim(logKey(stationId), 0, 49);

        return res.status(200).json({
            id,
            target,
            total: outcomes.length,
            sent: tally('sent'),
            failed: tally('failed'),
            expired: tally('expired'),
        });
    } catch (err) {
        console.error('[push-notify]', err);
        return res.status(500).json({ error: 'Push error' });
    }
}
