import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { MODERN_BRIDGE_EVENTS as EVENTS } from '../src/scripts/modern/bridge/events.js';

test('withholds unowned Angular and DOM statements during delayed account switches', async () => {
    const { outputFiles } = await build({
        entryPoints: ['src/scripts/modern/bridge/page-bridge.js'],
        bundle: true,
        write: false,
        format: 'iife',
    });
    const dom = new JSDOM('<a href="StatementView.aspx?StmtKey=101">August 1, 2026</a>', {
        url: 'https://example.com/',
        runScripts: 'outside-only',
    });
    const { window } = dom;
    const accounts = ['A', 'B'].map((key) => ({
        PNALKey: key,
        PTntvfFmtPremTenant: key,
        PTntPremiseID: key,
        PTntTenantCounter: 1,
    }));
    const scope = {
        displayAccounts: accounts,
        userSelections: [accounts[0]],
        statements: [{ StatementKey: '101' }],
        showWaterConsumptionGraph: false,
    };
    window.angular = { element: () => ({ scope: () => scope }) };
    const timeouts = new Map();
    let nextId = 0;
    window.setTimeout = (fn) => {
        timeouts.set(++nextId, fn);
        return nextId;
    };
    window.clearTimeout = (id) => timeouts.delete(id);
    window.setInterval = () => 1;
    window.clearInterval = () => {};
    const requests = [];
    window.fetch = (url, options) =>
        new Promise((resolve) => {
            requests.push({
                account: JSON.parse(options.body).additionalParams.find(
                    ({ name }) => name === 'PremiseID'
                ).value,
                resolve: (key) =>
                    resolve({
                        ok: true,
                        json: async () => ({ items: key ? [{ StatementKey: key }] : [] }),
                    }),
            });
        });
    const states = [];
    window.addEventListener(EVENTS.state, ({ detail }) => states.push(detail));
    const dispatch = (event) => window.dispatchEvent(new window.CustomEvent(event));
    const flush = async () => {
        const callbacks = [...timeouts.values()];
        timeouts.clear();
        callbacks.forEach((fn) => fn());
        await new Promise((resolve) => setImmediate(resolve));
    };
    const latest = () => states.at(-1);
    try {
        window.eval(outputFiles[0].text);
        dispatch(EVENTS.start);
        assert.equal(latest().statements.length, 0);
        await flush();
        assert.equal(requests[0].account, 'A');

        scope.userSelections = [accounts[1]];
        dispatch(EVENTS.requestState);
        assert.equal(latest().selectedAccountNumber, 'B');
        assert.equal(latest().statements.length, 0);
        await flush();
        assert.equal(requests[1].account, 'B');
        requests[1].resolve('201');
        await flush();
        assert.deepEqual(
            Array.from(latest().statements, (item) => item.statementKey),
            ['201']
        );

        // A's late Angular update and network response must not contaminate B.
        scope.statements = [{ StatementKey: '102' }];
        requests[0].resolve('102');
        await flush();
        dispatch(EVENTS.requestState);
        assert.deepEqual(
            Array.from(latest().statements, (item) => item.statementKey),
            ['201']
        );

        // Returning to A must fetch again: the obsolete A response was discarded.
        scope.userSelections = [accounts[0]];
        dispatch(EVENTS.requestState);
        assert.equal(latest().statements.length, 0);
        await flush();
        assert.equal(requests[2].account, 'A');
        assert.equal(latest().flags.statementsLoaded, false);
        requests[2].resolve(null);
        await flush();
        assert.equal(latest().statements.length, 0);
        assert.equal(latest().flags.statementsLoaded, true);
        assert.equal(latest().flags.statementsPending, false);
    } finally {
        dispatch(EVENTS.stop);
        window.close();
    }
});
