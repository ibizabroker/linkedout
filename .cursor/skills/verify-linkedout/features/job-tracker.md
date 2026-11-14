# Job tracker

The popup shows a `Job tracker` section below `Blocked companies`, only in a build made with `WXT_GOOGLE_CLIENT_ID` and `WXT_EXTENSION_KEY` set. Disconnected, it reads `Save every job you apply to in a Google Sheet.` with a `Connect Google Sheets` button that reads `Connecting…` and is disabled while Google's sign-in is open. Connected, it reads `Tracking to LinkedOut Job Tracker` with an `Open sheet` link and a `Disconnect` button. If the stored sheet was deleted or trashed, it reads `Sheet not found.` with `Create a new one` and `Disconnect`. A build without the two values has no section.

## Sub-features

- `tracker-hidden` builds without `.env` and shows no `Job tracker` text or buttons.
- `tracker-disconnected` shows the description and the `Connect Google Sheets` button below `Blocked companies (0)`.
- `tracker-connect-pending` clicks the button; it becomes a disabled `Connecting…` while the sign-in is open.
- `tracker-connect-ends` leaves the sign-in unanswered; within about two minutes the button returns to `Connect Google Sheets` with no error line.
- `tracker-connected` shows `Tracking to LinkedOut Job Tracker`, an `Open sheet` link that opens the sheet in a new tab, and `Disconnect`.
- `tracker-check-failure` reopens the popup while connected with Google unreachable or signed out; it stays Connected and never shows `Sheet not found.`
- `tracker-disconnect` clicks `Disconnect`; the button returns and storage holds `sheet: null`.
- `tracker-unreadable` stores a malformed `tracker` document; the section reads as Disconnected.
- `tracker-real-google` needs a real Chrome profile signed in to Google. It covers the first connect creating the sheet, reconnect reusing it, a trashed sheet showing `Sheet not found.`, and `Create a new one`. It cannot be driven here.

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
- Never print the client ID, the manifest key, or the extension ID in notes or artifacts.
