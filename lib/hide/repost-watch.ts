import { fetchJobPostings, type PostingsOutcome } from '@/lib/hide/job-postings';
import { fetchJobPage, jobIdOf } from '@/lib/hide/job-page';
import {
  emptyRepostCache,
  freshEntry,
  mergeRepostCaches,
  withRepostEntry,
  type RepostCache,
} from '@/lib/hide/repost-cache';
import { createRepostBatcher } from '@/lib/hide/repost-batcher';
import {
  readRepostPause,
  recordReposts,
  watchRepostCache,
  writeRepostPause,
} from '@/lib/hide/repost-store';

export type RepostWatch = {
  isReposted(jobId: string): boolean;
  track(cards: Iterable<Element>, enabled: boolean): void;
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
  let stopped = false;
  let enabled = false;

  const batcher = createRepostBatcher({
    fetchBatch: (jobIds) => fetchJobPostings(jobIds),
    fetchOne: fetchOnePosting,
    isKnown: (jobId) => freshEntry(cache, jobId, Date.now()) !== undefined,
    onChecked: (results) => {
      for (const [jobId, facts] of results) {
        cache = withRepostEntry(cache, jobId, facts, Date.now());
      }
      recordReposts(results);
      onChange();
    },
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

  const stopCacheWatch = watchRepostCache((stored) => {
    cache = mergeRepostCaches(cache, stored, Date.now());
    onChange();
  });
  void readRepostPause().then((until) => {
    if (!stopped && until !== undefined) {
      batcher.pauseUntil(until);
      onChange();
    }
  });

  return {
    isReposted: (jobId) => freshEntry(cache, jobId, Date.now())?.reposted === true,
    track(cards, on) {
      if (on !== enabled) {
        enabled = on;
        if (!on) {
          batcher.clear();
        }
      }
      if (!on) {
        return;
      }

      for (const card of cards) {
        const jobId = jobIdOf(card);
        if (jobId !== undefined) {
          batcher.want(jobId);
        }
      }
    },
    isPaused: () => batcher.isPaused(),
    stop() {
      stopped = true;
      stopCacheWatch();
      batcher.stop();
    },
  };
}
