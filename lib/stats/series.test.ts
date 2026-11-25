import { describe, expect, test } from 'bun:test';
import { bests, dailySeries, weeklySeries } from './series.ts';

const at = (y: number, m: number, d: number, h = 12): number => new Date(y, m - 1, d, h).getTime();
const midnight = (y: number, m: number, d: number): number => new Date(y, m - 1, d).getTime();

describe('dailySeries', () => {
  test('lists the last days oldest first, zero days included', () => {
    const times = [at(2026, 5, 20), at(2026, 5, 20, 15), at(2026, 5, 18)];
    expect(dailySeries(times, at(2026, 5, 20), 4)).toEqual([
      { dayStart: midnight(2026, 5, 17), count: 0 },
      { dayStart: midnight(2026, 5, 18), count: 1 },
      { dayStart: midnight(2026, 5, 19), count: 0 },
      { dayStart: midnight(2026, 5, 20), count: 2 },
    ]);
  });

  test('covers 30 days by default', () => {
    expect(dailySeries([], at(2026, 5, 20)).length).toBe(30);
  });
});

describe('weeklySeries', () => {
  test('lists Monday-based weeks oldest first', () => {
    const times = [at(2026, 5, 17), at(2026, 5, 18), at(2026, 5, 20)];
    expect(weeklySeries(times, at(2026, 5, 21), 3)).toEqual([
      { weekStart: midnight(2026, 5, 4), count: 0 },
      { weekStart: midnight(2026, 5, 11), count: 1 },
      { weekStart: midnight(2026, 5, 18), count: 2 },
    ]);
  });

  test('covers 12 weeks by default', () => {
    expect(weeklySeries([], at(2026, 5, 20)).length).toBe(12);
  });
});

describe('bests', () => {
  test('no applications gives no bests and a zero average', () => {
    expect(bests([], at(2026, 5, 20))).toEqual({
      bestDay: null,
      bestWeek: null,
      weeklyAverage: 0,
      dailyAverage: 0,
    });
  });

  test('finds the busiest day and week', () => {
    const times = [at(2026, 5, 4), at(2026, 5, 11), at(2026, 5, 11, 15), at(2026, 5, 12)];
    const result = bests(times, at(2026, 5, 20));
    expect(result.bestDay).toEqual({ dayStart: midnight(2026, 5, 11), count: 2 });
    expect(result.bestWeek).toEqual({ weekStart: midnight(2026, 5, 11), count: 3 });
  });

  test('averages over the weeks from the first row through the current week', () => {
    const times = [at(2026, 5, 4), at(2026, 5, 5), at(2026, 5, 13), at(2026, 5, 19)];
    expect(bests(times, at(2026, 5, 20)).weeklyAverage).toBe(4 / 3);
  });

  test('a first row this week counts as one week', () => {
    expect(bests([at(2026, 5, 19)], at(2026, 5, 20)).weeklyAverage).toBe(1);
  });

  test('averages per day from the first row through today', () => {
    const times = [at(2026, 5, 17), at(2026, 5, 18), at(2026, 5, 20)];
    expect(bests(times, at(2026, 5, 20)).dailyAverage).toBe(3 / 4);
  });

  test('rows all from today average their count per day', () => {
    const times = [at(2026, 5, 20, 9), at(2026, 5, 20, 10), at(2026, 5, 20, 11)];
    expect(bests(times, at(2026, 5, 20)).dailyAverage).toBe(3);
  });
});
