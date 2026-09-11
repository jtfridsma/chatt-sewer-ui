import test from 'node:test';
import assert from 'node:assert/strict';

import { getChattContext } from '../src/scripts/utilities/context.js';

test('recognizes the Chattanooga landing page', () => {
    const context = getChattContext('https://www.sewerpayments.com/chattanooga');

    assert.equal(context.isRelevant, true);
    assert.equal(context.isSewerPaymentsChatt, true);
    assert.equal(context.pageType, null);
});

test('classifies supported Chattanooga WebShare pages', () => {
    const context = getChattContext(
        'https://share.dwcorp.com/WebShare/Anonymous/GuestPay.aspx?clientKey=3652&viewID=3'
    );

    assert.equal(context.isRelevant, true);
    assert.equal(context.isChattWebShare, true);
    assert.equal(context.pageType, 'guest-pay');
});

test('rejects WebShare pages for other clients', () => {
    const context = getChattContext(
        'https://share.dwcorp.com/WebShare/Login.aspx?clientKey=9999&viewID=3'
    );

    assert.equal(context.isRelevant, false);
    assert.equal(context.isChattWebShare, false);
});

test('accepts Chattanooga regardless of view ID while requiring its client key', () => {
    for (const view of ['&viewID=3', '&viewID=7', '&viewId=7', '']) {
        for (const client of ['3652', '9999', '']) {
            const context = getChattContext(
                `https://share.dwcorp.com/WebShare/Account.aspx?clientKey=${client}${view}`
            );
            assert.equal(context.isChattWebShare, client === '3652');
            assert.equal(context.isRelevant, client === '3652');
            assert.equal(context.pageType, client === '3652' ? 'dashboard' : null);
        }
    }
});
