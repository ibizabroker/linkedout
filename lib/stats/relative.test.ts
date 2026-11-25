import { describe, expect, test } from 'bun:test';
import { relativeTime } from './relative.ts';

const now = Date.UTC(2026, 10, 24, 12);

describe('relativeTime', () => {
  test('reads minutes, hours and days back from now', () => {
    expect(relativeTime(now - 5 * 60_000, now)).toBe('5 minutes ago');
    expect(relativeTime(now - 3 * 3_600_000, now)).toBe('3 hours ago');
    expect(relativeTime(now - 2 * 86_400_000, now)).toBe('2 days ago');
  });

  test('reads under a minute as now', () => {
    expect(relativeTime(now - 10_000, now)).toBe('now');
  });
});
