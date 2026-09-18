// Shared setup for the push-alert functions (files starting with "_" are not endpoints).
//
// Environment variables (Vercel → Settings → Environment Variables):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY   from `npx web-push generate-vapid-keys`
//   VAPID_SUBJECT                         contact, e.g. mailto:someone@example.com
//   KV_REST_API_URL, KV_REST_API_TOKEN    added automatically by the Upstash for Redis integration
//     (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN also work)

import webpush from 'web-push';
import { Redis } from '@upstash/redis';

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;

export const redis = url && token ? new Redis({ url, token }) : null;
export const pushReady = Boolean(redis && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
export const publicKey = pushReady ? VAPID_PUBLIC_KEY : '';

if (pushReady) {
    webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:admin@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}
export { webpush };

// Wall portal numbers: G-1…G-22, GCOP, NCOP, N-1…N-22
export const STATION_IDS = [
    ...Array.from({ length: 22 }, (_, i) => `G-${i + 1}`),
    'GCOP', 'NCOP',
    ...Array.from({ length: 22 }, (_, i) => `N-${i + 1}`),
];
export const isStationId = id => STATION_IDS.includes(String(id || ''));

// One Redis hash per station: field = subscription endpoint, value = { subscription, label, at }
export const stationKey = id => `push:station:${id}`;

export const MAX_PCS_PER_STATION = 10;

// Device count per station, kept in one hash so /api/push-status is a single read
export const COUNTS_KEY = 'push:counts';

export async function syncCounts(ids) {
    const list = [...new Set(ids)].filter(Boolean);
    if (!list.length) return;
    const pipe = redis.pipeline();
    list.forEach(id => pipe.hlen(stationKey(id)));
    const lens = await pipe.exec();
    const set = {};
    const gone = [];
    list.forEach((id, i) => { const n = Number(lens[i]) || 0; if (n > 0) set[id] = n; else gone.push(id); });
    if (Object.keys(set).length) await redis.hset(COUNTS_KEY, set);
    if (gone.length) await redis.hdel(COUNTS_KEY, ...gone);
}

// A PC receives alerts for ONE station: drop its subscription from every station except `keep`
export async function removeFromStations(endpoint, keep = null) {
    const pipe = redis.pipeline();
    STATION_IDS.filter(id => id !== keep).forEach(id => pipe.hdel(stationKey(id), endpoint));
    const removed = await pipe.exec();
    return STATION_IDS.filter(id => id !== keep).filter((_, i) => Number(removed[i]) > 0);
}

export function parseRecord(value) {
    if (!value) return null;
    try {
        return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
        return null;
    }
}

// Short, plain text only
export const clean = (value, max) => String(value || '').replace(/[^\p{L}\p{N}\s&().,'\/-]/gu, '').trim().slice(0, max);
