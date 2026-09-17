// Recording-only DevTools snippet. Never import this into extension source.
(() => {
    // Use selectors for text containers, not real account values. For inputs or
    // images, select a containing element that can display an ::after overlay.
    const pageSelectors = [
        ':has(> input.form-control[name="emailAddress"])', // Edit profile modal email wrapper
        'td[headers="accountNum"]', // Payment modal account number
        'td[headers="servAddresss"]', // Payment modal address
        'span.csui-payment-account-value', // Payment modal account number
        // Original account grid: account number and address precede Balance.
        '.ui-grid-row [ui-grid-row] > .ui-grid-cell:nth-child(-n+2) > .ui-grid-cell-contents',
        '.data-display > [ng-bind="userSelections[0].NamevfFirstLast"]', // Summary name
        '.data-display > [ng-bind="userSelections[0].ServiceAddress"]', // Summary address
        '.data-display > [ng-bind="userSelections[0].PTntvfFmtPremTenant"]', // Summary account number
        // SVG does not render ::after masks; hide meter legends (including title tooltips).
        'nvd3[data="waterMeterData"] .nv-legendWrap .nv-series',
    ];
    const dashboardSelectors = [
        '.account-nav-item__address', // Sidebar address
        '.account-nav-item__details > span:first-child', // Sidebar account number
        '#csui-modern-overview-heading', // Overview address
        '.account-overview__facts > div:first-child > dd', // Overview account number
        '.summary-grid > .summary-field:nth-child(1) > dd', // Summary name
        '.summary-grid > .summary-field:nth-child(2) > dd', // Summary address
        '.summary-grid > .summary-field:nth-child(3) > dd', // Summary account number
        '.meter-tab__label', // Meter number
        '.chart__summary > .field:first-child > dd', // Meter number
        '.chart__readings table caption', // Meter number
    ];

    // Validate before installing anything, so a typo cannot silently drop masks.
    for (const selector of [...pageSelectors, ...dashboardSelectors]) {
        document.querySelector(selector);
    }
    window.csuiRecordingRedaction?.stop();
    if (!pageSelectors.length && !dashboardSelectors.length) {
        console.warn('Recording redaction: no selectors configured; nothing is masked.');
        return;
    }

    const styles = new Map();
    const observer = new MutationObserver(apply);

    function install(root, selectors) {
        if (!root || !selectors.length) return;
        let style = styles.get(root);
        if (!style) {
            style = document.createElement('style');
            const targets = `:is(${selectors.join(', ')})`;
            style.textContent = `
                ${targets} {
                    position: relative !important;
                    isolation: isolate !important;
                }
                ${targets}, ${targets} * { visibility: hidden !important; }
                ${targets}::after {
                    content: '' !important;
                    position: absolute !important;
                    inset: 0 !important;
                    visibility: visible !important;
                    background: #000 !important;
                    opacity: 1 !important;
                    z-index: 1 !important;
                    pointer-events: none !important;
                }
            `;
            styles.set(root, style);
            observer.observe(root, { childList: true, subtree: true });
        }
        if (!style.isConnected) (root.head || root).append(style);
    }

    function apply() {
        // Release detached dashboard roots when the enhancement is toggled.
        for (const [root, style] of styles) {
            if (root.host && !root.host.isConnected) {
                style.remove();
                styles.delete(root);
            }
        }
        install(document, pageSelectors);
        install(document.getElementById('csui-modern-dashboard')?.shadowRoot, dashboardSelectors);
    }

    window.csuiRecordingRedaction = {
        apply,
        stop() {
            observer.disconnect();
            for (const style of styles.values()) style.remove();
            styles.clear();
            delete window.csuiRecordingRedaction;
        },
    };
    observer.observe(document, { childList: true, subtree: true });
    apply();
    console.info(
        'Recording masks installed. Rehearse all views before recording; reload clears masks.'
    );
})();
