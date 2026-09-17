# Chatt Sewer UI

A focused Chrome extension that transforms Chattanooga's legacy sewer payment portals into a clearer, more accessible experience—with a modern account dashboard, streamlined payment workflows, and enhancements that can be disabled at any time.

## What it does

- Injects a compiled stylesheet and bundled content script on:
    - `https://www.sewerpayments.com/chattanooga*`
    - `https://share.dwcorp.com/WebShare/*` and `https://share.dwcorp.com/webshare/*` (scoped to Chattanooga by `clientKey=3652`; `viewID=3` is not required)
- Uses scoped CSS (`html.csui-theme`) to avoid leaking styles outside the target pages.
- Keeps source in `src/` and compiled assets in `public/`.
- Adds an accessible in-page toggle (top-right) labeled “Chatt Sewer UI”.
- Retrieves statements through account-scoped portal requests and opens them in a new tab.
- Provides an expandable readings table beneath each water-consumption chart.
- Bundles Inter, Gabarito, and a Material Symbols Rounded icon subset; font and icon loading makes no external font-service requests.

### Dashboard status messages

After a paperless-billing or automatic-payment change, “Not confirmed” means the extension cannot verify that the portal saved the change. Complete any portal steps, then reload the page to check. The setting retains its previous displayed value and cannot be changed again while unconfirmed. An immediate failure displays “Could not change this setting. Please try again.”

Missing or invalid balances display “Unavailable” rather than zero. Check the original dashboard before making a payment when the extension cannot read your balance.

### Synthetic dashboard demo

No sewer account is needed to explore the bundled demo. After installing or reloading the extension, open `chrome://extensions`, select **Chattanooga Sewer UI Enhancer → Details → Extension options**. The demo opens in a tab and is available to everyone, not just reviewers.

It reuses the production dashboard renderer with invented accounts, balances, statements, and meter readings. Try account and meter tabs, the readings table, the sample statement, and the state controls for loading, no accounts, and unavailable balances. Preference actions simulate “Not confirmed” or an error; **Reset demo** restores the initial state. Changes remain only in page memory.

Payment, profile, password, and sign-out controls open labelled simulations, not real portal forms. The demo makes no portal requests and cannot authenticate, process payments, or change real accounts. Its page policy blocks network connections. User-followed support links can still open external sites. It demonstrates the dashboard UI, not live Angular integration, statement retrieval, or transaction outcomes. The sample statement is a local HTML document, not a real bill or PDF.

Maintain the synthetic fixtures in `src/scripts/demo.js` and the page assets in `public/demo/`. The build generates `public/demo.js`; packaging includes the demo assets as private extension pages without adding host or API permissions.

## Quick start (Chrome / Chromium)

1. Install dependencies: `npm install`
2. Build once: `npm run build`  
   Or watch during development: `npm run dev` (parallel CSS + JS watch)
3. Load the extension:

- Open `chrome://extensions`
- Enable “Developer mode”
- Click “Load unpacked” and select this repository folder

4. Visit a supported page and refresh to see the new styles.

Notes:

- Styles compile from `src/styles/main.scss` to `public/main.css` (Sass).
- JS bundles from `src/scripts/main.js` to `public/main.js` (esbuild).
- Compiled files in `public/` are generated locally and are not committed.
- Bundled fonts and their licenses are committed in `public/fonts/`: Inter and Gabarito use the SIL Open Font License; Material Symbols uses Apache License 2.0. See `public/fonts/MaterialSymbols-README.txt` before adding icons to the subset.
- While `npm run dev` is running, reload the target page to see updates (Chrome may require reloading the extension after JS changes).

## Recording-only redaction helper (macOS)

`pnpm demo` (or `npm run demo`) copies `scripts/recording-redaction.js` to the clipboard;
it does not build the extension, launch the synthetic demo, or inject anything into a browser.

1. Review the preconfigured `pageSelectors` for original portal elements and `dashboardSelectors`
   for elements inside the enhanced dashboard's shadow root. Adjust selectors as needed for the
   views you plan to record. Select text containers; for inputs or images, select a suitable wrapper. Do not put real
   account values or credentials in the script.
2. Run `pnpm demo`, then paste into **DevTools → Sources → Snippets**, save, and run on the portal.
   After editing the file, copy it again and replace the saved snippet.
3. Masks follow matching elements and recreated dashboard roots. Rehearse account switches,
   enhancement toggles, and modals before recording. These are visual masks, not data removal;
   URLs, separate statement tabs, and iframe contents are not covered.
4. Rerun the saved snippet after a full page reload. To remove masks without reloading, run
   `window.csuiRecordingRedaction?.stop()` in the console. To reapply after stopping, rerun the
   saved snippet; stopping removes the helper API.

The helper stays in `scripts/`, outside the build entry points and the packager's selected
`public/` assets. Do not import it from extension source or add it to the manifest. Private
local notes belong under the Git-ignored `.local/` directory.

## Project rules

