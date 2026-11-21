# Contributing to LinkedOut

Thanks for helping. This guide covers how to set up the project, how the code is laid out, and how to send a change.

## Before you start

- **Bugs:** Open an issue. Say what you did, what you expected and what happened instead. Include your Chrome version and, if you can, a screenshot. Remove names, profile links and anything else personal from screenshots first.
- **New features and larger changes:** Open an issue first and describe the problem you want to solve. This saves you from building something that doesn't fit the product.
- **Small fixes** such as typos and obvious bugs can go straight to a pull request.

LinkedOut targets Chrome. The Firefox scripts exist, but Firefox is not tested or supported yet.

## Set up

You need [bun](https://bun.sh) and Chrome.

```bash
bun install
bun run dev
```

`bun run dev` builds the extension and opens Chrome with it loaded, and rebuilds when you save.

To load a build into your own Chrome profile instead:

1. Run `bun run build`.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select `.output/chrome-mv3`.

You need a LinkedIn account to see LinkedOut work on a real Jobs page.

## Commands

| Command                | What it does                                                  |
| ---------------------- | ------------------------------------------------------------- |
| `bun run dev`          | Starts Chrome with the extension loaded and reloads on change |
| `bun run build`        | Builds into `.output/chrome-mv3`                              |
| `bun run zip`          | Builds and zips the extension                                 |
| `bun test`             | Runs the tests                                                |
| `bun run lint`         | Runs oxlint                                                   |
| `bun run format`       | Formats the code with oxfmt                                   |
| `bun run format:check` | Checks formatting without changing files                      |
| `bun run compile`      | Type-checks with `tsc`                                        |

Run `bun run lint`, `bun run format:check`, `bun run compile` and `bun test` before you open a pull request. CI runs the same checks.

## Project layout

```text
entrypoints/
├── popup/         the toolbar popup
├── options/       the Settings page
├── content.ts     runs on LinkedIn: hides cards, adds Block buttons
└── background.ts  the service worker: tracker queue and messages
lib/
├── hide/          which job cards to hide, and the reposted and applicant checks
├── block/         blocked companies and the Block button and panel
├── tracker/       the Google Sheets job tracker
└── ui/            shared React pieces
components/ui/     shadcn components
site/              the homepage and privacy policy, published to GitHub Pages
```

`PRODUCT.md` describes what the extension does and why. `DESIGN.md` describes the visual design: colours, type, spacing and components. Read the relevant parts before you change how something behaves or looks.

## Working on the Job tracker

The Job tracker signs in with Google, so it needs a Google OAuth client ID and a fixed extension ID. **Without them, the build still works.** It leaves out the tracker, along with the `identity` and `alarms` permissions. Most changes don't touch the tracker, so you can skip this section.

### What you can test without Google

Most of the tracker is plain code with tests that run without a network or a Google account. These include:

- how a row is built from LinkedIn's job data;
- the Sheets and Drive request bodies;
- the outbox queue and retries;
- how errors are classified.

The tests are in `lib/tracker/*.test.ts`, and the LinkedIn sample data is in `lib/tracker/fixtures/`. If your change can be covered there, cover it there.

To see the tracker's screens without signing in, write the tracker's state to the extension's storage from the DevTools console on the popup page. `.cursor/skills/verify-linkedout/features/job-tracker.md` lists the storage shapes for connected, waiting and sign-in-expired.

### Sign in with your own Google project

To test the real connection, set up your own Google Cloud project. Don't ask for the maintainer's client ID: it only works with the store's extension ID.

1. Make a key. It fixes your extension ID across installs.

   ```bash
   openssl genrsa -out linkedout-key.pem 2048
   openssl rsa -in linkedout-key.pem -pubout -outform DER | base64 | tr -d '\n'
   ```

   The second command prints the public key as one line. Keep `linkedout-key.pem` outside the repo.

2. Work out your extension ID from the key.

   ```bash
   openssl rsa -in linkedout-key.pem -pubout -outform DER | shasum -a 256 | head -c 32 | tr '0-9a-f' 'a-p'
   ```

3. In the [Google Cloud console](https://console.cloud.google.com/), create a project. Enable the Google Sheets API and the Google Drive API.
4. Set up the OAuth consent screen as **External**, leave it in **Testing**, and add your own Google account as a test user. Add the `https://www.googleapis.com/auth/drive.file` scope.
5. Create an OAuth client ID of type **Chrome Extension**. Set its item ID to the extension ID from step 2.
6. Copy `.env.example` to `.env`. Set `WXT_EXTENSION_KEY` to the public key from step 1 and `WXT_GOOGLE_CLIENT_ID` to the client ID from step 5.
7. Run `bun run build` and load `.output/chrome-mv3`. Check that the extension ID in `chrome://extensions` matches step 2.

`.env` is git-ignored. Never commit it or the `.pem` file. Don't paste your client ID, key or extension ID into issues or pull requests.

### Testing a tracker change

CI can't sign in to Google, so for a tracker change, say in the pull request how you tested it: which tests cover it, and what you checked with your own Google project. The maintainer tests the real connection again before merging.

## Code style

- TypeScript and React. Formatting is oxfmt and linting is oxlint, so run `bun run format` and `bun run lint`.
- **No comments in code.** A lint rule rejects them. Put the reason in a clear name, a smaller function or the pull request description.
- Keep changes small, about 100 lines of product code. Split larger work into several pull requests.
- Test behaviour that a user or caller can see, not internal details.
- Read LinkedIn's data only through the user's own session in the browser. Don't add servers, analytics or third-party requests. LinkedOut's privacy policy promises there are none.

## Commits

Commits follow [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): what changed`, written as a sentence in lower case.

```text
feat(popup): show the applicant limit next to the slider
fix(tracker): keep a queued row when Google answers 503
```

- **Types:** `feat`, `fix`, `style`, `refactor`, `docs`, `test`, `chore`.
- **Common scopes:** `popup`, `options`, `block`, `hide`, `tracker`, `ui`, `site`.

## Pull requests

1. Branch from `master`. Use one branch per issue.
2. Make the change and run the checks listed under [Commands](#commands).
3. Open the pull request against `master`. Put `Fixes #N` in the description, and use these sections:
   - **Summary:** what changed. A short diff sketch or tree is often clearer than prose.
   - **Evidence:** how you know it works. For a visible change, add screenshots in light and dark mode. For anything else, add test output.
   - **Merge danger:** whether the change is easy to roll back, and what it could break.
4. CI must pass. Pull requests are squash-merged, so the title becomes the commit message on `master` and must follow the commit format.

## Security

If you find a security problem, don't open a public issue. Report it privately through **Security → Report a vulnerability** on the GitHub repo.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
