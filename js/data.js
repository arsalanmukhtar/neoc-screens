// ─── Portal descriptions ──────────────────────────────────────────────────────
// `desc` accepts basic HTML, rendered in the side panel's Description tab:
//   <p> <br> <h4> <strong>/<b> <em>/<i> <u> <s> <mark> <code> <ul>/<ol>/<li> <blockquote> <a href>
// Anything else (scripts, styles, other attributes) is stripped before display.
// SAMPLE_DESC is dummy text — replace it per station with the real description.
const SAMPLE_DESC = `
<p><strong>Lorem ipsum dolor sit amet</strong>, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud <em>exercitation ullamco laboris</em> nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in <u>reprehenderit in voluptate</u> velit esse cillum dolore eu fugiat nulla pariatur.</p>
<h4>Key features</h4>
<ul>
    <li><strong>Live monitoring</strong> — excepteur sint occaecat cupidatat non proident.</li>
    <li><em>Early warnings</em> — sunt in culpa qui officia deserunt mollit anim id est laborum.</li>
    <li><u>Map layers</u> — curabitur pretium tincidunt lacus, nulla gravida orci a odio.</li>
</ul>
<h4>How to use</h4>
<ol>
    <li>Nullam varius, turpis et commodo pharetra, est eros bibendum elit.</li>
    <li>Nec luctus magna felis sollicitudin mauris; integer in mauris eu nibh euismod gravida.</li>
    <li>Duis ac tellus et risus vulputate vehicula, donec lobortis risus a elit.</li>
</ol>
<blockquote>Etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam.</blockquote>
<p>Maecenas fermentum consequat mi. Donec fermentum. Pellentesque malesuada nulla a mi. <s>Duis sapien sem</s>, aliquet nec, commodo eget, consequat quis, neque. Aliquam faucibus, elit ut dictum aliquet, felis nisl adipiscing sapien, sed malesuada diam lacus eget erat.</p>
`;

