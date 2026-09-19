// Admin sign-in shared by api/auth.js and api/station-admin.js (files starting with "_" are not endpoints).
//
// Environment variables (Vercel → Settings → Environment Variables):
//   ADMIN_EMAIL      the admin account's email (defaults to developer.ndma@gmail.com)
//   ADMIN_PASSWORD   the admin account's password (required; never stored in this public repo)
//   AUTH_SECRET      optional signing key; by default one is derived from ADMIN_PASSWORD,
//                    so changing the password signs every browser out
//
// Tokens don't expire: a browser stays signed in until it signs out or the secret changes.

import crypto from 'node:crypto';

export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'developer.ndma@gmail.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SECRET = process.env.AUTH_SECRET
    || (ADMIN_PASSWORD ? crypto.createHash('sha256').update(`neoc-auth:${ADMIN_PASSWORD}`).digest('hex') : '');

export const authReady = Boolean(ADMIN_PASSWORD && SECRET);

const b64url = buf => Buffer.from(buf).toString('base64url');
const sign = data => crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
const digest = text => crypto.createHash('sha256').update(String(text)).digest();

// Constant-time checks so response timing gives nothing away
export function checkCredentials(email, password) {
    if (!authReady) return false;
    const emailOk = crypto.timingSafeEqual(digest(String(email || '').trim().toLowerCase()), digest(ADMIN_EMAIL));
    const passOk = crypto.timingSafeEqual(digest(password || ''), digest(ADMIN_PASSWORD));
    return emailOk && passOk;
}

export function issueToken() {
    const payload = b64url(JSON.stringify({ sub: ADMIN_EMAIL, role: 'admin', iat: Date.now() }));
    return `${payload}.${sign(payload)}`;
}

// Returns the signed-in user, or null
export function verifyToken(token) {
    if (!authReady || typeof token !== 'string') return null;
    const [payload, mac] = token.split('.');
    if (!payload || !mac) return null;
    const expected = sign(payload);
    if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
    try {
        const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (data.sub !== ADMIN_EMAIL || data.role !== 'admin') return null;
        return { email: data.sub, role: 'Admin', since: data.iat };
    } catch (e) {
        return null;
    }
}

export function userFromRequest(req) {
    const header = req.headers.authorization || '';
    return verifyToken(header.startsWith('Bearer ') ? header.slice(7) : '');
}

export function clientIp(req) {
    return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}
