import type { Applicants } from '@/lib/hide/applicants';
import type { CachedFacts } from '@/lib/hide/repost-cache';
import {
  MAX_POSTINGS_PER_REQUEST,
  type PostingsOutcome,
  type RepostFacts,
} from '@/lib/hide/job-postings';

export const SINGLE_GAP_MS = 1000;
export const SINGLE_JITTER_MS = 500;
export const FIRST_BACKOFF_MS = 10 * 60 * 1000;
export const MAX_BACKOFF_MS = 60 * 60 * 1000;

export type RepostCheckerDeps = {
  readonly fetchBatch: (jobIds: readonly string[]) => Promise<PostingsOutcome>;
  readonly fetchOne: (jobId: string) => Promise<PostingsOutcome>;
  readonly loadCache: () => Promise<void>;
  readonly cached: (jobId: string) => CachedFacts | undefined;
  readonly onRecord: (results: ReadonlyMap<string, RepostFacts>) => void;
  readonly onChange: () => void;
  readonly onPauseChange: (pausedUntil: number | undefined) => void;
  readonly now: () => number;
  readonly schedule: (run: () => void, delayMs: number) => () => void;
  readonly jitter: () => number;
};

export type RepostChecker = {
  want(jobId: string): void;
  isReposted(jobId: string): boolean;
  applicantsOf(jobId: string): Applicants | undefined;
  countNeeded(needed: boolean): void;
  clear(): void;
  pauseUntil(timestamp: number): void;
  isPaused(): boolean;
  stop(): void;
};

export function createRepostChecker(deps: RepostCheckerDeps): RepostChecker {
  const facts = new Map<string, RepostFacts>();
  const asked = new Set<string>();
  const batchQueue: string[] = [];
  const pending = new Set<string>();
  const skipped = new Set<string>();
  let batchInFlight = false;
  let singleInFlight: string | undefined;
  let cancelTimer: (() => void) | undefined;
  let nextSingleAt = 0;
  let fallback = false;
  let cacheReady = false;
  let paused = false;
  let backoffMs = FIRST_BACKOFF_MS;
  let stopped = false;
  let countNeeded = false;

  const isKnown = (jobId: string): boolean => {
    if (facts.has(jobId)) {
      return true;
    }
    if (!fallback) {
      return false;
    }
    const cached = deps.cached(jobId);
    return cached !== undefined && !(countNeeded && cached.countStale);
  };

  function sendBatches(): void {
    if (stopped || paused || batchInFlight || batchQueue.length === 0) {
      return;
    }
    const ids = batchQueue.splice(0, MAX_POSTINGS_PER_REQUEST);
    batchInFlight = true;
    void deps.fetchBatch(ids).then((outcome) => {
      batchInFlight = false;
      if (!stopped) {
        handleBatch(ids, outcome);
      }
    });
  }

  function handleBatch(ids: readonly string[], outcome: PostingsOutcome): void {
    if (outcome.kind === 'ok') {
      backoffMs = FIRST_BACKOFF_MS;
      for (const id of ids) {
        const found = outcome.postings.get(id);
        if (found !== undefined) {
          facts.set(id, found);
        }
      }
      deps.onChange();
      sendBatches();
      return;
    }

    const unsent = [...ids, ...batchQueue.splice(0)];
    if (outcome.kind === 'throttled') {
      for (const id of unsent) {
        asked.delete(id);
      }
      throttle();
      return;
    }

    fallback = true;
    void deps.loadCache().then(() => {
      cacheReady = true;
      for (const id of unsent) {
        pending.add(id);
      }
      deps.onChange();
      armSingle();
    });
  }

  function armSingle(): void {
    if (
      stopped ||
      paused ||
      !cacheReady ||
      singleInFlight !== undefined ||
      cancelTimer !== undefined ||
      pending.size === 0
    ) {
      return;
    }
    cancelTimer = deps.schedule(
      () => {
        cancelTimer = undefined;
        sendSingle();
      },
      Math.max(0, nextSingleAt - deps.now()),
    );
  }

  function sendSingle(): void {
    let id: string | undefined;
    for (const candidate of pending) {
      pending.delete(candidate);
      if (!isKnown(candidate)) {
        id = candidate;
        break;
      }
    }
    if (id === undefined) {
      return;
    }

    const jobId = id;
    singleInFlight = jobId;
    void deps.fetchOne(jobId).then((outcome) => {
      singleInFlight = undefined;
      if (stopped) {
        return;
      }
      if (outcome.kind === 'throttled') {
        pending.add(jobId);
        throttle();
        return;
      }
      backoffMs = FIRST_BACKOFF_MS;
      nextSingleAt = deps.now() + SINGLE_GAP_MS + deps.jitter() * SINGLE_JITTER_MS;
      const found = outcome.kind === 'ok' ? outcome.postings.get(jobId) : undefined;
      if (found === undefined) {
        skipped.add(jobId);
      } else {
        facts.set(jobId, found);
        deps.onRecord(new Map([[jobId, found]]));
        deps.onChange();
      }
      armSingle();
    });
  }

  function throttle(): void {
    pause(backoffMs);
    backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
  }

  function pause(durationMs: number): void {
    cancelTimer?.();
    paused = true;
    deps.onPauseChange(deps.now() + durationMs);
    cancelTimer = deps.schedule(() => {
      cancelTimer = undefined;
      paused = false;
      deps.onPauseChange(undefined);
      armSingle();
    }, durationMs);
  }

  const checker: RepostChecker = {
    want(jobId) {
      if (stopped || isKnown(jobId)) {
        return;
      }
      if (!fallback) {
        if (!paused && !asked.has(jobId)) {
          asked.add(jobId);
          batchQueue.push(jobId);
          queueMicrotask(sendBatches);
        }
        return;
      }
      if (!skipped.has(jobId) && singleInFlight !== jobId) {
        pending.add(jobId);
        armSingle();
      }
    },
    isReposted(jobId) {
      const known = facts.get(jobId);
      if (known !== undefined) {
        return known.reposted;
      }
      return fallback && deps.cached(jobId)?.reposted === true;
    },
    applicantsOf(jobId) {
      const known = facts.get(jobId);
      if (known !== undefined) {
        return known.applicants;
      }
      return fallback ? deps.cached(jobId)?.applicants : undefined;
    },
    countNeeded(needed) {
      countNeeded = needed;
    },
    clear() {
      facts.clear();
      asked.clear();
      batchQueue.length = 0;
      pending.clear();
      skipped.clear();
    },
    pauseUntil(timestamp) {
      const remaining = timestamp - deps.now();
      if (remaining > 0 && !stopped && !paused) {
        pause(remaining);
      }
    },
    isPaused() {
      return paused;
    },
    stop() {
      stopped = true;
      checker.clear();
      cancelTimer?.();
      cancelTimer = undefined;
    },
  };
  return checker;
}
