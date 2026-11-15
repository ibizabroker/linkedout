import { MAX_POSTINGS_PER_REQUEST, csrfTokenFrom } from '../hide/job-postings.ts';
import { MAX_APPLICATION_AGE_MS } from './decision.ts';
import {
  assembleJobFacts,
  parseApplicationDetails,
  parseGeoNames,
  parsePostingDetails,
  workplaceFromPage,
  type JobFacts,
  type Workplace,
} from './job-facts.ts';

const JOB_ID = /^\d+$/;

export function voyagerBatchUrl(path: string, urnType: string, ids: readonly string[]): string {
  const urns = ids.map((id) => encodeURIComponent(`urn:li:${urnType}:${id}`)).join(',');
  return `/voyager/api/${path}?ids=List(${urns})`;
}

export async function fetchJobFacts(
  jobIds: readonly string[],
  deps: {
    readonly fetchJson?: typeof fetch;
    readonly cookie?: () => string;
    readonly now?: () => number;
  } = {},
): Promise<readonly JobFacts[] | undefined> {
  const token = csrfTokenFrom((deps.cookie ?? (() => document.cookie))());
  if (
    token === undefined ||
    jobIds.length === 0 ||
    jobIds.length > MAX_POSTINGS_PER_REQUEST ||
    !jobIds.every((id) => JOB_ID.test(id))
  ) {
    return undefined;
  }
  const fetchJson = deps.fetchJson ?? fetch;
  const get = async (path: string, urnType: string, ids: readonly string[]): Promise<unknown> => {
    const response = await fetchJson(voyagerBatchUrl(path, urnType, ids), {
      credentials: 'include',
      headers: {
        'csrf-token': token,
        accept: 'application/vnd.linkedin.normalized+json+2.1',
        'x-restli-protocol-version': '2.0.0',
      },
    });
    if (!response.ok) {
      throw new Error(`LinkedIn responded ${response.status}`);
    }
    return response.json();
  };

  try {
    const [detailsJson, postingsJson] = await Promise.all([
      get('voyagerJobsDashJobSeekerApplicationDetails', 'fsd_jobSeekerApplicationDetail', jobIds),
      get('voyagerJobsDashJobPostings', 'fsd_jobPosting', jobIds),
    ]);
    const details = parseApplicationDetails(detailsJson);
    const postings = parsePostingDetails(postingsJson);
    const geoIds = new Set<string>();
    for (const posting of postings.values()) {
      if (posting.geoId !== undefined) {
        geoIds.add(posting.geoId);
      }
    }
    const geoNames =
      geoIds.size === 0
        ? new Map<string, string>()
        : parseGeoNames(await get('voyagerDashGeo', 'fsd_geo', [...geoIds]));

    const facts: JobFacts[] = [];
    for (const jobId of jobIds) {
      const detail = details.get(jobId);
      const posting = postings.get(jobId);
      if (detail !== undefined && posting !== undefined) {
        facts.push(assembleJobFacts(jobId, detail, posting, geoNames));
      }
    }
    const now = (deps.now ?? Date.now)();
    return Promise.all(
      facts.map(async (job) =>
        job.workplace === null && recentlyApplied(job, now)
          ? { ...job, workplace: await pageWorkplace(job.jobId, fetchJson) }
          : job,
      ),
    );
  } catch {
    return undefined;
  }
}

function recentlyApplied(job: JobFacts, now: number): boolean {
  return job.applied && job.appliedAt !== null && now - job.appliedAt <= MAX_APPLICATION_AGE_MS;
}

async function pageWorkplace(jobId: string, fetchPage: typeof fetch): Promise<Workplace | null> {
  try {
    const response = await fetchPage(`/jobs/view/${jobId}/`, { credentials: 'include' });
    return response.ok ? workplaceFromPage(await response.text()) : null;
  } catch {
    return null;
  }
}
