# Chrome Web Store reviewer instructions

Last updated: September 16, 2026. Prepared for extension version 0.1.0.

## Maintainer: prepare each submission

This file is the maintained source for the Chrome Web Store Developer Dashboard's **Test
instructions** field. Copy the reviewer section below into that field after updating the access
status. This file is not included in the runtime ZIP by the current packaging script, and putting
instructions in a ZIP is not a substitute for completing the dashboard field.

- Verify the instructions against the exact ZIP being submitted and update the version above.
- Replace the access-status paragraph below with the actual arrangement. State which features and
  account scenarios are available, any restrictions, and the access expiry date.
- Enter authorized test credentials and any sign-in requirements directly in the reviewer-only
  dashboard fields. Never commit passwords, session cookies, real customer records, or private
  statement URLs to this file or the repository.
- Verify access from a fresh browser session. Keep it available throughout review and any follow-up.
- Provide a redacted walkthrough video and replace the video-link placeholder below before
  submission. Check every frame for personal information, account identifiers, statement URLs,
  and payment details, and verify that reviewers can open the link.
- Refresh the public steps, expected results, and source map whenever functionality changes.
- Keep store images and captions in `.local/store-assets/v<VERSION>/` as described in the README's
  **Store images and captions** section. Release preparation stages them beside the submission
  documents; they are separate from the walkthrough video and runtime ZIP.

Creating these instructions does not establish authenticated access. No provider test account or
sanctioned sandbox has been arranged. A bundled synthetic demo is available through Extension options.

## Reviewer section — copy into the submission

### Purpose and supported environment

Chattanooga Sewer UI Enhancer is an independent desktop Chrome extension. It improves presentation
on the Chattanooga landing page at https://www.sewerpayments.com/chattanooga and the Chattanooga
tenant of https://share.dwcorp.com/WebShare/ (also matching lowercase /webshare/).

The WebShare URL must contain clientKey=3652. viewID=3 is customary but is not required by the
extension. The extension has no toolbar popup; its live control appears inside supported pages.
Its Extension options page opens the synthetic dashboard demo described below.

The underlying portal owns authentication, account records, payment processing, and account-change
workflows. The extension is not affiliated with the City or the portal provider.

### Access status and limits

Authenticated test access has not yet been arranged. Public pages can be reviewed using the steps
below. A new portal login alone may not provide a linked sewer account, statements, balances, or
meter readings. Account registration and linking requirements are controlled by the portal and
have not been verified here. Reviewers should not need a local address or invent account details.

The bundled demo provides synthetic accounts and consumption history for interactive dashboard UI
review without credentials or a local address. Live statement retrieval, authentication, Angular
integration, and authenticated modals still require an authorized portal account for interactive
testing. The redacted walkthrough video below supplements the demo with recorded portal behavior.
The demo and video do not establish that live integration has passed review.

### Walkthrough video

**Video link:** [REPLACE WITH ACCESSIBLE WALKTHROUGH VIDEO URL BEFORE SUBMISSION]

The video shows the submitted extension version, the populated dashboard, tab changes, enhancement
toggles, and portal modal opening/cancellation. Personal and account identifiers are visually masked.
Any unavailable scenarios are explained in the recording. Use the synthetic demo below for
interactive exploration; the video does not provide authenticated access or verify payment outcomes.

### Synthetic dashboard — no login or local account needed

1. Open chrome://extensions, find Chattanooga Sewer UI Enhancer, choose Details, then Extension
   options. The clearly labelled synthetic demo opens in its own tab. If Extension options is
   missing after a development update, reload the installed extension first.
2. Explore the three invented accounts. Two have distinct synthetic meters and readings; the
   inactive account has empty statements, messages, and consumption history.
3. Switch account-detail tabs and meter tabs. Expand View Readings Table and compare the chart.
   Statement links open the same clearly labelled local sample document in a new tab.
4. Use Dashboard state to view populated accounts, an unavailable balance, no accounts, and loading.
   These are deliberate scenarios, not requests waiting for a real service.
5. In the populated dashboard, open Preferences and change a setting. The Preference action result
   control chooses Not confirmed or Error. These reproduce display states without saving anything.
   Reset demo clears simulated changes and restores the initial account and tabs.
6. Open Pay Now, Update Profile, Change Password, or Sign Out. Each opens a native dialog explaining
   the simulation; close it with its button or Escape. These dialogs are not replicas of portal forms.
7. Reload or reset the demo to start again. No credentials, payment information, or real addresses
   are requested. Fixtures are hardcoded and changes remain in memory. Network connections are
   blocked by the demo page policy; support links may navigate to external services when followed.

The demo uses the same createDashboardView renderer and bundled Chart.js module as the live UI.
It bypasses the MAIN-world bridge and all real portal actions. Source: src/scripts/demo.js; packaged
entry: public/demo/index.html. It is included in the submitted product and available to all users.

### Public pages — no sewer account required for viewing

1. With the submitted extension installed and enabled, open
   https://www.sewerpayments.com/chattanooga.
2. Open the in-page Chatt Sewer UI control near the top-right corner. Switch enhancements off and
   on. Expect the enhanced layout to revert and return without submitting forms or navigating away.
3. Follow the landing page's sign-in link to WebShare. Confirm clientKey=3652 remains in the URL.
   Expect the sign-in form to be restyled while retaining the portal's original controls.
