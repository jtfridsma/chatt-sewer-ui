---
name: sync-demos
description: Synchronize the chatt-sewer-ui public and local demos when explicitly requested. Do not invoke for ordinary app changes or unsolicited discrepancy audits.
---

Work from the repository root. Invoke only on an explicit demo maintenance request, including `$sync-demos`. An invocation authorizes syncing the current public and available local enhanced demos unless the user narrows the scope. An audit-only request authorizes inspection and reporting, not edits.

## Sources and outputs

| Surface                          | Maintained source                                                                                         | Output / verification                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Public extension-options demo    | `src/scripts/demo.js`, `public/demo/`, shared renderer in `src/scripts/modern/components/` and its styles | Root `build.mjs` generates `public/demo.js`; `test/demo.test.js` covers the demo                            |
| Local enhanced demo              | `.local/demos/build.mjs`, `modals.js`, `modals.css` in that directory, plus public/shared sources         | The local builder generates `dashboard.html` and `statement.html`; `check.mjs` verifies them                |
| Local original-portal comparison | `.local/demos/dashboard-old.html`, including its captured CSS, modal templates, and local script          | Maintained directly; `.local/demos/check-old.mjs` verifies it; the local builder does **not** regenerate it |

`.local/` is intentionally untracked and may not exist in another checkout. If it is missing, complete the available requested work and report that local syncing was skipped. Do not recreate missing captures, remove the ignore rule, or force-add local files.

## Preserve the purpose of each demo

- Reuse the shared renderer; change demo-specific adapters only where they no longer represent the app. Edit maintained source before rebuilding generated output. The local builder performs literal replacements against `src/scripts/demo.js`; confirm those replacements still apply after source changes.
- Keep the public demo's explicit synthetic labeling, scenario controls, bundled assets, and simulated actions. Local demos intentionally hide that banner and use more realistic invented fixtures and reference dialogs. Do not copy those presentation choices into the public demo.
- Keep payments, profile/password updates, billing changes, and sign-out simulated. Do not introduce live account data, portal APIs, authentication, or transaction calls. Google font loading in the local pages is intentional; preserve the distinction between asset loading and blocked application requests.
- Local pages reference `images/dashboard-logo.png`. Text and Material Symbols fonts use Google assets; original-portal Glyphicons and ui-grid fonts reference local `fonts/` files.
- Preserve local comparison fixtures unless the user asks to change them: Audrey Smith; Market St account `006184295-01` (highest), Main St account `006073842-01`, Frazier Ave account `005962731-01`; addresses `218 Market St`, `74 E Main St #3`, and `305 Frazier Ave`. Keep shared balances, readings, and dates consistent between local pages. Old statement labels encode their date, e.g. `260831 CHA 77 2026-0831 Statement`, while links remain local.
- Freeze the old portal's captured layout, responsive quirks, and modal styling. App redesigns are not discrepancies in that baseline. Only update its shared fixtures, logo, extension control, or reference defects when that scope is explicitly requested. Its extension control stays off; the enhanced reference starts on.
- A fresh live capture is a separate explicit request. Do not visit the authenticated portal or perform live actions as part of routine demo synchronization.

## Verify and finish

1. Compare the requested app changes with the affected demo adapters and presentation. Make only the necessary source changes; preserve unrelated work.
2. Rebuild the affected outputs. For public demo JavaScript, use `npm run build:js`; use the normal CSS build if relevant. For the local enhanced page, run `node .local/demos/build.mjs`.
3. Run `node --test test/demo.test.js` for public changes. For available local pages, run `node .local/demos/check.mjs` and `node .local/demos/check-old.mjs` as relevant. Extend existing checks for changed behavior. JSDOM's canvas warnings do not prove a rendered chart works.
4. Visually inspect changed layouts at desktop and mobile sizes, plus affected dialogs, using a permitted local preview. Wait for Google fonts before comparison screenshots. If browser verification is blocked, report that limitation without claiming visual fidelity was verified.
5. Report the surfaces updated, intentional baseline differences, skipped/missing local assets, and checks performed. Stop after the requested synchronization. Do not add watchers, automatic sync hooks, or scheduled audits; this skill does not authorize publishing or release.
