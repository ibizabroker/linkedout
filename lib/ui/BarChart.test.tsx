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
    <BarChart title="Applications per day" unit="applications" bars={bars} />,
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
    expect(html.match(/fill-foreground"/g)?.length).toBe(1);
  });

  test('draws a zero bar with no height', () => {
    expect(html).toContain('height="0"');
  });
});
