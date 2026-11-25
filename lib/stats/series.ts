import { countBetween, dayStart, weekStart } from './calendar.ts';

export type DayCount = { readonly dayStart: number; readonly count: number };
export type WeekCount = { readonly weekStart: number; readonly count: number };
export type Bests = {
  readonly bestDay: DayCount | null;
  readonly bestWeek: WeekCount | null;
  readonly weeklyAverage: number;
  readonly dailyAverage: number;
};

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * 86_400_000;

export function dailySeries(times: readonly number[], now: number, days = 30): DayCount[] {
  return Array.from({ length: days }, (_, index) => {
    const start = dayStart(now, index - days + 1);
    return { dayStart: start, count: countBetween(times, start, dayStart(start, 1)) };
  });
}

export function weeklySeries(times: readonly number[], now: number, weeks = 12): WeekCount[] {
  return Array.from({ length: weeks }, (_, index) => {
    const start = weekStart(now, index - weeks + 1);
    return { weekStart: start, count: countBetween(times, start, weekStart(start, 1)) };
  });
}

function busiest(
  times: readonly number[],
  startOf: (time: number) => number,
): { readonly start: number; readonly count: number } | null {
  const counts = new Map<number, number>();
  for (const time of times) {
    const start = startOf(time);
    counts.set(start, (counts.get(start) ?? 0) + 1);
  }
  let best: { start: number; count: number } | null = null;
  for (const [start, count] of counts) {
    if (best === null || count > best.count || (count === best.count && start < best.start)) {
      best = { start, count };
    }
  }
  return best;
}

export function bests(times: readonly number[], now: number): Bests {
  const day = busiest(times, (time) => dayStart(time));
  const week = busiest(times, (time) => weekStart(time));
  const first = times[0];
  const weeks =
    first === undefined
      ? 1
      : Math.max(1, Math.round((weekStart(now) - weekStart(first)) / WEEK_MS) + 1);
  const days =
    first === undefined
      ? 1
      : Math.max(1, Math.round((dayStart(now) - dayStart(first)) / DAY_MS) + 1);
  return {
    bestDay: day === null ? null : { dayStart: day.start, count: day.count },
    bestWeek: week === null ? null : { weekStart: week.start, count: week.count },
    weeklyAverage: times.length / weeks,
    dailyAverage: times.length / days,
  };
}
