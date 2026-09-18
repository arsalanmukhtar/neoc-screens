// POST   /api/push-subscribe { stationId, subscription, label }  → this PC receives the station's alerts
// DELETE /api/push-subscribe { stationId, endpoint }              → stop

import { redis, pushReady, isStationId, stationKey, clean, MAX_PCS_PER_STATION } from './_push.js';

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (!pushReady) return res.status(503).json({ error: 'Push alerts are not configured on the server' });

    const body = req.body || {};
    if (!isStationId(body.stationId)) return res.status(400).json({ error: 'Unknown station' });
    const key = stationKey(body.stationId);

    try {
        if (req.method === 'POST') {
            const sub = body.subscription || {};
            const valid = typeof sub.endpoint === 'string' && sub.endpoint.startsWith('https://')
                && sub.keys && typeof sub.keys.p256dh === 'string' && typeof sub.keys.auth === 'string';
            if (!valid) return res.status(400).json({ error: 'Invalid subscription' });

            const known = await redis.hexists(key, sub.endpoint);
            if (!known && (await redis.hlen(key)) >= MAX_PCS_PER_STATION) {
                return res.status(409).json({ error: `A station can have at most ${MAX_PCS_PER_STATION} PCs` });
            }
            const record = {
                subscription: { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
                label: clean(body.label, 80),
                at: new Date().toISOString(),
            };
            await redis.hset(key, { [sub.endpoint]: JSON.stringify(record) });
            return res.status(200).json({ ok: true });
        }

        if (req.method === 'DELETE') {
            if (typeof body.endpoint !== 'string') return res.status(400).json({ error: 'Missing endpoint' });
            await redis.hdel(key, body.endpoint);
            return res.status(200).json({ ok: true });
        }

        res.setHeader('Allow', 'POST, DELETE');
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('[push-subscribe]', err);
        return res.status(500).json({ error: 'Storage error' });
    }
}
