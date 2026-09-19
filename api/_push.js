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

// Device count per station and kind, kept in one hash so /api/push-status is a single read
export const COUNTS_KEY = 'push:counts';
export const COUNTS_READY_KEY = 'push:counts:v2';   // set once the tally has been built with kinds

// Fields per station: "<id>|desktop" and "<id>|mobile" = how many PCs / phones get its alerts
export async function syncCounts(ids) {
    const list = [...new Set(ids)].filter(Boolean);
    if (!list.length) return;
    const pipe = redis.pipeline();
    list.forEach(id => pipe.hgetall(stationKey(id)));
    const all = await pipe.exec();
    const set = {};
    const gone = [];
    list.forEach((id, i) => {
        const counts = { desktop: 0, mobile: 0 };
        Object.values(all[i] || {}).forEach(value => { counts[deviceKind(parseRecord(value))]++; });
        KINDS.forEach(kind => {
            if (counts[kind]) set[`${id}|${kind}`] = counts[kind];
            else gone.push(`${id}|${kind}`);
        });
        gone.push(id);   // older total-only field
    });
    if (Object.keys(set).length) await redis.hset(COUNTS_KEY, set);
    if (gone.length) await redis.hdel(COUNTS_KEY, ...gone);
}

// Alerts can only be sent Monday–Friday, 8:30 AM – 4:30 PM Pakistan time (UTC+5, no daylight saving)
export const OFFICE_HOURS_TEXT = 'Mon–Fri, 8:30 AM – 4:30 PM';
// TEMPORARILY OFF for testing: set to true to allow alerts only in office hours again
// (also in js/app.js)
export const OFFICE_HOURS_ON = false;
export function inOfficeHours(now = new Date()) {
    if (!OFFICE_HOURS_ON) return true;
    const pk = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    const day = pk.getUTCDay();                                  // 0 Sunday … 6 Saturday
    const minutes = pk.getUTCHours() * 60 + pk.getUTCMinutes();
    return day >= 1 && day <= 5 && minutes >= 8 * 60 + 30 && minutes < 16 * 60 + 30;
}

// PCs and phones are alerted separately
export const KINDS = ['desktop', 'mobile'];

// Devices registered before kinds existed: tell them apart by their label (the browser's platform)
export function deviceKind(record) {
    if (!record) return 'desktop';
    if (KINDS.includes(record.kind)) return record.kind;
    return /iphone|ipad|ipod|android|arm|aarch/i.test(record.label || '') ? 'mobile' : 'desktop';
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
