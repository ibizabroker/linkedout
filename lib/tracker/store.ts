import { browser } from 'wxt/browser';
import { parseFactsMessage } from './facts-message.ts';
import type { CheckResult } from './domain.ts';
import {
  SignInError,
  checkSheet,
  connectSheet,
  recreateSheet,
  renewSignIn,
  signOut,
} from './google.ts';
import {
  TRACKER_REQUEST,
  parseActionReply,
  parseCheckReply,
  parseRequest,
  type ActionReply,
  type TrackerAction,
} from './messages.ts';
import {
  clearSync,
  oauthConfigured,
  readSnapshot,
  writeAuthExpired,
  writeConnection,
} from './snapshot.ts';
import { FLUSH_ALARM, flush, recordApplication } from './writer.ts';

const LINKEDIN_ORIGIN = 'https://www.linkedin.com/';

type UserAction = Exclude<TrackerAction, 'check'>;

function send(action: TrackerAction): Promise<unknown> {
  return browser.runtime.sendMessage({ type: TRACKER_REQUEST, action });
}

export async function requestTrackerAction(action: UserAction): Promise<ActionReply> {
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

  const schedule = <T>(task: () => Promise<T>): Promise<T> => {
    const result = queue.then(task, task);
    queue = result.catch(() => undefined);
    return result;
  };
  const scheduleFlush = (): void => {
    void schedule(flush).catch(() => undefined);
  };

  browser.runtime.onMessage.addListener((message, sender) => {
    const action = parseRequest(message);
    if (action !== undefined) {
      if (sender.id !== browser.runtime.id || !extensionSender(sender)) {
        return Promise.reject(new Error('Rejected tracker request'));
      }
      if (action === 'check') {
        const result = schedule(runCheck);
        scheduleFlush();
        return result;
      }
      const result = schedule(() => runAction(action));
      void result.then((reply) => {
        if (reply.status === 'done' && reply.sheet !== null) {
          scheduleFlush();
        }
      });
      return result;
    }

    const facts = parseFactsMessage(message);
    if (facts === undefined) {
      return;
    }
    if (sender.id !== browser.runtime.id || sender.tab?.url?.startsWith(LINKEDIN_ORIGIN) !== true) {
      return Promise.reject(new Error('Rejected tracker application'));
    }
    const result = schedule(async () => ({
      verdict: (await recordApplication(facts, Date.now())).kind,
    }));
    void result.then(scheduleFlush, () => undefined);
    return result;
  });

  if (oauthConfigured()) {
    browser.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === FLUSH_ALARM) {
        scheduleFlush();
      }
    });
    scheduleFlush();
  }
}

async function runAction(action: UserAction): Promise<ActionReply> {
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
    if (action === 'reconnect') {
      const { connection } = await readSnapshot();
      if (connection === null) {
        return { status: 'failed' };
      }
      await renewSignIn();
      await writeAuthExpired(false);
      return { status: 'done', sheet: connection.sheet };
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
