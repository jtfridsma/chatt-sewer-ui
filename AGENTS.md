# Repository instructions

- Never push to `main`, merge a pull request, publish a production deploy, or change production configuration/secrets without explicit user approval for that exact action. Approval to implement or test is not approval to release.
- Demo maintenance is opt-in. During ordinary app work, if you notice a concrete discrepancy in the public demo or local demos, briefly describe it and ask whether to sync. Continue the authorized app work; do not edit demo-specific fixtures, presentation, or local snapshots without that request. Do not run an unsolicited demo audit.
- An explicit request to sync demos (including `$sync-demos`) authorizes the matching maintenance; do not ask again for the same scope. Follow [.agents/skills/sync-demos/SKILL.md](.agents/skills/sync-demos/SKILL.md). Existing builds may still regenerate shared bundles; shared renderer changes naturally affect the public demo. This rule concerns additional demo-specific work.
- Treat `.local/demos/dashboard-old.html` as a historical original-portal reference, not a page to modernize. Keep `.local/` ignored by Git.
