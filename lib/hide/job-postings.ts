export const MAX_POSTINGS_PER_REQUEST = 25;

const JOB_ID = /^\d+$/;
const JOB_POSTING_TYPE = 'com.linkedin.voyager.dash.jobs.JobPosting';
const URN_PREFIX = 'urn:li:fsd_jobPosting:';
const THROTTLED_STATUSES: ReadonlySet<number> = new Set([429, 999]);

export type RepostFacts = {
  readonly reposted: boolean;
  readonly applies?: number;
  readonly originalListedAt?: number;
};

export type PostingsOutcome =
  | { readonly kind: 'ok'; readonly postings: ReadonlyMap<string, RepostFacts> }
  | { readonly kind: 'throttled' }
  | { readonly kind: 'failed' };

export function parseJobPostings(json: unknown): Map<string, RepostFacts> {
  const postings = new Map<string, RepostFacts>();
  const included = isRecord(json) ? json.included : undefined;
  if (!Array.isArray(included)) {
    return postings;
  }

  for (const item of included) {
    if (!isRecord(item) || item.$type !== JOB_POSTING_TYPE) {
      continue;
    }
    const urn = item.entityUrn;
    if (
      typeof urn !== 'string' ||
      !urn.startsWith(URN_PREFIX) ||
      typeof item.repostedJob !== 'boolean'
    ) {
      continue;
    }
    const jobId = urn.slice(URN_PREFIX.length);
    if (JOB_ID.test(jobId)) {
      postings.set(jobId, {
        reposted: item.repostedJob,
        applies: finiteNumber(item.numApplies),
        originalListedAt: finiteNumber(item.originalListedAt),
      });
    }
  }
  return postings;
}

export function csrfTokenFrom(cookie: string): string | undefined {
  for (const part of cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === 'JSESSIONID') {
      const token = rest.join('=').replace(/^"|"$/g, '');
      return token === '' ? undefined : token;
    }
  }
  return undefined;
}

export function postingsUrl(jobIds: readonly string[]): string {
  const urns = jobIds.map((id) => encodeURIComponent(`${URN_PREFIX}${id}`)).join(',');
  return `/voyager/api/voyagerJobsDashJobPostings?ids=List(${urns})`;
}

export async function fetchJobPostings(
  jobIds: readonly string[],
  deps: { readonly fetchJson?: typeof fetch; readonly cookie?: () => string } = {},
): Promise<PostingsOutcome> {
  const fetchJson = deps.fetchJson ?? fetch;
  const token = csrfTokenFrom((deps.cookie ?? (() => document.cookie))());
  if (
    token === undefined ||
    jobIds.length === 0 ||
    jobIds.length > MAX_POSTINGS_PER_REQUEST ||
    !jobIds.every((id) => JOB_ID.test(id))
  ) {
    return { kind: 'failed' };
  }

  let response: Response;
  try {
    response = await fetchJson(postingsUrl(jobIds), {
      credentials: 'include',
      headers: {
        'csrf-token': token,
        accept: 'application/vnd.linkedin.normalized+json+2.1',
        'x-restli-protocol-version': '2.0.0',
      },
    });
  } catch {
    return { kind: 'throttled' };
  }

  if (THROTTLED_STATUSES.has(response.status)) {
    return { kind: 'throttled' };
  }
  if (!response.ok) {
    return { kind: 'failed' };
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return { kind: 'failed' };
  }

  const postings = parseJobPostings(json);
  const covered = jobIds.some((id) => postings.has(id));
  return covered ? { kind: 'ok', postings } : { kind: 'failed' };
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
