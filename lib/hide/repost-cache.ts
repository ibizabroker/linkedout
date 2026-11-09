export const REPOST_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const REPOST_CACHE_CAP = 5000;

export type RepostEntry = {
  readonly reposted: boolean;
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
  reposted: boolean,
  now: number,
): RepostCache {
  const next = new Map(cache);
  next.delete(jobId);
  next.set(jobId, { reposted, checkedAt: now });
  return pruned(next, now);
}

export function parseStoredRepostCache(raw: unknown, now: number): RepostCache {
  if (!isRecord(raw) || raw.version !== 1 || !isRecord(raw.entries)) {
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
      entries.set(jobId, { reposted: value.reposted, checkedAt: value.checkedAt });
    }
  }
  return pruned(entries, now);
}

export function serializeRepostCache(cache: RepostCache): {
  readonly version: 1;
  readonly entries: Record<string, RepostEntry>;
} {
  return { version: 1, entries: Object.fromEntries(cache) };
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
