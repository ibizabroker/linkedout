import { dayStart, weekStart } from './calendar.ts';
import { dailySeries, weeklySeries } from './series.ts';

export type StatsBar = {
  readonly label: string;
  readonly value: number;
  readonly axisLabel?: string;
  readonly current?: boolean;
};

export function shortDate(time: number): string {
  return new Date(time).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function longDate(time: number): string {
  return new Date(time).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function dailyBars(times: readonly number[], now: number): StatsBar[] {
  const today = dayStart(now);
  return dailySeries(times, now, 30).map((day) => ({
    label: day.dayStart === today ? `Today, ${longDate(day.dayStart)}` : longDate(day.dayStart),
    value: day.count,
    axisLabel: new Date(day.dayStart).getDay() === 1 ? shortDate(day.dayStart) : undefined,
    current: day.dayStart === today,
  }));
}

export function weeklyBars(times: readonly number[], now: number): StatsBar[] {
  const thisWeek = weekStart(now);
  const lastWeek = weekStart(now, -1);
  return weeklySeries(times, now, 12).map((week) => {
    const date = `Week of ${shortDate(week.weekStart)}`;
    return {
      label:
        week.weekStart === thisWeek
          ? `This week, ${date}`
          : week.weekStart === lastWeek
            ? `Last week, ${date}`
            : date,
      value: week.count,
      axisLabel: shortDate(week.weekStart),
      current: week.weekStart === thisWeek,
    };
  });
}
