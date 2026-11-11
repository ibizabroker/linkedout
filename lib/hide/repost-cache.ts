export const REPOST_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const REPOST_CACHE_CAP = 5000;

export type RepostFacts = {
  readonly reposted: boolean;
  readonly applies?: number;
  readonly originalListedAt?: number;
};

export type RepostEntry = RepostFacts & {
  readonly checkedAt: number;
};

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
  facts: RepostFacts,
  now: number,
): RepostCache {
  const next = new Map(cache);
  next.delete(jobId);
  next.set(jobId, entryOf(facts, now));
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
  if (!isRecord(raw) || raw.version !== 2 || !isRecord(raw.entries)) {
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
      entries.set(
        jobId,
        entryOf(
          {
            reposted: value.reposted,
            applies: finiteNumber(value.applies),
            originalListedAt: finiteNumber(value.originalListedAt),
          },
          value.checkedAt,
        ),
      );
    }
  }
  return pruned(entries, now);
}

export function serializeRepostCache(cache: RepostCache): {
  readonly version: 2;
  readonly entries: Record<string, RepostEntry>;
} {
  return { version: 2, entries: Object.fromEntries(cache) };
}

function entryOf(facts: RepostFacts, checkedAt: number): RepostEntry {
  const entry: { -readonly [K in keyof RepostEntry]: RepostEntry[K] } = {
    reposted: facts.reposted,
    checkedAt,
  };
  if (facts.applies !== undefined) {
    entry.applies = facts.applies;
  }
  if (facts.originalListedAt !== undefined) {
    entry.originalListedAt = facts.originalListedAt;
  }
  return entry;
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
