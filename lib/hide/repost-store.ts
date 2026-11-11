import { browser } from 'wxt/browser';
import {
  parseStoredRepostCache,
  serializeRepostCache,
  withRepostEntry,
  type RepostCache,
  type RepostFacts,
} from '@/lib/hide/repost-cache';

const REPOST_CACHE_KEY = 'repost-cache';
const REPOST_PAUSE_KEY = 'repost-pause-until';
const RECORD_REPOST = 'linkedout/repost-cache/record';
const LINKEDIN_ORIGIN = 'https://www.linkedin.com/';

export function watchRepostCache(onRead: (cache: RepostCache) => void): () => void {
  let stopped = false;

  void browser.storage.local.get(REPOST_CACHE_KEY).then(
    (stored) => {
      if (!stopped) {
        onRead(parseStoredRepostCache(stored[REPOST_CACHE_KEY], Date.now()));
      }
    },
    () => undefined,
  );

  const onChanged: Parameters<typeof browser.storage.onChanged.addListener>[0] = (
    changes,
    areaName,
  ) => {
    const change = areaName === 'local' ? changes[REPOST_CACHE_KEY] : undefined;
    if (change !== undefined) {
      onRead(parseStoredRepostCache(change.newValue, Date.now()));
    }
  };
  browser.storage.onChanged.addListener(onChanged);

  return () => {
    stopped = true;
    browser.storage.onChanged.removeListener(onChanged);
  };
}

export function recordReposts(results: ReadonlyMap<string, RepostFacts>): void {
  const records = [...results].map(([jobId, facts]) => ({ jobId, ...facts }));
  void browser.runtime.sendMessage({ type: RECORD_REPOST, records }).catch(() => undefined);
}

export function readRepostPause(): Promise<number | undefined> {
  return browser.storage.local.get(REPOST_PAUSE_KEY).then(
    (stored) => {
      const until: unknown = stored[REPOST_PAUSE_KEY];
      return typeof until === 'number' && Number.isFinite(until) ? until : undefined;
    },
    () => undefined,
  );
}

export function writeRepostPause(until: number | undefined): void {
  const write =
    until === undefined
      ? browser.storage.local.remove(REPOST_PAUSE_KEY)
      : browser.storage.local.set({ [REPOST_PAUSE_KEY]: until });
  void write.catch(() => undefined);
}

export function startRepostCacheOwner(): void {
  let queue: Promise<void> = Promise.resolve();

  browser.runtime.onMessage.addListener((message, sender) => {
    if (!isRecordMessage(message)) {
      return;
    }
    if (sender.id !== browser.runtime.id || sender.tab?.url?.startsWith(LINKEDIN_ORIGIN) !== true) {
      return Promise.reject(new Error('Rejected repost record'));
    }

    const write = queue.then(async () => {
      const stored = await browser.storage.local.get(REPOST_CACHE_KEY);
      const now = Date.now();
      let cache = parseStoredRepostCache(stored[REPOST_CACHE_KEY], now);
      for (const { jobId, ...facts } of message.records) {
        cache = withRepostEntry(cache, jobId, facts, now);
      }
      await browser.storage.local.set({ [REPOST_CACHE_KEY]: serializeRepostCache(cache) });
    });
    queue = write.catch(() => undefined);
    return write;
  });
}

type RepostRecord = RepostFacts & { readonly jobId: string };

function isRecordMessage(message: unknown): message is {
  readonly type: typeof RECORD_REPOST;
  readonly records: readonly RepostRecord[];
} {
  if (typeof message !== 'object' || message === null) {
    return false;
  }
  const record = message as Record<string, unknown>;
  return (
    record.type === RECORD_REPOST && Array.isArray(record.records) && record.records.every(isRecord)
  );
}

function isRecord(value: unknown): value is RepostRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.jobId === 'string' &&
    /^\d+$/.test(record.jobId) &&
    typeof record.reposted === 'boolean' &&
    isOptionalNumber(record.applies) &&
    isOptionalNumber(record.originalListedAt)
  );
}

function isOptionalNumber(value: unknown): boolean {
  return value === undefined || (typeof value === 'number' && Number.isFinite(value));
}
