import { createDashboardView } from './modern/components/dashboard-view.js';
import { normalizeAccount } from './modern/bridge/normalize-data.js';

// Entirely invented fixtures. Never import the MAIN-world bridge or live actions here.
const examples = [
    { key: 'DEMO-A', address: '100 Example Lane (fictional)', balance: 84.25, active: 1 },
    { key: 'DEMO-B', address: '200 Sample Avenue (fictional)', balance: 0, active: 1 },
    { key: 'DEMO-C', address: '300 Demo Court (fictional)', balance: 0, active: 0 },
];
const host = document.getElementById('demo-dashboard');
const scenario = document.getElementById('scenario');
const result = document.getElementById('preference-result');
const status = document.getElementById('demo-status');
const dialog = document.getElementById('demo-dialog');
let selectedKey = 'DEMO-A';
let settingStatus = {};
let view;

function showSimulation(title, description) {
    document.getElementById('demo-dialog-title').textContent = `${title} — simulation only`;
    document.getElementById('demo-dialog-description').textContent = description;
    dialog.showModal();
}

function changePreference(field) {
    settingStatus[selectedKey] = {
        ...settingStatus[selectedKey],
        [field]: result.value,
    };
    status.textContent = 'Simulated preference result. Nothing was sent or saved. Reset to retry.';
    render();
}

function reset() {
    view?.destroy();
    if (dialog.open) dialog.close();
    selectedKey = 'DEMO-A';
    settingStatus = {};
    scenario.value = 'populated';
    result.value = 'unconfirmed';
    view = createDashboardView({
        host,
        actions: {
            selectAccount(account) {
                selectedKey = account.accountKey;
                render();
            },
            setPaperlessBilling: () => changePreference('paperlessBilling'),
            setAutoPay: () => changePreference('autoPay'),
            openPayment: () =>
                showSimulation(
                    'Payment',
                    `Selected synthetic account: ${selectedKey}. In the live portal this opens its payment workflow. This demo cannot take payment or collect payment details.`
                ),
            openProfile: () =>
                showSimulation('Update Profile', 'No personal information is requested or saved.'),
            openChangePassword: () =>
                showSimulation('Change Password', 'There is no account or password in this demo.'),
            signOut: () =>
                showSimulation(
                    'Sign Out',
                    'There is no authenticated session. Close this tab to exit.'
                ),
            showOriginalDashboard: () =>
                showSimulation(
                    'Original dashboard',
                    'There is no underlying portal page in this demo. On a supported live page this control turns off the enhanced interface.'
                ),
        },
    });
    status.textContent = 'Choose an account or explore the dashboard tabs.';
    render();
}

function render() {
    if (scenario.value === 'loading') {
        view.renderLoading();
        return;
    }
    const accounts = examples.map((example) => ({
        ...normalizeAccount({
            PNALKey: example.key,
            PTntvfFmtPremTenant: example.key,
            ServiceAddress: example.address,
            NamevfFirstLast: 'Synthetic Customer',
            PTntvfBalance:
                scenario.value === 'unavailable' && example.key === selectedKey
                    ? undefined
                    : example.balance,
            PTntActive: example.active,
            LastPayDate: '2026-08-15',
            LastPayAmt: 72,
            PTntPrevBalance: 72,
            NameEBillConsent: true,
            AutoPay: false,
        }),
        settingStatus: settingStatus[example.key],
    }));
    const selected = accounts.find((account) => account.accountKey === selectedKey);
    const hasHistory = selectedKey !== 'DEMO-C';
    view.render({
        accounts: scenario.value === 'empty' ? [] : accounts,
        selectedAccount: scenario.value === 'empty' ? null : selected,
        statements: hasHistory
            ? [{ label: `${selectedKey} — Synthetic sample statement`, url: 'statement.html' }]
            : [],
        waterMeters: hasHistory
            ? [1, 2].map((meter) => ({
                  meterNumber: `${selectedKey}-METER-${meter}`,
                  readings: [18, 22, 15, 26, 20, 24].map((value, index) => ({
                      date: `2026-${String(index + 3).padStart(2, '0')}-15`,
                      consumption: value + meter + (selectedKey === 'DEMO-B' ? 8 : 0),
                  })),
              }))
            : [],
        messages: hasHistory
            ? ['Synthetic demonstration message. This is not a service notice.']
            : [],
        flags: {
            showPaymentButton: selectedKey !== 'DEMO-C',
            allowPaperlessChange: selectedKey !== 'DEMO-C',
            allowRecurring: selectedKey !== 'DEMO-C',
            showWaterConsumptionGraph: true,
        },
    });
}

scenario.addEventListener('change', render);
document.getElementById('reset').addEventListener('click', reset);
document.getElementById('close-dialog').addEventListener('click', () => dialog.close());
window.addEventListener('pagehide', () => view.destroy(), { once: true });
reset();
