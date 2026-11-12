import type { Applicants } from '@/lib/hide/applicants';

export const REPOST_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const COUNT_TTL_MS = 24 * 60 * 60 * 1000;
export const REPOST_CACHE_CAP = 5000;

export type RepostEntry = {
  readonly reposted: boolean;
  readonly checkedAt: number;
  readonly applicants?: Applicants;
};

export type CachedFacts = {
  readonly reposted: boolean;
  readonly applicants: Applicants | undefined;
  readonly countStale: boolean;
};

export function cachedFacts(
  cache: RepostCache,
  jobId: string,
  now: number,
): CachedFacts | undefined {
  const entry = freshEntry(cache, jobId, now);
  if (entry === undefined) {
    return undefined;
  }
  const countStale = now - entry.checkedAt >= COUNT_TTL_MS;
  return {
    reposted: entry.reposted,
    applicants: countStale ? undefined : entry.applicants,
    countStale,
  };
}

export type RepostCache = ReadonlyMap<string, RepostEntry>;

export function emptyRepostCache(): RepostCache {
  return new Map();
}

export function freshEntry(
  cache: RepostCache,
  jobId: string,
  now: number,
): RepostEntry | undefined {
  const entry = cache.get(jobId);
  return entry !== undefined && now - entry.checkedAt < REPOST_TTL_MS ? entry : undefined;
}

export function withRepostEntry(
  cache: RepostCache,
  jobId: string,
  facts: { readonly reposted: boolean; readonly applicants?: Applicants },
  now: number,
): RepostCache {
  const next = new Map(cache);
  next.delete(jobId);
  next.set(jobId, {
    reposted: facts.reposted,
    checkedAt: now,
    ...(facts.applicants === undefined ? {} : { applicants: facts.applicants }),
  });
  return pruned(next, now);
}

export function mergeRepostCaches(a: RepostCache, b: RepostCache, now: number): RepostCache {
  const merged = new Map(a);
  for (const [jobId, entry] of b) {
    const existing = merged.get(jobId);
    if (existing === undefined || existing.checkedAt < entry.checkedAt) {
      merged.set(jobId, entry);
    }
  }
  return pruned(merged, now);
}

export function parseStoredRepostCache(raw: unknown, now: number): RepostCache {
  if (!isRecord(raw) || raw.version !== 4 || !isRecord(raw.entries)) {
    return emptyRepostCache();
  }

  const entries = new Map<string, RepostEntry>();
  for (const [jobId, value] of Object.entries(raw.entries)) {
    if (
      /^\d+$/.test(jobId) &&
      isRecord(value) &&
      typeof value.reposted === 'boolean' &&
      typeof value.checkedAt === 'number' &&
      Number.isFinite(value.checkedAt)
    ) {
      const applicants = parseApplicants(value.applicants);
      entries.set(jobId, {
        reposted: value.reposted,
        checkedAt: value.checkedAt,
        ...(applicants === undefined ? {} : { applicants }),
      });
    }
  }
  return pruned(entries, now);
}

export function serializeRepostCache(cache: RepostCache): {
  readonly version: 4;
  readonly entries: Record<string, RepostEntry>;
} {
  return { version: 4, entries: Object.fromEntries(cache) };
}

function pruned(entries: Map<string, RepostEntry>, now: number): RepostCache {
  for (const [jobId, entry] of entries) {
    if (now - entry.checkedAt >= REPOST_TTL_MS) {
      entries.delete(jobId);
    }
  }
  if (entries.size > REPOST_CACHE_CAP) {
    const oldestFirst = [...entries].sort(([, a], [, b]) => a.checkedAt - b.checkedAt);
    for (const [jobId] of oldestFirst.slice(0, entries.size - REPOST_CACHE_CAP)) {
      entries.delete(jobId);
    }
  }
  return entries;
}

export function parseApplicants(value: unknown): Applicants | undefined {
  if (value === 'over-100') {
    return value;
  }
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
