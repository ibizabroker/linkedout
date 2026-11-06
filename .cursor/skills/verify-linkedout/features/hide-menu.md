# Applied toggle

The popup names LinkedOut, says whether this tab is a Jobs search, and turns Applied hiding on or off from one checkbox. The choice is saved as soon as the checkbox changes.

## Sub-features

- `applied-open` shows the heading, the jobs-search status, and a visible `Hide from results` label, and a closed trigger named `Hide from results: Applied` on a fresh install.
- `applied-menu` opens one checkbox named Applied, checked.
- `applied-clear` turns Applied off, keeps the menu open, and renames the trigger `Hide from results: Nothing hidden`.
- `applied-persist` keeps `Hide from results: Nothing hidden` after the popup document is opened again.
- `applied-restore` turns Applied back on and checks the checkbox.

## How to get to it (user POV)

- Open the LinkedOut toolbar action popup. Verification opens `popup.html` in the loaded extension, which is not a LinkedIn Jobs search.

## Driving it with control-linkedout

Preconditions:

- A healthy launch for `$LINKEDOUT_VERIFY_RUN_ID` (`doctor` reports `ok: true` and `headingVisible: true`).
- The extension storage for this profile has no saved hide choice, so the trigger starts as `Hide from results: Applied`.

- **Open popup.** Run `bun run verify:control -- open-popup --run-id "$LINKEDOUT_VERIFY_RUN_ID"`. The heading `LinkedOut` is visible.
- **Read the closed panel.** Run `bun run verify:control -- snapshot --run-id "$LINKEDOUT_VERIFY_RUN_ID" --path .cursor/skills/verify-linkedout/artifacts/applied-toggle/closed.aria.txt`. The snapshot contains heading `LinkedOut`, status `Open a Jobs search to hide cards`, the text `Hide from results`, and button `Hide from results: Applied`.
- **Open the menu.** Run `bun run verify:control -- click --run-id "$LINKEDOUT_VERIFY_RUN_ID" --role button --name "Hide from results: Applied"`. Then snapshot to `.cursor/skills/verify-linkedout/artifacts/applied-toggle/menu.aria.txt`. The menu is named `Hide from results: Applied` and the checkbox `Applied` is checked.
- **Clear Applied.** Run `bun run verify:control -- click --run-id "$LINKEDOUT_VERIFY_RUN_ID" --role menuitemcheckbox --name "Applied"`. Snapshot to `.cursor/skills/verify-linkedout/artifacts/applied-toggle/cleared.aria.txt`. The menu is named `Hide from results: Nothing hidden` and the checkbox `Applied` is not checked.
- **Reopen.** Run `bun run verify:control -- open-popup --run-id "$LINKEDOUT_VERIFY_RUN_ID"`. Snapshot to `.cursor/skills/verify-linkedout/artifacts/applied-toggle/reopened.aria.txt`. The button is `Hide from results: Nothing hidden` and the status is still `Open a Jobs search to hide cards`.
- **Turn Applied back on.** Click button `Hide from results: Nothing hidden`, then click menuitemcheckbox `Applied`. Snapshot to `.cursor/skills/verify-linkedout/artifacts/applied-toggle/restored.aria.txt`. The checkbox `Applied` is checked.
- **Proof.** Screenshot the closed panel and the open menu with `bun run verify:control -- screenshot --run-id "$LINKEDOUT_VERIFY_RUN_ID" --path .cursor/skills/verify-linkedout/artifacts/applied-toggle/closed.png` and the same command for `menu.png`. Both show the `LinkedOut` heading.

## Gotchas

- This profile is not a Jobs search, so the status stays `Open a Jobs search to hide cards` even after Applied is cleared. `Showing every card` appears only on a Jobs results list.
- Reloading the popup does not reset a saved choice. A fresh profile starts at Applied.
- Match the closed trigger by its accessible name. That name is `Hide from results: Applied` or `Hide from results: Nothing hidden`, and it changes after the checkbox click.
- The checkbox click leaves the menu open. Escape closes it.
- A save error shows in the status line above the trigger as `Your choice could not be saved. Try again.`
- A stored choice that cannot be read shows `Could not load your choice. Choose again.`, the trigger reads `Hide from results: Nothing hidden`, and choosing Applied saves over the bad value.
