# LinkedOut — agent instructions

LinkedOut is a browser extension to fix Linkedin jobs. Stack: **WXT**, **React**, **TypeScript**, **bun**, **oxlint**.

Current default target is Chrome

## Commands

```bash
bun install
bun run dev          # default browser target, hot reload
bun run build        # → .output/<browser-mv…>
bun run lint         # oxlint
bun run format       # oxfmt
bun run compile      # tsc --noEmit
```

Load unpacked: `chrome://extensions` → Developer mode → Load unpacked → select the build output directory (currently `.output/chrome-mv3`).

## Verification

User-visible popup changes must be proven with the project skill **verify-linkedout** (`.cursor/skills/verify-linkedout/SKILL.md`), not source inspection alone.

```bash
export LINKEDOUT_VERIFY_RUN_ID="…"
bun run verify:control -- launch --run-id "$LINKEDOUT_VERIFY_RUN_ID"
bun run verify:control -- doctor --run-id "$LINKEDOUT_VERIFY_RUN_ID"
# drive per features/ map
bun run verify:control -- cleanup --run-id "$LINKEDOUT_VERIFY_RUN_ID"
```

## Working rules

- Prefer small changes (~100 lines of product code per change). Split work rather than bundling features.
- After issues exist: one issue → one change set; reference `Fixes #N` in the PR.
- Do not expand scope beyond the asked task.
- Keep conventions constrained: entrypoints under `entrypoints/`, ignore `.output/` and `.wxt/` for lint/edits.
- Do not commit secrets, `.tmp/`, or verification artifacts under `.cursor/skills/verify-linkedout/artifacts/`.
