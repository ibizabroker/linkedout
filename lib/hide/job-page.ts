const JOB_DETAILS_SCREEN = 'com.linkedin.sdui.flagshipnav.jobs.JobDetails';
const REPOSTED = /Reposted\s+\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago/i;
const JOB_ID = /^\d+$/;
const LIMITED_STATUSES: ReadonlySet<number> = new Set([403, 429, 999]);

export type JobPageFacts = {
  readonly reposted: boolean;
};

export type JobPageOutcome =
  | { readonly kind: 'page'; readonly facts: JobPageFacts }
  | { readonly kind: 'limited' }
  | { readonly kind: 'failed' };

export function readJobPage(html: string): JobPageFacts | undefined {
  if (!html.includes(JOB_DETAILS_SCREEN)) {
    return undefined;
  }
  return { reposted: REPOSTED.test(html) };
}

export function jobIdOf(card: Element): string | undefined {
  const occludable = card.getAttribute('data-occludable-job-id');
  const keyed = card.getAttribute('componentkey')?.match(/^job-card-component-ref-(\d+)$/)?.[1];
  const id = occludable ?? keyed;
  return id !== undefined && JOB_ID.test(id) ? id : undefined;
}

export async function fetchJobPage(
  jobId: string,
  fetchPage: typeof fetch = fetch,
): Promise<JobPageOutcome> {
  if (!JOB_ID.test(jobId)) {
    return { kind: 'failed' };
  }

  let response: Response;
  try {
    response = await fetchPage(`/jobs/view/${jobId}/`, { credentials: 'include' });
  } catch {
    return { kind: 'limited' };
  }

  if (LIMITED_STATUSES.has(response.status) || response.status >= 500) {
    return { kind: 'limited' };
  }
  if (!response.ok) {
    return { kind: 'failed' };
  }

  let html: string;
  try {
    html = await response.text();
  } catch {
    return { kind: 'limited' };
  }
  const facts = readJobPage(html);
  return facts === undefined ? { kind: 'failed' } : { kind: 'page', facts };
}
