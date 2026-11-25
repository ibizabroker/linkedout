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
