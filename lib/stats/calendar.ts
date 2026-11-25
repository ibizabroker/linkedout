export type Summary = {
  readonly today: number;
  readonly thisWeek: number;
  readonly lastWeek: number;
  readonly thisMonth: number;
  readonly allTime: number;
};

export function dayStart(time: number, daysFrom = 0): number {
  const date = new Date(time);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + daysFrom).getTime();
}

export function weekStart(time: number, weeksFrom = 0): number {
  const date = new Date(time);
  const sinceMonday = (date.getDay() + 6) % 7;
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - sinceMonday + weeksFrom * 7,
  ).getTime();
}

function monthStart(time: number, monthsFrom = 0): number {
  const date = new Date(time);
  return new Date(date.getFullYear(), date.getMonth() + monthsFrom, 1).getTime();
}

export function countBetween(times: readonly number[], from: number, until: number): number {
  return times.filter((time) => time >= from && time < until).length;
}

export function summarize(times: readonly number[], now: number): Summary {
  return {
    today: countBetween(times, dayStart(now), dayStart(now, 1)),
    thisWeek: countBetween(times, weekStart(now), weekStart(now, 1)),
    lastWeek: countBetween(times, weekStart(now, -1), weekStart(now)),
    thisMonth: countBetween(times, monthStart(now), monthStart(now, 1)),
    allTime: times.length,
  };
}
