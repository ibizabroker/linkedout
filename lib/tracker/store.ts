import { browser } from 'wxt/browser';
import {
  parseStoredTracker,
  serializeTracker,
  type CheckResult,
  type TrackerSheet,
} from './domain.ts';
import { SignInError, checkSheet, connectSheet, recreateSheet, signOut } from './google.ts';
import {
  TRACKER_REQUEST,
  parseActionReply,
  parseCheckReply,
  parseRequest,
  type ActionReply,
  type TrackerAction,
} from './messages.ts';

const TRACKER_STORAGE_KEY = 'tracker';

export function oauthConfigured(): boolean {
  return browser.runtime.getManifest().oauth2 !== undefined;
}

export function watchTracker(onRead: (sheet: TrackerSheet | null) => void): () => void {
  let stopped = false;

  void browser.storage.local.get(TRACKER_STORAGE_KEY).then(
    (stored) => {
      if (!stopped) {
        onRead(parseStoredTracker(stored[TRACKER_STORAGE_KEY]));
      }
    },
    () => {
      if (!stopped) {
        onRead(null);
      }
    },
  );

  const onChanged: Parameters<typeof browser.storage.onChanged.addListener>[0] = (
    changes,
    areaName,
  ) => {
    const change = areaName === 'local' ? changes[TRACKER_STORAGE_KEY] : undefined;
    if (change !== undefined) {
      onRead(parseStoredTracker(change.newValue));
    }
  };
  browser.storage.onChanged.addListener(onChanged);

  return () => {
    stopped = true;
    browser.storage.onChanged.removeListener(onChanged);
  };
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
      await writeSheet(null);
      return { status: 'done', sheet: null };
    }
    const sheet = await (action === 'connect' ? connectSheet() : recreateSheet());
    await writeSheet(sheet);
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
  const stored = await browser.storage.local.get(TRACKER_STORAGE_KEY);
  const sheet = parseStoredTracker(stored[TRACKER_STORAGE_KEY]);
  return { status: sheet === null ? 'ok' : await checkSheet(sheet) };
}

function writeSheet(sheet: TrackerSheet | null): Promise<void> {
  return browser.storage.local.set({ [TRACKER_STORAGE_KEY]: serializeTracker(sheet) });
}

function extensionSender(sender: { readonly tab?: unknown; readonly url?: string }): boolean {
  return sender.tab === undefined || sender.url?.startsWith(browser.runtime.getURL('')) === true;
}
