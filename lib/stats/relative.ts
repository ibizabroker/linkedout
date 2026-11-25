const UNITS: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
];

export function relativeTime(time: number, now: number): string {
  const format = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const elapsed = Math.max(0, now - time);
  for (const [unit, length] of UNITS) {
    if (elapsed >= length) {
      return format.format(-Math.floor(elapsed / length), unit);
    }
  }
  return format.format(0, 'second');
}
