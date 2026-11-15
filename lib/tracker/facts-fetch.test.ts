import { describe, expect, test } from 'bun:test';
import details from './fixtures/details.json';
import geo from './fixtures/geo.json';
import postings from './fixtures/postings.json';
import { fetchJobFacts, voyagerBatchUrl } from './facts-fetch.ts';

const COOKIE = 'JSESSIONID="ajax:123"; other=1';

function linkedIn(status = 200): typeof fetch {
  const serve = async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input);
    const body = url.includes('JobSeekerApplicationDetails')
      ? details
      : url.includes('voyagerDashGeo')
        ? geo
        : postings;
    return new Response(JSON.stringify(body), { status });
  };
  return serve as typeof fetch;
}

describe('batch url', () => {
  test('urns are encoded and joined in a List', () => {
    expect(voyagerBatchUrl('voyagerDashGeo', 'fsd_geo', ['1', '2'])).toBe(
      '/voyager/api/voyagerDashGeo?ids=List(urn%3Ali%3Afsd_geo%3A1,urn%3Ali%3Afsd_geo%3A2)',
    );
  });
});

describe('fetching a job as one set of facts', () => {
  test('an applied job comes back with its details, posting, and place name', async () => {
    const facts = await fetchJobFacts(['4480699030'], {
      fetchJson: linkedIn(),
      cookie: () => COOKIE,
    });
    expect(facts?.length).toBe(1);
    expect(facts?.[0]?.company).toBe('Mercury');
    expect(facts?.[0]?.location).toBe('San Francisco, CA');
    expect(facts?.[0]?.applied).toBe(true);
  });

  test('jobs LinkedIn did not return are left out', async () => {
    const facts = await fetchJobFacts(['4480699030', '1'], {
      fetchJson: linkedIn(),
      cookie: () => COOKIE,
    });
    expect(facts?.map((f) => f.jobId)).toEqual(['4480699030']);
  });

  test('a failed or throttled response yields no facts, to try again later', async () => {
    expect(
      await fetchJobFacts(['4480699030'], { fetchJson: linkedIn(429), cookie: () => COOKIE }),
    ).toBeUndefined();
  });

  test('without the csrf cookie, or with a bad or oversized id list, nothing is fetched', async () => {
    const deps = { fetchJson: linkedIn(), cookie: () => COOKIE };
    expect(await fetchJobFacts(['4480699030'], { ...deps, cookie: () => '' })).toBeUndefined();
    expect(await fetchJobFacts(['x'], deps)).toBeUndefined();
    expect(await fetchJobFacts([], deps)).toBeUndefined();
    expect(await fetchJobFacts(Array(26).fill('1'), deps)).toBeUndefined();
  });
});
