import { useId, type ReactElement } from 'react';
import type { StatsBar } from '@/lib/stats/bars';

const WIDTH = 640;
const HEIGHT = 144;
const TOP = 16;
const BOTTOM = 22;
const SPARSE_LIMIT = 12;

export function BarChart(props: {
  readonly title: string;
  readonly unit: string;
  readonly bars: readonly StatsBar[];
}): ReactElement {
  const { title, unit, bars } = props;
  const titleId = useId();
  const peak = Math.max(1, ...bars.map((bar) => bar.value));
  const plotHeight = HEIGHT - TOP - BOTTOM;
  const slot = WIDTH / bars.length;
  const sparse = bars.length <= SPARSE_LIMIT;

  return (
    <figure>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-labelledby={titleId}
        className="block h-auto w-full text-[11px]"
      >
        <title id={titleId}>{title}</title>
        <line
          x1={0}
          x2={WIDTH}
          y1={HEIGHT - BOTTOM + 0.5}
          y2={HEIGHT - BOTTOM + 0.5}
          className="stroke-border"
        />
        {bars.map((bar, index) => {
          const height = (bar.value / peak) * plotHeight;
          const x = index * slot;
          return (
            <g key={bar.label}>
              <title>{`${bar.label}: ${bar.value} ${unit}`}</title>
              <rect
                x={x}
                y={0}
                width={slot}
                height={HEIGHT - BOTTOM}
                className="fill-transparent"
              />
              <rect
                x={x + slot * 0.15}
                y={HEIGHT - BOTTOM - height}
                width={slot * 0.7}
                height={height}
                className={
                  bar.current === true
                    ? 'fill-foreground'
                    : 'fill-muted-foreground'
                }
              />
              {sparse || bar.value > 0 ? (
                <text
                  x={x + slot / 2}
                  y={HEIGHT - BOTTOM - height - 4}
                  textAnchor="middle"
                  className="fill-foreground tabular-nums"
                >
                  {bar.value}
                </text>
              ) : null}
              {bar.axisLabel === undefined ? null : (
                <text
                  x={index === 0 ? x : x + slot / 2}
                  y={HEIGHT - 6}
                  textAnchor={index === 0 ? 'start' : 'middle'}
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
