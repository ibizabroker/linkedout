import { fetchJobPage, jobIdOf } from '@/lib/hide/job-page';
import {
  emptyRepostCache,
  freshEntry,
  mergeRepostCaches,
  withRepostEntry,
  type RepostCache,
} from '@/lib/hide/repost-cache';
import { createRepostQueue } from '@/lib/hide/repost-queue';
import {
  readRepostPause,
  recordRepost,
  watchRepostCache,
  writeRepostPause,
} from '@/lib/hide/repost-store';

const LOOKAHEAD_PX = 600;

export type RepostWatch = {
  isReposted(jobId: string): boolean;
  track(cards: Iterable<Element>, enabled: boolean): void;
  isPaused(): boolean;
  stop(): void;
};

export function startRepostWatch(onChange: () => void): RepostWatch {
  let cache: RepostCache = emptyRepostCache();
  let stopped = false;
  let enabled = false;
  const observers = new Map<Element | null, IntersectionObserver>();
  const watched = new WeakSet<Element>();
  const nearScreen = new WeakSet<Element>();

  const queue = createRepostQueue({
    check: (jobId) => fetchJobPage(jobId),
    isKnown: (jobId) => freshEntry(cache, jobId, Date.now()) !== undefined,
    onChecked: (jobId, facts) => {
      cache = withRepostEntry(cache, jobId, facts.reposted, Date.now());
      recordRepost(jobId, facts.reposted);
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
      queue.pauseUntil(until);
      onChange();
    }
  });

  function observerFor(card: Element): IntersectionObserver {
    const root = scrollParent(card);
    const existing = observers.get(root);
    if (existing !== undefined) {
      return existing;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const jobId = jobIdOf(entry.target);
          if (entry.isIntersecting) {
            nearScreen.add(entry.target);
            if (jobId !== undefined) {
              queue.want(jobId);
            }
          } else {
            nearScreen.delete(entry.target);
            if (jobId !== undefined) {
              queue.drop(jobId);
            }
          }
        }
      },
      { root, rootMargin: `0px 0px ${LOOKAHEAD_PX}px 0px` },
    );
    observers.set(root, observer);
    return observer;
  }

  function disconnectAll(): void {
    for (const observer of observers.values()) {
      observer.disconnect();
    }
    observers.clear();
    queue.clear();
  }

  return {
    isReposted: (jobId) => freshEntry(cache, jobId, Date.now())?.reposted === true,
    track(cards, on) {
      if (on !== enabled) {
        enabled = on;
        if (!on) {
          disconnectAll();
          return;
        }
      }
      if (!on) {
        return;
      }

      for (const card of cards) {
        if (!watched.has(card)) {
          watched.add(card);
          observerFor(card).observe(card);
          continue;
        }
        const jobId = nearScreen.has(card) ? jobIdOf(card) : undefined;
        if (jobId !== undefined) {
          queue.want(jobId);
        }
      }
    },
    isPaused: () => queue.isPaused(),
    stop() {
      stopped = true;
      stopCacheWatch();
      disconnectAll();
      queue.stop();
    },
  };
}

function scrollParent(card: Element): Element | null {
  for (let node = card.parentElement; node !== null; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return node;
    }
  }
  return null;
}