- Keep it plain JavaScript. No framework, no TypeScript, no runtime abstraction layer.
- Prefer scoped CSS under `html.csui-theme` plus page-specific classes.
- Visual and structural content-script changes should be idempotent and reversible when the enhancement toggle is turned off. Bundled font resources may remain loaded for the in-page control. The original payment-due snapshot intentionally remains on the modal row across toggles so an edited payment amount does not replace it.
- Favor a few explicit modules over “reusable” infrastructure.

### Squarespace block contracts

The landing-page enhancements intentionally depend on specific Squarespace block IDs. They are required integration contracts, shared by the landing-page JavaScript and Sass, because a semantic fallback could modify the wrong content. If Squarespace regenerates them, the extension reports the missing blocks through its existing error indicator and leaves the affected host content unchanged.

### Inactive account behavior

The modern dashboard intentionally treats a zero-due account with no payment activity for roughly 18 months as inactive, even when the portal does not explicitly mark it inactive. On initial load, the dashboard may select a more active account instead. This opinionated behavior is intended to foreground the account most likely to need payment activity; the account-status tooltip discloses when the inactive label was inferred.

## Project structure

```text
.
├─ manifest.json
├─ public/
│  ├─ main.css
│  ├─ main.js
│  ├─ csui-modern-bridge.js
│  ├─ csui-consumption-chart.js
│  ├─ icons/
│  ├─ favicons/
│  └─ fonts/             # Bundled text/icon fonts, stylesheet, and licenses
└─ src/
   ├─ styles/            # Sass source (tokens, base, components, templates)
   └─ scripts/           # JS source (context detection, class application, toggle)
```

## Scripts

- `npm run build` — builds CSS and JS (`build:*`)
- `npm run build:css` — Sass -> `public/main.css` (compressed)
- `npm run build:js` — esbuild -> `public/main.js` (bundled, minified IIFE)
- `npm run package` — validates, builds, and creates a versioned extension ZIP in `dist/`
- `npm run dev` — watch CSS and JS in parallel
- `npm run dev:css` — watch Sass
- `npm run dev:js` — watch JS (esbuild)
- `npm run lint` — Prettier check
- `npm test` — runs focused unit, integration, and lifecycle tests with Node's test runner, including bridge, settings, modal, balance, readings-table, and bundled-font checks
- `npm run format` — Prettier write

Build toolchain:

- esbuild (`build.mjs`) bundles the main content script, MAIN-world bridge, and lazy Chart.js module
- Sass compiles `src/styles/main.scss`

## Packaging

### Updating the version

1. Run `npm version patch --no-git-tag-version` (or `minor`, `major`, or an exact version).
2. The npm `version` hook syncs `manifest.json` automatically. Update release references in `docs/TEST_INSTRUCTIONS.md`, other documentation, and the version fallbacks in `src/scripts/components/theme-toggle.js`.
3. Review and commit the three version files and updated references together.

Use numeric versions without prerelease suffixes such as `-beta.1`. The flag prevents automatic Git commits and tags. Packaging does not bump versions or publish; rebuild the same release without bumping again.

For agent-assisted preparation, ask: `Use $prepare-release to prepare a patch release.` The [project skill](.agents/skills/prepare-release/SKILL.md) handles the bump, reference updates, package checks, and version-pinned store submission documents without committing or publishing. After packaging, it generates `STORE_LISTING.md`, `STORE_DISCLOSURES.md`, and a copy of `docs/TEST_INSTRUCTIONS.md` in `dist/submission-v<VERSION>/`, beside the ZIP. These contain listing copy, permission/data-use explanations, and reviewer instructions, with unresolved submission details separated from copy-ready text. Running `npm run package` alone does not generate these documents and clears previous output in `dist/`. If the version hook fails, inspect the version files before retrying; npm may already have applied the bump.

### Store images and captions

Keep supplied store screenshots, the store icon, promotional artwork, and `captions.md` in `.local/store-assets/v<VERSION>/` (initial release: `.local/store-assets/v0.1.0/`). Use a numbered list in `captions.md`, with one filename and caption per screenshot in upload order. List other assets separately. This directory is Git-ignored and survives packaging; keep a separate backup of the originals.

The release preparation skill reads that version's assets and captions, includes the captions in `STORE_LISTING.md`, and copies the supplied files to `dist/submission-v<VERSION>/store-assets/` after packaging. Store assets are uploaded separately from the extension ZIP. `npm run package` alone does not copy them and clears previous submission output in `dist/`. For a later release, supply the matching asset directory or explicitly choose an earlier set to reuse.

### Creating the archive

Run `npm run package` to create a distributable extension archive. The command runs formatting and tests through the production build, clears `dist/`, verifies that `manifest.json` and `package.json` versions match, validates every manifest resource, copies only the manifest and referenced runtime files into a clean staging directory, and writes `dist/chatt-sewer-ui-v<VERSION>.zip`.

The ZIP contains `manifest.json` at its root and can be submitted or shared without the source tree, development dependencies, or stale unreferenced build output.

Maintain [reviewer test instructions](docs/TEST_INSTRUCTIONS.md) alongside each release. Before submission, update the access arrangement and copy the reviewer section into the Chrome Web Store Test instructions field. Keep credentials out of the repository. The instructions document is not included in the runtime ZIP; authenticated reviewer access must be arranged separately.
