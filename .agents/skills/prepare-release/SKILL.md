---
name: prepare-release
description: Prepare a chatt-sewer-ui release by bumping its version, synchronizing release references, validating the local package, and generating version-pinned store submission documents.
---

Work from the repository root. Use the user's requested numeric version or bump type; ask if unspecified. If already bumped for this release, do not bump again.

1. Run `npm version <version|patch|minor|major> --no-git-tag-version`. The version hook syncs `manifest.json`; npm updates `package.json` and `package-lock.json`. Reject prerelease suffixes before running. If the hook fails, inspect all three files before retrying: npm may already have updated its files.
2. Search tracked source and documentation for the old release number. Update current-release references, especially the version/date in `docs/TEST_INSTRUCTIONS.md`, README instructions, and version fallbacks in `src/scripts/components/theme-toggle.js`. Preserve history, dependency versions, and unrelated examples. The toggle normally reads the runtime manifest; do not replace that with a hardcoded version.
3. Run `npm run package`. Confirm the three version files agree and review the generated ZIP's version and current reviewer instructions. Keep README prose unwrapped. Do not claim live portal/reviewer checks were performed unless actually verified.
4. After packaging succeeds, generate the submission documents below in `dist/submission-v<VERSION>/`, beside the ZIP. Packaging clears `dist/`, so regenerate these documents after any subsequent package run. Keep them outside the runtime ZIP.
5. Check that each document names the exact version and ZIP filename, matches the packaged manifest and release behavior, and separates copy-ready text from unresolved submission details. Report the version, changed references, checks, ZIP and document paths, and any remaining submission blockers. Preparing a release does not authorize committing, tagging, pushing, publishing, or changing production configuration.

## Submission documents

Generate concise Markdown directly; no generator framework or extra document set is needed. Put the extension version, ZIP filename, and preparation date at the top of each file.

- `STORE_LISTING.md`: Manifest name, short and detailed descriptions, website/support/privacy/terms links, concise screenshot captions where applicable, and user-facing “What's new” notes based on changes since the previous release. If the release baseline is unknown, flag that rather than inventing changes.
- `STORE_DISCLOSURES.md`: Single-purpose explanation, exact content-script match patterns and declared permissions/host permissions (including optional permissions), their necessary user-facing purposes, and release-specific data-use information for submission. Distinguish manifest site scope from runtime Chattanooga tenant checks; do not invent a `storage` permission because the code uses site local storage. Cover account-data access, authenticated portal requests, transmission, persistent storage, and bundled versus remote code/resources as supported by the source. Verify relevant current store fields and requirements against official Chrome Web Store documentation.
- `TEST_INSTRUCTIONS.md`: Copy the maintained `docs/TEST_INSTRUCTIONS.md` with the release metadata. Preserve the reviewer section and actual access limitations; do not fabricate credentials, live verification, or access arrangements. The file in `docs/` remains the maintained source.

Use the packaged manifest, corresponding source, release diff, and maintained repository docs as evidence. Supplied marketing drafts are wording references, not proof of release features or privacy practices. Use **Chatt Sewer UI** in concise copy and the exact manifest name for the store name. Explain that this independent, unofficial extension improves the existing portal's presentation and navigation; the portal retains authentication, account records, and payment processing. Keep extension support distinct from official billing support.

Verify public support/privacy links and compare privacy claims with the release's actual data flows. Do not duplicate or rewrite the legal policy. Keep unverified links, screenshot suitability, unknown release history, and other unresolved details in a short **Maintainer notes — not for submission** section in the relevant file, outside copy-ready fields. Do not claim submission readiness while required details remain unresolved. Omit website inventories, prior validation narratives, and long generic checklists. Screenshot captions do not authorize generating or syncing demo assets.
