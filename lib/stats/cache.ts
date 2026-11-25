import { browser } from 'wxt/browser';

export const STATS_KEY = 'stats';

export type StatsCache = {
  readonly times: readonly number[];
  readonly readAt: number;
} | null;

export type StoredStats = {
  readonly version: 1;
  readonly times: readonly number[];
  readonly readAt: number;
};

export function parseStats(raw: unknown): StatsCache {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return null;
  }
  const { version, times, readAt } = raw as Record<string, unknown>;
  if (
    version !== 1 ||
    !Array.isArray(times) ||
    !times.every((time) => typeof time === 'number' && Number.isFinite(time)) ||
    typeof readAt !== 'number' ||
    !Number.isFinite(readAt)
  ) {
    return null;
  }
  return { times: [...(times as number[])].sort((a, b) => a - b), readAt };
}

export function serializeStats(times: readonly number[], readAt: number): StoredStats {
  return { version: 1, times, readAt };
}

export function withTime(times: readonly number[], time: number): readonly number[] {
  return [...times, time].sort((a, b) => a - b);
}

export async function readStats(): Promise<StatsCache> {
  return parseStats((await browser.storage.local.get(STATS_KEY))[STATS_KEY]);
}

export function writeStats(times: readonly number[], readAt: number): Promise<void> {
  return browser.storage.local.set({ [STATS_KEY]: serializeStats(times, readAt) });
}

export function clearStats(): Promise<void> {
  return browser.storage.local.remove(STATS_KEY);
}

export async function addAppliedTime(time: number): Promise<void> {
  const cache = await readStats();
  if (cache !== null && Number.isFinite(time)) {
    await writeStats(withTime(cache.times, time), cache.readAt);
  }
}
