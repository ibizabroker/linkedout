#!/usr/bin/env bun
import { spawn } from 'node:child_process';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { openSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium, type BrowserContext, type Page } from 'playwright';

type State = {
  runId: string;
  port: number;
  pid: number;
  userDataDir: string;
  extensionDir: string;
  extensionId: string;
  popupUrl: string;
  buildRevision: string;
};

type Session = {
  context: BrowserContext;
  page: Page;
  state: State;
};

const ROOT = path.resolve(import.meta.dir, '../../../..');
const DEFAULT_EXTENSION_DIR = path.join(ROOT, '.output/chrome-mv3');
const ARTIFACTS_ROOT = path.join(
  ROOT,
  '.cursor/skills/verify-linkedout/artifacts',
);

function runIdFromEnv(): string {
  return process.env.LINKEDOUT_VERIFY_RUN_ID ?? `run-${Date.now()}`;
}

function runDir(runId: string): string {
  return (
    process.env.LINKEDOUT_VERIFY_DIR ??
    path.join(ROOT, '.tmp', `linkedout-verify-${runId}`)
  );
}

function statePath(runId: string): string {
  return path.join(runDir(runId), 'state.json');
}

async function readState(runId: string): Promise<State> {
  const raw = await readFile(statePath(runId), 'utf8');
  return JSON.parse(raw) as State;
}

async function writeState(state: State): Promise<void> {
  await mkdir(runDir(state.runId), { recursive: true });
  await writeFile(statePath(state.runId), JSON.stringify(state, null, 2));
}

async function buildRevision(extensionDir: string): Promise<string> {
  const manifest = JSON.parse(
    await readFile(path.join(extensionDir, 'manifest.json'), 'utf8'),
  ) as { name?: string; version?: string };
  return `${manifest.name ?? 'unknown'}@${manifest.version ?? '0'}`;
}

async function ensureBuilt(extensionDir: string): Promise<void> {
  try {
    await readFile(path.join(extensionDir, 'manifest.json'));
  } catch {
    console.error(`Missing extension at ${extensionDir}. Run: bun run build`);
    process.exit(1);
  }
}

