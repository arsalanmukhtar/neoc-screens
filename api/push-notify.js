// POST /api/push-notify { stationId, pc, portal } → push the alert to every PC registered for the station
// The message text is built here, so callers cannot push arbitrary content.

import { redis, webpush, pushReady, isStationId, stationKey, parseRecord, clean, syncCounts } from './_push.js';

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

    try {
        const rateKey = `push:rate:${stationId}`;
        const count = await redis.incr(rateKey);
        if (count === 1) await redis.expire(rateKey, 60);
        if (count > RATE_LIMIT) return res.status(429).json({ error: 'Too many alerts, try again in a minute' });

        const pc = clean(body.pc, 20) || stationId;
        const portal = clean(body.portal, 60);
        const payload = JSON.stringify({
            title: `NEOC ALERT · ${stationId}`,
            body: `RETURN TO YOUR WORKSTATION (${pc.toUpperCase()})`,
            tag: `neoc-alert-${stationId}`,
            stationId,
            pc,
            portal,
            at: new Date().toISOString(),
        });

        const key = stationKey(stationId);
        const entries = Object.entries((await redis.hgetall(key)) || {});
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
        return res.status(200).json({
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
