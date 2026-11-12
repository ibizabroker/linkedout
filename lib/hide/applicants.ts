export const APPLICANT_STOPS = [
  10, 25, 50, 75, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000,
] as const;
export const APPLICANT_MIN = 1;
export const APPLICANT_MAX = 2000;
export const APPLICANT_DEFAULT = 100;
export const OVER_100_FLOOR = 100;

export type Applicants = number | 'over-100';

export type ApplicantLimit = {
  readonly enabled: boolean;
  readonly max: number;
};

export type StoredLimitRead =
  | { readonly status: 'ready'; readonly limit: ApplicantLimit }
  | { readonly status: 'unreadable' };

export function offLimit(): ApplicantLimit {
  return { enabled: false, max: APPLICANT_DEFAULT };
}

export function isValidMax(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= APPLICANT_MIN &&
    value <= APPLICANT_MAX
  );
}

export function parseLimitDocument(raw: unknown): ApplicantLimit | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return undefined;
  }
  const doc = raw as Record<string, unknown>;
  if (doc.version !== 1 || typeof doc.enabled !== 'boolean' || !isValidMax(doc.max)) {
    return undefined;
  }
  return { enabled: doc.enabled, max: doc.max };
}

export function parseStoredLimit(raw: unknown): StoredLimitRead {
  if (raw === undefined) {
    return { status: 'ready', limit: offLimit() };
  }
  const limit = parseLimitDocument(raw);
  return limit === undefined ? { status: 'unreadable' } : { status: 'ready', limit };
}

export function serializeLimit(limit: ApplicantLimit): {
  readonly version: 1;
  readonly enabled: boolean;
  readonly max: number;
} {
  return { version: 1, enabled: limit.enabled, max: limit.max };
}

export function effectiveLimit(read: StoredLimitRead | undefined): ApplicantLimit {
  return read?.status === 'ready' ? read.limit : offLimit();
}

export function exceedsLimit(applicants: Applicants | undefined, limit: ApplicantLimit): boolean {
  if (!limit.enabled || applicants === undefined) {
    return false;
  }
  if (applicants === 'over-100') {
    return limit.max < OVER_100_FLOOR;
  }
  return applicants > limit.max;
}

export function nearestStop(max: number): number {
  let best: number = APPLICANT_STOPS[0];
  for (const stop of APPLICANT_STOPS) {
    if (Math.abs(stop - max) < Math.abs(best - max)) {
      best = stop;
    }
  }
  return best;
}

export function stopIndex(max: number): number {
  return APPLICANT_STOPS.indexOf(nearestStop(max) as (typeof APPLICANT_STOPS)[number]);
}

export function parseTypedMax(text: string): number | undefined {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) {
    return undefined;
  }
  const value = Number(trimmed);
  return isValidMax(value) ? value : undefined;
}
