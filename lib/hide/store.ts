import { browser } from 'wxt/browser';
import {
  parseReplaceDocument,
  parseStoredHideSet,
  serializeHideSet,
  type HideSet,
  type StoredHideRead,
} from '@/lib/hide/domain';

const HIDE_SET_STORAGE_KEY = 'hide-set';
const REPLACE_HIDE_SET = 'linkedout/hide-set/replace';

export function watchHideSet(onRead: (read: StoredHideRead) => void): () => void {
  let stopped = false;

  void browser.storage.local.get(HIDE_SET_STORAGE_KEY).then(
    (stored) => {
      if (stopped) {
        return;
      }
      onRead(parseStoredHideSet(stored[HIDE_SET_STORAGE_KEY]));
    },
    () => {
      if (!stopped) {
        onRead({ status: 'unreadable' });
      }
    },
  );

  const onChanged: Parameters<typeof browser.storage.onChanged.addListener>[0] = (
    changes,
    areaName,
  ) => {
    if (areaName !== 'local' || !Object.hasOwn(changes, HIDE_SET_STORAGE_KEY)) {
      return;
    }

    const change = changes[HIDE_SET_STORAGE_KEY];
    if (change === undefined) {
      return;
    }

    onRead(parseStoredHideSet(change.newValue));
  };

  browser.storage.onChanged.addListener(onChanged);

  return () => {
    stopped = true;
    browser.storage.onChanged.removeListener(onChanged);
  };
}

export function requestHideSet(set: HideSet): Promise<HideSet> {
  return browser.runtime
    .sendMessage({
      type: REPLACE_HIDE_SET,
      document: serializeHideSet(set),
    })
    .then((reply: unknown) => {
      const stored = parseReplaceDocument(reply);
      if (stored === undefined) {
        throw new Error('Rejected hide set replace');
      }
      return stored;
    });
}

export function startHideSetOwner(): void {
  browser.runtime.onMessage.addListener((message, sender) => {
    if (!isReplaceMessage(message)) {
      return;
    }

    if (sender.id !== browser.runtime.id || !extensionSender(sender)) {
      return Promise.reject(new Error('Rejected hide set replace'));
    }

    const next = parseReplaceDocument(message.document);
    if (next === undefined) {
      return Promise.reject(new Error('Rejected hide set replace'));
    }

    return putHideSet(next).then(() => serializeHideSet(next));
  });
}

function extensionSender(sender: { readonly tab?: unknown; readonly url?: string }): boolean {
  if (sender.tab === undefined) {
    return true;
  }

  return sender.url?.startsWith(browser.runtime.getURL('')) === true;
}

function putHideSet(set: HideSet): Promise<void> {
  return browser.storage.local.set({
    [HIDE_SET_STORAGE_KEY]: serializeHideSet(set),
  });
}

function isReplaceMessage(message: unknown): message is {
  readonly type: typeof REPLACE_HIDE_SET;
  readonly document: unknown;
} {
  if (!isRecord(message) || message.type !== REPLACE_HIDE_SET || !('document' in message)) {
    return false;
  }

  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
