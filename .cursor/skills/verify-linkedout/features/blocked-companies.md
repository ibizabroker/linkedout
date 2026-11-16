# Blocked companies

The settings page is a full tab opened from the `Open settings` icon button in the popup header. A left nav (`Blocked companies` with a count, `Account` with `On`, `Off` or `Needs you`) switches panes by hash (`#blocked`, `#account`), and a reload keeps the pane. The `Blocked companies` pane shows the title, one line of guidance, a search field (`Search blocked companies`, with a `/` keycap hint; pressing `/` focuses it) and the list newest first with an `Unblock <Company>` button on each row that removes it at once with no confirmation. Typing filters the rows; with no match it reads `No blocked company matches “q”.` With nothing blocked it shows `No blocked companies. Block one from a job card or the job details.` and no search field. If the stored list is unreadable it shows `Could not load blocked companies.` and no rows, and a failed unblock shows `Could not unblock that company. Try again.` under the title and keeps the row. The popup readout shows the count as `Blocked N`, and leaves it out when the list is unreadable. A build without Google settings has no `Account` nav item.

## Sub-features

- `blocked-empty` shows the empty-state text and no Unblock buttons on a fresh profile.
- `blocked-seeded` lists seeded companies newest first.
- `blocked-unblock` clicks `Unblock <Company>`; the row updates and storage no longer holds it. The empty state returns after the last one.
- `blocked-unreadable` shows the failure line and no rows or empty state.
- `blocked-readout` shows `Blocked N` in the popup readout, matching the list, and no `Blocked` figure when the list is unreadable (the popup message line shows `Could not load blocked companies.`).
- `blocked-search` fills `Search blocked companies` with part of a name; only matching rows stay, and a query with no match shows the no-match line.
- `blocked-entry` clicks `Open settings` in the popup header, which opens the settings page.

## How to get to it (user POV)

- Click the gear in the LinkedOut popup header (`Open settings`), or open the extension's options from `chrome://extensions`. Verification opens `options.html` with `open-options`.

## Driving it with control-linkedout

Preconditions:

- A healthy launch for `$LINKEDOUT_VERIFY_RUN_ID` (`doctor` reports `ok: true` and `headingVisible: true`).

- **Open settings.** Run `bun run verify:control -- open-options --run-id "$LINKEDOUT_VERIFY_RUN_ID"`. The heading `Blocked companies` is visible in the main pane.
- **Read the empty state.** Snapshot to `.cursor/skills/verify-linkedout/artifacts/blocked-companies/empty.aria.txt`. It has the guidance paragraph and the empty-state paragraph, and no `Unblock` button.
- **Seed.** From the extension page, run `bun run verify:control -- ext-eval --run-id "$LINKEDOUT_VERIFY_RUN_ID" --expression "chrome.runtime.sendMessage({ type: 'linkedout/blocklist/block', name: 'Northwind Talent' }).then(() => 1)"` once per company, with a short pause between runs so `blockedAt` differs. Snapshot to `.../blocked-companies/seeded.aria.txt`. Rows list newest first, each with button `Unblock <Company>`.
- **Unblock.** Run `bun run verify:control -- click --run-id "$LINKEDOUT_VERIFY_RUN_ID" --role button --name "Unblock Northwind Talent"`. Snapshot to `.../blocked-companies/unblocked.aria.txt`. The row is gone.
- **Unreadable.** Run `ext-eval` with `chrome.storage.local.set({ blocklist: 'garbage' }).then(() => 1)`. Snapshot to `.../blocked-companies/unreadable.aria.txt`. It shows alert `Could not load blocked companies.` and no rows.
- **Popup readout.** Run `open-popup` and snapshot to `.../blocked-companies/readout.aria.txt`. The paragraph after the heading reads `Blocked N` with N the number of seeded companies (restore a readable list first), and the unreadable state shows no `Blocked` figure.
- **Proof.** Size the tab with `viewport --width 900 --height 520`, then screenshot the settings page to `.../blocked-companies/options-light.png`, run `scheme --scheme dark`, and screenshot to `options-dark.png`.

## Gotchas

- Restoring a readable list after `blocked-unreadable` means writing a valid list back (`chrome.storage.local.remove('blocklist')`) and reloading.
- The pane heading is `Blocked companies` (level 1). `doctor` checks for the popup heading `LinkedOut`, so run it from `open-popup`, not on the settings page.
- A failed unblock cannot be forced in the harness; it is covered by `lib/ui/BlockedCompanies.test.tsx`.
- Seed with a short pause between blocks, so `blockedAt` differs and the order is deterministic.
- `Open settings` uses `browser.runtime.openOptionsPage()`, which opens a new tab outside the single control page. Drive the page with `open-options`.
