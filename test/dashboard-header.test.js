import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

test('sidebar offset follows header resizing and releases its observer on teardown', async () => {
    const { outputFiles } = await build({
        stdin: {
            contents: `export { createDashboardView } from './src/scripts/modern/components/dashboard-view.js';`,
            resolveDir: process.cwd(),
        },
        bundle: true,
        write: false,
        format: 'iife',
        globalName: 'dashboard',
    });
    const dom = new JSDOM('<div id="host"></div>', { runScripts: 'outside-only' });
    const { window } = dom;
    let resize;
    let observed;
    window.ResizeObserver = class {
        constructor(callback) {
            resize = callback;
        }
        observe(element) {
            observed = element;
        }
        disconnect() {
            observed = null;
        }
    };
    try {
        window.eval(outputFiles[0].text);
        const host = window.document.getElementById('host');
        const view = window.dashboard.createDashboardView({ host, actions: {} });
        view.render({ accounts: [{ accountNumber: '123' }] });
        assert.equal(observed, host.shadowRoot.querySelector('.modern-header'));
        for (const height of [80, 112]) {
            observed.getBoundingClientRect = () => ({ height });
            resize();
            assert.equal(host.style.getPropertyValue('--dashboard-header-height'), `${height}px`);
        }
        view.render({ accounts: [{ accountNumber: '456' }] });
        assert.equal(observed, host.shadowRoot.querySelector('.modern-header'));
        view.destroy();
        assert.equal(observed, null);
        assert.equal(host.style.getPropertyValue('--dashboard-header-height'), '');
    } finally {
        window.close();
    }
});
