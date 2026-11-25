import { describe, expect, test } from 'bun:test';
import { parseStats, serializeStats, withTime } from './cache.ts';

describe('stats cache', () => {
  test('what is stored parses back', () => {
    expect(parseStats(serializeStats([1, 5, 9], 100))).toEqual({ times: [1, 5, 9], readAt: 100 });
  });

  test('an empty read is a cache with no times, not a missing cache', () => {
    expect(parseStats(serializeStats([], 100))).toEqual({ times: [], readAt: 100 });
    expect(parseStats(undefined)).toBe(null);
  });

  test('stored times come back sorted', () => {
    expect(parseStats({ version: 1, times: [9, 1, 5], readAt: 0 })?.times).toEqual([1, 5, 9]);
  });

  test('malformed or foreign values are treated as never read', () => {
    expect(parseStats({ version: 2, times: [], readAt: 1 })).toBe(null);
    expect(parseStats({ version: 1, times: [1, 'x'], readAt: 1 })).toBe(null);
    expect(parseStats({ version: 1, times: [Number.NaN], readAt: 1 })).toBe(null);
    expect(parseStats({ version: 1, times: [], readAt: 'now' })).toBe(null);
    expect(parseStats({ version: 1, times: {}, readAt: 1 })).toBe(null);
    expect(parseStats([])).toBe(null);
    expect(parseStats(null)).toBe(null);
  });
});

describe('withTime', () => {
  test('keeps the times sorted', () => {
    expect(withTime([1, 5, 9], 6)).toEqual([1, 5, 6, 9]);
    expect(withTime([], 3)).toEqual([3]);
  });
});
