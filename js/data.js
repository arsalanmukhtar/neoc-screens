// ─── Grid Configuration ───────────────────────────────────────────────────────
const GRID_CONFIG = [
    {
        id: 'G1', label: 'G1', rows: 3, cols: 2, colorKey: 'outer',
        stations: [
            { pc: 13, user: 'Hajra Qadeer',   portal: 'Regional Hazard' },
            { pc: 10, user: 'Shehzad Ali',     portal: 'Planetary Dynamics' },
            { pc: 40, user: 'Saleha',          portal: 'Satellite Feed' },
            { pc: 44, user: 'Hanan',           portal: 'Oceanic Oscillations' },
            { pc:  3, user: 'Mudassir Shah',   portal: 'Cryosphere Monitoring' },
            { pc: 55, user: 'Ismail',          portal: 'Global Glacier II' },
        ],
    },
    {
        id: 'G2', label: 'G2', rows: 4, cols: 4, colorKey: 'inner',
        stations: [
            { pc: 15, user: 'Jamaal Nasir',     portal: 'Climate Drivers' },
            { pc:  2, user: 'Mudassir Shah',    portal: 'Global Met Projections' },
            { pc: 53, user: 'Imtiaz Nabi',      portal: 'CCOP' },
            { pc: 56, user: 'Qamar',            portal: 'Marine Dynamics' },
            { pc: 11, user: 'Talha Rizwan',     portal: 'Forest Inventory' },
            { pc: 38, user: 'Zainab Ali',       portal: 'Global Land Use' },
            { pc:  8, user: 'Osama Khan',       portal: 'Carbon Atlas' },
            { pc: 36, user: 'Sajid Inam',       portal: 'Wildfire Monitoring' },
            { pc:  6, user: 'Zeeshan Nasir',    portal: 'Global Hydromet' },
            { pc: 35, user: 'Shahfukh Malik',   portal: 'Terrestrial Water' },
            { pc: 12, user: 'Hizbullah Jadoon', portal: 'Hydrological Portal' },
            { pc:  5, user: 'Abdu Ahad',        portal: 'Global Dew' },
            { pc: 58, user: 'Junaid',           portal: 'Coastal Risk Screening' },
            { pc: 41, user: 'Kashif Iqbal',     portal: 'Seismic & Tsunami Watch' },
            { pc: 39, user: 'Azka',             portal: 'Infrastructure Watch' },
            { pc: 34, user: 'Tahra Saeed',      portal: 'SDG Dashboard' },
        ],
    },
    { id: 'COP', label: 'COP', rows: 1, cols: 2, colorKey: 'mid', cellLabels: ['GCOP', 'NCOP'] },
    { id: 'L2',  label: 'L2',  rows: 4, cols: 4, colorKey: 'inner' },
    { id: 'L1',  label: 'L1',  rows: 3, cols: 2, colorKey: 'outer' },
];

// ─── Fallback portal/user pools (used for grids without static stations) ──────
const PORTALS = [
    { name: 'NDMA Central', num: '001', desc: 'Primary coordination portal' },
    { name: 'Field Ops',    num: '002', desc: 'Field operations management' },
    { name: 'Crisis Command', num: '003', desc: 'Emergency response control' },
    { name: 'Logistics Hub', num: '004', desc: 'Supply chain & logistics' },
    { name: 'Comms Gateway', num: '005', desc: 'Communication relay node' },
    { name: 'Recon Monitor', num: '006', desc: 'Reconnaissance & surveillance' },
    { name: 'Medical Center', num: '007', desc: 'Medical response tracking' },
    { name: 'Data Analytics', num: '008', desc: 'Real-time data dashboard' },
];

const USERS = [
    'arsalan', 'tariq.m', 'sadia.k', 'imran.h', 'nadia.r',
    'zubair.a', 'fatima.s', 'omar.y', 'hira.b', 'kamran.j',
];

function generateCells(gridId, rows, cols, cellLabels, stations) {
    const cells = [];
    let idx = 1;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const station  = stations ? stations[idx - 1] : null;
            const portal   = station
                ? { name: station.portal, num: String(idx).padStart(3, '0'), desc: station.portal }
                : PORTALS[(idx - 1) % PORTALS.length];
            const user     = station ? station.user : USERS[(idx - 1) % USERS.length];
            const lastOctet = ((gridId.charCodeAt(0) * 10 + idx) % 253) + 1;
            const pcNumber  = cellLabels
                ? cellLabels[idx - 1]
                : station
                    ? `PC-${station.pc}`
                    : `PC-${gridId}-${String(idx).padStart(2, '0')}`;

            cells.push({
                id: `${gridId}-${String(idx).padStart(2, '0')}`,
                pcNumber,
                user,
                ipAddress: `192.168.${(idx % 5) + 1}.${lastOctet}`,
                portalName: portal.name,
                portalNumber: portal.num,
                portalDescription: portal.desc,
                row: r,
                col: c,
            });
            idx++;
        }
    }
    return cells;
}

// ─── Build initial state ──────────────────────────────────────────────────────
function buildInitialData() {
    const data = {};
    GRID_CONFIG.forEach(({ id, rows, cols, cellLabels, stations }) => {
        data[id] = generateCells(id, rows, cols, cellLabels, stations);
    });
    return data;
}

let GRID_DATA = buildInitialData();

// ─── Persist to localStorage ──────────────────────────────────────────────────
const DATA_VERSION = '3';

function saveData() {
    localStorage.setItem('ndma_grid_data', JSON.stringify(GRID_DATA));
    localStorage.setItem('ndma_version', DATA_VERSION);
}

function loadData() {
    if (localStorage.getItem('ndma_version') !== DATA_VERSION) {
        localStorage.removeItem('ndma_grid_data');
        localStorage.setItem('ndma_version', DATA_VERSION);
        return;
    }
    const saved = localStorage.getItem('ndma_grid_data');
    if (saved) {
        try { GRID_DATA = JSON.parse(saved); } catch (e) { }
    }
}

function updateCell(gridId, cellId, field, value) {
    const cell = GRID_DATA[gridId].find(c => c.id === cellId);
    if (cell) {
        cell[field] = value;
        saveData();
    }
}
