import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

test('recording helper is opt-in, survives dashboard replacement, and cleans up on rerun', async () => {
    const source = (await readFile(new URL('./recording-redaction.js', import.meta.url), 'utf8'))
        .replace(/const pageSelectors = \[[\s\S]*?\];/, 'const pageSelectors = [];')
        .replace(/const dashboardSelectors = \[[\s\S]*?\];/, 'const dashboardSelectors = [];');
    const dom = new JSDOM('<p class="private">Original value</p>', {
        runScripts: 'outside-only',
    });
    const { window } = dom;
    const { document } = window;
    window.console.warn = () => {};
    window.console.info = () => {};
    const settle = () => new Promise((resolve) => window.setTimeout(resolve, 0));
    const addDashboard = () => {
        const host = document.createElement('div');
        host.id = 'csui-modern-dashboard';
        const shadow = host.attachShadow({ mode: 'open' });
        shadow.innerHTML = '<span class="private">Dashboard value</span>';
        document.body.append(host);
        return host;
    };

    try {
        window.eval(source);
        assert.equal(document.querySelector('style'), null);
        assert.equal(window.csuiRecordingRedaction, undefined);

        const configured = source
            .replace('const pageSelectors = [];', "const pageSelectors = ['.private'];")
            .replace('const dashboardSelectors = [];', "const dashboardSelectors = ['.private'];");
        let host = addDashboard();
        window.eval(configured);
        assert.equal(document.querySelectorAll('style').length, 1);
        assert.match(host.shadowRoot.querySelector('style').textContent, /visibility: hidden/);
        assert.equal(document.querySelector('.private').textContent, 'Original value');

        host.remove();
        host = addDashboard();
        await settle();
        assert.equal(host.shadowRoot.querySelectorAll('style').length, 1);
        window.eval(configured);
        await settle();
        assert.equal(document.querySelectorAll('style').length, 1);
        assert.equal(host.shadowRoot.querySelectorAll('style').length, 1);

        window.csuiRecordingRedaction.stop();
        await settle();
        assert.equal(document.querySelector('style'), null);
        assert.equal(host.shadowRoot.querySelector('style'), null);
        assert.equal(window.csuiRecordingRedaction, undefined);
    } finally {
        window.close();
    }
});

test('configured selectors mask identity fields in their correct DOM roots only', async () => {
    const source = await readFile(new URL('./recording-redaction.js', import.meta.url), 'utf8');
    const dom = new JSDOM(
        `<div id="email"><input class="form-control" name="emailAddress"></div>
         <table><tr><td headers="accountNum">Account</td><td id="payment-address" headers="servAddresss">Address</td></tr></table>
         <span id="payment-account" class="csui-payment-account-value">Account</span>
         <div class="ui-grid-row"><div ui-grid-row="row">
             <div class="ui-grid-cell"><div id="grid-account" class="ui-grid-cell-contents">Account</div></div>
             <div class="ui-grid-cell"><div id="grid-address" class="ui-grid-cell-contents">Address</div></div>
             <div class="ui-grid-cell"><div id="grid-balance" class="ui-grid-cell-contents">Balance</div></div>
         </div></div>
         <p class="data-display"><b id="legacy-name" ng-bind="userSelections[0].NamevfFirstLast">Name</b></p>
         <p class="data-display"><b id="legacy-address" ng-bind="userSelections[0].ServiceAddress">Address</b></p>
         <p class="data-display"><b id="legacy-account" ng-bind="userSelections[0].PTntvfFmtPremTenant">Account</b></p>
         <p class="data-display"><b id="legacy-payment" ng-bind="userSelections[0].LastPayAmt|currency">Payment</b></p>
         <nvd3 data="waterMeterData"><svg>
             <g class="nv-legendWrap"><g id="meter-legend" class="nv-series"><text>Meter</text><title>Meter</title></g></g>
             <g class="nv-controlsWrap"><g id="chart-controls" class="nv-series"><text>Grouped</text></g></g>
         </svg></nvd3>`,
        { runScripts: 'outside-only' }
    );
    const { window } = dom;
    try {
        const host = window.document.createElement('div');
        window.document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
            <button><span class="account-nav-item__top">
                <span id="sidebar-address" class="account-nav-item__address">Address</span>
            </span><span class="account-nav-item__details account-nav-item__label">
                <span id="sidebar-account">Account</span><span>•</span><span>Balance</span>
            </span></button>
            <section><div><h2 id="csui-modern-overview-heading">Address</h2></div>
                <dl class="account-overview__facts"><div><dt>Account</dt><dd id="overview-account">Account</dd></div>
                    <div><dt>Status</dt><dd>Current</dd></div></dl></section>
            <section><h2>Account Information</h2><dl class="summary-grid">
                ${['name', 'address', 'account', 'balance']
                    .map(
                        (field) =>
                            `<div class="summary-field"><dt>${field}</dt><dd id="summary-${field}">${field}</dd></div>`
                    )
                    .join('')}
            </dl></section>
            <span id="meter-tab" class="meter-tab__label">Meter</span>
            <figure><dl class="chart__summary">
                <div class="field"><dt>Meter</dt><dd id="meter-number">Meter</dd></div>
                <div class="field"><dt>Readings</dt><dd>13</dd></div>
            </dl></figure>
            <div class="chart__readings"><table><caption id="caption">Meter</caption></table></div>`;
        const selectors = (name) =>
            window.eval(`(${source.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\]);`))[1]})`);
        const page = selectors('pageSelectors');
        const dashboard = selectors('dashboardSelectors');
        for (const selector of page)
            assert.ok(window.document.querySelectorAll(selector).length > 0, selector);
        for (const selector of dashboard)
            assert.equal(shadow.querySelectorAll(selector).length, 1, selector);
        assert.deepEqual(
            [...shadow.querySelectorAll(dashboard.join(', '))].map((element) => element.id),
            [
                'sidebar-address',
                'sidebar-account',
                'csui-modern-overview-heading',
                'overview-account',
                'summary-name',
                'summary-address',
                'summary-account',
                'meter-tab',
                'meter-number',
                'caption',
            ]
        );
        assert.equal(window.document.querySelector(page[0]).id, 'email');
        for (const id of [
            'grid-account',
            'grid-address',
            'legacy-name',
            'legacy-address',
            'legacy-account',
            'meter-legend',
        ]) {
            assert.ok(window.document.getElementById(id).matches(page.join(', ')), id);
        }
        for (const id of ['grid-balance', 'legacy-payment', 'chart-controls']) {
            assert.equal(window.document.getElementById(id).matches(page.join(', ')), false, id);
        }
    } finally {
        window.close();
    }
});
