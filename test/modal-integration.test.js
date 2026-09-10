import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

test('preserves the original amount due when the enhancement is toggled', async () => {
    const { outputFiles } = await build({
        stdin: {
            contents: `export { setupModernModalIntegration } from './src/scripts/modern/modal-integration.js';`,
            resolveDir: process.cwd(),
        },
        bundle: true,
        write: false,
        format: 'iife',
        globalName: 'modalIntegration',
    });
    const dom = new JSDOM(
        `<div class="modal in">
            <h2 class="modal-title">Payment</h2>
            <form><table><tbody><tr ng-repeat="account in accounts">
                <td>123</td><td><input name="amtToPay" value="100"></td>
            </tr></tbody></table></form>
            <div class="modal-footer"><p>Total: $100.00</p></div>
        </div>`,
        { runScripts: 'outside-only', pretendToBeVisual: true }
    );
    const { window } = dom;
    try {
        window.eval(outputFiles[0].text);
        const { document, modalIntegration } = window;
        const first = modalIntegration.setupModernModalIntegration();
        const due = () => document.querySelector('.csui-payment-amount-due__value');
        assert.equal(due().textContent, '$100.00');

        document.querySelector('input').value = '50';
        document.querySelector('.modal-footer p').textContent = 'Total: $50.00';
        first.destroy();
        assert.equal(due(), null);

        const second = modalIntegration.setupModernModalIntegration();
        assert.equal(due().textContent, '$100.00');
        assert.equal(
            document.querySelector('.csui-payment-total-due__value').textContent,
            '$100.00'
        );
        assert.equal(
            document.querySelector('.csui-payment-total-notice').textContent,
            'Amount to pay is $50.00 less than total due.'
        );
        assert.equal(document.querySelector('input').value, '50');
        second.destroy();
    } finally {
        window.close();
    }
});
