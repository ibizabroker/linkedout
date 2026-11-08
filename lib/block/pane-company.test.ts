import { describe, expect, test } from 'bun:test';
import { findTopCardCompany, paneButtonView, type PaneAnchor } from './pane-company.ts';

const R1_PANE: PaneAnchor[] = [
  { href: 'https://www.linkedin.com/company/cbre/life/', text: 'CBRE' },
  {
    href: 'https://www.linkedin.com/jobs/view/4455363940/?trackingId=7q',
    text: 'Facilities Assistant',
  },
  { href: '#', text: '' },
  { href: 'https://www.linkedin.com/jobs/search-results/?currentJobId=4', text: 'Full-time' },
  { href: 'https://www.linkedin.com/premium/products/', text: 'Activate Premium for $0' },
  { href: 'https://www.linkedin.com/company/cbre/life/', text: 'CBRE1,863,863 followers' },
  {
    href: 'https://www.linkedin.com/company/cbre-gws/',
    text: 'CBRE Global Workplace Solutions (GWS)',
  },
];

const R2_PANE: PaneAnchor[] = [
  { href: 'https://www.linkedin.com/company/amazon/life/', text: 'Amazon' },
  {
    href: 'https://www.linkedin.com/jobs/view/4465376226/?trackingId=F9',
    text: 'Process Assistant',
  },
  {
    href: 'https://www.linkedin.com/company/primevideoamazonstudios/',
    text: 'Prime Video & Amazon MGM Studios',
  },
];

describe('findTopCardCompany', () => {
  test('reads CBRE from the r1 capture, not the later company links', () => {
    expect(findTopCardCompany(R1_PANE)).toEqual({ index: 0, name: 'CBRE' });
  });

  test('reads Amazon from the r2 capture', () => {
    expect(findTopCardCompany(R2_PANE)).toEqual({ index: 0, name: 'Amazon' });
  });

  test('skips the textless logo link and collapses whitespace', () => {
    const anchors: PaneAnchor[] = [
      { href: '/company/cbre/life/', text: '' },
      { href: '/company/cbre/life/', text: '  CBRE \n ' },
      { href: '/jobs/view/1/', text: 'Title' },
    ];
    expect(findTopCardCompany(anchors)).toEqual({ index: 1, name: 'CBRE' });
  });

  test('returns undefined when the top card has no company link', () => {
    expect(findTopCardCompany(R1_PANE.slice(1))).toBeUndefined();
    expect(findTopCardCompany(R2_PANE.slice(1))).toBeUndefined();
    expect(findTopCardCompany([])).toBeUndefined();
  });
});

describe('paneButtonView', () => {
  test('is an enabled Block button named for the company', () => {
    expect(paneButtonView('CBRE', false)).toEqual({
      label: 'Block CBRE',
      text: 'Block',
      disabled: false,
    });
  });

  test('is a disabled Blocked label once blocked', () => {
    expect(paneButtonView('CBRE', true)).toEqual({
      label: 'Blocked CBRE',
      text: 'Blocked',
      disabled: true,
    });
  });
});
