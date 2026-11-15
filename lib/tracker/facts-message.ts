import type { JobFacts, Workplace } from './job-facts.ts';

export const TRACKER_FACTS = 'linkedout/tracker/facts';

const JOB_ID = /^\d+$/;
const WORKPLACES: readonly unknown[] = ['On-site', 'Hybrid', 'Remote'];

export function factsMessage(facts: JobFacts): object {
  return { type: TRACKER_FACTS, facts };
}

export function parseFactsMessage(raw: unknown): JobFacts | undefined {
  if (!isRecord(raw) || raw.type !== TRACKER_FACTS || !isRecord(raw.facts)) {
    return undefined;
  }
  const { jobId, applied, appliedAt, onsiteApply, title, company, location, workplace } = raw.facts;
  const { reposted, applicants } = raw.facts;
  if (
    isJobId(jobId) &&
    typeof applied === 'boolean' &&
    (appliedAt === null || isFiniteNumber(appliedAt)) &&
    typeof onsiteApply === 'boolean' &&
    typeof title === 'string' &&
    typeof company === 'string' &&
    typeof location === 'string' &&
    (workplace === null || isWorkplace(workplace)) &&
    typeof reposted === 'boolean' &&
    (applicants === null || isFiniteNumber(applicants))
  ) {
    return {
      jobId,
      applied,
      appliedAt,
      onsiteApply,
      title,
      company,
      location,
      workplace,
      reposted,
      applicants,
    };
  }
  return undefined;
}

function isJobId(value: unknown): value is string {
  return typeof value === 'string' && JOB_ID.test(value);
}

function isWorkplace(value: unknown): value is Workplace {
  return WORKPLACES.includes(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
