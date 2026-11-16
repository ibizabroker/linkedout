# Hide menu

The popup names LinkedOut, shows a readout line of figures, says in a message line when there is something to say, and turns Applied, Viewed, Saved, and Reposted hiding on or off from four switch rows under `Hide from results`. Each row shows its status in a muted label column and `Hidden` or `Shown`. Applied and Viewed start on, and Saved and Reposted start off. The choice is saved as soon as a switch changes.

## Sub-features

- `hide-open` shows the heading `LinkedOut`, the readout, the message `Open a Jobs search to hide cards`, and the group `Hide from results` with four switches on a fresh install.
- `hide-rows` shows switches `Applied` and `Viewed` on with the value `Hidden`, and `Saved` and `Reposted` off with the value `Shown`.
- `hide-clear-applied` turns Applied off and its value reads `Shown`.
- `hide-clear-all` turns Viewed off too, so no hide switch is on.
- `hide-persist` keeps both off after the popup document is opened again.
- `hide-restore` turns Applied and Viewed back on.
- `hide-reposted` turns Reposted on, then off again.
- `hide-saved` turns Saved on, then off again.
- `hide-readout` shows `Hidden here –` off a Jobs list, and the `Blocked` figure once the blocklist is readable.
- `hide-settings` clicks `Open settings`, which opens the settings page in a tab.

## How to get to it (user POV)

- Open the LinkedOut toolbar action popup. Verification opens `popup.html` in the loaded extension, which is not a LinkedIn Jobs search.

## Driving it with control-linkedout

Preconditions:

- A healthy launch for `$LINKEDOUT_VERIFY_RUN_ID` (`doctor` reports `ok: true` and `headingVisible: true`).
- The extension storage for this profile has no saved hide choice, so Applied and Viewed start on.

- **Size the tab.** Run `bun run verify:control -- viewport --run-id "$LINKEDOUT_VERIFY_RUN_ID" --width 352 --height 640`.
- **Open popup.** Run `bun run verify:control -- open-popup --run-id "$LINKEDOUT_VERIFY_RUN_ID"`. The heading `LinkedOut` is visible.
- **Read the rows.** Run `bun run verify:control -- snapshot --run-id "$LINKEDOUT_VERIFY_RUN_ID" --path .cursor/skills/verify-linkedout/artifacts/hide-menu/initial.aria.txt`. The snapshot contains heading `LinkedOut`, button `Open settings`, status `Open a Jobs search to hide cards`, group `Hide from results`, and the switches `Applied [checked]`, `Viewed [checked]`, `Saved`, and `Reposted`, each followed by its `Hidden` or `Shown` value.
- **Clear Applied.** Run `bun run verify:control -- click --run-id "$LINKEDOUT_VERIFY_RUN_ID" --role switch --name "Applied"`. Snapshot to `.../hide-menu/cleared-applied.aria.txt`. Switch `Applied` is not checked and reads `Shown`, and `Viewed` is still checked.
- **Clear Viewed.** Run the same click with `--name "Viewed"`. Snapshot to `.../hide-menu/cleared-all.aria.txt`. None of the four switches is checked.
- **Reopen.** Run `open-popup` again. Snapshot to `.../hide-menu/reopened.aria.txt`. Both switches are still off.
- **Turn both back on.** Click switch `Applied`, then switch `Viewed`. Snapshot to `.../hide-menu/restored.aria.txt`. Both are checked and `Saved` is not.
- **Turn Saved and Reposted on and off.** Click switch `Saved`, snapshot to `.../hide-menu/saved-on.aria.txt` (checked, `Hidden`), click it again, and snapshot to `.../hide-menu/saved-off.aria.txt` (not checked, `Shown`). Repeat with `Reposted`.
- **Proof.** Screenshot with `bun run verify:control -- screenshot --run-id "$LINKEDOUT_VERIFY_RUN_ID" --path .cursor/skills/verify-linkedout/artifacts/hide-menu/light.png`, then run `scheme --scheme dark` and screenshot to `dark.png`. Both show the `LinkedOut` heading.

## Gotchas

- Reposted hiding itself needs a logged-in LinkedIn Jobs search and real job pages, so this recipe only proves the row and the saved choice. Checks stay off until Reposted is on. Keep live runs short: with Reposted on, every page load sends one `voyagerJobsDashJobPostings` request per up to 25 listed cards, as soon as the cards appear, with no cache on that path, so a reload sends a fresh request. There are no `/jobs/view/` requests and no `repost-cache` writes unless the batch answered 403, a server error, or an unreadable body (then one download per job, about a second apart, with cache writes; a 429, 999, or network error pauses checks instead). To check live, count those requests in the network log and confirm each hidden card's job has `repostedJob: true` in the response.
- This profile is not a Jobs search, so the message stays `Open a Jobs search to hide cards` and `Hidden here` reads `–`. On a Jobs results list the message line is empty when cards are hidden or all are shown, because the `Hidden here` figure says it; only failures and LinkedIn-limit pauses show a message.
- The switch accessible name is the status (`Applied`, `Viewed`, `Saved`, `Reposted`). The value text is its description, not part of the name. Match with role `switch`.
- A switch click saves at once and has no menu to close.
- A save error shows in the message line as `Your choice could not be saved. Try again.`
- A stored choice that cannot be read shows `Could not load your choice. Choose again.`, every hide switch reads off, and choosing a switch saves over the bad value.
- `Open settings` calls `browser.runtime.openOptionsPage()`. In the harness, drive the settings page directly with `open-options` instead.
