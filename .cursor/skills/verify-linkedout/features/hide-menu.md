# Hide menu

The popup names LinkedOut, says whether this tab is a Jobs search, and turns Applied, Viewed, and Saved hiding on or off from three checkboxes. Applied and Viewed start checked and Saved starts unchecked. The choice is saved as soon as a checkbox changes.

## Sub-features

- `hide-open` shows the heading, the jobs-search status, and a visible `Hide from results` label, and a closed trigger named `Hide from results: Applied, Viewed` on a fresh install.
- `hide-menu` opens three checkboxes named Applied, Viewed, and Saved. Applied and Viewed are checked and Saved is not.
- `hide-clear-applied` turns Applied off, keeps the menu open, and renames the trigger `Hide from results: Viewed`.
- `hide-clear-all` turns Viewed off too, and renames the trigger `Hide from results: Nothing hidden`.
- `hide-persist` keeps `Hide from results: Nothing hidden` after the popup document is opened again.
- `hide-restore` turns Applied and Viewed back on and checks both checkboxes.
- `hide-saved` turns Saved on, which renames the trigger `Hide from results: Applied, Viewed, Saved`, then turns it off again, which restores `Hide from results: Applied, Viewed`.

## How to get to it (user POV)

- Open the LinkedOut toolbar action popup. Verification opens `popup.html` in the loaded extension, which is not a LinkedIn Jobs search.

## Driving it with control-linkedout

Preconditions:

- A healthy launch for `$LINKEDOUT_VERIFY_RUN_ID` (`doctor` reports `ok: true` and `headingVisible: true`).
- The extension storage for this profile has no saved hide choice, so the trigger starts as `Hide from results: Applied, Viewed`.

- **Open popup.** Run `bun run verify:control -- open-popup --run-id "$LINKEDOUT_VERIFY_RUN_ID"`. The heading `LinkedOut` is visible.
- **Read the closed panel.** Run `bun run verify:control -- snapshot --run-id "$LINKEDOUT_VERIFY_RUN_ID" --path .cursor/skills/verify-linkedout/artifacts/hide-menu/closed.aria.txt`. The snapshot contains heading `LinkedOut`, status `Open a Jobs search to hide cards`, the text `Hide from results`, and button `Hide from results: Applied, Viewed`.
- **Open the menu.** Run `bun run verify:control -- click --run-id "$LINKEDOUT_VERIFY_RUN_ID" --role button --name "Hide from results: Applied, Viewed"`. Then snapshot to `.cursor/skills/verify-linkedout/artifacts/hide-menu/menu.aria.txt`. The menu is named `Hide from results: Applied, Viewed` and the checkboxes `Applied` and `Viewed` are checked and `Saved` is not checked.
- **Clear Applied.** Run `bun run verify:control -- click --run-id "$LINKEDOUT_VERIFY_RUN_ID" --role menuitemcheckbox --name "Applied"`. Snapshot to `.cursor/skills/verify-linkedout/artifacts/hide-menu/cleared-applied.aria.txt`. The menu is named `Hide from results: Viewed`, the checkbox `Applied` is not checked, `Viewed` is checked, and `Saved` is not checked.
- **Clear Viewed.** Run the same click with `--name "Viewed"`. Snapshot to `.cursor/skills/verify-linkedout/artifacts/hide-menu/cleared-all.aria.txt`. The menu is named `Hide from results: Nothing hidden` and none of the three checkboxes is checked.
- **Reopen.** Run `bun run verify:control -- open-popup --run-id "$LINKEDOUT_VERIFY_RUN_ID"`. Snapshot to `.cursor/skills/verify-linkedout/artifacts/hide-menu/reopened.aria.txt`. The button is `Hide from results: Nothing hidden` and the status is still `Open a Jobs search to hide cards`.
- **Turn both back on.** Click button `Hide from results: Nothing hidden`, then click menuitemcheckbox `Applied`, then menuitemcheckbox `Viewed`. Snapshot to `.cursor/skills/verify-linkedout/artifacts/hide-menu/restored.aria.txt`. Applied and Viewed are checked, Saved is not checked, and the menu is named `Hide from results: Applied, Viewed`.
- **Turn Saved on and off.** With the menu named `Hide from results: Applied, Viewed` open, click menuitemcheckbox `Saved`. Snapshot to `.cursor/skills/verify-linkedout/artifacts/hide-menu/saved-on.aria.txt`. The menu is named `Hide from results: Applied, Viewed, Saved` and all three checkboxes are checked. Click menuitemcheckbox `Saved` again. Snapshot to `.cursor/skills/verify-linkedout/artifacts/hide-menu/saved-off.aria.txt`. The menu is named `Hide from results: Applied, Viewed` and `Saved` is not checked.
- **Proof.** Screenshot the closed panel and the open menu with `bun run verify:control -- screenshot --run-id "$LINKEDOUT_VERIFY_RUN_ID" --path .cursor/skills/verify-linkedout/artifacts/hide-menu/closed.png` and the same command for `menu.png`. Both show the `LinkedOut` heading.

## Gotchas

- This profile is not a Jobs search, so the status stays `Open a Jobs search to hide cards` even after all options are cleared. `Showing every card` appears only on a Jobs results list.
- Reloading the popup does not reset a saved choice. A fresh profile starts at Applied and Viewed, with Saved unchecked.
- Match the closed trigger by its accessible name. That name is `Hide from results: Applied, Viewed`, `Hide from results: Applied`, `Hide from results: Viewed`, `Hide from results: Applied, Viewed, Saved`, or `Hide from results: Nothing hidden`, among other combinations, and it changes after each checkbox click.
- A checkbox click leaves the menu open. Escape closes it.
- `open-popup` loads the popup in a full-size tab, so it cannot show a menu that does not fit. To check the fit, size the viewport to the popup body and confirm that the open menu is below the trigger.
- A save error shows in the status line above the trigger as `Your choice could not be saved. Try again.`
- A stored choice that cannot be read shows `Could not load your choice. Choose again.`, the trigger reads `Hide from results: Nothing hidden`, and choosing an option saves over the bad value.
