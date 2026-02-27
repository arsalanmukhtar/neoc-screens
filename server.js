require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Storage backend selection ────────────────────────────────────────────────
// Production (Railway/Render): set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
// Local dev: falls back to data/grid-data.json automatically

const USE_REDIS = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const REDIS_KEY = 'neoc_grid_data';

let redis = null;
if (USE_REDIS) {
    const { Redis } = require('@upstash/redis');
    redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log('Storage: Upstash Redis');
} else {
    console.log('Storage: local file (data/grid-data.json)');
}

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'grid-data.json');

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function readData() {
    if (USE_REDIS) {
        return await redis.get(REDIS_KEY); // returns parsed object or null
    }
    if (!fs.existsSync(DATA_FILE)) return null;
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        return null;
    }
}

async function writeData(data) {
    if (USE_REDIS) {
        await redis.set(REDIS_KEY, data); // Upstash serialises objects automatically
        return;
    }
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

// ─── API routes ───────────────────────────────────────────────────────────────
app.get('/api/data', async (req, res) => {
    try {
        res.json(await readData());
    } catch (e) {
        console.error('Read error:', e);
        res.json(null);
    }
});

app.post('/api/save', async (req, res) => {
    try {
        await writeData(req.body);
        res.json({ ok: true });
    } catch (e) {
        console.error('Save error:', e);
        res.status(500).json({ ok: false, error: e.message });
    }
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`NEOC Dashboard running at http://localhost:${PORT}`);
});
