// GET /api/push-status → { enabled, stations: { "GCOP": 2, … }, kinds: { "GCOP": { desktop: 1, mobile: 1 }, … }, total }
// How many devices receive each station's alerts (counts only, no device details).
// Reads the running tally in push:counts (one command); builds it once from the station lists if missing.

import { redis, pushReady, STATION_IDS, COUNTS_KEY, COUNTS_READY_KEY, syncCounts } from './_push.js';

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (!pushReady) return res.status(200).json({ enabled: false, stations: {}, kinds: {}, total: 0 });
    try {
        if (!(await redis.exists(COUNTS_READY_KEY))) {
            await syncCounts(STATION_IDS);
            await redis.set(COUNTS_READY_KEY, 1);
        }
        const raw = (await redis.hgetall(COUNTS_KEY)) || {};
        const stations = {};
        const kinds = {};
        STATION_IDS.forEach(id => {
            const desktop = Number(raw[`${id}|desktop`]) || 0;
            const mobile = Number(raw[`${id}|mobile`]) || 0;
            if (desktop + mobile > 0) {
                stations[id] = desktop + mobile;
                kinds[id] = { desktop, mobile };
            }
        });
        const total = Object.values(stations).reduce((a, b) => a + b, 0);
        return res.status(200).json({ enabled: true, stations, kinds, total });
    } catch (err) {
        console.error('[push-status]', err);
        return res.status(500).json({ error: 'Storage error' });
    }
}