// ─── Grid Configuration ───────────────────────────────────────────────────────
const GRID_CONFIG = [
    {
        id: 'G1', label: 'G1', rows: 3, cols: 2, colorKey: 'outer',
        stations: [
            { id: 1, pc: 13, user: 'Hajra Qadeer', developer: '', mail: 'hajraqadeer26@gmail.com', ip: '1.113', portal: 'Regional Hazard Watch', category: '', desc: SAMPLE_DESC, portalPort: '5500', portalPath: 'regional-hazard-watch/index.html', serverType: 'vscode', projectDir: 'D:\\Portals\\Regional-Hazard-Watch' },
            { id: 2, pc: 10, user: 'Shehzad Ali', developer: '', mail: 'shehzadalikhan586@gmail.com', ip: '1.123', portal: 'Global Planetary Dynamics', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 3, pc: 40, user: 'Syeda Saleha Ali', developer: '', mail: '', ip: '1.82', portal: 'Global Satellite Feed', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 4, pc: 44, user: 'Abdul Hanan', developer: '', mail: 'abdulhanan.geo@gmail.com', ip: '0.8', portal: 'Global Oceanic & Atmospheric Oscillations', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 5, pc: 3, user: 'Mudassir Shah', developer: '', mail: 'muddassir.ndma25@gmail.com', ip: '1.122', portal: 'Cryosphere Monitoring Platform', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 6, pc: 55, user: 'Muhammad Ismail Khan', developer: '', mail: '', ip: '1.23', portal: 'Global Glacier Monitoring Portal', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
        ],
    },
    {
        id: 'G2', label: 'G2', rows: 4, cols: 4, colorKey: 'inner',
        stations: [
            { id: 7, pc: 15, user: 'Jamal Abdul Nasir', developer: '', mail: '', ip: '1.93', portal: 'Global Climate Drivers', category: '', desc: SAMPLE_DESC, portalPort: '3000', portalPath: '', serverType: 'npm', projectDir: 'D:\\Portals\\Global-Climate-Drivers' },
            { id: 8, pc: 2, user: 'Mudassir Shah', developer: '', mail: 'muddassir.ndma25@gmail.com', ip: '1.189', portal: 'Global Met Projections', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 9, pc: 53, user: 'Imtiaz Nabi', developer: '', mail: '', ip: '1.8', portal: 'Climate Common Operating Picture', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 10, pc: 56, user: 'Qamar Iqbal', developer: '', mail: '', ip: '1.11', portal: 'Global Marine Dynamics', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 11, pc: 11, user: 'Talha Rizwan', developer: '', mail: '', ip: '1.171', portal: 'Global Forest Inventory', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 12, pc: 38, user: 'Zainab Ali', developer: '', mail: '', ip: '1.91', portal: 'Global Land Use Land Cover', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 13, pc: 8, user: 'Osama Khan', developer: '', mail: '', ip: '1.106', portal: 'Global Carbon Atlas', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 14, pc: 36, user: 'Sajid Inam', developer: '', mail: '', ip: '1.51', portal: 'Global Wildfire Monitoring', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 15, pc: 6, user: 'Zeeshan Nasir', developer: '', mail: '', ip: '1.107', portal: 'Global Hydromet', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 16, pc: 35, user: 'Shahrukh Malik', developer: '', mail: '', ip: '1.41', portal: 'Global Terrestrial Water', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 17, pc: 12, user: 'Hizbullah Jadoon', developer: '', mail: '', ip: '1.108', portal: 'Global Hydrological Portal', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 18, pc: 5, user: 'Abdul Ahad', developer: '', mail: '', ip: '1.115', portal: 'Global DEW Precipitation Outlook 2026', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 19, pc: 58, user: 'Junaid Aziz Khan', developer: '', mail: '', ip: '1.13', portal: 'Coastal Risk Screening Tool', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 20, pc: 41, user: 'Kashif Iqbal', developer: '', mail: '', ip: '1.21', portal: 'Global Seismic & Tsunami Watch', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 21, pc: 39, user: 'Azka Ramzan', developer: '', mail: '', ip: '0.28', portal: 'Global Infrastructure Watch', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 22, pc: 34, user: 'Tahira Saeed', developer: '', mail: '', ip: '0.36', portal: 'Global SDG Dashboard', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
        ],
    },
    {
        id: 'COP', label: 'COP', rows: 1, cols: 2, colorKey: 'mid', cellLabels: ['GCOP', 'NCOP'],
        stations: [
            { id: 1, pc: 43, user: 'Syed Mustafa Haider', developer: '', mail: 'mustafa.haider011@gmail.com', ip: '1.4', portal: 'GCOP', category: '', desc: SAMPLE_DESC, portalPort: '8080', portalPath: 'gcop/index.html', serverType: 'browser', projectDir: '' },
            { id: 2, pc: 42, user: 'Muhammad Arsalan Mukhtar', developer: '', mail: 'developer.ndma@gmail.com', ip: '1.5', portal: 'NCOP', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
        ],
    },
    {
        id: 'N2', label: 'N2', rows: 4, cols: 4, colorKey: 'inner',
        stations: [
            { id: 1, pc: 49, user: 'Seemal Naeem', developer: '', mail: '', ip: '1.37', portal: 'National Cryosphere Monitoring Platform', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 2, pc: 45, user: 'Umair Afzal', developer: '', mail: '', ip: '1.26', portal: 'National GLOF Watch', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 3, pc: 50, user: 'Saqib Javed', developer: '', mail: '', ip: '1.55', portal: 'Snow Avalanche Monitoring Platform', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 4, pc: 23, user: 'Yasir Jameel', developer: '', mail: '', ip: '1.105', portal: 'National Landslide Portal', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 5, pc: 18, user: 'Ibrahim Abdullah', developer: '', mail: '', ip: '1.110', portal: 'National Hydro Analytics 2026', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 6, pc: 17, user: 'Ahad Khan', developer: '', mail: '', ip: '1.89', portal: 'National Water Equation', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 7, pc: '2-J', user: 'Ayman Fatima', developer: '', mail: '', ip: '1.139', portal: 'National Seismic & Tsunami Watch', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 8, pc: 46, user: 'Anum Bashir', developer: '', mail: '', ip: '1.18', portal: 'National Coast Watch', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 9, pc: 47, user: 'Maryam Khalid', developer: '', mail: '', ip: '0.70', portal: 'National Agriculture Watch', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 10, pc: 20, user: 'Saba Shahzadi', developer: '', mail: '', ip: '1.92', portal: 'National Drought Monitoring Portal', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 11, pc: 48, user: 'Abdul Sattar', developer: '', mail: '', ip: '1.45', portal: 'Pakistan Heatwave Portal', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 12, pc: 26, user: 'Sheikh Laraib', developer: '', mail: '', ip: '1.131', portal: 'National Wildfire Monitoring Portal', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 13, pc: 57, user: 'Bilavel Raza', developer: '', mail: '', ip: '1.10', portal: 'E-MHVRA Portal', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 14, pc: 25, user: 'Raja Umair', developer: '', mail: '', ip: '1.94', portal: 'NCOP ARC', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 15, pc: 15, user: 'Jamal Abdul Nasir', developer: '', mail: '', ip: '1.104', portal: 'NEOC AI-Based Early Warning System', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 16, pc: 54, user: 'Tanveer Ahmed', developer: '', mail: '', ip: '0.18', portal: 'Air Quality Monitoring Platform', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
        ],
    },
    {
        id: 'N1', label: 'N1', rows: 3, cols: 2, colorKey: 'outer',
        stations: [
            { id: 17, pc: 22, user: 'Sajid Ali', developer: '', mail: '', ip: '1.69', portal: 'Accumulated Precipitation', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 18, pc: 52, user: 'Reserved', developer: '', mail: '', ip: '1.39', portal: 'Sub-Continent Bulk Shear & Anomaly', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 19, pc: 21, user: 'Tayyab Jadoon', developer: '', mail: '', ip: '1.119', portal: 'Precipitation Outlook 2026', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 20, pc: 19, user: 'Waqar Hussain', developer: '', mail: '', ip: '1.83', portal: 'Total Precipitation', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 21, pc: 51, user: 'Nayab Ahmed', developer: '', mail: '', ip: '0.21', portal: 'National Hazard Calendar', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 22, pc: 14, user: 'Ayman Fatima', developer: '', mail: '', ip: '1.168', portal: 'Temperature Outlook 2026', category: '', desc: SAMPLE_DESC, portalPort: '', portalPath: '', serverType: '', projectDir: '' },
        ],
    },
];


// Cells are pushed row by row (the order CSS grid lays them out), but stations
// fill each column top→bottom, so `order` / the cell id follow station order.
function generateCells(gridId, rows, cols, cellLabels, stations) {
    const cells = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const stationIdx = c * rows + r;   // column-major: fill each column top→bottom
            const order = stationIdx + 1;
            const station = stations[stationIdx];
            const idPrefix = gridId[0] === 'N' ? 'N' : gridId[0]; // G, N, or C
            const portal = {
                name: station.portal,
                num: `${idPrefix}-${station.id}`,
                desc: station.desc || station.portal,
            };
            const lastOctet = ((gridId.charCodeAt(0) * 10 + order) % 253) + 1;
            const ipAddress = station.ip
                ? `172.18.${station.ip}`
                : `172.18.${(order % 5) + 1}.${lastOctet}`;
            const pcNumber  = `PC-${station.pc}`;
            const cellLabel = cellLabels ? cellLabels[stationIdx] : null;

            cells.push({
                id: `${gridId}-${String(order).padStart(2, '0')}`,
                order,
                stationId: station.id,
                pcNumber,
                cellLabel,
                user: station.user,
                developer: station.developer || '',
                ipAddress,
                portalName: portal.name,
                category: station.category || '',
                portalNumber: portal.num,
                portalDescription: portal.desc,
                mail: station.mail || '',
                portalPort: station.portalPort || '',
                portalPath: station.portalPath || '',
                serverType: station.serverType || '',
                projectDir: station.projectDir || '',
                row: r,
                col: c,
                archived: station.archived || false,
            });
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
