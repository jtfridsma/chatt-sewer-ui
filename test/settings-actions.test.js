import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { MODERN_BRIDGE_EVENTS as EVENTS } from '../src/scripts/modern/bridge/events.js';
import { renderSettingsToggles } from '../src/scripts/modern/components/dashboard-fragments.js';

const { outputFiles } = await build({
    entryPoints: ['src/scripts/modern/bridge/page-bridge.js'],
    bundle: true,
    write: false,
    format: 'iife',
});

for (const [action, rawField, field, method] of [
    ['set-auto-pay', 'AutoPay', 'autoPay', 'setAutoPayment'],
    ['set-paperless-billing', 'NameEBillConsent', 'paperlessBilling', 'changePaperless'],
]) {
    for (const initial of [false, true]) {
        test(`${action} preserves last known ${initial} until a reload verifies the setting`, async () => {
            const dom = new JSDOM('', {
                url: 'https://share.dwcorp.com/WebShare/Account.aspx?clientKey=3652&viewID=3',
                runScripts: 'outside-only',
            });
            const { window } = dom;
            const account = { PNALKey: 'A', PTntvfFmtPremTenant: 'A', [rawField]: initial };
            const other = { PNALKey: 'B', PTntvfFmtPremTenant: 'B', [rawField]: initial };
            const scope = {
                displayAccounts: [account, other],
                userSelections: [account],
                showWaterConsumptionGraph: false,
                // Angular's $apply catches callback errors itself.
                $apply(fn) {
                    try {
                        fn();
                    } catch {}
                },
                $applyAsync() {},
            };
            window.angular = { element: () => ({ scope: () => scope }) };
            window.setTimeout = window.setInterval = () => 1;
            window.clearTimeout = window.clearInterval = () => {};
            const states = [];
            window.addEventListener(EVENTS.state, ({ detail }) => states.push(detail));
            const dispatch = (name, detail) =>
                window.dispatchEvent(new window.CustomEvent(name, { detail }));
            const act = () => dispatch(EVENTS.legacyAction, { action, enabled: !initial });
            const latest = () => states.at(-1).selectedAccount;
            const check = (status) => {
                assert.equal(latest()[field], initial);
                assert.equal(states.at(-1).accounts[0][field], initial);
                assert.equal(latest().settingStatus[field], status);
                const html = renderSettingsToggles({ selected: latest(), flags: {} });
                assert.match(
                    html,
                    status === 'error' ? /Could not change this setting/ : /Not confirmed/
                );
            };
            try {
                window.eval(outputFiles[0].text);
                dispatch(EVENTS.start);
                act(); // Missing method must leave the raw value untouched and surface an error.
                assert.equal(account[rawField], initial);
                check('error');

                scope[method] = () => {
                    throw new Error('portal failed');
                };
                act();
                assert.equal(account[rawField], initial);
                check('error');

                scope[method] = () => Promise.reject(new Error('async failure'));
                act();
                check('unconfirmed');
                await new Promise((resolve) => setImmediate(resolve));
                assert.equal(account[rawField], initial);
                check('error');

                let rejectRequest;
                let calls = 0;
                scope[method] = () => {
                    calls++;
                    assert.equal(account[rawField], !initial);
                    // Observed portal workflow (2026-09-10): both methods return
                    // undefined; autopay attaches an empty rejection callback and
                    // paperless discards the request promise altogether.
                    new Promise((resolve, reject) => {
                        rejectRequest = reject;
                    }).then(
                        () => {},
                        () => {}
                    );
                };
                act();
                check('unconfirmed');
                act();
                assert.equal(calls, 1, 'do not launch overlapping unverified changes');
                rejectRequest(new Error('portal swallowed this failure'));
                await new Promise((resolve) => setImmediate(resolve));
                dispatch(EVENTS.requestState);
                check('unconfirmed');

                // Autopay Cancel flips the model back; Escape/backdrop only dismiss
                // the modal. Neither path provides proof of a saved new setting.
                if (field === 'autoPay') account.AutoPay = !account.AutoPay;
                dispatch(EVENTS.requestState);
                check('unconfirmed');

                scope.userSelections = [other];
                dispatch(EVENTS.requestState);
                assert.equal(latest().settingStatus, undefined);
                scope.userSelections = [account];
                dispatch(EVENTS.stop);
                dispatch(EVENTS.start);
                check('unconfirmed');
            } finally {
                dispatch(EVENTS.stop);
                window.close();
            }
        });
    }
}
