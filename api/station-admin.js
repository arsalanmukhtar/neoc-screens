// Admin-only station edits (Authorization: Bearer <token> from /api/auth).
//
// GET  /api/station-admin → { passwords: { 'G-7': '…', … } }
// POST /api/station-admin { stationId, field: 'ip', value: '172.18.1.112' } → commits js/data.js on GitHub
// POST /api/station-admin { stationId, field: 'password', value: '…' }   → saved in Redis
//
// System passwords are kept in Redis, not in data.js: the repository and the site are public.

import { userFromRequest } from './_auth.js';
import { redis, isStationId } from './_push.js';
import { githubReady, commitStationIp } from './_github.js';

const PASSWORDS_KEY = 'station:passwords';   // hash: station id → { value, at }

// Accepts 172.18.a.b or a.b; returns 'a.b' (data.js keeps the last two parts)
function parseIp(value) {
    const text = String(value || '').trim();
    const m = /^(?:172\.18\.)?(\d{1,3})\.(\d{1,3})$/.exec(text);
    if (!m || Number(m[1]) > 255 || Number(m[2]) > 255) return null;
    return `${Number(m[1])}.${Number(m[2])}`;
}

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    const user = userFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Sign in as admin first' });

    if (req.method === 'GET') {
        if (!redis) return res.status(200).json({ passwords: {} });
        const raw = (await redis.hgetall(PASSWORDS_KEY)) || {};
        const passwords = {};
        for (const [id, record] of Object.entries(raw)) {
            const value = record && typeof record === 'object' ? record.value : record;
            if (value != null) passwords[id] = String(value);
        }
        return res.status(200).json({ passwords });
    }
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'GET, POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { stationId, field, value } = req.body || {};
    if (!isStationId(stationId)) return res.status(400).json({ error: 'Unknown station' });

    if (field === 'password') {
        if (!redis) return res.status(503).json({ error: 'Storage (Upstash Redis) is not set up on the server' });
        const password = String(value ?? '');
        if (password.length > 128) return res.status(400).json({ error: 'Password is too long (128 characters max)' });
        if (password) await redis.hset(PASSWORDS_KEY, { [stationId]: { value: password, at: new Date().toISOString() } });
        else await redis.hdel(PASSWORDS_KEY, stationId);
        return res.status(200).json({ ok: true, password });
    }

    if (field === 'ip') {
        const ip = parseIp(value);
        if (!ip) return res.status(400).json({ error: 'Enter an address like 172.18.1.112' });
        if (!githubReady) return res.status(503).json({ error: 'IP editing is not set up on the server yet (GITHUB_TOKEN)' });
        try {
            const result = await commitStationIp(stationId, ip);
            return res.status(200).json({ ok: true, ip, ...result });
        } catch (err) {
            console.error('[station-admin] GitHub', err);
            return res.status(502).json({ error: 'The IP could not be updated. Try again' });
        }
    }

    return res.status(400).json({ error: 'Unknown field' });
}
