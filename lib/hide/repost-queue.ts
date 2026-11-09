import type { JobPageFacts, JobPageOutcome } from '@/lib/hide/job-page';

export const REQUEST_GAP_MS = 1000;
export const REQUEST_JITTER_MS = 500;
export const FIRST_BACKOFF_MS = 10 * 60 * 1000;
export const MAX_BACKOFF_MS = 60 * 60 * 1000;

export type RepostQueueDeps = {
  readonly check: (jobId: string) => Promise<JobPageOutcome>;
  readonly isKnown: (jobId: string) => boolean;
  readonly onChecked: (jobId: string, facts: JobPageFacts) => void;
  readonly onPauseChange: (pausedUntil: number | undefined) => void;
  readonly now: () => number;
  readonly schedule: (run: () => void, delayMs: number) => () => void;
  readonly jitter: () => number;
};

export type RepostQueue = {
  want(jobId: string): void;
  drop(jobId: string): void;
  clear(): void;
  pauseUntil(timestamp: number): void;
  isPaused(): boolean;
  stop(): void;
};

export function createRepostQueue(deps: RepostQueueDeps): RepostQueue {
  const pending = new Set<string>();
  const failed = new Set<string>();
  let inFlight: string | undefined;
  let cancelTimer: (() => void) | undefined;
  let paused = false;
  let backoffMs = FIRST_BACKOFF_MS;
  let stopped = false;

  function pump(): void {
    if (stopped || paused || inFlight !== undefined || cancelTimer !== undefined) {
      return;
    }

    const next = pending.values().next();
    if (next.done) {
      return;
    }
    const jobId = next.value;
    pending.delete(jobId);
    if (deps.isKnown(jobId)) {
      pump();
      return;
    }

    inFlight = jobId;
    void deps.check(jobId).then((outcome) => {
      inFlight = undefined;
      if (stopped) {
        return;
      }
      if (outcome.kind === 'limited') {
        pending.add(jobId);
        pause(backoffMs);
        backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
        return;
      }

      backoffMs = FIRST_BACKOFF_MS;
      cancelTimer = deps.schedule(
        () => {
          cancelTimer = undefined;
          pump();
        },
        REQUEST_GAP_MS + deps.jitter() * REQUEST_JITTER_MS,
      );
      if (outcome.kind === 'page') {
        deps.onChecked(jobId, outcome.facts);
      } else {
        failed.add(jobId);
      }
    });
  }

  function pause(durationMs: number): void {
    cancelTimer?.();
    paused = true;
    deps.onPauseChange(deps.now() + durationMs);
    cancelTimer = deps.schedule(() => {
      cancelTimer = undefined;
      paused = false;
      deps.onPauseChange(undefined);
      pump();
    }, durationMs);
  }

  return {
    want(jobId) {
      if (deps.isKnown(jobId) || failed.has(jobId) || jobId === inFlight) {
        return;
      }
      pending.add(jobId);
      pump();
    },
    drop(jobId) {
      pending.delete(jobId);
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
