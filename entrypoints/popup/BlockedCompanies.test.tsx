import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  BlockedCompaniesSection,
  BlockedCompanyList,
} from './BlockedCompanies';

const noop = (): void => undefined;

describe('BlockedCompanyList', () => {
  test('shows the empty state and no Unblock buttons without companies', () => {
    const html = renderToStaticMarkup(
      <BlockedCompanyList companies={[]} onUnblock={noop} />,
    );
    expect(html).toContain(
      'No blocked companies. Block one from a job card or the job details.',
    );
    expect(html).not.toContain('Unblock');
  });

  test('renders an Unblock button per company in the given order', () => {
    const html = renderToStaticMarkup(
      <BlockedCompanyList
        companies={[{ name: 'CBRE' }, { name: 'Private Company' }]}
        onUnblock={noop}
      />,
    );
    const labels = [...html.matchAll(/aria-label="([^"]*)"/g)].map(
      (match) => match[1],
    );
    expect(labels).toEqual(['Unblock CBRE', 'Unblock Private Company']);
    expect(html).not.toContain('No blocked companies');
  });
});

describe('BlockedCompaniesSection', () => {
  test('shows the count of the given companies', () => {
    const html = renderToStaticMarkup(
      <BlockedCompaniesSection
        companies={[{ name: 'CBRE' }, { name: 'Acme' }]}
        onUnblock={noop}
      />,
    );
    expect(html).toContain('Blocked companies (2)');
  });

  test('shows no count and no empty state when the blocklist is unreadable', () => {
    const html = renderToStaticMarkup(
      <BlockedCompaniesSection companies={null} onUnblock={noop} />,
    );
    expect(html).toContain('Blocked companies<');
    expect(html).not.toContain('(0)');
    expect(html).not.toContain('No blocked companies');
  });
});
