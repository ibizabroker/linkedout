# Blocked companies

The popup shows a `Blocked companies (N)` section below `Hide from results`. Its header expands and collapses the list. With nothing blocked, the expanded list shows `No blocked companies. Block one from a job card or the job details.` Blocking is not built yet, so N is always 0.

## Sub-features

- `blocked-closed` shows a collapsed button named `Blocked companies (0)` below the `Hide from results` trigger.
- `blocked-empty` expands the section and shows the empty-state text.
- `blocked-collapse` collapses the section again and hides the empty-state text.
- `blocked-fit` keeps the open `Hide from results` menu below its trigger and inside the popup, with the section collapsed or expanded.

## How to get to it (user POV)

- Open the LinkedOut toolbar action popup. Verification opens `popup.html` in the loaded extension.

## Driving it with control-linkedout

Preconditions:

- A healthy launch for `$LINKEDOUT_VERIFY_RUN_ID` (`doctor` reports `ok: true` and `headingVisible: true`).

- **Open popup.** Run `bun run verify:control -- open-popup --run-id "$LINKEDOUT_VERIFY_RUN_ID"`. The heading `LinkedOut` is visible.
- **Read the collapsed section.** Run `bun run verify:control -- snapshot --run-id "$LINKEDOUT_VERIFY_RUN_ID" --path .cursor/skills/verify-linkedout/artifacts/blocked-companies/collapsed.aria.txt`. The snapshot ends with button `Blocked companies (0)` after button `Hide from results: Applied, Viewed`, and has no empty-state text.
- **Expand.** Run `bun run verify:control -- click --run-id "$LINKEDOUT_VERIFY_RUN_ID" --role button --name "Blocked companies (0)"`. Snapshot to `.cursor/skills/verify-linkedout/artifacts/blocked-companies/expanded.aria.txt`. The button is `Blocked companies (0)` with `[expanded]`, followed by paragraph `No blocked companies. Block one from a job card or the job details.`
- **Collapse.** Run the same click again. Snapshot to `.cursor/skills/verify-linkedout/artifacts/blocked-companies/recollapsed.aria.txt`. The button has no `[expanded]` and the empty-state text is gone.
- **Proof.** Screenshot the collapsed and expanded states with `bun run verify:control -- screenshot --run-id "$LINKEDOUT_VERIFY_RUN_ID" --path .cursor/skills/verify-linkedout/artifacts/blocked-companies/collapsed.png` and the same command for `expanded.png`. Both show the `LinkedOut` heading.

## Gotchas

- The header is a button, not a heading. Match it by role `button` and its full name, including the count.
- `open-popup` loads the popup in a full-size tab, so it cannot show a menu that does not fit. `control-linkedout` has no viewport command. To check `blocked-fit`, use a Playwright page sized to the popup body (320px wide, body height), expand the section, open the `Hide from results` menu, and confirm that the menu starts below the trigger and ends inside the body.
- The rows and their `Unblock <Company>` buttons do not appear in the popup until blocking ships. A unit test renders them with sample data.