4. Follow available registration, username-recovery, and guest-payment links. Inspect presentation
   and keyboard access, and compare with enhancements off. Viewing these forms does not require
   creating an account. Do not submit invented customer information or trigger recovery emails.
5. Reload a supported page after disabling the theme. The preference should persist on that origin;
   the landing site and WebShare store preferences separately.

### Authenticated dashboard — requires supplied authorized access

Use these steps only when the submission provides suitable access. On a real account, limit review
to viewing and opening/cancelling dialogs. Do not submit payments, change credentials, delete saved
payment methods, or toggle billing settings. Billing-setting changes may save immediately.

Execute write tests only in a provider-approved test environment explicitly designated for them.

1. Sign in through the portal with the supplied credentials. Expect the enhanced dashboard after
   account data loads. If acquisition fails, the original dashboard should remain available.
2. Compare account identity, balance, and amount due with the original dashboard using the in-page
   toggle. Missing or invalid balances should display “Unavailable,” not a zero balance. The
   extension may infer inactivity for zero-due accounts with no payment for roughly 18 months;
   the account-status information explains that inference.
3. If multiple accounts are supplied, switch between them. Confirm identity and related details
   follow the selected account. Some data loads asynchronously.
4. Open Statements. Available statements should belong to the selected account and open in a new
   tab. Close the statement tab to return. Statement data is requested from the portal for that
   account rather than copied from an unowned Angular or DOM collection.
5. If meter readings are available, inspect the consumption chart and expand “View Readings Table.”
   Confirm the dates and values correspond. If multiple meters exist, switch meter tabs.
6. Inspect Messages and Preferences. Options depend on portal capabilities. In an authorized write-test
   environment only, a preference change may show “Not confirmed”: complete the portal steps and
   reload to verify the saved value. The old displayed value remains until then; the control is
   disabled while unconfirmed. Detected failures show an error instead of claiming success.
7. Where available, open Pay Now, Update Profile, and Change Password, then cancel or close without
   submitting. Expect the portal's own dialogs with enhanced styling. Check keyboard navigation and
   that closing a dialog restores access to the dashboard.
8. Toggle enhancements off and on, including while a modal is open. Expect the original interface
   when off. An existing payment row retains its original due snapshot across toggles; editing the
   payment amount must not redefine the displayed amount due. Test amount editing only where the
   supplied access explicitly permits it, and do not submit a payment.
9. Sign out using the portal control.

### Data handling and implementation map

- The extension reads portal account data and makes authenticated requests to the existing portal.
  It has no developer-operated account-data endpoint, analytics SDK, or credential store.
- Persistent site storage holds the theme preference and up to three diagnostics per portal area.
  Clearing portal site data removes these; uninstalling the extension alone does not.
- JavaScript, Chart.js, text fonts, and icon fonts are bundled. Font loading does not contact Google
  Fonts. User-followed support/contribution links lead to third-party sites.
- manifest.json declares the supported sites and packaged resources. public/main.js contains the
  isolated content script; public/csui-modern-bridge.js runs in MAIN world to integrate with the
  portal's AngularJS state and methods. public/csui-consumption-chart.js is a packaged lazy module.
- Source counterparts are src/scripts/main.js, src/scripts/modern/bridge/page-bridge.js,
  src/scripts/modern/components/dashboard-view.js, and src/scripts/modern/modal-integration.js.
  The source repository is https://github.com/jtfridsma/chatt-sewer-ui. Source and automated tests
  supplement the submitted bundle; they do not establish live account access or transaction success.

## Maintainer: options for authenticated review

1. **Preferred: provider-approved test access.** Ask the portal operator for a dedicated account with
   synthetic linked premises, statements, and meters, and a safe way to exercise billing workflows.
   Availability is unknown. If the operator offers a separate sandbox, verify compatibility with the
   submitted build: the current manifest does not cover arbitrary sandbox hosts.
2. **Possible alternative: authorized, restricted real-account access.** Only use this if the provider
   and account owner permit it and the account can be shared safely. Read-only access, if supported,
   may cover viewing but will not verify write workflows. Do not assume a personal account with saved
   payment methods is an appropriate reviewer account.
3. **Available fallback: the bundled synthetic demo.** Use the reviewer steps above to demonstrate
   layout, tabs, charts, and representative states without customer data. It is transparent and
   available to all users in the submitted product. It cannot prove real login, Angular integration,
   portal requests, the host's modal behavior, or payment outcomes.
4. **Supplement: a redacted walkthrough recording.** Show the exact submitted version, populated
   dashboard, tab changes, and modal opening/cancellation. Explain unavailable scenarios. A recording
   helps communicate functionality but is not guaranteed to replace interactive access.

Do not rely on a cursory code review or assumed behavior as an approval strategy. Google says the
Test instructions step is optional, but also reserves the right to reject when it cannot determine
the extension's full functionality. If access cannot be arranged, disclose that limitation and
provide the strongest available evidence; seek Chrome Web Store support guidance rather than
claiming a demo, video, or code inspection guarantees approval.

## Official references

- [Provide test instructions](https://developer.chrome.com/docs/webstore/cws-dashboard-test-instructions)
- [Manifest V3 requirements](https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements)
- [Chrome Web Store review process](https://developer.chrome.com/docs/webstore/review-process)
