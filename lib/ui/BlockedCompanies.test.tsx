import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  BLOCKLIST_UNREADABLE_TEXT,
  BlockedCompaniesPane,
  BlockedCompanyList,
  matchingCompanies,
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

describe('BlockedCompaniesPane', () => {
  test('lists the companies under the page title', () => {
    const html = renderToStaticMarkup(
      <BlockedCompaniesPane
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
      <BlockedCompaniesPane
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
      <BlockedCompaniesPane
        companies={[{ name: 'CBRE' }]}
        failureText="Could not unblock that company. Try again."
        onUnblock={noop}
      />,
    );
    expect(html).toContain('Could not unblock that company. Try again.');
    expect(html).toContain('Unblock CBRE');
  });
});

describe('searching blocked companies', () => {
  const companies = [
    { name: 'Northwind Talent' },
    { name: 'Apex Recruiting Group' },
    { name: 'Contoso Careers' },
  ];

  test('matches part of a name regardless of case or surrounding spaces', () => {
    expect(matchingCompanies(companies, ' RECRUIT ')).toEqual([
      { name: 'Apex Recruiting Group' },
    ]);
    expect(matchingCompanies(companies, '')).toEqual(companies);
  });

  test('lists only the rows that match the query', () => {
    const html = renderToStaticMarkup(
      <BlockedCompanyList companies={companies} query="co" onUnblock={noop} />,
    );
    expect(html).toContain('Unblock Contoso Careers');
    expect(html).not.toContain('Unblock Northwind Talent');
  });

  test('says which query matched nothing and keeps the empty state for an empty list', () => {
    const none = renderToStaticMarkup(
      <BlockedCompanyList companies={companies} query="zzz" onUnblock={noop} />,
    );
    expect(none).toContain('No blocked company matches “zzz”.');
    expect(none).not.toContain('Unblock');

    const empty = renderToStaticMarkup(
      <BlockedCompanyList companies={[]} query="zzz" onUnblock={noop} />,
    );
    expect(empty).toContain('No blocked companies.');
    expect(empty).not.toContain('matches');
  });

  test('offers the search field only when there is something to search', () => {
    const withRows = renderToStaticMarkup(
      <BlockedCompaniesPane
        companies={companies}
        failureText={undefined}
        onUnblock={noop}
      />,
    );
    expect(withRows).toContain('placeholder="Search blocked companies"');
    const without = renderToStaticMarkup(
      <BlockedCompaniesPane
        companies={[]}
        failureText={undefined}
        onUnblock={noop}
      />,
    );
    expect(without).not.toContain('Search blocked companies');
  });
});
