---
name: prepare-release
description: Prepare a chatt-sewer-ui release by bumping its version, synchronizing release references, and validating the local package.
---

Work from the repository root. Use the user's requested numeric version or bump type; ask if unspecified. If already bumped for this release, do not bump again.

1. Run `npm version <version|patch|minor|major> --no-git-tag-version`. The version hook syncs `manifest.json`; npm updates `package.json` and `package-lock.json`. Reject prerelease suffixes before running. If the hook fails, inspect all three files before retrying: npm may already have updated its files.
2. Search tracked source and documentation for the old release number. Update current-release references, especially the version/date in `TEST_INSTRUCTIONS.md`, README instructions, and version fallbacks in `src/scripts/components/theme-toggle.js`. Preserve history, dependency versions, and unrelated examples. The toggle normally reads the runtime manifest; do not replace that with a hardcoded version.
3. Run `npm run package`. Confirm the three version files agree and review the generated ZIP's version and current reviewer instructions. Keep README prose unwrapped. Do not claim live portal/reviewer checks were performed unless actually verified.
4. Report the version, changed references, checks, and ZIP path. Preparing a release does not authorize committing, tagging, pushing, publishing, or changing production configuration.