async function postJson(
  port: number,
  pathname: string,
  body: unknown = {},
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const res = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function getJson(
  port: number,
  pathname: string,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const res = await fetch(`http://127.0.0.1:${port}${pathname}`);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function parseArgs(argv: string[]) {
  const args = [...argv];
  const flags = new Map<string, string | boolean>();
  const positionals: string[] = [];
  while (args.length) {
    const token = args.shift()!;
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = args[0];
      if (!next || next.startsWith('--')) {
        flags.set(key, true);
      } else {
        flags.set(key, args.shift()!);
      }
    } else {
      positionals.push(token);
    }
  }
  return { positionals, flags };
}

function flag(flags: Map<string, string | boolean>, name: string): string {
  const value = flags.get(name);
  if (typeof value !== 'string' || !value) {
    throw new Error(`Missing required --${name}`);
  }
  return value;
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function send(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function openPopup(session: Session): Promise<Page> {
  await session.page.goto(session.state.popupUrl, { waitUntil: 'domcontentloaded' });
  await session.page.getByRole('heading', { name: 'LinkedOut' }).waitFor({
    timeout: 10_000,
  });
  return session.page;
}

async function startDaemon(runId: string): Promise<void> {
  const extensionDir =
    process.env.LINKEDOUT_EXTENSION_DIR ?? DEFAULT_EXTENSION_DIR;
  await ensureBuilt(extensionDir);
  const userDataDir = path.join(runDir(runId), 'chrome-profile');
  await mkdir(userDataDir, { recursive: true });
  await mkdir(ARTIFACTS_ROOT, { recursive: true });

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: false,
    args: [
      `--disable-extensions-except=${extensionDir}`,
      `--load-extension=${extensionDir}`,
      '--no-first-run',
      '--no-default-browser-check',
    ],
  });

  let worker = context.serviceWorkers()[0];
  if (!worker) {
    worker = await context.waitForEvent('serviceworker', { timeout: 30_000 });
  }
  const extensionId = worker.url().split('/')[2];
  if (!extensionId) {
    await context.close();
    throw new Error('Could not resolve extension id from service worker URL');
  }

  const page = context.pages()[0] ?? (await context.newPage());
  const revision = await buildRevision(extensionDir);
  const popupUrl = `chrome-extension://${extensionId}/popup.html`;

  const session: Session = {
    context,
    page,
    state: {
      runId,
      port: 0,
      pid: process.pid,
      userDataDir,
      extensionDir,
      extensionId,
      popupUrl,
      buildRevision: revision,
    },
  };

  await openPopup(session);

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      if (req.method === 'GET' && url.pathname === '/doctor') {
        const alive = !!context.browser()?.isConnected() || context.pages().length >= 0;
        const headingVisible = await session.page
          .getByRole('heading', { name: 'LinkedOut' })
          .isVisible()
          .catch(() => false);
        return send(res, 200, {
          ok: alive && headingVisible,
          extensionId: session.state.extensionId,
          popupUrl: session.state.popupUrl,
          userDataDir: session.state.userDataDir,
          extensionDir: session.state.extensionDir,
          buildRevision: session.state.buildRevision,
          headingVisible,
        });
      }

      if (req.method === 'POST' && url.pathname === '/open-popup') {
        await openPopup(session);
        return send(res, 200, { ok: true, popupUrl: session.state.popupUrl });
      }

      if (req.method === 'POST' && url.pathname === '/click') {
        const body = (await readBody(req)) as {
          role?: string;
          name?: string;
        };
        if (!body.role || !body.name) {
          return send(res, 400, { ok: false, error: 'role and name required' });
        }
        await session.page
          .getByRole(body.role as Parameters<Page['getByRole']>[0], {
            name: body.name,
          })
          .click();
        return send(res, 200, { ok: true });
      }

      if (req.method === 'POST' && url.pathname === '/text-content') {
        const body = (await readBody(req)) as {
          role?: string;
          name?: string;
        };
        if (!body.role || !body.name) {
          return send(res, 400, { ok: false, error: 'role and name required' });
        }
        const text = await session.page
          .getByRole(body.role as Parameters<Page['getByRole']>[0], {
            name: body.name,
          })
          .innerText();
        return send(res, 200, { ok: true, text });
      }

      if (req.method === 'POST' && url.pathname === '/snapshot') {
        const body = (await readBody(req)) as { path?: string; aria?: boolean };
        if (!body.path) return send(res, 400, { ok: false, error: 'path required' });
        const out = path.resolve(ROOT, body.path);
        await mkdir(path.dirname(out), { recursive: true });
        if (body.aria !== false) {
          const aria = await session.page.locator('body').ariaSnapshot();
          await writeFile(out, aria);
        } else {
          const html = await session.page.content();
          await writeFile(out, html);
        }
        return send(res, 200, { ok: true, path: out });
      }

      if (req.method === 'POST' && url.pathname === '/screenshot') {
        const body = (await readBody(req)) as { path?: string };
        if (!body.path) return send(res, 400, { ok: false, error: 'path required' });
        const out = path.resolve(ROOT, body.path);
        await mkdir(path.dirname(out), { recursive: true });
        await session.page.screenshot({ path: out, fullPage: true });
        return send(res, 200, { ok: true, path: out });
      }

      if (req.method === 'POST' && url.pathname === '/shutdown') {
        send(res, 200, { ok: true });
        setTimeout(async () => {
          server.close();
          await context.close();
          process.exit(0);
        }, 50);
        return;
      }

      send(res, 404, { ok: false, error: `unknown route ${url.pathname}` });
    } catch (error) {
      send(res, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind control server');
  }
  session.state.port = address.port;
  session.state.pid = process.pid;
  await writeState(session.state);
  console.log(
    JSON.stringify(
      {
        ok: true,
        runId,
        port: session.state.port,
        extensionId,
        popupUrl,
        userDataDir,
        buildRevision: revision,
      },
      null,
      2,
    ),
  );
}

async function cmdLaunch(flags: Map<string, string | boolean>) {
  const runId =
    typeof flags.get('run-id') === 'string'
      ? String(flags.get('run-id'))
      : runIdFromEnv();
  process.env.LINKEDOUT_VERIFY_RUN_ID = runId;

  if (!flags.get('no-build')) {
    const build = spawn('bun', ['run', 'build'], {
      cwd: ROOT,
      stdio: 'inherit',
    });
    const code = await new Promise<number>((resolve) =>
      build.on('exit', (c) => resolve(c ?? 1)),
    );
    if (code !== 0) process.exit(code);
  }

  const logPath = path.join(runDir(runId), 'daemon.log');
  await mkdir(runDir(runId), { recursive: true });
  const logFd = openSync(logPath, 'a');

  const child = spawn(
    process.execPath,
    [import.meta.path, 'daemon', '--run-id', runId],
    {
      cwd: ROOT,
      detached: true,
      stdio: ['ignore', logFd, logFd],
      env: {
        ...process.env,
        LINKEDOUT_VERIFY_RUN_ID: runId,
        LINKEDOUT_VERIFY_DIR: runDir(runId),
      },
    },
  );

  child.unref();

  const started = await new Promise<State>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          `Launch timed out. See ${logPath}`,
        ),
      );
    }, 60_000);
    const interval = setInterval(() => {
      void readState(runId)
        .then((state) => {
          if (state.port) {
            clearTimeout(timer);
            clearInterval(interval);
            resolve(state);
          }
        })
        .catch(() => undefined);
    }, 200);
    child.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        clearInterval(interval);
        clearTimeout(timer);
        reject(new Error(`Daemon exited early (${code}). See ${logPath}`));
      }
    });
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        runId: started.runId,
        port: started.port,
        extensionId: started.extensionId,
        popupUrl: started.popupUrl,
        userDataDir: started.userDataDir,
        buildRevision: started.buildRevision,
        statePath: statePath(runId),
      },
      null,
      2,
    ),
  );
}

