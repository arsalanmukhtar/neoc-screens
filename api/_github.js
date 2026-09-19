// Edits js/data.js in the GitHub repo, so a change made on the dashboard lands in the main file
// and Vercel redeploys it for everyone (about a minute).
//
// Environment variables:
//   GITHUB_TOKEN    fine-grained token with "Contents: Read and write" on this repository
//   GITHUB_REPO     optional, defaults to arsalanmukhtar/neoc-screens
//   GITHUB_BRANCH   optional, defaults to main

const TOKEN = process.env.GITHUB_TOKEN || '';
const REPO = process.env.GITHUB_REPO || 'arsalanmukhtar/neoc-screens';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const DATA_FILE = 'js/data.js';

export const githubReady = Boolean(TOKEN);

async function github(path, options = {}) {
    const res = await fetch(`https://api.github.com/repos/${REPO}/${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${TOKEN}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'neoc-dashboard',
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data.message || `GitHub ${res.status}`);
        err.status = res.status;
        throw err;
    }
    return data;
}

// Which subgrid blocks in data.js can hold a wall number, and the station id inside them
function locate(stationId) {
    if (stationId === 'GCOP') return { grids: ['COP'], n: 1 };
    if (stationId === 'NCOP') return { grids: ['COP'], n: 2 };
    const m = /^([GN])-(\d+)$/.exec(stationId);
    if (!m) throw new Error(`Unknown station ${stationId}`);
    return { grids: m[1] === 'G' ? ['G1', 'G2'] : ['N2', 'N1'], n: Number(m[2]) };
}

// Rewrites one station's `ip: '…'` in the data.js source text
export function setStationIp(src, stationId, ip) {
    const { grids, n } = locate(stationId);
    const line = new RegExp(`(\\{ id: ${n}, [^\\n]*?\\bip: ')([^'\\n]*)(')`);
    for (const grid of grids) {
        const start = src.indexOf(`id: '${grid}'`);
        if (start < 0) continue;
        const end = src.indexOf('\n        ],', start);
        const block = src.slice(start, end < 0 ? undefined : end);
        if (!line.test(block)) continue;
        return src.slice(0, start) + block.replace(line, `$1${ip}$3`) + (end < 0 ? '' : src.slice(end));
    }
    throw new Error(`Station ${stationId} not found in ${DATA_FILE}`);
}

// Commits the new IP; retries once if data.js changed in between
export async function commitStationIp(stationId, ip) {
    for (let attempt = 0; ; attempt++) {
        const file = await github(`contents/${DATA_FILE}?ref=${encodeURIComponent(BRANCH)}`);
        const src = Buffer.from(file.content, 'base64').toString('utf8');
        const next = setStationIp(src, stationId, ip);
        if (next === src) return { changed: false };
        try {
            const result = await github(`contents/${DATA_FILE}`, {
                method: 'PUT',
                body: JSON.stringify({
                    message: `Update ${stationId} IP to 172.18.${ip} (from the dashboard)`,
                    content: Buffer.from(next, 'utf8').toString('base64'),
                    sha: file.sha,
                    branch: BRANCH,
                }),
            });
            return { changed: true, commit: (result.commit && result.commit.sha || '').slice(0, 7) };
        } catch (err) {
            if (attempt === 0 && (err.status === 409 || err.status === 422)) continue;
            throw err;
        }
    }
}
