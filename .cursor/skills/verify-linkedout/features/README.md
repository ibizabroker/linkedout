# LinkedOut verification map

This directory is the maintained source for verifying user-facing behavior of LinkedOut. Read this index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Build output exists at `.output/chrome-mv3` (launch builds unless `--no-build`).
- Start a disposable run with `bun run verify:control -- launch --run-id <id>`.
- Run `bun run verify:control -- doctor --run-id <id>` and require `ok: true`, `headingVisible: true`, and the expected `buildRevision`.
- Never drive a Chromium profile that was not started by this verification run.
- Headed Chromium only (extensions).

## Driving conventions

- Start every recipe from a fresh `open-popup` unless its preconditions say otherwise.
- Prefer ARIA roles and accessible names (`getByRole`) over CSS selectors or coordinates.
- Treat every command as literal. Keep quoted names and flags unchanged.
- Restore disposable run state with `cleanup`. Do not remove proof artifacts.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes an ARIA snapshot and a screenshot with the `LinkedOut` heading visible.
- Record the feature ID and entry point used with every artifact.
- Report an unreachable path with the attempted command and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with control-linkedout` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only user paths, stable handles, required state, commands, and observable proof.

## Features

- [Hide menu](./hide-menu.md) covers opening the popup and turning Applied, Viewed, and Saved hiding on and off.
- [Extension identity](./extension-identity.md) covers confirming the built extension name and popup title surface.
