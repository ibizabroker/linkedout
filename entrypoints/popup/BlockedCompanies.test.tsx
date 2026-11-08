import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { BlockedCompanyList } from './BlockedCompanies';

describe('BlockedCompanyList', () => {
  test('shows the empty state and no Unblock buttons without companies', () => {
    const html = renderToStaticMarkup(<BlockedCompanyList companies={[]} />);
    expect(html).toContain(
      'No blocked companies. Block one from a job card or the job details.',
    );
    expect(html).not.toContain('Unblock');
  });

  test('renders an Unblock button per company in the given order', () => {
    const html = renderToStaticMarkup(
      <BlockedCompanyList
        companies={[{ name: 'CBRE' }, { name: 'Private Company' }]}
      />,
    );
    const labels = [...html.matchAll(/aria-label="([^"]*)"/g)].map(
      (match) => match[1],
    );
    expect(labels).toEqual(['Unblock CBRE', 'Unblock Private Company']);
    expect(html).not.toContain('No blocked companies');
  });
});
