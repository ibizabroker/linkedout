import { MAX_POSTINGS_PER_REQUEST, type PostingsOutcome } from '@/lib/hide/job-postings';
import type { RepostFacts } from '@/lib/hide/repost-cache';

export const COLLECT_MS = 300;
export const BATCH_GAP_MS = 1500;
export const SINGLE_GAP_MS = 1000;
export const SINGLE_JITTER_MS = 500;
export const FIRST_BACKOFF_MS = 10 * 60 * 1000;
export const MAX_BACKOFF_MS = 60 * 60 * 1000;

export type RepostBatcherDeps = {
  readonly fetchBatch: (jobIds: readonly string[]) => Promise<PostingsOutcome>;
  readonly fetchOne: (jobId: string) => Promise<PostingsOutcome>;
  readonly isKnown: (jobId: string) => boolean;
  readonly onChecked: (results: ReadonlyMap<string, RepostFacts>) => void;
  readonly onPauseChange: (pausedUntil: number | undefined) => void;
  readonly now: () => number;
  readonly schedule: (run: () => void, delayMs: number) => () => void;
  readonly jitter: () => number;
};

export type RepostBatcher = {
  want(jobId: string): void;
  clear(): void;
  pauseUntil(timestamp: number): void;
  isPaused(): boolean;
  stop(): void;
};

export function createRepostBatcher(deps: RepostBatcherDeps): RepostBatcher {
  const pending = new Set<string>();
  const skipped = new Set<string>();
  let inFlight: ReadonlySet<string> = new Set();
  let cancelTimer: (() => void) | undefined;
  let nextAllowedAt = 0;
  let single = false;
  let paused = false;
  let backoffMs = FIRST_BACKOFF_MS;
  let stopped = false;

  function arm(): void {
    if (stopped || paused || inFlight.size > 0 || cancelTimer !== undefined || pending.size === 0) {
      return;
    }
    cancelTimer = deps.schedule(
      () => {
        cancelTimer = undefined;
        send();
      },
      Math.max(COLLECT_MS, nextAllowedAt - deps.now()),
    );
  }

  function send(): void {
    const ids: string[] = [];
    for (const id of pending) {
      pending.delete(id);
      if (!deps.isKnown(id)) {
        ids.push(id);
      }
      if (ids.length === (single ? 1 : MAX_POSTINGS_PER_REQUEST)) {
        break;
      }
    }
    if (ids.length === 0) {
      return;
    }

    inFlight = new Set(ids);
    const request = single ? deps.fetchOne(ids[0]!) : deps.fetchBatch(ids);
    void request.then((outcome) => {
      inFlight = new Set();
      if (stopped) {
        return;
      }
      handle(ids, outcome);
    });
  }

  function handle(ids: readonly string[], outcome: PostingsOutcome): void {
    if (outcome.kind === 'limited') {
      for (const id of ids) {
        pending.add(id);
      }
      pause(backoffMs);
      backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
      return;
    }

    backoffMs = FIRST_BACKOFF_MS;
    nextAllowedAt =
      deps.now() + (single ? SINGLE_GAP_MS + deps.jitter() * SINGLE_JITTER_MS : BATCH_GAP_MS);

    if (outcome.kind === 'failed') {
      if (single) {
        for (const id of ids) {
          skipped.add(id);
        }
      } else {
        single = true;
        for (const id of ids) {
          pending.add(id);
        }
      }
      arm();
      return;
    }

    const results = new Map<string, RepostFacts>();
    for (const id of ids) {
      const facts = outcome.postings.get(id);
      if (facts === undefined) {
        skipped.add(id);
      } else {
        results.set(id, facts);
      }
    }
    if (results.size > 0) {
      deps.onChecked(results);
    }
    arm();
  }

  function pause(durationMs: number): void {
    cancelTimer?.();
    paused = true;
    deps.onPauseChange(deps.now() + durationMs);
    cancelTimer = deps.schedule(() => {
      cancelTimer = undefined;
      paused = false;
      deps.onPauseChange(undefined);
      arm();
    }, durationMs);
  }

  return {
    want(jobId) {
      if (deps.isKnown(jobId) || skipped.has(jobId) || inFlight.has(jobId)) {
        return;
      }
      pending.add(jobId);
      arm();
    },
    clear() {
      pending.clear();
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
      pending.clear();
      cancelTimer?.();
      cancelTimer = undefined;
    },
  };
}
