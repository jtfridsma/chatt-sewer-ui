import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { normalizeAccount } from '../src/scripts/modern/bridge/normalize-data.js';
import { MODERN_BRIDGE_EVENTS as EVENTS } from '../src/scripts/modern/bridge/events.js';

test('shows a nonblocking balance notice only while the balance is unavailable', async () => {
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
    try {
        window.eval(outputFiles[0].text);
        for (const balance of [undefined, 0, 'invalid', 25]) {
            const account = normalizeAccount({
                PTntvfFmtPremTenant: '123',
                PTntvfBalance: balance,
            });
            window.dispatchEvent(
                new window.CustomEvent(EVENTS.state, {
                    detail: {
                        ok: true,
                        accounts: [account],
                        selectedAccount: account,
                        flags: { showWaterConsumptionGraph: false, statementsLoaded: true },
                    },
                })
            );
            const root = window.document.getElementById('csui-modern-dashboard').shadowRoot;
            const amount = root.querySelector('.account-overview__amount');
            const notice = amount.querySelector('.notice-inline');
            if (account.totalAmountDue === undefined) {
                assert.match(
                    notice.textContent,
                    /Balance unavailable\. We couldn’t read your account balance\. Check the original dashboard before making a payment\./
                );
                assert.equal(notice.getAttribute('role'), 'status');
                assert.equal(notice.querySelector('[aria-hidden="true"]').textContent, 'info');
            } else {
                assert.equal(notice, null);
            }
            assert.equal(amount.querySelector('[data-action="pay-now"]').disabled, false);
        }
    } finally {
        window.close();
    }
});
