import { describe, expect, test } from 'bun:test';
import { csrfTokenFrom, fetchJobPostings, parseJobPostings, postingsUrl } from './job-postings.ts';

const TYPE = 'com.linkedin.voyager.dash.jobs.JobPosting';
const sample = {
  data: { results: { '*urn:li:fsd_jobPosting:1': 'urn:li:fsd_jobPosting:1' } },
  included: [
    {
      $type: TYPE,
      entityUrn: 'urn:li:fsd_jobPosting:1',
      repostedJob: false,
      numApplies: 37,
      listedAt: 1794264999000,
      originalListedAt: 1794264110000,
    },
    {
      $type: TYPE,
      entityUrn: 'urn:li:fsd_jobPosting:2',
      repostedJob: true,
      numApplies: 347,
      listedAt: 1794225861000,
      originalListedAt: 1772574849000,
    },
    { $type: TYPE, entityUrn: 'urn:li:fsd_jobPosting:3', title: 'no flag' },
    { $type: TYPE, entityUrn: 'urn:li:fsd_jobPosting:4', repostedJob: 'yes' },
    {
      $type: 'com.linkedin.voyager.dash.organization.Company',
      entityUrn: 'urn:li:fsd_jobPosting:5',
      repostedJob: true,
    },
  ],
};

function respond(status: number, body: unknown): typeof fetch {
  return (async () =>
    new Response(typeof body === 'string' ? body : JSON.stringify(body), {
      status,
    })) as unknown as typeof fetch;
}

const cookie = () => 'a=b; JSESSIONID="ajax:123"; c=d';

describe('parseJobPostings', () => {
  test('reads the repost flag, applicants and original listing time', () => {
    const postings = parseJobPostings(sample);
    expect(postings.get('1')).toEqual({
      reposted: false,
      applies: 37,
      originalListedAt: 1794264110000,
    });
    expect(postings.get('2')).toEqual({
      reposted: true,
      applies: 347,
      originalListedAt: 1772574849000,
    });
  });

  test('skips postings without a boolean flag and other entity types', () => {
    expect([...parseJobPostings(sample).keys()]).toEqual(['1', '2']);
  });

  test('anything else parses to nothing', () => {
    expect(parseJobPostings(null).size).toBe(0);
    expect(parseJobPostings({ included: 'x' }).size).toBe(0);
  });
});

describe('request', () => {
  test('the csrf token is the JSESSIONID value without quotes', () => {
    expect(csrfTokenFrom('a=b; JSESSIONID="ajax:123"; c=d')).toBe('ajax:123');
    expect(csrfTokenFrom('a=b')).toBeUndefined();
  });

  test('ids are urn encoded into one List', () => {
    expect(postingsUrl(['1', '2'])).toBe(
      '/voyager/api/voyagerJobsDashJobPostings?ids=List(urn%3Ali%3Afsd_jobPosting%3A1,urn%3Ali%3Afsd_jobPosting%3A2)',
    );
  });

  test('sends the csrf header and returns the covered postings', async () => {
    let token: string | undefined;
    let credentials: unknown;
    const outcome = await fetchJobPostings(['1', '2'], {
      cookie,
      fetchJson: (async (_url: unknown, init?: RequestInit) => {
        token = (init?.headers as Record<string, string>)['csrf-token'];
        credentials = init?.credentials;
        return new Response(JSON.stringify(sample));
      }) as unknown as typeof fetch,
    });
    expect(outcome.kind).toBe('ok');
    expect(credentials).toBe('include');
    expect(token).toBe('ajax:123');
  });

  test('limit statuses and network errors are limited', async () => {
    for (const status of [403, 429, 999, 500, 503]) {
      expect((await fetchJobPostings(['1'], { cookie, fetchJson: respond(status, {}) })).kind).toBe(
        'limited',
      );
    }
    const down = (async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;
    expect((await fetchJobPostings(['1'], { cookie, fetchJson: down })).kind).toBe('limited');
  });

  test('other statuses, non-JSON, no csrf cookie, and a changed schema are failed', async () => {
    expect((await fetchJobPostings(['1'], { cookie, fetchJson: respond(404, {}) })).kind).toBe(
      'failed',
    );
    expect(
      (await fetchJobPostings(['1'], { cookie, fetchJson: respond(200, '<html>') })).kind,
    ).toBe('failed');
    expect(
      (await fetchJobPostings(['1'], { cookie: () => '', fetchJson: respond(200, sample) })).kind,
    ).toBe('failed');
    expect((await fetchJobPostings(['9'], { cookie, fetchJson: respond(200, sample) })).kind).toBe(
      'failed',
    );
  });

  test('more than 25 ids is refused', async () => {
    const ids = Array.from({ length: 26 }, (_, i) => String(i + 1));
    expect((await fetchJobPostings(ids, { cookie, fetchJson: respond(200, sample) })).kind).toBe(
      'failed',
    );
  });
});
