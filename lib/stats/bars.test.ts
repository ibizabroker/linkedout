import { describe, expect, test } from 'bun:test';
import { dailyBars, weeklyBars } from './bars.ts';

const now = new Date(2026, 10, 24, 15, 0).getTime();
const at = (day: number, hour: number): number => new Date(2026, 10, day, hour).getTime();

describe('stats bars', () => {
  const times = [at(24, 9), at(24, 10), at(23, 9), at(17, 9)];

  test('daily bars end with today and count each day', () => {
    const bars = dailyBars(times, now);
    expect(bars.length).toBe(30);
    expect(bars.at(-1)?.value).toBe(2);
    expect(bars.at(-1)?.current).toBe(true);
    expect(bars.at(-1)?.label.startsWith('Today, ')).toBe(true);
    expect(bars.at(-2)?.value).toBe(1);
  });

  test('daily bars label only Mondays on the axis', () => {
    const labelled = dailyBars(times, now).filter((bar) => bar.axisLabel !== undefined);
    expect(labelled.length >= 4 && labelled.length <= 5).toBe(true);
  });

  test('weekly bars name this week and last week', () => {
    const bars = weeklyBars(times, now);
    expect(bars.length).toBe(12);
    expect(bars.at(-1)?.value).toBe(3);
    expect(bars.at(-1)?.current).toBe(true);
    expect(bars.at(-1)?.label.startsWith('This week, ')).toBe(true);
    expect(bars.at(-2)?.label.startsWith('Last week, ')).toBe(true);
    expect(bars.at(-2)?.value).toBe(1);
  });
});
