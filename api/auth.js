// POST /api/auth { email, password } → { token, user }   (sign in)
// GET  /api/auth  (Authorization: Bearer <token>) → { user }   (check a saved sign-in)

import { authReady, checkCredentials, issueToken, verifyToken, userFromRequest, clientIp } from './_auth.js';
import { redis } from './_push.js';

const MAX_FAILURES = 10;          // wrong passwords per IP address…
const LOCKOUT_SECONDS = 15 * 60;  // …within this window, then sign-in is blocked for it

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (!authReady) return res.status(503).json({ error: 'Sign-in is not set up on the server yet (ADMIN_PASSWORD)' });

    if (req.method === 'GET') {
        const user = userFromRequest(req);
        return user ? res.status(200).json({ user }) : res.status(401).json({ error: 'Not signed in' });
    }
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'GET, POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const failKey = `auth:fail:${clientIp(req)}`;
    if (redis && Number(await redis.get(failKey)) >= MAX_FAILURES) {
        return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes' });
    }

    const { email, password } = req.body || {};
    if (!checkCredentials(email, password)) {
        if (redis) {
            const count = await redis.incr(failKey);
            if (count === 1) await redis.expire(failKey, LOCKOUT_SECONDS);
        }
        return res.status(401).json({ error: 'Wrong email or password' });
    }

    if (redis) await redis.del(failKey);
    const token = issueToken();
    return res.status(200).json({ token, user: verifyToken(token) });
}
