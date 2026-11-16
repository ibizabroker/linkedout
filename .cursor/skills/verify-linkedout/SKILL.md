---
name: verify-linkedout
description: Drive the LinkedOut browser extension popup the way a user does via Playwright, and capture proof artifacts. Use when proving popup UI behavior, smoke-testing a build, or verifying a PR that changes entrypoints/popup. Currently exercises the default Chromium build; Firefox coverage comes later.
---

# Verify LinkedOut

Scripted control of the real extension surface (React popup in Chromium). Prefer this over reading source or unit-only checks when the change is user-visible.

Put `control-linkedout` on your mental PATH as:

```bash
bun run verify:control -- <command>
```

Or:

```bash
bun .cursor/skills/verify-linkedout/bin/control-linkedout.ts <command>
```

## Launch

1. From the repo root, start a disposable run (builds unless `--no-build`):

```bash
export LINKEDOUT_VERIFY_RUN_ID="pr-$RANDOM"
bun run verify:control -- launch --run-id "$LINKEDOUT_VERIFY_RUN_ID"
```

2. Ready means the printed JSON includes `extensionId`, `popupUrl`, and `buildRevision`, and the popup heading `LinkedOut` is visible inside the control daemon.
3. Each launch uses its own Chrome profile under `.tmp/linkedout-verify-<run-id>/chrome-profile`. Never drive a profile you did not start.
4. Extensions require headed Chromium. Do not switch the harness to headless.

Teardown is `cleanup` (below). Keep the `LINKEDOUT_VERIFY_RUN_ID` for every later command in the run.

## Doctor

Read-only health check before the first drive and after any surprise:

```bash
bun run verify:control -- doctor --run-id "$LINKEDOUT_VERIFY_RUN_ID"
```

Require `ok: true`, matching `extensionDir` (default `.output/chrome-mv3`), a non-empty `extensionId`, and `headingVisible: true`. If doctor fails, relaunch — do not click through a wedged session.

## Drive

Open the feature map first: `features/README.md`, then the matching feature file.

Common browser commands (stable handles only — roles and accessible names):

```bash
bun run verify:control -- open-popup --run-id "$LINKEDOUT_VERIFY_RUN_ID"
bun run verify:control -- click --run-id "$LINKEDOUT_VERIFY_RUN_ID" --role button --name "Increment count"
bun run verify:control -- text --run-id "$LINKEDOUT_VERIFY_RUN_ID" --role button --name "Increment count"
bun run verify:control -- snapshot --run-id "$LINKEDOUT_VERIFY_RUN_ID" --path .cursor/skills/verify-linkedout/artifacts/<feature>/popup.aria.txt
bun run verify:control -- screenshot --run-id "$LINKEDOUT_VERIFY_RUN_ID" --path .cursor/skills/verify-linkedout/artifacts/<feature>/popup.png
```

Drive the real popup document (`chrome-extension://<id>/popup.html`) and settings page (`options.html`). Do not stub React state or call extension APIs as a substitute for the user path.

## Evidence

- Store proof under `.cursor/skills/verify-linkedout/artifacts/<feature>/`.
- Capture the action and the resulting state (for the counter: button text before and after click).
- UI proof includes an ARIA snapshot and a screenshot that shows the `LinkedOut` heading, in light and dark.
- Record `run-id`, `extensionId`, and `buildRevision` from launch/doctor alongside the artifacts (print them into the agent reply; optional `meta.json` in the feature artifact folder).
- Cleanup must not delete artifacts.

## Cleanup

```bash
bun run verify:control -- cleanup --run-id "$LINKEDOUT_VERIFY_RUN_ID"
```

Stops only the daemon/browser started for that run id and deletes `.tmp/linkedout-verify-<run-id>/`. Artifacts under `.cursor/skills/verify-linkedout/artifacts/` remain.

## Helpers

| Invocation | Purpose |
| --- | --- |
| `bun run verify:control -- launch [--run-id id] [--no-build]` | Build (optional), start Chromium + extension + control daemon |
| `bun run verify:control -- doctor --run-id id` | Health check |
| `bun run verify:control -- open-popup --run-id id` | Navigate to popup.html |
| `bun run verify:control -- open-options --run-id id` | Navigate to options.html, the settings page |
| `bun run verify:control -- scheme --run-id id --scheme light\|dark` | Emulate the colour scheme |
| `bun run verify:control -- viewport --run-id id --width W --height H` | Resize the tab (popup is 352px wide) |
| `bun run verify:control -- ext-eval --run-id id --expression JS` | Run JS on the open extension page (seed storage, send messages) |
| `bun run verify:control -- click --run-id id --role ROLE --name NAME` | Click by role + accessible name |
| `bun run verify:control -- fill --run-id id --role ROLE --name NAME --value TEXT` | Replace a field's text |
| `bun run verify:control -- press --run-id id --role ROLE --name NAME --key KEY` | Press a key on an element (for example `ArrowRight` on a slider, `Enter`) |
| `bun run verify:control -- text --run-id id --role ROLE --name NAME` | Read inner text |
| `bun run verify:control -- snapshot --run-id id --path FILE` | Write ARIA snapshot |
| `bun run verify:control -- screenshot --run-id id --path FILE` | Write PNG |
| `bun run verify:control -- cleanup --run-id id` | Tear down run; keep artifacts |

## Feature map

See [features/README.md](./features/README.md). Keep the map honest with `/maintain-verification-skill` as surfaces grow.
