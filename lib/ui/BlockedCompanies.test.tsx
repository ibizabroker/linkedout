import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  BLOCKLIST_UNREADABLE_TEXT,
  BlockedCompaniesPage,
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

describe('BlockedCompaniesPage', () => {
  test('lists the companies under the page title', () => {
    const html = renderToStaticMarkup(
      <BlockedCompaniesPage
        companies={[{ name: 'CBRE' }, { name: 'Acme' }]}
        failureText={undefined}
        onUnblock={noop}
      />,
    );
    expect(html).toContain('Blocked companies</h1>');
    expect(html).toContain('Unblock CBRE');
    expect(html).toContain('Unblock Acme');
    expect(html).not.toContain('role="alert"');
  });

  test('shows the failure and no rows or empty state when the list is unreadable', () => {
    const html = renderToStaticMarkup(
      <BlockedCompaniesPage
        companies={null}
        failureText={BLOCKLIST_UNREADABLE_TEXT}
        onUnblock={noop}
      />,
    );
    expect(html).toContain('Could not load blocked companies.');
    expect(html).not.toContain('Unblock');
    expect(html).not.toContain('No blocked companies');
  });

  test('keeps the row and shows the failure when an unblock fails', () => {
    const html = renderToStaticMarkup(
      <BlockedCompaniesPage
        companies={[{ name: 'CBRE' }]}
        failureText="Could not unblock that company. Try again."
        onUnblock={noop}
      />,
    );
    expect(html).toContain('Could not unblock that company. Try again.');
    expect(html).toContain('Unblock CBRE');
  });
});
