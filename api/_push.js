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

// Wall portal numbers: G-1…G-22, N-1…N-22, GCOP, NCOP
export const isStationId = id => /^(?:[GN]-\d{1,2}|GCOP|NCOP)$/.test(String(id || ''));

// One Redis hash per station: field = subscription endpoint, value = { subscription, label, at }
export const stationKey = id => `push:station:${id}`;

export const MAX_PCS_PER_STATION = 10;

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
