import { describe, expect, test } from 'bun:test';
import { summarize } from '@/lib/stats/calendar';
import { dailySeries } from '@/lib/stats/series';
import { demoHistory } from './history';

const now = new Date(2026, 10, 24, 11, 0).getTime();

describe('demo history', () => {
  const times = demoHistory(now);

  test('covers about ten weeks, oldest first, all before now', () => {
    expect(times.length > 80 && times.length < 400).toBe(true);
    expect(times.every((time, index) => index === 0 || (times[index - 1] ?? 0) <= time)).toBe(true);
    expect(times.every((time) => time < now)).toBe(true);
    expect(now - (times[0] ?? now) > 60 * 86_400_000).toBe(true);
  });

  test('starts today at zero so applying ticks it up', () => {
    expect(summarize(times, now).today).toBe(0);
  });

  test('varies between 0 and 6 a day and fills last week', () => {
    const days = dailySeries(times, now, 70).map((day) => day.count);
    expect(Math.max(...days) <= 6).toBe(true);
    expect(new Set(days).size >= 4).toBe(true);
    expect(summarize(times, now).lastWeek > 0).toBe(true);
  });
});
