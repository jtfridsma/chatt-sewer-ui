import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

test('readable consumption values survive chart loading failure', async () => {
    const { outputFiles } = await build({
        stdin: {
            contents: `export { createDashboardView } from './src/scripts/modern/components/dashboard-view.js';
                export { mountConsumptionCharts } from './src/scripts/modern/components/lazy-consumption-chart.js';`,
            resolveDir: process.cwd(),
        },
        bundle: true,
        write: false,
        format: 'iife',
        globalName: 'dashboard',
    });
    const dom = new JSDOM('<div id="host"></div>', {
        url: 'https://example.com/',
        runScripts: 'outside-only',
        pretendToBeVisual: true,
    });
    try {
        dom.window.eval(outputFiles[0].text);
        const host = dom.window.document.getElementById('host');
        const view = dom.window.dashboard.createDashboardView({ host, actions: {} });
        view.render({
            accounts: [{ accountNumber: '123' }],
            waterMeters: [
                {
                    meterNumber: 'Meter 123',
                    readings: [
                        { date: '2026-08-01', consumption: 1250 },
                        { date: '2026-07-01', consumption: 0 },
                    ],
                },
            ],
            flags: { showWaterConsumptionGraph: true },
        });
        const root = host.shadowRoot;
        await assert.rejects(dom.window.dashboard.mountConsumptionCharts(root), /unavailable/);
        const table = root.querySelector('.chart__readings table');
        assert.match(table.querySelector('caption').textContent, /Meter 123/);
        assert.deepEqual(
            [...table.querySelectorAll('thead th[scope="col"]')].map((cell) => cell.textContent),
            ['Read Date', 'Consumption']
        );
        const chartData = JSON.parse(
            decodeURIComponent(root.querySelector('canvas').dataset.readings)
        );
        assert.deepEqual(
            [...table.querySelectorAll('tbody th[scope="row"]')].map((cell) => cell.textContent),
            chartData.map((reading) => reading.label)
        );
        assert.deepEqual(
            [...table.querySelectorAll('tbody td')].map((cell) => cell.textContent),
            ['0', '1,250']
        );
        assert.equal(
            table.closest('details').querySelector('summary span:not(.icon)').textContent,
            'View Readings Table'
        );
        view.destroy();
    } finally {
        dom.window.close();
    }
});
