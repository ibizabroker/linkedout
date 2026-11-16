# Applicant limit

The popup has an `Applicant count` group with a `Limit` switch row and a `Max applicants` slider row holding a slider and a number box. It is off by default, the slider row is dimmed and disabled while it is off, and turning it on starts the limit at 100. The row value reads `Off` or `Hide over N`. The slider and the number box stay in sync, and the choice is saved.

## Sub-features

- `limit-default` shows the switch `Limit` off with the value `Off`, a disabled slider, and a disabled number box reading 100.
- `limit-enable` turns the switch on, which reads `Hide over 100` and enables both controls.
- `limit-slider` moves the slider one stop with the keyboard and the number box and the row value follow (100 to 150).
- `limit-number` accepts a typed whole number and saves it on Enter or when the box is left.
- `limit-persist` keeps the switch on and the last number after the popup document is opened again.

## How to get to it (user POV)

- Open the LinkedOut toolbar action popup. Verification opens `popup.html` in the loaded extension, which is not a LinkedIn Jobs search.

## Driving it with control-linkedout

Preconditions:

- A healthy launch for `$LINKEDOUT_VERIFY_RUN_ID` (`doctor` reports `ok: true` and `headingVisible: true`).
- The extension storage for this profile has no saved applicant limit.
- The tab is sized with `viewport --width 352 --height 640`.

- **Default.** Run `bun run verify:control -- open-popup --run-id "$LINKEDOUT_VERIFY_RUN_ID"`, then snapshot to `.cursor/skills/verify-linkedout/artifacts/applicant-limit/default.aria.txt`. The switch `Limit` is not checked and reads `Off`, the slider `Applicant limit` is disabled, and the textbox `Applicant limit number` is disabled and reads `100`.
- **Enable.** Run `bun run verify:control -- click --run-id "$LINKEDOUT_VERIFY_RUN_ID" --role switch --name "Limit"`, then snapshot to `.../applicant-limit/enabled.aria.txt`. The switch is checked and reads `Hide over 100`, and the slider and the textbox are enabled with `100`.
- **Move the slider.** Run `bun run verify:control -- press --run-id "$LINKEDOUT_VERIFY_RUN_ID" --role slider --name "Applicant limit" --key ArrowRight`, then snapshot to `.../applicant-limit/slider-right.aria.txt`. The textbox reads `150` and the switch reads `Hide over 150`.
- **Type a number.** Run `bun run verify:control -- fill --run-id "$LINKEDOUT_VERIFY_RUN_ID" --role textbox --name "Applicant limit number" --value 300`, then `press` the same textbox with `--key Enter`. Snapshot to `.../applicant-limit/typed-300.aria.txt`. The textbox reads `300`. Repeat with `60` for a value between stops (`typed-60.aria.txt`); the thumb sits on the nearest stop, 50.
- **Reopen.** Run `open-popup` again and snapshot to `.../applicant-limit/reopened.aria.txt`. The switch is checked and the textbox still reads `60`.
- **Proof.** Screenshot with `bun run verify:control -- screenshot --run-id "$LINKEDOUT_VERIFY_RUN_ID" --path .cursor/skills/verify-linkedout/artifacts/applicant-limit/enabled-60-light.png`, then `scheme --scheme dark` and `enabled-60-dark.png`. The `LinkedOut` heading is visible.

## Gotchas

- This profile is not a Jobs search, so these steps prove the controls and the saved value only. Hiding itself needs a logged-in LinkedIn Jobs search. With the limit on, each page load sends one `voyagerJobsDashJobPostings` request per up to 25 listed cards, the same request Reposted uses, so a live check shows one request even with Reposted off. Every hidden card's job must have `numApplies` above the limit in the response, and no visible card may. Changing the limit sends no new request.
- A drag or a typed number changes the cards before it is saved. Only release, blur, or Enter writes the `applicant-limit` key.
- If the batch request fails, the fallback downloads `/jobs/view/<id>/` pages one at a time and reads `N applicants` or `Over 100 applicants`; cached counts older than 24 hours are downloaded again only while the limit is on.
- The switch is named `Limit`; the slider's accessible name is `Applicant limit`; the number box is `Applicant limit number`. The thumb reports an index through `aria-valuenow`, so read the textbox for the value.
- The `Max applicants` label is plain text, not the slider's name.
