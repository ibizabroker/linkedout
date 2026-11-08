import { browser } from 'wxt/browser';
import {
  emptyBlocklist,
  parseStoredBlocklist,
  serializeBlocklist,
  withBlocked,
  withoutBlocked,
  type StoredBlocklistRead,
} from '@/lib/block/domain';

const BLOCKLIST_STORAGE_KEY = 'blocklist';
const BLOCK_COMPANY = 'linkedout/blocklist/block';
const UNBLOCK_COMPANY = 'linkedout/blocklist/unblock';

type Change = typeof BLOCK_COMPANY | typeof UNBLOCK_COMPANY;

export function watchBlocklist(onRead: (read: StoredBlocklistRead) => void): () => void {
  let stopped = false;

  void browser.storage.local.get(BLOCKLIST_STORAGE_KEY).then(
    (stored) => {
      if (!stopped) {
        onRead(parseStoredBlocklist(stored[BLOCKLIST_STORAGE_KEY]));
      }
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
    const change = changes[BLOCKLIST_STORAGE_KEY];
    if (areaName === 'local' && change !== undefined) {
      onRead(parseStoredBlocklist(change.newValue));
    }
  };

  browser.storage.onChanged.addListener(onChanged);

  return () => {
    stopped = true;
    browser.storage.onChanged.removeListener(onChanged);
  };
}

export function requestBlock(name: string): Promise<void> {
  return send(BLOCK_COMPANY, name);
}

export function requestUnblock(name: string): Promise<void> {
  return send(UNBLOCK_COMPANY, name);
}

export function startBlocklistOwner(): void {
  let writes: Promise<unknown> = Promise.resolve();

  browser.runtime.onMessage.addListener((message, sender) => {
    if (!isChangeMessage(message)) {
      return;
    }
    if (sender.id !== browser.runtime.id) {
      return Promise.reject(new Error('Rejected blocklist change'));
    }

    const apply = () => applyChange(message.type, message.name);
    const done = writes.then(apply, apply);
    writes = done.catch(() => undefined);
    return done;
  });
}

function send(type: Change, name: string): Promise<void> {
  return browser.runtime.sendMessage({ type, name }).then((reply: unknown) => {
    if (reply !== true) {
      throw new Error('Rejected blocklist change');
    }
  });
}

async function applyChange(type: Change, name: string): Promise<true> {
  const stored = await browser.storage.local.get(BLOCKLIST_STORAGE_KEY);
  const read = parseStoredBlocklist(stored[BLOCKLIST_STORAGE_KEY]);
  const current = read.status === 'ready' ? read.list : emptyBlocklist();
  const next =
    type === BLOCK_COMPANY ? withBlocked(current, name, Date.now()) : withoutBlocked(current, name);
  await browser.storage.local.set({ [BLOCKLIST_STORAGE_KEY]: serializeBlocklist(next) });
  return true;
}

function isChangeMessage(
  message: unknown,
): message is { readonly type: Change; readonly name: string } {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message.type === BLOCK_COMPANY || message.type === UNBLOCK_COMPANY) &&
    'name' in message &&
    typeof message.name === 'string' &&
    message.name.trim() !== ''
  );
}
