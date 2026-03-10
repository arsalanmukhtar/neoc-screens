// ─── Grid Configuration ───────────────────────────────────────────────────────
const GRID_CONFIG = [
    {
        id: 'G1', label: 'G1', rows: 3, cols: 2, colorKey: 'outer',
        stations: [
            { id: 1, pc: 13, user: 'Hajra Qadeer', mail: 'hajraqadeer26@gmail.com', ip: '1.112', portal: 'Regional Hazard Watch', desc: '', portalPort: '5500', portalPath: 'regional-hazard-watch/index.html', serverType: 'vscode', projectDir: 'D:\\Portals\\Regional-Hazard-Watch' },
            { id: 2, pc: 10, user: 'Shehzad Ali', mail: 'shehzadalikhan586@gmail.com', ip: '1.123', portal: 'Global Planetary Dynamics', desc: '', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 3, pc: 40, user: 'Syeda Saleha Ali', mail: '', ip: '1.82', portal: 'Global Satellite Feed', desc: '', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 4, pc: 44, user: 'Abdul Hanan', mail: 'abdulhanan.geo@gmail.com', ip: '0.8', portal: 'Global Oceanic & Atmospheric Oscillations', desc: '', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 5, pc: 3, user: 'Mudassir Shah', mail: 'muddassir.ndma25@gmail.com', ip: '1.122', portal: 'Cryosphere Monitoring Platform', desc: '', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 6, pc: 55, user: 'Muhammad Ismail Khan', mail: '', ip: '1.23', portal: 'Global Glacier Monitoring Portal', desc: '', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
        ],
    },
    {
        id: 'G2', label: 'G2', rows: 4, cols: 4, colorKey: 'inner',
        stations: [
            { id: 7, pc: 15, user: 'Jamal Abdul Nasir', mail: '', ip: '1.93', portal: 'Global Climate Drivers', desc: '', portalPort: '3000', portalPath: '', serverType: 'npm', projectDir: 'D:\\Portals\\Global-Climate-Drivers' },
            { id: 8, pc: 2, user: 'Mudassir Shah', mail: 'muddassir.ndma25@gmail.com', ip: '1.189', portal: 'Global Met Projections', desc: '', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 9, pc: 53, user: 'Imtiaz Nabi', mail: '', ip: '1.8', portal: 'Climate Common Operating Picture', desc: '', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 10, pc: 56, user: 'Qamar Iqbal', mail: '', ip: '1.11', portal: 'Global Marine Dynamics', desc: '', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 11, pc: 11, user: 'Talha Rizwan', mail: '', ip: '1.171', portal: 'Global Forest Inventory', desc: '', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 12, pc: 38, user: 'Zainab Ali', mail: '', ip: '1.91', portal: 'Global Land Use Land Cover', desc: '', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 13, pc: 8, user: 'Osama Khan', mail: '', ip: '1.106', portal: 'Global Carbon Atlas', desc: '', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 14, pc: 36, user: 'Sajid Inam', mail: '', ip: '1.51', portal: 'Global Wildfire Monitoring', desc: '', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 15, pc: 6, user: 'Zeeshan Nasir', mail: '', ip: '1.107', portal: 'Global Hydromet', desc: '', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 16, pc: 35, user: 'Shahrukh Malik', mail: '', ip: '1.41', portal: 'Global Terrestrial Water', desc: '', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 17, pc: 12, user: 'Hizbullah Jadoon', mail: '', ip: '1.108', portal: 'Global Hydrological Portal', desc: '', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 18, pc: 5, user: 'Abdul Ahad', mail: '', ip: '1.115', portal: 'Global DEW Precipitation Outlook 2026', desc: '', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 19, pc: 58, user: 'Junaid Aziz Khan', mail: '', ip: '1.13', portal: 'Coastal Risk Screening Tool', desc: '', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 20, pc: 41, user: 'Kashif Iqbal', mail: '', ip: '1.21', portal: 'Global Seismic & Tsunami Watch', desc: '', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 21, pc: 39, user: 'Azka Ramzan', mail: '', ip: '0.28', portal: 'Global Infrastructure Watch', desc: '', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 22, pc: 34, user: 'Tahira Saeed', mail: '', ip: '0.36', portal: 'Global SDG Dashboard', desc: '', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
        ],
    },
    {
        id: 'COP', label: 'COP', rows: 1, cols: 2, colorKey: 'mid', cellLabels: ['GCOP', 'NCOP'],
        stations: [
            { id: 1, pc: 43, user: 'Syed Mustafa Haider', mail: '', ip: '1.4', portal: 'GCOP', desc: 'Global coordination and operations portal for all-hazard management', portalPort: '8080', portalPath: 'gcop/index.html', serverType: 'browser', projectDir: '' },
            { id: 2, pc: 42, user: 'Muhammad Arsalan Mukhtar', mail: '', ip: '1.5', portal: 'NCOP', desc: 'National coordination and operations portal for domestic response', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
        ],
    },
    {
        id: 'N2', label: 'N2', rows: 4, cols: 4, colorKey: 'inner',
        stations: [
            { id: 1, pc: 49, user: 'Seemal Naeem', mail: '', ip: '1.37', portal: 'National Cryosphere Monitoring Platform', desc: 'Real-time flood monitoring and early warning dissemination', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 2, pc: 45, user: 'Umair Afzal', mail: '', ip: '1.26', portal: 'National GLOF Watch', desc: 'Drought severity indices and seasonal forecast tracking', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 3, pc: 50, user: 'Saqib Javed', mail: '', ip: '1.55', portal: 'Snow Avalanche Monitoring Platform', desc: 'Urban hazard exposure and vulnerability mapping', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 4, pc: 23, user: 'Yasir Jameel', mail: '', ip: '1.105', portal: 'National Landslide Portal', desc: 'Fire weather index, hotspot detection and risk assessment', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 5, pc: 18, user: 'Ibrahim Abdullah', mail: '', ip: '1.110', portal: 'National Hydro Analytics 2026', desc: 'Tropical cyclone, squall line and severe storm tracking', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 6, pc: 17, user: 'Ahad Khan', mail: '', ip: '1.87', portal: 'National Water Equation', desc: 'Ambient air quality, pollutant levels and health advisories', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 7, pc: '2-J', user: 'Ayman Fatima', mail: '', ip: '1.139', portal: 'National Seismic & Tsunami Watch', desc: 'Landslide susceptibility modelling and event detection', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 8, pc: 46, user: 'Anum Bashir', mail: '', ip: '1.18', portal: 'National Coast Watch', desc: 'River stage, discharge and flood threshold monitoring', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 9, pc: 47, user: 'Maryam Khalid', mail: '', ip: '0.70', portal: 'National Agriculture Watch', desc: 'Reservoir storage levels, inflow and outflow tracking', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 10, pc: 20, user: 'Saba Shahzadi', mail: '', ip: '1.92', portal: 'National Drought Monitoring Portal', desc: 'Snow extent, depth and snow-water equivalent analysis', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 11, pc: 48, user: 'Abdul Sattar', mail: '', ip: '1.45', portal: 'Pakistan Heatwave Portal', desc: 'Precipitation radar composite and short-range nowcasting', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 12, pc: 26, user: 'Sheikh Laraib', mail: '', ip: '1.131', portal: 'National Wildfire Monitoring Portal', desc: 'Geospatial data operations, basemap and map service management', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 13, pc: 57, user: 'Bilavel Raza', mail: '', ip: '1.10', portal: 'E-MHVRA Portal', desc: 'National disaster event registry, records and reporting', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 14, pc: 25, user: 'Raja Umair', mail: '', ip: '1.94', portal: 'NCOP ARC', desc: 'Active disaster response operations and resource tracking', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 15, pc: 15, user: 'Jamal Abdul Nasir', mail: '', ip: '1.104', portal: 'NEOC AI-Based Early Warning System', desc: 'Rapid damage, loss and needs assessment portal', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 16, pc: 54, user: 'Tanveer Ahmed', mail: '', ip: '0.18', portal: 'Air Quality Monitoring Platform', desc: 'Post-disaster recovery progress and rehabilitation monitoring', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
        ],
    },
    {
        id: 'N1', label: 'N1', rows: 3, cols: 2, colorKey: 'outer',
        stations: [
            { id: 17, pc: 22, user: 'Sajid Ali', mail: '', ip: '1.69', portal: 'Accumulated Precipitation', desc: 'Seismic activity monitoring and earthquake early warning system', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 18, pc: 52, user: 'Reserved', mail: '', ip: '1.39', portal: 'Sub-Continent Bulk Shear & Anomaly', desc: 'Station reserved for future assignment', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 19, pc: 21, user: 'Tayyab Jadoon', mail: '', ip: '1.119', portal: 'Precipitation Outlook 2026', desc: 'Tsunami detection, propagation modelling and coastal alerts', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 20, pc: 19, user: 'Waqar Hussain', mail: '', ip: '1.83', portal: 'Total Precipitation', desc: 'Volcanic eruption monitoring and ash dispersion tracking', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 21, pc: 51, user: 'Nayab Ahmed', mail: '', ip: '0.21', portal: 'National Hazard Calendar', desc: 'Cold weather event detection, frost warnings and alerts', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
            { id: 22, pc: 14, user: 'Ayman Fatima', mail: '', ip: '1.168', portal: 'Temperature Outlook 2026', desc: 'Dust and sand storm detection, forecast and visibility alerts', portalPort: '', portalPath: '', serverType: '', projectDir: '' },
        ],
    },
];


function generateCells(gridId, rows, cols, cellLabels, stations) {
    const cells = [];
    let idx = 1;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const stationIdx = c * rows + r;   // column-major: fill each column top→bottom
            const station = stations[stationIdx];
            const idPrefix = gridId[0] === 'N' ? 'N' : gridId[0]; // G, N, or C
            const portal = {
                name: station.portal,
                num: `${idPrefix}-${station.id}`,
                desc: station.desc || station.portal,
            };
            const lastOctet = ((gridId.charCodeAt(0) * 10 + idx) % 253) + 1;
            const ipAddress = station.ip
                ? `172.18.${station.ip}`
                : `172.18.${(idx % 5) + 1}.${lastOctet}`;
            const pcNumber  = `PC-${station.pc}`;
            const cellLabel = cellLabels ? cellLabels[stationIdx] : null;

            cells.push({
                id: `${gridId}-${String(idx).padStart(2, '0')}`,
                stationId: station.id,
                pcNumber,
                cellLabel,
                user: station.user,
                ipAddress,
                portalName: portal.name,
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
