// GET /api/push-status → { enabled, stations: { "GCOP": 1, … }, total }
// How many PCs receive each station's alerts (counts only, no PC details).

import { redis, pushReady, STATION_IDS, stationKey } from './_push.js';

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (!pushReady) return res.status(200).json({ enabled: false, stations: {}, total: 0 });
    try {
        const pipe = redis.pipeline();
        STATION_IDS.forEach(id => pipe.hlen(stationKey(id)));
        const counts = await pipe.exec();
        const stations = {};
        STATION_IDS.forEach((id, i) => { if (Number(counts[i]) > 0) stations[id] = Number(counts[i]); });
        const total = Object.values(stations).reduce((a, b) => a + b, 0);
        return res.status(200).json({ enabled: true, stations, total });
    } catch (err) {
        console.error('[push-status]', err);
        return res.status(500).json({ error: 'Storage error' });
    }
}
