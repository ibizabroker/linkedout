import { useId, type ReactElement } from 'react';
import type { StatsBar } from '@/lib/stats/bars';
import { scaleFor } from '@/lib/stats/scale';

const WIDTH = 640;
const HEIGHT = 190;
const TOP = 22;
const BOTTOM = 24;
const LEFT = 30;
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
  const slot = (WIDTH - LEFT) / bars.length;
  const y = (value: number): number =>
    base - (Math.min(value, top) / top) * (base - TOP);
  const tallest = values.indexOf(Math.max(...values));

  return (
    <figure>
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
          const labelled = bar.current === true || index === tallest || broken;
          return (
            <g key={bar.label}>
              <title>{`${bar.label}: ${bar.value} ${unit}`}</title>
              <rect
                x={x}
                y={TOP - 10}
                width={slot}
                height={base - TOP + 10}
                className="fill-transparent"
              />
              {bar.value > 0 ? (
                <path
                  d={barPath(left, width, barTop, base)}
                  className={
                    bar.current === true
                      ? 'fill-foreground'
                      : 'fill-muted-foreground'
                  }
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
