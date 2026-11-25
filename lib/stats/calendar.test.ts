import { describe, expect, test } from 'bun:test';
import { summarize } from './calendar.ts';

const at = (y: number, m: number, d: number, h = 0, mi = 0): number =>
  new Date(y, m - 1, d, h, mi).getTime();

describe('summarize', () => {
  test('empty history counts nothing', () => {
    expect(summarize([], at(2026, 5, 20))).toEqual({
      today: 0,
      thisWeek: 0,
      lastWeek: 0,
      thisMonth: 0,
      allTime: 0,
    });
  });

  test('a day starts at local midnight', () => {
    const times = [at(2026, 5, 19, 23, 59), at(2026, 5, 20, 0, 0), at(2026, 5, 20, 9, 30)];
    expect(summarize(times, at(2026, 5, 20, 12)).today).toBe(2);
  });

  test('weeks run Monday to Sunday', () => {
    const times = [at(2026, 5, 17, 23, 59), at(2026, 5, 18, 0, 0), at(2026, 5, 24, 23, 59)];
    const summary = summarize(times, at(2026, 5, 21, 12));
    expect(summary.thisWeek).toBe(2);
    expect(summary.lastWeek).toBe(1);
  });

  test('a Sunday belongs to the week that began on the Monday before', () => {
    const times = [at(2026, 5, 18), at(2026, 5, 24, 20)];
    const summary = summarize(times, at(2026, 5, 24, 21));
    expect(summary.thisWeek).toBe(2);
    expect(summary.lastWeek).toBe(0);
  });

  test('months split at the first midnight', () => {
    const times = [at(2026, 4, 30, 23, 59), at(2026, 5, 1, 0, 0), at(2026, 5, 31, 23, 59)];
    const summary = summarize(times, at(2026, 5, 31, 23, 59));
    expect(summary.thisMonth).toBe(2);
    expect(summary.allTime).toBe(3);
  });
});
