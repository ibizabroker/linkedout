import { describe, expect, test } from 'bun:test';
import { pickCompanyName } from './company-name.ts';

const CARD = `
<div role="button" componentkey="job-card-component-ref-1">
  <div data-display-contents="true"><p><span>Selected, Facilities Assistant (Verified job)</span><span aria-hidden="true">Facilities Assistant</span></p></div>
  <div><p>  CBRE
  </p></div>
  <p>New York, NY</p>
  <div><button aria-label="Dismiss Facilities Assistant job"></button></div>
</div>`;

function paragraphsOf(html: string): string[] {
  return [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((match) =>
    (match[1] ?? '').replace(/<[^>]*>/g, ''),
  );
}

describe('pickCompanyName', () => {
  test('takes the paragraph after the title block and collapses whitespace', () => {
    expect(pickCompanyName(paragraphsOf(CARD))).toBe('CBRE');
  });

  test('keeps Private Company as a name', () => {
    expect(pickCompanyName(['Title', 'Private Company', 'Remote'])).toBe('Private Company');
  });

  test('returns undefined when the company paragraph is missing or blank', () => {
    expect(pickCompanyName(['Title'])).toBeUndefined();
    expect(pickCompanyName(['Title', '  \n '])).toBeUndefined();
    expect(pickCompanyName([])).toBeUndefined();
  });
});
