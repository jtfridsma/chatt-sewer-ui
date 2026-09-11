import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

test('synthetic demo uses real dashboard interactions without portal access or persistence', async () => {
    const { outputFiles, metafile } = await build({
        entryPoints: ['src/scripts/demo.js'],
        bundle: true,
        write: false,
        format: 'iife',
        metafile: true,
    });
    assert.equal(
        Object.keys(metafile.inputs).some((path) => /page-bridge|legacy-actions/.test(path)),
        false
    );
    const html = await readFile('public/demo/index.html', 'utf8');
    assert.match(html, /connect-src 'none'/);
    const dom = new JSDOM(html, {
        url: 'chrome-extension://synthetic/public/demo/index.html',
        runScripts: 'outside-only',
        pretendToBeVisual: true,
    });
    const { window } = dom;
    const requests = [];
    window.fetch = (...args) => {
        requests.push(args);
        throw new Error('No network allowed');
    };
    window.HTMLDialogElement.prototype.showModal = function () {
        this.open = true;
    };
    window.HTMLDialogElement.prototype.close = function () {
        this.open = false;
    };
    try {
        window.eval(outputFiles[0].text);
        const root = window.document.getElementById('demo-dashboard').shadowRoot;
        const click = (selector) => root.querySelector(selector).click();
        const choose = (id, value) => {
            const control = window.document.getElementById(id);
            control.value = value;
            control.dispatchEvent(new window.Event('change'));
        };
        assert.equal(root.querySelectorAll('[data-account-option]').length, 3);
        assert.equal(root.querySelectorAll('.chart__readings tbody tr').length, 6);
        click('[data-account-option="DEMO-B"]');
        click('[data-detail-tab="statements"]');
        const statement = root.querySelector('.statement-list a');
        assert.match(statement.textContent, /DEMO-B/);
        assert.equal(statement.href, 'chrome-extension://synthetic/public/demo/statement.html');
        assert.equal(statement.target, '_blank');
        click('[data-detail-tab="billing"]');
        click('[data-toggle-setting="autopay"]');
        assert.match(root.textContent, /Not confirmed/);
        assert.equal(root.querySelector('[data-toggle-setting="autopay"]').disabled, true);
        window.document.getElementById('reset').click();
        choose('preference-result', 'error');
        click('[data-detail-tab="billing"]');
        click('[data-toggle-setting="paperless"]');
        assert.match(root.textContent, /Could not change this setting/);
        click('[data-action="pay-now"]');
        assert.equal(window.document.getElementById('demo-dialog').open, true);
        assert.match(
            window.document.getElementById('demo-dialog-description').textContent,
            /cannot take payment/
        );
        window.document.getElementById('close-dialog').click();
        click('[data-action="original-dashboard"]');
        assert.match(
            window.document.getElementById('demo-dialog-description').textContent,
            /no underlying portal page/
        );
        window.document.getElementById('close-dialog').click();
        choose('scenario', 'unavailable');
        assert.match(root.textContent, /Balance unavailable/);
        choose('scenario', 'empty');
        assert.match(root.textContent, /No account data/);
        choose('scenario', 'loading');
        assert.ok(root.querySelector('[aria-busy="true"]'));
        window.document.getElementById('reset').click();
        assert.equal(root.querySelectorAll('[data-account-option]').length, 3);
        assert.deepEqual(requests, []);
    } finally {
        window.dispatchEvent(new window.Event('pagehide'));
        window.close();
    }
});
