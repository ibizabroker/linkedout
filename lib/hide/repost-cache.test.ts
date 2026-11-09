import { describe, expect, test } from 'bun:test';
import {
  REPOST_CACHE_CAP,
  REPOST_TTL_MS,
  emptyRepostCache,
  freshEntry,
  mergeRepostCaches,
  parseStoredRepostCache,
  serializeRepostCache,
  withRepostEntry,
} from './repost-cache.ts';

const NOW = 10 * REPOST_TTL_MS;

describe('repost cache', () => {
  test('a recorded entry is fresh and round-trips through storage', () => {
    const cache = withRepostEntry(emptyRepostCache(), '1', true, NOW);
    expect(freshEntry(cache, '1', NOW + 1000)).toEqual({ reposted: true, checkedAt: NOW });
    const back = parseStoredRepostCache(serializeRepostCache(cache), NOW);
    expect(freshEntry(back, '1', NOW)?.reposted).toBe(true);
  });

  test('an entry older than seven days is unknown and dropped on parse', () => {
    const cache = withRepostEntry(emptyRepostCache(), '1', true, NOW);
    expect(freshEntry(cache, '1', NOW + REPOST_TTL_MS)).toBeUndefined();
    const stored = serializeRepostCache(cache);
    expect(parseStoredRepostCache(stored, NOW + REPOST_TTL_MS).size).toBe(0);
  });

  test('past the cap the oldest entries go first', () => {
    let cache = emptyRepostCache();
    for (let id = 1; id <= REPOST_CACHE_CAP + 2; id += 1) {
      cache = withRepostEntry(cache, String(id), false, NOW + id);
    }
    expect(cache.size).toBe(REPOST_CACHE_CAP);
    expect(cache.has('1')).toBe(false);
    expect(cache.has('2')).toBe(false);
    expect(cache.has('3')).toBe(true);
  });

  test('anything unreadable parses to an empty cache or skips the bad entry', () => {
    expect(parseStoredRepostCache(undefined, NOW).size).toBe(0);
    expect(parseStoredRepostCache({ version: 2, entries: {} }, NOW).size).toBe(0);
    const mixed = {
      version: 1,
      entries: {
        '5': { reposted: true, checkedAt: NOW },
        x: { reposted: true, checkedAt: NOW },
        '6': { reposted: 'yes', checkedAt: NOW },
      },
    };
    expect([...parseStoredRepostCache(mixed, NOW).keys()]).toEqual(['5']);
  });

  test('merging keeps the newer entry for a job', () => {
    const older = withRepostEntry(emptyRepostCache(), '1', false, NOW);
    const newer = withRepostEntry(emptyRepostCache(), '1', true, NOW + 5);
    expect(mergeRepostCaches(older, newer, NOW + 5).get('1')?.reposted).toBe(true);
    expect(mergeRepostCaches(newer, older, NOW + 5).get('1')?.reposted).toBe(true);
  });
});