async function withState(
  flags: Map<string, string | boolean>,
): Promise<State> {
  const runId =
    typeof flags.get('run-id') === 'string'
      ? String(flags.get('run-id'))
      : process.env.LINKEDOUT_VERIFY_RUN_ID;
  if (!runId) {
    throw new Error('Pass --run-id or set LINKEDOUT_VERIFY_RUN_ID');
  }
  return readState(runId);
}

async function cmdDoctor(flags: Map<string, string | boolean>) {
  const state = await withState(flags);
  const result = await getJson(state.port, '/doctor');
  console.log(JSON.stringify({ ...result.data, status: result.status }, null, 2));
  if (!result.ok || !(result.data as { ok?: boolean }).ok) process.exit(1);
}

async function cmdOpenPopup(flags: Map<string, string | boolean>) {
  const state = await withState(flags);
  const result = await postJson(state.port, '/open-popup');
  console.log(JSON.stringify(result.data, null, 2));
  if (!result.ok) process.exit(1);
}

async function cmdClick(flags: Map<string, string | boolean>) {
  const state = await withState(flags);
  const result = await postJson(state.port, '/click', {
    role: flag(flags, 'role'),
    name: flag(flags, 'name'),
  });
  console.log(JSON.stringify(result.data, null, 2));
  if (!result.ok) process.exit(1);
}

async function cmdText(flags: Map<string, string | boolean>) {
  const state = await withState(flags);
  const result = await postJson(state.port, '/text-content', {
    role: flag(flags, 'role'),
    name: flag(flags, 'name'),
  });
  console.log(JSON.stringify(result.data, null, 2));
  if (!result.ok) process.exit(1);
}

async function cmdSnapshot(flags: Map<string, string | boolean>) {
  const state = await withState(flags);
  const result = await postJson(state.port, '/snapshot', {
    path: flag(flags, 'path'),
    aria: flags.get('aria') !== false,
  });
  console.log(JSON.stringify(result.data, null, 2));
  if (!result.ok) process.exit(1);
}

async function cmdScreenshot(flags: Map<string, string | boolean>) {
  const state = await withState(flags);
  const result = await postJson(state.port, '/screenshot', {
    path: flag(flags, 'path'),
  });
  console.log(JSON.stringify(result.data, null, 2));
  if (!result.ok) process.exit(1);
}

async function cmdCleanup(flags: Map<string, string | boolean>) {
  const runId =
    typeof flags.get('run-id') === 'string'
      ? String(flags.get('run-id'))
      : process.env.LINKEDOUT_VERIFY_RUN_ID;
  if (!runId) throw new Error('Pass --run-id or set LINKEDOUT_VERIFY_RUN_ID');

  try {
    const state = await readState(runId);
    await postJson(state.port, '/shutdown').catch(() => undefined);
    try {
      process.kill(state.pid, 0);
      process.kill(state.pid, 'SIGTERM');
    } catch {}
  } catch {}

  await rm(runDir(runId), { recursive: true, force: true });
  console.log(
    JSON.stringify(
      {
        ok: true,
        cleanedRunDir: runDir(runId),
        artifactsKeptAt: ARTIFACTS_ROOT,
      },
      null,
      2,
    ),
  );
}

function usage() {
  console.log(`control-linkedout — LinkedOut verification harness

Usage:
  control-linkedout launch [--run-id <id>] [--no-build]
  control-linkedout doctor --run-id <id>
  control-linkedout open-popup --run-id <id>
  control-linkedout click --run-id <id> --role <role> --name <name>
  control-linkedout text --run-id <id> --role <role> --name <name>
  control-linkedout snapshot --run-id <id> --path <file> [--aria]
  control-linkedout screenshot --run-id <id> --path <file>
  control-linkedout cleanup --run-id <id>

Env:
  LINKEDOUT_VERIFY_RUN_ID   default run id
  LINKEDOUT_VERIFY_DIR      disposable run directory
  LINKEDOUT_EXTENSION_DIR   override .output/chrome-mv3
`);
}

async function main() {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  const cmd = positionals[0];
  switch (cmd) {
    case 'daemon':
      await startDaemon(
        typeof flags.get('run-id') === 'string'
          ? String(flags.get('run-id'))
          : runIdFromEnv(),
      );
      break;
    case 'launch':
      await cmdLaunch(flags);
      break;
    case 'doctor':
      await cmdDoctor(flags);
      break;
    case 'open-popup':
      await cmdOpenPopup(flags);
      break;
    case 'click':
      await cmdClick(flags);
      break;
    case 'text':
      await cmdText(flags);
      break;
    case 'snapshot':
      await cmdSnapshot(flags);
      break;
    case 'screenshot':
      await cmdScreenshot(flags);
      break;
    case 'cleanup':
      await cmdCleanup(flags);
      break;
    default:
      usage();
      process.exit(cmd ? 1 : 0);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
