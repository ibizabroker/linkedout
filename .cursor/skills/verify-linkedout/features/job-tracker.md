# Job tracker

The popup shows a `Job tracker` group below `Applicant count`, only in a build made with `WXT_GOOGLE_CLIENT_ID` and `WXT_EXTENSION_KEY` set. Actions are ink keys with a blue icon. Not connected, it is one `Sheet` row with a right-aligned `Connect Google Sheets` key, which reads `Connecting…`, is disabled and shows a tint sweep while Google's sign-in is open. Connected, it has a `Sheet` row with the sheet name and an icon-only `Open sheet` link, and a `Status` row reading `N jobs added`, plus `· N waiting` while rows are queued. There is no Disconnect in the popup. If the stored sheet was deleted or trashed, the row reads `Sheet` / `Not found` with a right-aligned `New sheet` key (`Creating…` while it runs). The readout line at the top shows `Tracked N`, plus `· N waiting`, while the tracker is connected. When the queue cannot be written because Google sign-in expired, a line under the message line reads `Google sign-in expired.` in red with a `Reconnect` key (`Reconnecting…` while it runs). The same actions, plus `Disconnect`, live on the settings page `Account` pane. A build without the two values has no section and no `Account` item.

## Sub-features

- `tracker-hidden` builds without `.env` and shows no `Job tracker` text or buttons.
- `tracker-disconnected` shows the `Sheet` row and the `Connect Google Sheets` key below `Applicant count`.
- `tracker-connect-pending` clicks the button; it becomes a disabled `Connecting…` while the sign-in is open.
- `tracker-connect-ends` leaves the sign-in unanswered; within about two minutes the button returns to `Connect Google Sheets` with no error line.
- `tracker-connected` shows the `Sheet` row with `LinkedOut Job Tracker` and an `Open sheet` link that opens the sheet in a new tab, and the `Status` row.
- `tracker-check-failure` reopens the popup while connected with Google unreachable or signed out; it stays Connected and never shows `Not found`
- `tracker-disconnect` clicks `Disconnect` on the settings page `Account` pane; the key returns as `Connect Google Sheets` and storage holds `sheet: null`.
- `tracker-unreadable` stores a malformed `tracker` document; the section reads as Disconnected.
- `tracker-added-count` seeds three written job ids; the `Status` row reads `3 jobs added`, the readout reads `Tracked 3`, and `1 job added` for one.
- `tracker-waiting` seeds an outbox of two rows; the `Status` row reads `0 jobs added · 2 waiting` and the readout `Tracked 0 · 2 waiting`, and `1 waiting` for one.
- `tracker-auth-expired` seeds an outbox of one row; the `Status` row reads `· 1 waiting`, and the line `Google sign-in expired.` with a `Reconnect` key shows at the top. In Playwright Chromium the background cannot get a Google token, so opening the popup with a queued row sets this state by itself.
- `tracker-detect-applied` needs a LinkedIn session. With the tracker seeded as connected, a Jobs results page with an Applied card, a `/jobs/view/<id>/` page, and a collections page with a job that reads `Applied …` each make the content script request the application details, posting, and place batches for that job. An application older than 30 minutes writes nothing.
- `tracker-real-google` needs a real Chrome profile signed in to Google. It covers the first connect creating the sheet, reconnect reusing it, a trashed sheet showing `Not found`, and `New sheet`. It also covers the real append: apply to a job (Easy Apply, or answer Yes to `Did you finish applying?` after applying on the company site), reopen the sheet, and see one row with the application time, `Applied via`, and workplace, in plain (not bold) text, with Status set from its dropdown and Last update a date that opens a date picker; applying to the same job again or reloading adds no second row. It cannot be driven here.

## How to get to it (user POV)

- Open the LinkedOut toolbar action popup. Verification opens `popup.html` in the loaded extension.

## Driving it with control-linkedout

Preconditions:

- A copy of `.env` with both values filled in, so the build carries `oauth2`. Without it only `tracker-hidden` applies.
- A healthy launch for `$LINKEDOUT_VERIFY_RUN_ID` (`doctor` reports `ok: true` and `headingVisible: true`).

