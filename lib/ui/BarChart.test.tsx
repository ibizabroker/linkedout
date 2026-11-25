import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { BarChart } from './BarChart';

const bars = [
  { label: 'Mon 3 Nov', value: 2, axisLabel: '3' },
  { label: 'Tue 4 Nov', value: 0 },
  { label: 'Wed 5 Nov', value: 5, current: true },
];

describe('Bar chart', () => {
  const html = renderToStaticMarkup(
    <BarChart
      title="Applications per day"
      unit="applications"
      bars={bars}
      average={7 / 3}
    />,
  );

  test('gives every bar a title and a row in the text alternative', () => {
    expect(html).toContain('<title>Wed 5 Nov: 5 applications</title>');
    expect(html).toContain('<title>Tue 4 Nov: 0 applications</title>');
    expect(html).toContain(
      '<th scope="row">Mon 3 Nov</th><td>2 applications</td>',
    );
  });

  test('names the chart for assistive technology', () => {
    expect(html).toContain('role="img"');
    expect(html).toContain('<caption>Applications per day</caption>');
  });

  test('marks only the current bar in the foreground colour', () => {
    expect(
      html.match(/<path d="[^"]*" class="[^"]*fill-foreground [^"]*"/g)?.length,
    ).toBe(1);
  });

  test('draws no bar for a zero value', () => {
    expect(
      html.match(
        /<path d="[^"]*" class="[^"]*fill-(foreground|muted-foreground) [^"]*"/g,
      )?.length,
    ).toBe(2);
  });

  test('labels only the current and tallest bars, not every bar', () => {
    expect(html.match(/font-semibold/g)?.length).toBe(1);
  });

  test('draws gridlines with their tick labels and an average line', () => {
    expect(html).toContain('stroke-dasharray="2 3"');
    expect(html).toContain('avg 2.3');
  });

  test('draws the average it is given, not the mean of its bars', () => {
    const given = renderToStaticMarkup(
      <BarChart title="t" unit="applications" bars={bars} average={0.6} />,
    );
    expect(given).toContain('avg 0.6');
    expect(given).not.toContain('avg 2.3');
  });

  test('drops the line when the average is zero or above the top', () => {
    for (const average of [0, 50]) {
      const html = renderToStaticMarkup(
        <BarChart
          title="t"
          unit="applications"
          bars={bars}
          average={average}
        />,
      );
      expect(html).not.toContain('avg ');
    }
  });

  test('breaks a bar that is far above the rest and labels its real value', () => {
    const spike = renderToStaticMarkup(
      <BarChart
        title="t"
        unit="applications"
        average={1}
        bars={[
          ...[2, 1, 3, 2, 1].map((value, i) => ({ label: `d${i}`, value })),
          { label: 'today', value: 100, current: true },
        ]}
      />,
    );
    expect(spike).toContain('class="stroke-background"');
    expect(spike).toContain('>100</text>');
    expect(html).not.toContain('class="stroke-background"');
  });

  test('is one keyboard stop that names how to step through the bars', () => {
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('arrow keys');
  });

  test('shows no tooltip until a bar is hovered or focused', () => {
    expect(html).not.toContain('applied</strong>');
  });
});
