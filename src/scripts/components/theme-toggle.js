// src/scripts/components/theme-toggle.js

import {
    dispatchThemeToggle,
    persistThemeEnabled,
    readThemeEnabled,
    setThemeEnabled,
} from '../utilities/theme-state.js';
import { getChattContext } from '../utilities/context.js';

const STORAGE_KEY_DIAGNOSTICS = 'csui-diagnostics';

const UI_ROOT_ID = 'csui-ui';
const LAUNCHER_ID = 'csui-launcher';
const PANEL_ID = 'csui-panel';
const TOGGLE_ID = 'csui-enabled-toggle';
const ERROR_BADGE_ID = 'csui-error-badge';
const BADGE_ICON_ID = 'csui-diagnostic-badge-icon';
const DIAGNOSTICS_ID = 'csui-diagnostics';
const MAX_DIAGNOSTICS = 3;

const LINKS = {
    reportIssue: 'https://github.com/jtfridsma/chatt-sewer-ui/issues/new',
    buyCoffee: 'https://buymeacoffee.com/jtfridsma',
};

export function addThemeToggle(ctx) {
    if (typeof document === 'undefined') return;
    if (!document.body) return;

    // Avoid duplicate insertion
    if (document.getElementById(UI_ROOT_ID)) return;

    // Build UI root + markup
    const root = document.createElement('div');
    root.id = UI_ROOT_ID;
    root.className = 'csui-control'; // styles will target this
    root.innerHTML = getMarkup();

    document.body.appendChild(root);

    const launcher = root.querySelector(`#${LAUNCHER_ID}`);
    const panel = root.querySelector(`#${PANEL_ID}`);
    const toggle = root.querySelector(`#${TOGGLE_ID}`);
    const errorBadge = root.querySelector(`#${ERROR_BADGE_ID}`);
    const badgeIcon = root.querySelector(`#${BADGE_ICON_ID}`);
    const diagnostics = root.querySelector(`#${DIAGNOSTICS_ID}`);

    if (!launcher || !panel || !toggle) return;

    panel.hidden = true;
    launcher.setAttribute('aria-controls', PANEL_ID);

    // Restore enabled state (default: on)
    const initialOn = readThemeEnabled();
    setThemeEnabled(initialOn);
    toggle.checked = initialOn;

    const diagnosticScope = getDiagnosticScope(ctx);
    const initialDiagnostics = clearTransientDashboardDiagnostics(
        readDiagnostics(diagnosticScope),
        diagnosticScope
    );
    renderDiagnostics(initialDiagnostics, diagnostics, diagnosticScope);
    syncDiagnosticBadge(initialDiagnostics, errorBadge, badgeIcon);

    const openPanel = () => {
        panel.hidden = false;
        root.setAttribute('data-csui-open', 'true');
        launcher.setAttribute('aria-expanded', 'true');
        requestAnimationFrame(() => {
            toggle.focus?.();
        });
    };

    const closePanel = () => {
        panel.hidden = true;
        root.removeAttribute('data-csui-open');
        launcher.setAttribute('aria-expanded', 'false');
        launcher.focus?.();
    };

    const isOpen = () => root.getAttribute('data-csui-open') === 'true';

    launcher.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isOpen()) closePanel();
        else openPanel();
    });

    // Close on click outside
    document.addEventListener(
        'click',
        (e) => {
            if (!isOpen()) return;
            if (!root.contains(e.target)) closePanel();
        },
        true
    );

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (!isOpen()) return;
        if (e.key === 'Escape') {
            e.preventDefault();
            closePanel();
        }
    });

    // Toggle enabled state
    toggle.addEventListener('change', () => {
        const next = !!toggle.checked;
        // Allow handle motion only after interaction, never while restoring state.
        root.setAttribute('data-csui-interacted', 'true');
        setThemeEnabled(next);
        persistThemeEnabled(next);

        if (!next && diagnosticScope === 'webshare:dashboard') {
            window.__CSUI__?.clearDashboardDataDiagnostics?.();
        }

        try {
            dispatchThemeToggle(next);
        } catch {
            // no-op
        }
    });

    installGlobalErrorReporter({
        errorBadge,
        badgeIcon,
        diagnostics,
        diagnosticScope,
    });
}

