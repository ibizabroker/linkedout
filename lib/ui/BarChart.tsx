import { useId, useState, type KeyboardEvent, type ReactElement } from 'react';
import { compareToAverage } from '@/lib/stats/comparison';
import type { StatsBar } from '@/lib/stats/bars';
import { scaleFor } from '@/lib/stats/scale';

const WIDTH = 640;
const HEIGHT = 190;
const TOP = 22;
const BOTTOM = 24;
const LEFT = 30;
const RIGHT = 12;
const CORNER = 3;
const BAR_SHARE = 0.66;

function barPath(x: number, width: number, top: number, base: number): string {
  const radius = Math.min(CORNER, width / 2, base - top);
  return `M${x},${base} V${top + radius} Q${x},${top} ${x + radius},${top} H${x + width - radius} Q${x + width},${top} ${x + width},${top + radius} V${base} Z`;
}

export function BarChart(props: {
  readonly title: string;
  readonly unit: string;
  readonly bars: readonly StatsBar[];
}): ReactElement {
  const { title, unit, bars } = props;
  const titleId = useId();
  const values = bars.map((bar) => bar.value);
  const { top, capped, ticks, average } = scaleFor(values);
  const base = HEIGHT - BOTTOM;
  const slot = (WIDTH - LEFT - RIGHT) / bars.length;
  const y = (value: number): number =>
    base - (Math.min(value, top) / top) * (base - TOP);
  const tallest = values.indexOf(Math.max(...values));
  const [active, setActive] = useState<number | null>(null);
  const activeBar = active === null ? undefined : bars[active];
  const currentIndex = Math.max(
    0,
    bars.findIndex((bar) => bar.current === true),
  );

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      setActive(null);
      return;
    }
    const step =
      event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) {
      return;
    }
    event.preventDefault();
    setActive(
      Math.min(bars.length - 1, Math.max(0, (active ?? currentIndex) + step)),
    );
  };

  return (
    <figure>
      <div
        role="group"
        aria-label={`${title}. Use the left and right arrow keys to step through the bars.`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onFocus={() => setActive((current) => current ?? currentIndex)}
        onBlur={() => setActive(null)}
        className="relative rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-labelledby={titleId}
          className="block h-auto w-full text-[11px]"
        >
          <title id={titleId}>{title}</title>
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={LEFT}
                x2={WIDTH}
                y1={y(tick) + 0.5}
                y2={y(tick) + 0.5}
                strokeDasharray="2 3"
                className="stroke-border"
              />
              <text
                x={LEFT - 8}
                y={y(tick) + 4}
                textAnchor="end"
                className="fill-muted-foreground tabular-nums"
              >
                {tick}
              </text>
            </g>
          ))}
          <line
            x1={LEFT}
            x2={WIDTH}
            y1={base + 0.5}
            y2={base + 0.5}
            className="stroke-border"
          />
          {average > 0 && average <= top ? (
            <g className="fill-primary stroke-primary">
              <line
                x1={LEFT}
                x2={WIDTH}
                y1={y(average)}
                y2={y(average)}
                strokeWidth={1.5}
                strokeDasharray="5 4"
              />
              <text
                x={LEFT + 4}
                y={y(average) - 5}
                stroke="none"
                className="tabular-nums"
              >
                {`avg ${average.toFixed(1)}`}
              </text>
            </g>
          ) : null}
          {bars.map((bar, index) => {
            const x = LEFT + index * slot;
            const width = slot * BAR_SHARE;
            const left = x + (slot - width) / 2;
            const barTop = y(bar.value);
            const broken = capped && bar.value > top;
            const labelled =
              bar.current === true || index === tallest || broken;
            return (
              <g key={bar.label}>
                <title>{`${bar.label}: ${bar.value} ${unit}`}</title>
                <rect
                  x={x}
                  y={TOP - 10}
                  width={slot}
                  height={base - TOP + 10}
                  className="fill-transparent"
                  onPointerEnter={() => setActive(index)}
                  onPointerLeave={() => setActive(null)}
                />
                {bar.value > 0 ? (
                  <path
                    d={barPath(left, width, barTop, base)}
                    className={`transition-opacity motion-reduce:transition-none ${
                      bar.current === true
                        ? 'fill-foreground'
                        : 'fill-muted-foreground'
                    } ${active !== null && active !== index ? 'opacity-45' : ''}`}
                  />
                ) : null}
                {broken ? (
                  <path
                    d={`M${left - 2},${barTop + 21} L${left + width + 2},${barTop + 15} M${left - 2},${barTop + 26} L${left + width + 2},${barTop + 20}`}
                    strokeWidth={3}
                    className="stroke-background"
                  />
                ) : null}
                {labelled && bar.value > 0 ? (
                  <text
                    x={left + width / 2}
                    y={barTop - 6}
                    textAnchor="middle"
                    className="fill-foreground text-xs font-semibold tabular-nums"
                  >
                    {bar.value}
                  </text>
                ) : null}
                {bar.axisLabel === undefined ? null : (
                  <text
                    x={x + slot / 2}
                    y={HEIGHT - 7}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                  >
                    {bar.axisLabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {active !== null && activeBar !== undefined ? (
          <Tooltip
            bar={activeBar}
            average={average}
            left={((LEFT + (active + 0.5) * slot) / WIDTH) * 100}
            top={(y(activeBar.value) / HEIGHT) * 100}
          />
        ) : null}
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {bars.map((bar) => (
            <tr key={bar.label}>
              <th scope="row">{bar.label}</th>
              <td>{`${bar.value} ${unit}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function Tooltip(props: {
  readonly bar: StatsBar;
  readonly average: number;
  readonly left: number;
  readonly top: number;
}): ReactElement {
  const { bar, average, left, top } = props;
  const comparison = compareToAverage(bar.value, average);
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-full flex-col rounded-md bg-foreground px-2.5 py-1.5 text-xs whitespace-nowrap text-background"
      style={{
        left: `${Math.min(Math.max(left, 14), 86)}%`,
        top: `calc(${Math.max(top, 14)}% - 8px)`,
      }}
    >
      <strong className="tabular-nums">{`${bar.value} applied`}</strong>
      <span>{bar.label}</span>
      {comparison === undefined ? null : <span>{comparison}</span>}
    </div>
  );
}
