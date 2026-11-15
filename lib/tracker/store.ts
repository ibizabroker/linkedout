import { browser } from 'wxt/browser';
import type { CheckResult } from './domain.ts';
import { SignInError, checkSheet, connectSheet, recreateSheet, signOut } from './google.ts';
import {
  TRACKER_REQUEST,
  parseActionReply,
  parseCheckReply,
  parseRequest,
  type ActionReply,
  type TrackerAction,
} from './messages.ts';
import { clearSync, readSnapshot, writeConnection } from './snapshot.ts';

export function oauthConfigured(): boolean {
  return browser.runtime.getManifest().oauth2 !== undefined;
}

function send(action: TrackerAction): Promise<unknown> {
  return browser.runtime.sendMessage({ type: TRACKER_REQUEST, action });
}

export async function requestTrackerAction(
  action: 'connect' | 'disconnect' | 'recreate',
): Promise<ActionReply> {
  const reply = parseActionReply(await send(action));
  if (reply === undefined) {
    throw new Error('Rejected tracker reply');
  }
  return reply;
}

export async function requestTrackerCheck(): Promise<CheckResult> {
  const result = parseCheckReply(await send('check'));
  if (result === undefined) {
    throw new Error('Rejected tracker reply');
  }
  return result;
}

export function startTrackerOwner(): void {
  let queue: Promise<unknown> = Promise.resolve();

  browser.runtime.onMessage.addListener((message, sender) => {
    const action = parseRequest(message);
    if (action === undefined) {
      return;
    }
    if (sender.id !== browser.runtime.id || !extensionSender(sender)) {
      return Promise.reject(new Error('Rejected tracker request'));
    }
    const run = (): Promise<unknown> => (action === 'check' ? runCheck() : runAction(action));
    const result = queue.then(run, run);
    queue = result;
    return result;
  });
}

async function runAction(action: 'connect' | 'disconnect' | 'recreate'): Promise<ActionReply> {
  if (!oauthConfigured()) {
    return { status: 'failed' };
  }
  try {
    if (action === 'disconnect') {
      await signOut();
      await clearSync();
      await writeConnection(null);
      return { status: 'done', sheet: null };
    }
    const sheet = await (action === 'connect' ? connectSheet() : recreateSheet());
    await writeConnection({ sheet, connectedAt: await connectedAtFor(action) });
    return { status: 'done', sheet };
  } catch (error) {
    return error instanceof SignInError && error.failure === 'cancelled'
      ? { status: 'cancelled' }
      : { status: 'failed' };
  }
}

async function runCheck(): Promise<{ readonly status: CheckResult }> {
  if (!oauthConfigured()) {
    return { status: 'error' };
  }
  const { connection } = await readSnapshot();
  return { status: connection === null ? 'ok' : await checkSheet(connection.sheet) };
}

async function connectedAtFor(action: 'connect' | 'recreate'): Promise<number> {
  const { connection } = await readSnapshot();
  return action === 'recreate' && connection !== null ? connection.connectedAt : Date.now();
}

function extensionSender(sender: { readonly tab?: unknown; readonly url?: string }): boolean {
  return sender.tab === undefined || sender.url?.startsWith(browser.runtime.getURL('')) === true;
}