function getMarkup() {
    const version = getExtensionVersion();
    return `
    <button
      id="${LAUNCHER_ID}"
      class="csui-control__launcher"
      type="button"
      aria-label="Chatt Sewer UI settings"
      aria-haspopup="dialog"
      aria-expanded="false"
    >
      <svg class="csui-control__launcher-icon" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path class="csui-control__launcher-icon-base" d="M1.90735e-06 35.9999C1.90735e-06 55.8821 16.1177 71.9998 35.9999 71.9998C55.8821 71.9998 71.9998 55.8821 71.9998 35.9999C71.9998 16.1177 55.8821 0 35.9999 0C16.1177 0 1.90735e-06 16.1177 1.90735e-06 35.9999Z" fill="#9ca3af"/>
        <mask id="wave-mask" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="72" height="72">
          <path class="csui-control__launcher-icon-wave-mask" d="M1.90735e-06 35.9999C1.90735e-06 55.8821 16.1177 71.9998 35.9999 71.9998C55.8821 71.9998 71.9998 55.8821 71.9998 35.9999C71.9998 16.1177 55.8821 0 35.9999 0C16.1177 0 1.90735e-06 16.1177 1.90735e-06 35.9999Z" fill="#9ca3af"/>
        </mask>
        <g mask="url(#wave-mask)">
          <path class="csui-control__launcher-icon-wave" d="M132 -10.0032C136 -10.0032 140.001 -5.20337 144.001 -5.20337V71.9998H0.000976562V4.15015H0V-5.20337C3.99991 -5.20337 8.00106 -10.0031 12.001 -10.0032C16.0008 -10.003 20.0011 -5.20341 24.001 -5.20337C28.0007 -5.20356 32.0012 -10.0029 36.001 -10.0032C40.0005 -10.0027 44.0005 -5.20395 48 -5.20337C51.9997 -5.20341 56.0003 -10.0027 60 -10.0032C63.9999 -10.0032 68.0011 -5.20343 72.001 -5.20337C76.0008 -5.20376 80.0012 -10.0032 84.001 -10.0032C88.0007 -10.0028 92.0012 -5.20341 96.001 -5.20337C100 -5.20383 104 -10.0026 108 -10.0032C112 -10.0029 116 -5.20369 120 -5.20337C124 -5.20341 128 -10.0029 132 -10.0032Z" fill="#004360"/>
        </g>
        <path class="csui-control__launcher-icon-handle" d="M48 23.9999C44.0742 23.9999 40.5909 25.8858 38.4024 28.8004C37.4638 30.0504 36.0899 30.9999 34.5268 30.9999H14C11.7909 30.9999 10 32.7907 10 34.9999V36.9999C10 39.209 11.7909 40.9999 14 40.9999H34.5269C36.09 40.9999 37.4638 41.9492 38.4024 43.1991C40.591 46.1138 44.0744 47.9999 48 47.9999C54.6272 47.9998 59.9998 42.6271 60 35.9999C60 29.3725 54.6274 23.9999 48 23.9999Z" fill="white"/>
      </svg>

      <span id="${ERROR_BADGE_ID}" class="csui-control__badge" aria-hidden="true">
        <span id="${BADGE_ICON_ID}" class="material-symbols-rounded csui-control__badge-icon">warning</span>
      </span>
    </button>

    <div
      id="${PANEL_ID}"
      class="csui-control__panel"
      role="dialog"
      aria-label="Chatt Sewer UI"
    >
      <div class="csui-control__header">
        <div class="csui-control__title">
          <span>Chatt Sewer UI</span>
          <span class="csui-control__version">v${escapeHtml(version)}</span>
        </div>
        <label class="csui-control__toggle" aria-label="Enable enhancements">
          <input id="${TOGGLE_ID}" type="checkbox" />
          <span class="csui-control__toggle-ui" aria-hidden="true"></span>
        </label>
      </div>

      <div id="${DIAGNOSTICS_ID}" class="csui-control__diagnostics" aria-live="polite" hidden></div>

      <div class="csui-control__divider" role="separator" aria-hidden="true"></div>

      <div class="csui-control__links">
        <a class="csui-control__link" href="${escapeAttr(
            LINKS.reportIssue
        )}" target="_blank" rel="noopener noreferrer">
          💩 <span>Report an issue</span>
        </a>
        <a class="csui-control__link" href="${escapeAttr(
            LINKS.buyCoffee
        )}" target="_blank" rel="noopener noreferrer">
          ☕️ <span>Buy me a coffee</span>
        </a>
      </div>
    </div>
  `;
}

function readDiagnostics(scope) {
    try {
        const parsed = JSON.parse(localStorage.getItem(getDiagnosticsStorageKey(scope)) || '[]');
        if (Array.isArray(parsed)) {
            const diagnostics = parsed
                .map((entry) => normalizeDiagnostic(entry?.level, entry?.message))
                .filter(Boolean);
            if (diagnostics.length) return diagnostics.slice(-MAX_DIAGNOSTICS);
        }
    } catch {
        // ignore
    }
    return [];
}

function persistDiagnostics(diagnostics, scope) {
    try {
        localStorage.setItem(getDiagnosticsStorageKey(scope), JSON.stringify(diagnostics));
    } catch {
        // ignore
    }
}

function syncDiagnosticBadge(diagnostics, badgeEl, iconEl) {
    if (!badgeEl) return;
    if (!diagnostics.length) {
        badgeEl.removeAttribute('data-visible');
        badgeEl.removeAttribute('data-severity');
        return;
    }

    const severity = diagnostics.some((diagnostic) => diagnostic.level === 'error')
        ? 'error'
        : 'warning';
    badgeEl.setAttribute('data-visible', 'true');
    badgeEl.setAttribute('data-severity', severity);
    if (iconEl) iconEl.textContent = severity;
}

