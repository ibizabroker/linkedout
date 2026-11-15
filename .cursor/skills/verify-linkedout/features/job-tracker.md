# Job tracker

The popup shows a `Job tracker` section below `Blocked companies`, only in a build made with `WXT_GOOGLE_CLIENT_ID` and `WXT_EXTENSION_KEY` set. Disconnected, it reads `Save every job you apply to in a Google Sheet.` with a `Connect Google Sheets` button that reads `Connecting…` and is disabled while Google's sign-in is open. Connected, it reads `Tracking to LinkedOut Job Tracker` with an `Open sheet` link and a `Disconnect` button. If the stored sheet was deleted or trashed, it reads `Sheet not found.` with `Create a new one` and `Disconnect`. Connected, it also reads `N jobs added` once a row has been written, and `N jobs waiting to sync` while rows are queued. When the queue cannot be written because Google sign-in expired, it adds `Google sign-in expired.` in red with a `Reconnect` button. A build without the two values has no section.

## Sub-features

- `tracker-hidden` builds without `.env` and shows no `Job tracker` text or buttons.
- `tracker-disconnected` shows the description and the `Connect Google Sheets` button below `Blocked companies (0)`.
- `tracker-connect-pending` clicks the button; it becomes a disabled `Connecting…` while the sign-in is open.
- `tracker-connect-ends` leaves the sign-in unanswered; within about two minutes the button returns to `Connect Google Sheets` with no error line.
- `tracker-connected` shows `Tracking to LinkedOut Job Tracker`, an `Open sheet` link that opens the sheet in a new tab, and `Disconnect`.
- `tracker-check-failure` reopens the popup while connected with Google unreachable or signed out; it stays Connected and never shows `Sheet not found.`
- `tracker-disconnect` clicks `Disconnect`; the button returns and storage holds `sheet: null`.
- `tracker-unreadable` stores a malformed `tracker` document; the section reads as Disconnected.
- `tracker-added-count` seeds three written job ids; the section reads `3 jobs added`, and `1 job added` for one. At zero the line is absent.
- `tracker-waiting` seeds an outbox of two rows; the section reads `2 jobs waiting to sync`, and `1 job waiting to sync` for one.
- `tracker-auth-expired` seeds an outbox of one row; the section reads `1 job waiting to sync`, `Google sign-in expired.`, and a `Reconnect` button. In Playwright Chromium the background cannot get a Google token, so opening the popup with a queued row sets this state by itself.
- `tracker-detect-applied` needs a LinkedIn session. With the tracker seeded as connected, a Jobs results page with an Applied card, a `/jobs/view/<id>/` page, and a collections page with a job that reads `Applied …` each make the content script request the application details, posting, and place batches for that job. An application older than 30 minutes writes nothing.
- `tracker-real-google` needs a real Chrome profile signed in to Google. It covers the first connect creating the sheet, reconnect reusing it, a trashed sheet showing `Sheet not found.`, and `Create a new one`. It also covers the real append: apply to a job (Easy Apply, or answer Yes to `Did you finish applying?` after applying on the company site), reopen the sheet, and see one row with the application time, `Applied via`, and workplace; applying to the same job again or reloading adds no second row. It cannot be driven here.

## How to get to it (user POV)

- Open the LinkedOut toolbar action popup. Verification opens `popup.html` in the loaded extension.

## Driving it with control-linkedout

Preconditions:

- A copy of `.env` with both values filled in, so the build carries `oauth2`. Without it only `tracker-hidden` applies.
- A healthy launch for `$LINKEDOUT_VERIFY_RUN_ID` (`doctor` reports `ok: true` and `headingVisible: true`).

- **Open popup.** Run `bun run verify:control -- open-popup --run-id "$LINKEDOUT_VERIFY_RUN_ID"`. The heading `LinkedOut` is visible.
- **Read the disconnected section.** Run `bun run verify:control -- snapshot --run-id "$LINKEDOUT_VERIFY_RUN_ID" --path .cursor/skills/verify-linkedout/artifacts/job-tracker/disconnected.aria.txt`. The snapshot ends with paragraph `Job tracker`, paragraph `Save every job you apply to in a Google Sheet.`, and button `Connect Google Sheets`, after button `Blocked companies (0)`.
- **Start a connect.** Run `bun run verify:control -- click --run-id "$LINKEDOUT_VERIFY_RUN_ID" --role button --name "Connect Google Sheets"`. A snapshot to `.cursor/skills/verify-linkedout/artifacts/job-tracker/connecting.aria.txt` shows button `Connecting…` with `[disabled]`.
- **Proof.** Screenshot with `bun run verify:control -- screenshot --run-id "$LINKEDOUT_VERIFY_RUN_ID" --path .cursor/skills/verify-linkedout/artifacts/job-tracker/disconnected.png`. It shows the `LinkedOut` heading.
- **Hidden build.** Move `.env` aside, run `bun run build`, then `launch --no-build` and `open-popup`. A snapshot has no `Job tracker` paragraph. Restore `.env` afterward.

## Gotchas

- Playwright Chromium has no Google account. `Connect Google Sheets` opens a Google sign-in tab and waits. Nothing in the harness can finish it, and closing the tab does not end it. The popup returns to `Connect Google Sheets` only when the background gives up after two minutes, so wait about 130 seconds and poll with `snapshot` before judging `tracker-connect-ends`.
- Click `Connect Google Sheets` once per launch. A second launch has a fresh profile, but a pending sign-in in the same run keeps the button disabled.
- `control-linkedout` cannot seed storage. For `tracker-connected`, `tracker-check-failure`, `tracker-disconnect`, and `tracker-unreadable`, use a Playwright script like the blocked-companies one: open `popup.html` from the loaded extension, then `chrome.storage.local.set({ tracker: { version: 1, sheet: { spreadsheetId: 'seed_ID-1', url: 'https://docs.google.com/spreadsheets/d/seed_ID-1/edit' } } })` from the extension page. The popup follows storage and shows Connected. A `url` that is not the link for its `spreadsheetId` reads as Disconnected.
- The seeded sheet does not exist in Drive. In this harness the connected check cannot reach Google either, so it fails and the popup stays Connected. `Sheet not found.` never appears here.
- Seed storage for the new lines with `chrome.storage.local.set` from `popup.html`: `tracker: { version: 2, sheet: {…}, connectedAt: <ms> }`, `tracker-written: { version: 1, jobIds: ['1','2'] }`, `tracker-outbox: { version: 1, entries: [{ jobId: '4', row: ['…'] }], failures: 0 }`, and optionally `tracker-auth-expired: true`. A `tracker` document with `version: 1` reads as Disconnected.
- A seeded outbox row is really sent: the background tries to append it when the popup opens, fails to get a token in this harness, and keeps the row. Do not seed a row you would mind being written.
- Never print the client ID, the manifest key, or the extension ID in notes or artifacts.
