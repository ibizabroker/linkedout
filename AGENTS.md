# LinkedOut: agent instructions

LinkedOut is a Chrome MV3 extension that cleans up LinkedIn Jobs. Stack: **WXT**, **React**, **TypeScript**, **bun**, **oxlint** and **oxfmt**.

Read [CONTRIBUTING.md](CONTRIBUTING.md) first. It is the source for setup, commands, project layout, the Job tracker's Google setup, code style, commit messages and pull requests. This file adds only what an agent needs on top of it.

## Before you change code

- Read the parts of `PRODUCT.md` (behaviour) and `DESIGN.md` (visual design) that your change touches. Keep them true. If a change alters behaviour or design they describe, update them in the same change.
- Ignore `.output/` and `.wxt/`. They are build output.

## Verification

Prove user-visible changes to the popup, the Settings page or the on-page Block panel by driving the extension with the project skill **verify-linkedout** (`.cursor/skills/verify-linkedout/SKILL.md`). Reading the source is not enough. Its `features/` folder maps each feature to the steps that check it.

```bash
export LINKEDOUT_VERIFY_RUN_ID="…"
bun run verify:control -- launch --run-id "$LINKEDOUT_VERIFY_RUN_ID"
bun run verify:control -- doctor --run-id "$LINKEDOUT_VERIFY_RUN_ID"
bun run verify:control -- cleanup --run-id "$LINKEDOUT_VERIFY_RUN_ID"
```

Run `bun run lint`, `bun run format:check`, `bun run compile` and `bun test` before you call a change done.

## Working rules

- Do only the task you were given. Don't widen its scope.
- One issue, one branch, one pull request. Put `Fixes #N` in the pull request.
- Never commit `.env`, `.pem` files, `.tmp/`, or anything under `.cursor/skills/verify-linkedout/artifacts/`.
- Never write the Google client ID, the extension key or the extension ID into code, issues, pull requests, commits or verification notes.
- Don't name other products as design inspiration in `PRODUCT.md`, `DESIGN.md`, issues or pull requests.
