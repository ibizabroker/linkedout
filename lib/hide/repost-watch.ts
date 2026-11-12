import type { Applicants } from '@/lib/hide/applicants';
import { fetchJobPostings, type PostingsOutcome } from '@/lib/hide/job-postings';
import { fetchJobPage, jobIdOf } from '@/lib/hide/job-page';
import {
  emptyRepostCache,
  cachedFacts,
  mergeRepostCaches,
  type RepostCache,
} from '@/lib/hide/repost-cache';
import { createRepostChecker } from '@/lib/hide/repost-checker';
import {
  readRepostCache,
  readRepostPause,
  recordReposts,
  watchRepostCache,
  writeRepostPause,
} from '@/lib/hide/repost-store';

export type RepostWatch = {
  isReposted(jobId: string): boolean;
  applicantsOf(jobId: string): Applicants | undefined;
  track(
    cards: Iterable<Element>,
    needs: { readonly reposts: boolean; readonly counts: boolean },
  ): void;
  isPaused(): boolean;
  stop(): void;
};

async function fetchOnePosting(jobId: string): Promise<PostingsOutcome> {
  const outcome = await fetchJobPage(jobId);
  return outcome.kind === 'page'
    ? { kind: 'ok', postings: new Map([[jobId, outcome.facts]]) }
    : outcome;
}

export function startRepostWatch(onChange: () => void): RepostWatch {
  let cache: RepostCache = emptyRepostCache();
  let stopCacheWatch: (() => void) | undefined;
  let stopped = false;

  const checker = createRepostChecker({
    fetchBatch: (jobIds) => fetchJobPostings(jobIds),
    fetchOne: fetchOnePosting,
    loadCache: async () => {
      cache = mergeRepostCaches(cache, await readRepostCache(), Date.now());
      if (!stopped) {
        stopCacheWatch ??= watchRepostCache((stored) => {
          cache = mergeRepostCaches(cache, stored, Date.now());
          onChange();
        });
      }
    },
    cached: (jobId) => cachedFacts(cache, jobId, Date.now()),
    onRecord: recordReposts,
    onChange,
    onPauseChange: (until) => {
      writeRepostPause(until);
      onChange();
    },
    now: Date.now,
    schedule: (run, delayMs) => {
      const handle = setTimeout(run, delayMs);
      return () => clearTimeout(handle);
    },
    jitter: Math.random,
  });

  void readRepostPause().then((until) => {
    if (!stopped && until !== undefined) {
      checker.pauseUntil(until);
      onChange();
    }
  });

  return {
    isReposted: (jobId) => checker.isReposted(jobId),
    applicantsOf: (jobId) => checker.applicantsOf(jobId),
    track(cards, needs) {
      checker.countNeeded(needs.counts);
      if (!needs.reposts && !needs.counts) {
        checker.clear();
        return;
      }

      for (const card of cards) {
        const jobId = jobIdOf(card);
        if (jobId !== undefined) {
          checker.want(jobId);
        }
      }
    },
    isPaused: () => checker.isPaused(),
    stop() {
      stopped = true;
      stopCacheWatch?.();
      checker.stop();
    },
  };
}
