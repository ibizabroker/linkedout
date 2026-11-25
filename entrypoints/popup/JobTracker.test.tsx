import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { StatsLine } from './JobTracker';

describe('Stats line', () => {
  test('reads today, this week and last week in order', () => {
    const text = renderToStaticMarkup(
      <StatsLine today={3} thisWeek={11} lastWeek={9} />,
    ).replace(/<[^>]+>/g, '');
    expect(text).toBe('Today 3·This week 11·Last week 9');
  });
});
