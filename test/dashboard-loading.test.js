import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { MODERN_BRIDGE_EVENTS as EVENTS } from '../src/scripts/modern/bridge/events.js';

test('empty statements finish loading on completion or timer expiry without a bridge update', async () => {
    const { outputFiles } = await build({
        stdin: {
            contents: `import { setupModernDashboardIntegration } from './src/scripts/modern/dashboard.js';
                setupModernDashboardIntegration({ isChattWebShare: true, pageType: 'dashboard' });`,
            resolveDir: process.cwd(),
        },
        bundle: true,
        write: false,
        format: 'iife',
    });
    const dom = new JSDOM('<html data-csui-enabled="true"><body></body></html>', {
        url: 'https://example.com/',
        runScripts: 'outside-only',
        pretendToBeVisual: true,
    });
    const { window } = dom;
    let now = 1000;
    window.Date.now = () => now;
    const timers = new Map();
    let nextId = 0;
    window.setTimeout = (fn, delay) => {
        timers.set(++nextId, { fn, delay });
        return nextId;
    };
    window.clearTimeout = (id) => timers.delete(id);
    const account = { accountKey: 'inactive', accountNumber: 'inactive', pastInactive: true };
    const publish = (loaded) =>
        window.dispatchEvent(
            new window.CustomEvent(EVENTS.state, {
                detail: {
                    ok: true,
                    accounts: [account],
                    selectedAccount: account,
                    statements: [],
                    flags: {
                        statementsLoaded: loaded,
                        statementsPending: false,
                        showWaterConsumptionGraph: false,
                    },
                },
            })
        );
    try {
        window.eval(outputFiles[0].text);
        publish(false);
        const root = window.document.getElementById('csui-modern-dashboard').shadowRoot;
        root.getElementById('csui-modern-tab-statements').click();
        assert.match(root.textContent, /Loading statement history/);
        now += 6600;
        [...timers.values()].find(({ delay }) => delay === 6550).fn();
        assert.match(root.textContent, /No statements are available/);

        account.accountKey = 'another-inactive';
        publish(false);
        assert.match(root.textContent, /Loading statement history/);
        publish(true);
        assert.match(root.textContent, /No statements are available/);
        assert.doesNotMatch(root.textContent, /Loading statement history/);
    } finally {
        window.close();
    }
});
