import { browser } from 'wxt/browser';
import { MAX_POSTINGS_PER_REQUEST } from '../hide/job-postings.ts';
import { appliedJobIds } from './applied-signal.ts';
import { fetchJobFacts } from './facts-fetch.ts';
import { factsMessage } from './facts-message.ts';
import { isKnown } from './outbox.ts';
import { oauthConfigured, watchTracker, type TrackerSnapshot } from './snapshot.ts';

const SCAN_DELAY_MS = 400;
const RETRY_AFTER_MS = 30_000;

export function startApplicationWatch(
  doc: Document,
  ctx: { onInvalidated(callback: () => void): void },
): void {
  if (!oauthConfigured()) {
    return;
  }

  let snapshot: TrackerSnapshot | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const settled = new Set<string>();
  const attemptedAt = new Map<string, number>();

  const queueScan = (delay = SCAN_DELAY_MS): void => {
    clearTimeout(timer);
    timer = setTimeout(scan, delay);
  };
  const observer = new MutationObserver(() => {
    queueScan();
  });
  observer.observe(doc.body, { childList: true, subtree: true, characterData: true });
  const stopWatch = watchTracker((read) => {
    snapshot = read;
    queueScan();
  });
  ctx.onInvalidated(() => {
    clearTimeout(timer);
    observer.disconnect();
    stopWatch();
  });

  function scan(): void {
    if (snapshot === undefined || snapshot.connection === null) {
      return;
    }
    const { sync } = snapshot;
    const now = Date.now();
    const wanted = appliedJobIds(
      doc,
      doc.location,
      (jobId) =>
        !settled.has(jobId) &&
        !isKnown(sync, jobId) &&
        now - (attemptedAt.get(jobId) ?? -RETRY_AFTER_MS) >= RETRY_AFTER_MS,
    );
    for (let start = 0; start < wanted.length; start += MAX_POSTINGS_PER_REQUEST) {
      const batch = wanted.slice(start, start + MAX_POSTINGS_PER_REQUEST);
      for (const jobId of batch) {
        attemptedAt.set(jobId, now);
      }
      void report(batch);
    }
  }

  async function report(batch: readonly string[]): Promise<void> {
    const facts = await fetchJobFacts(batch);
    if (facts === undefined) {
      queueScan(RETRY_AFTER_MS);
      return;
    }
    for (const job of facts) {
      if (!job.applied) {
        continue;
      }
      try {
        await browser.runtime.sendMessage(factsMessage(job));
        settled.add(job.jobId);
      } catch {
        queueScan(RETRY_AFTER_MS);
      }
    }
  }
}
