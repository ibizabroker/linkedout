# Blocked companies

The popup shows a `Blocked companies (N)` section below `Hide from results`. Its header expands and collapses the list. With nothing blocked, the expanded list shows `No blocked companies. Block one from a job card or the job details.` With companies blocked, the list shows them newest first, and `Unblock <Company>` removes one at once with no confirmation. If the stored list is unreadable, the header drops its count and the status line shows `Could not load blocked companies.`

## Sub-features

- `blocked-closed` shows a collapsed button named `Blocked companies (0)` below the `Hide from results` trigger.
- `blocked-empty` expands the section and shows the empty-state text.
- `blocked-collapse` collapses the section again and hides the empty-state text.
- `blocked-seeded` lists seeded companies newest first and the header count matches.
- `blocked-unblock` clicks `Unblock <Company>`; the row and count update and storage no longer holds it. The empty state returns after the last one.
- `blocked-unreadable` shows the failure status line and no empty state.
- `blocked-fit` keeps the open `Hide from results` menu below its trigger and inside the popup, with the section collapsed or expanded, and with the list unreadable (write `blocklist: 'garbage'` from the extension page, reload, size the viewport to the body, open `Hide from results`, and confirm the menu opens below the trigger because the status line stays one line).

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
- `control-linkedout` cannot seed storage, so rows are covered by a Playwright script instead: launch a persistent context with `--load-extension=.output/chrome-mv3`, open `popup.html`, and seed from the extension page with `chrome.runtime.sendMessage({ type: 'linkedout/blocklist/block', name })`, which goes through the background owner and not React state. Reload, expand, check the rows, click `Unblock <Company>`, and read `chrome.storage.local.get('blocklist')`. For `blocked-unreadable`, `chrome.storage.local.set({ blocklist: 'garbage' })` with the popup open.
- Seed with a short pause between blocks, so `blockedAt` differs and the order is deterministic.
