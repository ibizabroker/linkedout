import { dayStart } from '@/lib/stats/calendar';

const WEEKS = 10;
const WEEKDAY_COUNTS = [3, 5, 2, 4, 6, 1, 4, 3, 0, 5, 2, 4];
const WEEKEND_COUNTS = [0, 1, 0, 0, 2, 0, 1];

export function demoHistory(now: number): readonly number[] {
  const times: number[] = [];
  for (let back = WEEKS * 7; back >= 1; back -= 1) {
    const start = dayStart(now, -back);
    const weekend = [0, 6].includes(new Date(start).getDay());
    const counts = weekend ? WEEKEND_COUNTS : WEEKDAY_COUNTS;
    const count = counts[(back * 5 + Math.floor(back / 7)) % counts.length] ?? 0;
    for (let index = 0; index < count; index += 1) {
      times.push(start + (9 + index * 1.4) * 3_600_000);
    }
  }
  return times.map(Math.round).filter((time) => time < now);
}