- **Open popup.** Run `bun run verify:control -- open-popup --run-id "$LINKEDOUT_VERIFY_RUN_ID"`. The heading `LinkedOut` is visible.
- **Read the disconnected section.** Run `bun run verify:control -- snapshot --run-id "$LINKEDOUT_VERIFY_RUN_ID" --path .cursor/skills/verify-linkedout/artifacts/job-tracker/disconnected.aria.txt`. The snapshot ends with group `Job tracker`, containing text `Sheet` and button `Connect Google Sheets`, after group `Applicant count`.
- **Start a connect.** Run `bun run verify:control -- click --run-id "$LINKEDOUT_VERIFY_RUN_ID" --role button --name "Connect Google Sheets"`. A snapshot to `.cursor/skills/verify-linkedout/artifacts/job-tracker/connecting.aria.txt` shows button `Connecting…` with `[disabled]`.
- **Proof.** Size the tab with `viewport --width 352 --height 640`, then screenshot with `bun run verify:control -- screenshot --run-id "$LINKEDOUT_VERIFY_RUN_ID" --path .cursor/skills/verify-linkedout/artifacts/job-tracker/disconnected-light.png`, run `scheme --scheme dark`, and screenshot to `disconnected-dark.png`. They show the `LinkedOut` heading.
- **Account pane.** `open-options`, then `ext-eval --expression "location.hash='#account'"`. Not connected shows `Google account` with `Connect Google Sheets` and the note. Seeded connected shows `Connected`, `Disconnect`, `Sheet`, `Jobs added`. Seeded with `tracker-auth-expired: true` it also shows `Reconnect` and `Status` `Sign-in expired`, and the nav reads `Needs you`. Screenshots live under `.cursor/skills/verify-linkedout/artifacts/ink-keys/`.
- **Hidden build.** Move `.env` aside, run `bun run build`, then `launch --no-build` and `open-popup`. A snapshot has no `Job tracker` group and the readout has no `Tracked` figure. Restore `.env` afterward.

## Gotchas

- Playwright Chromium has no Google account. `Connect Google Sheets` opens a Google sign-in tab and waits. Nothing in the harness can finish it, and closing the tab does not end it. The popup returns to `Connect Google Sheets` only when the background gives up after two minutes, so wait about 130 seconds and poll with `snapshot` before judging `tracker-connect-ends`.
- Click `Connect Google Sheets` once per launch. A second launch has a fresh profile, but a pending sign-in in the same run keeps the button disabled.
- Seed storage with `ext-eval` (or a Playwright script). For `tracker-connected`, `tracker-check-failure`, `tracker-disconnect`, and `tracker-unreadable`, run `bun run verify:control -- ext-eval --run-id "$LINKEDOUT_VERIFY_RUN_ID" --expression "chrome.storage.local.set(...).then(() => 1)"` on `popup.html`, with `chrome.storage.local.set({ tracker: { version: 1, sheet: { spreadsheetId: 'seed_ID-1', url: 'https://docs.google.com/spreadsheets/d/seed_ID-1/edit' } } })` as the argument. The popup follows storage and shows Connected. A `url` that is not the link for its `spreadsheetId` reads as Disconnected.
- The seeded sheet does not exist in Drive. In this harness the connected check cannot reach Google either, so it fails and the popup stays Connected. `Not found` never appears here; to see it, patch the in-page `chrome.runtime.sendMessage` with an init script so the `check` message replies `{ status: 'missing' }`.
- Seed storage for the count and waiting lines the same way: `tracker: { version: 2, sheet: {…}, connectedAt: <ms> }`, `tracker-written: { version: 1, jobIds: ['1','2'] }`, `tracker-outbox: { version: 1, entries: [{ jobId: '4', row: ['…'] }], failures: 0 }`, and optionally `tracker-auth-expired: true`. A `tracker` document with `version: 1` reads as Disconnected.
- A seeded outbox row is really sent: the background tries to append it when the popup opens, fails to get a token in this harness, and keeps the row. Do not seed a row you would mind being written.
- Never print the client ID, the manifest key, or the extension ID in notes or artifacts.
