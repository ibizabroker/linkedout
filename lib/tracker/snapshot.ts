import { browser } from 'wxt/browser';
import { parseStoredTracker, serializeTracker, type Connection } from './domain.ts';
import { firefoxGoogleClientId } from './oauth.ts';
import {
  emptySync,
  parseSync,
  serializeOutbox,
  serializeWritten,
  type SyncState,
} from './outbox.ts';

export function oauthConfigured(): boolean {
  if (import.meta.env.FIREFOX) {
    return firefoxGoogleClientId() !== undefined;
  }
  return browser.runtime.getManifest().oauth2 !== undefined;
}

const TRACKER_KEY = 'tracker';
const WRITTEN_KEY = 'tracker-written';
const OUTBOX_KEY = 'tracker-outbox';
const EXPIRED_KEY = 'tracker-auth-expired';
const KEYS = [TRACKER_KEY, WRITTEN_KEY, OUTBOX_KEY, EXPIRED_KEY];

export type TrackerSnapshot = {
  readonly connection: Connection | null;
  readonly sync: SyncState;
  readonly authExpired: boolean;
};

const UNREADABLE: TrackerSnapshot = { connection: null, sync: emptySync(), authExpired: false };

export async function readSnapshot(): Promise<TrackerSnapshot> {
  const stored = await browser.storage.local.get(KEYS);
  return {
    connection: parseStoredTracker(stored[TRACKER_KEY]),
    sync: parseSync(stored[WRITTEN_KEY], stored[OUTBOX_KEY]),
    authExpired: stored[EXPIRED_KEY] === true,
  };
}

export function watchTracker(onRead: (snapshot: TrackerSnapshot) => void): () => void {
  let stopped = false;
  let latest = 0;

  const read = (): void => {
    latest += 1;
    const mine = latest;
    void readSnapshot().then(
      (snapshot) => {
        if (!stopped && mine === latest) {
          onRead(snapshot);
        }
      },
      () => {
        if (!stopped && mine === latest) {
          onRead(UNREADABLE);
        }
      },
    );
  };

  const onChanged: Parameters<typeof browser.storage.onChanged.addListener>[0] = (
    changes,
    areaName,
  ) => {
    if (areaName === 'local' && KEYS.some((key) => changes[key] !== undefined)) {
      read();
    }
  };
  browser.storage.onChanged.addListener(onChanged);
  read();

  return () => {
    stopped = true;
    browser.storage.onChanged.removeListener(onChanged);
  };
}

export function writeConnection(connection: Connection | null): Promise<void> {
  return browser.storage.local.set({ [TRACKER_KEY]: serializeTracker(connection) });
}

export function writeSync(state: SyncState): Promise<void> {
  return browser.storage.local.set({
    [WRITTEN_KEY]: serializeWritten(state),
    [OUTBOX_KEY]: serializeOutbox(state),
  });
}

export function writeAuthExpired(expired: boolean): Promise<void> {
  return expired
    ? browser.storage.local.set({ [EXPIRED_KEY]: true })
    : browser.storage.local.remove(EXPIRED_KEY);
}

export function clearSync(): Promise<void> {
  return browser.storage.local.remove([WRITTEN_KEY, OUTBOX_KEY, EXPIRED_KEY]);
}
