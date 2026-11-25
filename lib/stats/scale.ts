const CAP_RATIO = 3;
const CAP_HEADROOM = 1.4;
const MIN_CAPPED_TOP = 4;
const TICK_COUNT = 3;

export type Scale = {
  readonly top: number;
  readonly capped: boolean;
  readonly ticks: readonly number[];
  readonly average: number;
};

function tickStep(max: number): number {
  const raw = max / TICK_COUNT;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= raw) ??
    magnitude;
  return Math.max(1, step);
}

function ticksUpTo(max: number): number[] {
  const step = tickStep(max);
  const ticks: number[] = [];
  for (let tick = step; tick <= max; tick += step) {
    ticks.push(tick);
  }
  return ticks;
}

export function scaleFor(values: readonly number[]): Scale {
  const [peak = 0, second = 0] = [...values].sort((a, b) => b - a);
  const average =
    values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
  if (second > 0 && peak > second * CAP_RATIO) {
    const top = Math.max(MIN_CAPPED_TOP, Math.ceil(second * CAP_HEADROOM));
    return { top, capped: true, ticks: ticksUpTo(top), average };
  }
  const step = tickStep(Math.max(1, peak));
  const top = Math.ceil(Math.max(1, peak) / step) * step;
  return { top, capped: false, ticks: ticksUpTo(top), average };
}
