import { describe, expect, test } from 'bun:test';
import { parseHTML } from 'linkedom';
import { appliedJobIds, currentJobIdOf } from './applied-signal.ts';

function page(html: string): Document {
  return parseHTML(`<html><body>${html}</body></html>`).document;
}

const card = (id: string, footer: string): string =>
  `<div role="button" componentkey="job-card-component-ref-${id}"><p>Engineer</p><p>${footer}</p></div>`;
const search = { pathname: '/jobs/search-results/', search: '?keywords=x' };

describe('which job id a page is about', () => {
  test('a job page carries it in the path and a list page in currentJobId', () => {
    expect(currentJobIdOf({ pathname: '/jobs/view/123/', search: '' })).toBe('123');
    expect(currentJobIdOf({ pathname: '/jobs/view/123', search: '?x=1' })).toBe('123');
    expect(currentJobIdOf({ pathname: '/jobs/search-results/', search: '?currentJobId=456' })).toBe(
      '456',
    );
  });

  test('no id, or one that is not numeric, reads as none', () => {
    expect(currentJobIdOf(search)).toBeUndefined();
    expect(currentJobIdOf({ pathname: '/jobs/', search: '?currentJobId=abc' })).toBeUndefined();
  });
});

describe('applied signal in the page', () => {
  test('a card with an Applied footer is a candidate and others are not', () => {
    const doc = page(card('1', 'Applied') + card('2', 'Viewed') + card('3', '2 days ago'));
    expect(appliedJobIds(doc, search)).toEqual(['1']);
  });

  test('the pane saying it applied makes the current job a candidate', () => {
    const company = page('<main><p>Applied on company site</p></main>');
    expect(appliedJobIds(company, { pathname: '/jobs/view/9/', search: '' })).toEqual(['9']);
    const aged = page('<main><span>Applied 52 minutes ago</span></main>');
    expect(
      appliedJobIds(aged, { pathname: '/jobs/collections/', search: '?currentJobId=7' }),
    ).toEqual(['7']);
    const bare = page('<main><span>Applied</span></main>');
    expect(appliedJobIds(bare, { pathname: '/jobs/view/9/', search: '' })).toEqual(['9']);
  });

  test('a pane that does not say applied adds nothing, and a company named Applied is ignored', () => {
    const view = { pathname: '/jobs/view/9/', search: '' };
    expect(appliedJobIds(page('<main><p>Easy Apply</p></main>'), view)).toEqual([]);
    expect(appliedJobIds(page('<main><p>Applied Materials</p></main>'), view)).toEqual([]);
  });

  test('an Applied footer inside a card does not make the pane job a candidate', () => {
    const doc = page(card('1', 'Applied'));
    expect(appliedJobIds(doc, { pathname: '/jobs/view/9/', search: '' })).toEqual(['1']);
  });

  test('a pane that says applied without a job id in the address adds nothing', () => {
    expect(appliedJobIds(page('<main><p>Applied</p></main>'), search)).toEqual([]);
  });

  test('the same job from its card and its pane is listed once', () => {
    const doc = page(card('9', 'Applied') + '<main><p>Applied on company site</p></main>');
    expect(appliedJobIds(doc, { pathname: '/jobs/view/9/', search: '' })).toEqual(['9']);
  });
});
