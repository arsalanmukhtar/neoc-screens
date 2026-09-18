// GET /api/push-config → { enabled, publicKey }
// Tells the dashboard whether push alerts are set up, and which key to subscribe with.

import { pushReady, publicKey } from './_push.js';

export default function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ enabled: pushReady, publicKey });
}