function renderDiagnostics(diagnostics, container, scope) {
    if (!container) return;
    container.replaceChildren();
    const isEmpty = !diagnostics.length;
    container.hidden = isEmpty;
    container.style.display = isEmpty ? 'none' : '';

    diagnostics.forEach((diagnostic) => {
        const item = document.createElement('div');
        item.className = `csui-control__diagnostic csui-control__diagnostic--${diagnostic.level}`;

        const label = document.createElement('strong');
        label.textContent = `${getDiagnosticScopeLabel(scope)} ${
            diagnostic.level === 'warning' ? 'Warning' : 'Error'
        }`;
        const message = document.createElement('span');
        message.textContent = diagnostic.message;

        item.append(label, message);
        container.appendChild(item);
    });
}

function installGlobalErrorReporter({
    errorBadge,
    badgeIcon,
    diagnostics: diagnosticsContainer,
    diagnosticScope,
}) {
    const w = window;
    const existing = w.__CSUI__ || {};
    let diagnostics = readDiagnostics(diagnosticScope);

    const report = (level, value) => {
        const diagnostic = normalizeDiagnostic(level, value);
        if (!diagnostic) return;

        const last = diagnostics.at(-1);
        if (last?.level === diagnostic.level && last.message === diagnostic.message) return;

        diagnostics = [...diagnostics, diagnostic].slice(-MAX_DIAGNOSTICS);
        persistDiagnostics(diagnostics, diagnosticScope);
        renderDiagnostics(diagnostics, diagnosticsContainer, diagnosticScope);
        syncDiagnosticBadge(diagnostics, errorBadge, badgeIcon);
    };

    w.__CSUI__ = {
        ...existing,
        reportError(err) {
            report('error', err);
        },
        reportWarning(warning) {
            report('warning', warning);
        },
        clearError() {
            diagnostics = [];
            persistDiagnostics(diagnostics, diagnosticScope);
            renderDiagnostics(diagnostics, diagnosticsContainer, diagnosticScope);
            syncDiagnosticBadge(diagnostics, errorBadge, badgeIcon);
        },
        clearDashboardDataDiagnostics() {
            const nextDiagnostics = clearTransientDashboardDiagnostics(
                diagnostics,
                diagnosticScope
            );
            if (nextDiagnostics.length === diagnostics.length) return;

            diagnostics = nextDiagnostics;
            renderDiagnostics(diagnostics, diagnosticsContainer, diagnosticScope);
            syncDiagnosticBadge(diagnostics, errorBadge, badgeIcon);
        },
    };
}

function clearTransientDashboardDiagnostics(diagnostics, scope) {
    if (scope !== 'webshare:dashboard') return diagnostics;

    const nextDiagnostics = diagnostics.filter(
        (diagnostic) => !isTransientDashboardDiagnostic(diagnostic)
    );
    if (nextDiagnostics.length !== diagnostics.length) {
        persistDiagnostics(nextDiagnostics, scope);
    }
    return nextDiagnostics;
}

function isTransientDashboardDiagnostic(diagnostic) {
    const message = diagnostic?.message || '';
    return (
        /\b(?:data|state|meter(?:\s+(?:data|readings?))?)\b.*\b(?:not\s+available|unavailable|timed?\s*out)\b/i.test(
            message
        ) ||
        /(?:csui-)?consumption chart|csui-consumption-chart|failed to resolve module specifier/i.test(
            message
        )
    );
}

function getDiagnosticScope(ctx) {
    const currentContext = ctx || getCurrentContext();
    if (currentContext?.isSewerPaymentsChatt) return 'landing';
    if (currentContext?.isChattWebShare) {
        return `webshare:${currentContext.pageType || 'other'}`;
    }
    return 'other';
}

function getCurrentContext() {
    try {
        return getChattContext(window.location);
    } catch {
        return null;
    }
}

function getDiagnosticsStorageKey(scope) {
    return `${STORAGE_KEY_DIAGNOSTICS}:${scope}`;
}

function getDiagnosticScopeLabel(scope) {
    const labels = {
        landing: 'Landing page',
        'webshare:dashboard': 'Dashboard',
        'webshare:login': 'Sign-in page',
        'webshare:forgot-username': 'Username recovery',
        'webshare:new-user': 'Registration',
        'webshare:guest-pay': 'Guest payment',
    };
    return labels[scope] || 'Extension';
}

function normalizeDiagnostic(level, value) {
    const message = value?.message ? String(value.message) : String(value || '');
    if (!message) return null;
    return {
        level: level === 'warning' ? 'warning' : 'error',
        message: message.replace(/\s+/g, ' ').trim().slice(0, 240),
    };
}

function getExtensionVersion() {
    try {
        const runtime =
            typeof chrome !== 'undefined'
                ? chrome.runtime
                : typeof browser !== 'undefined'
                  ? browser.runtime
                  : null;
        return runtime?.getManifest?.().version || '0.1.0';
    } catch {
        return '0.1.0';
    }
}

/** Tiny helpers */

function escapeAttr(url) {
    return String(url).replace(/"/g, '&quot;');
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
