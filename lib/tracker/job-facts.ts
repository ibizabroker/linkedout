export type Workplace = 'On-site' | 'Hybrid' | 'Remote';

export type JobFacts = {
  readonly jobId: string;
  readonly applied: boolean;
  readonly appliedAt: number | null;
  readonly onsiteApply: boolean;
  readonly title: string;
  readonly company: string;
  readonly location: string;
  readonly workplace: Workplace | null;
  readonly reposted: boolean;
  readonly applicants: number | null;
};

export type ApplicationDetail = {
  readonly applied: boolean;
  readonly appliedAt: number | null;
  readonly onsiteApply: boolean;
};

export type PostingDetail = {
  readonly title: string;
  readonly company: string;
  readonly geoId: string | undefined;
  readonly workplace: Workplace | null;
  readonly reposted: boolean;
  readonly applicants: number | null;
};

const DETAIL_TYPE = 'com.linkedin.voyager.dash.jobs.JobSeekerApplicationDetail';
const DETAIL_PREFIX = 'urn:li:fsd_jobSeekerApplicationDetail:';
const POSTING_TYPE = 'com.linkedin.voyager.dash.jobs.JobPosting';
const POSTING_PREFIX = 'urn:li:fsd_jobPosting:';
const GEO_PREFIX = 'urn:li:fsd_geo:';
const WORKPLACE_PREFIX = 'urn:li:fsd_workplaceType:';
const WORKPLACES: Readonly<Record<string, Workplace>> = {
  '1': 'On-site',
  '2': 'Remote',
  '3': 'Hybrid',
};

export function parseApplicationDetails(json: unknown): Map<string, ApplicationDetail> {
  const details = new Map<string, ApplicationDetail>();
  for (const item of includedOf(json, DETAIL_TYPE)) {
    const jobId = idAfter(item.entityUrn, DETAIL_PREFIX);
    if (jobId === undefined || typeof item.applied !== 'boolean') {
      continue;
    }
    details.set(jobId, {
      applied: item.applied,
      appliedAt: finiteNumber(item.appliedAt) ?? null,
      onsiteApply: item.onsiteApply === true,
    });
  }
  return details;
}

export function parsePostingDetails(json: unknown): Map<string, PostingDetail> {
  const postings = new Map<string, PostingDetail>();
  for (const item of includedOf(json, POSTING_TYPE)) {
    const jobId = idAfter(item.entityUrn, POSTING_PREFIX);
    const company = isRecord(item.companyDetails) ? item.companyDetails.name : undefined;
    if (
      jobId === undefined ||
      typeof item.title !== 'string' ||
      typeof company !== 'string' ||
      typeof item.repostedJob !== 'boolean'
    ) {
      continue;
    }
    postings.set(jobId, {
      title: item.title,
      company,
      geoId: idAfter(item.locationUrn, GEO_PREFIX),
      workplace: workplaceOf(item.workplaceTypes),
      reposted: item.repostedJob,
      applicants: finiteNumber(item.numApplies) ?? null,
    });
  }
  return postings;
}

export function parseGeoNames(json: unknown): Map<string, string> {
  const names = new Map<string, string>();
  for (const item of includedOf(json, 'com.linkedin.voyager.dash.common.Geo')) {
    const geoId = idAfter(item.entityUrn, GEO_PREFIX);
    const name = item.abbreviatedLocalizedName ?? item.defaultLocalizedName;
    if (geoId !== undefined && typeof name === 'string') {
      names.set(geoId, name);
    }
  }
  return names;
}

const PAGE_WORKPLACE = /\u2022 [^"\\\n]{1,160} \((On-site|Hybrid|Remote)\)(?=\\*")/;
const PAGE_WORKPLACES: Readonly<Record<string, Workplace>> = {
  'On-site': 'On-site',
  Hybrid: 'Hybrid',
  Remote: 'Remote',
};

export function workplaceFromPage(html: string): Workplace | null {
  const found = PAGE_WORKPLACE.exec(html)?.[1];
  return found === undefined ? null : (PAGE_WORKPLACES[found] ?? null);
}

export function assembleJobFacts(
  jobId: string,
  detail: ApplicationDetail,
  posting: PostingDetail,
  geoNames: ReadonlyMap<string, string>,
): JobFacts {
  return {
    jobId,
    ...detail,
    title: posting.title,
    company: posting.company,
    location: (posting.geoId === undefined ? undefined : geoNames.get(posting.geoId)) ?? '',
    workplace: posting.workplace,
    reposted: posting.reposted,
    applicants: posting.applicants,
  };
}

function workplaceOf(urns: unknown): Workplace | null {
  if (!Array.isArray(urns)) {
    return null;
  }
  for (const urn of urns) {
    const workplace = WORKPLACES[idAfter(urn, WORKPLACE_PREFIX) ?? ''];
    if (workplace !== undefined) {
      return workplace;
    }
  }
  return null;
}

function includedOf(json: unknown, type: string): Record<string, unknown>[] {
  const included = isRecord(json) ? json.included : undefined;
  return Array.isArray(included)
    ? included.filter(
        (item): item is Record<string, unknown> => isRecord(item) && item.$type === type,
      )
    : [];
}

function idAfter(urn: unknown, prefix: string): string | undefined {
  if (typeof urn !== 'string' || !urn.startsWith(prefix)) {
    return undefined;
  }
  const id = urn.slice(prefix.length);
  return /^\d+$/.test(id) ? id : undefined;
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
