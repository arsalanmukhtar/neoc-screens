// ─── Grid Configuration ───────────────────────────────────────────────────────
const GRID_CONFIG = [
    {
        id: 'G1', label: 'G1', rows: 3, cols: 2, colorKey: 'outer',
        stations: [
            { id: 1, pc: 13, user: 'Hajra Qadeer', portal: 'Regional Hazard Watch' },
            { id: 2, pc: 10, user: 'Shehzad Ali', portal: 'Global Planetary Dynamics' },
            { id: 3, pc: 40, user: 'Syeda Saleha Ali', portal: 'Global Satellite Feed' },
            { id: 4, pc: 44, user: 'Abdul Hanan', portal: 'Global Oceanic & Atmospheric Oscillations' },
            { id: 5, pc: 3, user: 'Mudassir Shah', portal: 'Cryosphere Monitoring Platform' },
            { id: 6, pc: 55, user: 'Muhammad Ismail Khan', portal: 'Global Glacier Monitoring Portal' },
        ],
    },
    {
        id: 'G2', label: 'G2', rows: 4, cols: 4, colorKey: 'inner',
        stations: [
            { id: 7, pc: 15, user: 'Jamal Abdul Nasir', portal: 'Global Climate Drivers' },
            { id: 8, pc: 2, user: 'Mudassir Shah', portal: 'Global Met Projections' },
            { id: 9, pc: 53, user: 'Imtiaz Nabi', portal: 'Climate Common Operating Picture' },
            { id: 10, pc: 56, user: 'Qamar Iqbal', portal: 'Global Marine Dynamics' },
            { id: 11, pc: 11, user: 'Talha Rizwan', portal: 'Global Forest Inventory' },
            { id: 12, pc: 38, user: 'Zainab Ali', portal: 'Global Land Use Land Cover' },
            { id: 13, pc: 8, user: 'Osama Khan', portal: 'Global Carbon Atlas' },
            { id: 14, pc: 36, user: 'Sajid Inam', portal: 'Global Wildfire Monitoring' },
            { id: 15, pc: 6, user: 'Zeeshan Nasir', portal: 'Global Hydromet' },
            { id: 16, pc: 35, user: 'Shahfukh Malik', portal: 'Global Terrestrial Water' },
            { id: 17, pc: 12, user: 'Hizbullah Jadoon', portal: 'Global Hydrological Portal' },
            { id: 18, pc: 5, user: 'Abdul Ahad', portal: 'Global DEW Precipitation Outlook 2026' },
            { id: 19, pc: 58, user: 'Junaid Aziz Khan', portal: 'Coastal Risk Screening Tool' },
            { id: 20, pc: 41, user: 'Kashif Iqbal', portal: 'Global Seismic & Tsunami Watch' },
            { id: 21, pc: 39, user: 'Azka Ramzan', portal: 'Global Infrastructure Watch' },
            { id: 22, pc: 34, user: 'Tahira Saeed', portal: 'Global SDG Dashboard' },
        ],
    },
    {
        id: 'COP', label: 'COP', rows: 1, cols: 2, colorKey: 'mid', cellLabels: ['GCOP', 'NCOP'],
        stations: [
            { id: 23, pc: 43, user: 'Syed Mustafa Haider', portal: 'GCOP', desc: 'Global coordination and operations portal for all-hazard management' },
            { id: 24, pc: 42, user: 'Muhammad Arsalan Mukhtar', portal: 'NCOP', desc: 'National coordination and operations portal for domestic response' },
        ],
    },
    {
        id: 'L2', label: 'L2', rows: 4, cols: 4, colorKey: 'inner',
        stations: [
            { id: 25, pc: 21, user: 'Faisal Ahmed', portal: 'National Cryosphere Monitoring Platform', desc: 'Real-time flood monitoring and early warning dissemination' },
            { id: 26, pc: 22, user: 'Nadia Iqbal', portal: 'National GLOF Watch', desc: 'Drought severity indices and seasonal forecast tracking' },
            { id: 27, pc: 23, user: 'Bilal Raza', portal: 'Snow Avalanche Monitoring Platform', desc: 'Urban hazard exposure and vulnerability mapping' },
            { id: 28, pc: 24, user: 'Sana Javed', portal: 'National Landslide Portal', desc: 'Fire weather index, hotspot detection and risk assessment' },
            { id: 29, pc: 25, user: 'Hamza Butt', portal: 'National Hydro Analytics 2026', desc: 'Tropical cyclone, squall line and severe storm tracking' },
            { id: 30, pc: 26, user: 'Maham Tariq', portal: 'National Water Equation', desc: 'Ambient air quality, pollutant levels and health advisories' },
            { id: 31, pc: 27, user: 'Usman Cheema', portal: 'National Coast Watch', desc: 'Landslide susceptibility modelling and event detection' },
            { id: 32, pc: 28, user: 'Ayesha Noor', portal: 'National Seismic & Tsunami Watch', desc: 'River stage, discharge and flood threshold monitoring' },
            { id: 33, pc: 29, user: 'Waseem Ali', portal: 'National Agriculture Watch', desc: 'Reservoir storage levels, inflow and outflow tracking' },
            { id: 34, pc: 30, user: 'Rabia Shah', portal: 'National Drought Monitoring Portal', desc: 'Snow extent, depth and snow-water equivalent analysis' },
            { id: 35, pc: 31, user: 'Asad Mehmood', portal: 'Pakistan Heatwave Portal', desc: 'Precipitation radar composite and short-range nowcasting' },
            { id: 36, pc: 32, user: 'Zara Khalid', portal: 'National Wildfire Monitoring Portal', desc: 'Geospatial data operations, basemap and map service management' },
            { id: 37, pc: 33, user: 'Tariq Mehmood', portal: 'E-MHVRA Portal', desc: 'National disaster event registry, records and reporting' },
            { id: 38, pc: 42, user: 'Hina Baig', portal: 'ARC', desc: 'Active disaster response operations and resource tracking' },
            { id: 39, pc: 43, user: 'Saad Yousuf', portal: 'NEOC AI-Based Early Warning System', desc: 'Rapid damage, loss and needs assessment portal' },
            { id: 40, pc: 45, user: 'Naila Awan', portal: 'Air Quality Monitoring Platform', desc: 'Post-disaster recovery progress and rehabilitation monitoring' },
        ],
    },
    {
        id: 'L1', label: 'L1', rows: 3, cols: 2, colorKey: 'outer',
        stations: [
            { id: 41, pc: 46, user: 'Danish Saeed', portal: 'Accumulated Precipitation', desc: 'Seismic activity monitoring and earthquake early warning system' },
            { id: 42, pc: 47, user: 'Lubna Farooq', portal: 'Sub-Continent Bulk Shear & Anomaly', desc: 'Tsunami detection, propagation modelling and coastal alerts' },
            { id: 43, pc: 48, user: 'Khalid Mahmood', portal: 'Precipitation Outlook 2026', desc: 'Volcanic eruption monitoring and ash dispersion tracking' },
            { id: 44, pc: 49, user: 'Aneela Khan', portal: 'Total Precipitation', desc: 'Extreme heat monitoring, health risk index and advisories' },
            { id: 45, pc: 50, user: 'Rizwan Ul Haq', portal: 'National Hazard Calendar', desc: 'Cold weather event detection, frost warnings and alerts' },
            { id: 46, pc: 51, user: 'Bushra Aslam', portal: 'Temperature Outlook 2026', desc: 'Dust and sand storm detection, forecast and visibility alerts' },
        ],
    },
];

// ─── Fallback portal/user pools (used for grids without static stations) ──────
const PORTALS = [
    { name: 'NDMA Central', num: '001', desc: 'Primary coordination portal' },
    { name: 'Field Ops', num: '002', desc: 'Field operations management' },
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
            const stationIdx = c * rows + r;   // column-major: fill each column top→bottom
            const station = stations ? (stations[stationIdx] || null) : null;
            const idPrefix = gridId[0] === 'L' ? 'N' : gridId[0]; // G, N, or C
            const portal = station
                ? { name: station.portal, num: `${idPrefix}-${station.id}`, desc: station.desc || station.portal }
                : PORTALS[(idx - 1) % PORTALS.length];
            const user = station ? station.user : USERS[(idx - 1) % USERS.length];
            const lastOctet = ((gridId.charCodeAt(0) * 10 + idx) % 253) + 1;
            const pcNumber = cellLabels
                ? cellLabels[stationIdx]
                : station
                    ? `PC-${station.pc}`
                    : `PC-${gridId}-${String(idx).padStart(2, '0')}`;

            cells.push({
                id: `${gridId}-${String(idx).padStart(2, '0')}`,
                stationId: station && station.id != null ? station.id : null,
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
const DATA_VERSION = '7';

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
