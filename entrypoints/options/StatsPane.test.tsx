import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { Figures, StatsPane } from './StatsPane';

describe('Stats pane', () => {
  test('offers Connect Google Sheets when the sheet is not connected', () => {
    const html = renderToStaticMarkup(
      <StatsPane
        session={{
          view: { kind: 'disconnected', busy: false },
          act: () => undefined,
          pending: undefined,
        }}
      />,
    );
    expect(html).toContain('Connect Google Sheets');
    expect(html).not.toContain('All time');
  });

  test('shows the four headline figures from the cache', () => {
    const html = renderToStaticMarkup(
      <Figures
        cache={{ times: [Date.now(), Date.now()], readAt: Date.now() }}
      />,
    );
    expect(html).toContain('Today');
    expect(html).toContain('This month');
    expect(html).toContain('All time');
  });

  test('says it is reading the sheet while there is no cache', () => {
    expect(renderToStaticMarkup(<Figures cache={null} />)).toContain(
      'Reading your sheet',
    );
  });
});

describe('Stats bests', () => {
  test('names the best day, the best week and the weekly average', () => {
    const day = new Date(2026, 10, 24, 9).getTime();
    const html = renderToStaticMarkup(
      <Figures cache={{ times: [day, day + 1, day + 2], readAt: day }} />,
    );
    expect(html).toContain('Best day');
    expect(html).toContain('3 · ');
    expect(html).toContain('Best week');
    expect(html).toContain('Weekly average');
  });

  test('shows dashes with no applications', () => {
    const html = renderToStaticMarkup(
      <Figures cache={{ times: [], readAt: 0 }} />,
    );
    expect(html).toContain('>–<');
  });
});
