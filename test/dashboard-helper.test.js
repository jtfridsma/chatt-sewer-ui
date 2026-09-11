import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { MODERN_BRIDGE_EVENTS as EVENTS } from '../src/scripts/modern/bridge/events.js';

test('dashboard help switches off enhancements through the existing toggle', async () => {
    const { outputFiles } = await build({
        stdin: {
            contents: `import { addThemeToggle } from './src/scripts/components/theme-toggle.js';
                import { setupModernDashboardIntegration } from './src/scripts/modern/dashboard.js';
                const ctx = { isChattWebShare: true, pageType: 'dashboard' };
                addThemeToggle(ctx);
                setupModernDashboardIntegration(ctx);`,
            resolveDir: process.cwd(),
        },
        bundle: true,
        write: false,
        format: 'iife',
    });
    const dom = new JSDOM('', {
        url: 'https://share.dwcorp.com/WebShare/Account.aspx?clientKey=3652',
        runScripts: 'outside-only',
        pretendToBeVisual: true,
    });
    try {
        const { window } = dom;
        const { document } = window;
        window.eval(outputFiles[0].text);
        const account = { accountNumber: '123' };
        window.dispatchEvent(
            new window.CustomEvent(EVENTS.state, {
                detail: { ok: true, accounts: [account], selectedAccount: account, flags: {} },
            })
        );
        const root = document.getElementById('csui-modern-dashboard').shadowRoot;
        const button = root.querySelector('[data-action="original-dashboard"]');
        assert.equal(button.textContent, 'Switch to the original dashboard');
        button.click();
        assert.equal(document.getElementById('csui-enabled-toggle').checked, false);
        assert.equal(window.localStorage.getItem('csui-theme-enabled'), 'false');
        assert.equal(document.documentElement.hasAttribute('data-csui-enabled'), false);
        assert.equal(document.getElementById('csui-modern-dashboard'), null);
        assert.equal(document.activeElement.id, 'csui-launcher');
        document.getElementById('csui-enabled-toggle').click();
        assert.ok(document.getElementById('csui-modern-dashboard'));
        assert.equal(window.localStorage.getItem('csui-theme-enabled'), 'true');
    } finally {
        dom.window.close();
    }
});
