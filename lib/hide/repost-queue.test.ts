import { describe, expect, test } from 'bun:test';
import type { JobPageOutcome } from './job-page.ts';
import { FIRST_BACKOFF_MS, REQUEST_GAP_MS, createRepostQueue } from './repost-queue.ts';

function harness(outcomes: Record<string, JobPageOutcome>) {
  let clock = 0;
  const timers: { at: number; run: () => void; live: boolean }[] = [];
  const started: { id: string; at: number }[] = [];
  const known = new Set<string>();
  const pauses: (number | undefined)[] = [];
  const queue = createRepostQueue({
    check: async (id) => {
      started.push({ id, at: clock });
      return outcomes[id] ?? { kind: 'failed' };
    },
    isKnown: (id) => known.has(id),
    onChecked: (id) => known.add(id),
    onPauseChange: (until) => pauses.push(until),
    now: () => clock,
    schedule: (run, delay) => {
      const timer = { at: clock + delay, run, live: true };
      timers.push(timer);
      return () => {
        timer.live = false;
      };
    },
    jitter: () => 0,
  });
  async function advanceTo(time: number): Promise<void> {
    for (;;) {
      await Promise.resolve();
      await Promise.resolve();
      const due = timers
        .filter((timer) => timer.live && timer.at <= time)
        .sort((a, b) => a.at - b.at)[0];
      if (due === undefined) {
        clock = time;
        return;
      }
      due.live = false;
      clock = due.at;
      due.run();
    }
  }
  return { queue, started, known, pauses, advanceTo };
}

const page = { kind: 'page', facts: { reposted: false } } as const;

describe('repost queue', () => {
  test('requests go one at a time, a gap apart', async () => {
    const h = harness({ '1': page, '2': page, '3': page });
    h.queue.want('1');
    h.queue.want('2');
    h.queue.want('3');
    await h.advanceTo(10 * REQUEST_GAP_MS);
    expect(h.started.map((s) => s.at)).toEqual([0, REQUEST_GAP_MS, 2 * REQUEST_GAP_MS]);
  });

  test('a known id is never fetched again', async () => {
    const h = harness({ '1': page });
    h.queue.want('1');
    await h.advanceTo(5000);
    h.queue.want('1');
    await h.advanceTo(10000);
    expect(h.started.length).toBe(1);
  });

  test('a dropped id is never fetched', async () => {
    const h = harness({ '1': page, '2': page });
    h.queue.want('1');
    h.queue.want('2');
    h.queue.drop('2');
    await h.advanceTo(10000);
    expect(h.started.map((s) => s.id)).toEqual(['1']);
  });

  test('a failed page is not retried in the same session', async () => {
    const h = harness({ '1': { kind: 'failed' } });
    h.queue.want('1');
    await h.advanceTo(5000);
    h.queue.want('1');
    await h.advanceTo(10000);
    expect(h.started.length).toBe(1);
  });

  test('a limited answer stops the queue, then resumes after the backoff', async () => {
    const h = harness({ '1': { kind: 'limited' }, '2': page });
    h.queue.want('1');
    h.queue.want('2');
    await h.advanceTo(FIRST_BACKOFF_MS - 1);
    expect(h.queue.isPaused()).toBe(true);
    expect(h.started.length).toBe(1);
    expect(h.pauses).toEqual([FIRST_BACKOFF_MS]);
    await h.advanceTo(FIRST_BACKOFF_MS);
    expect(h.pauses).toEqual([FIRST_BACKOFF_MS, undefined]);
    expect(h.started.length).toBe(2);
  });

  test('a stored pause holds the queue until it ends', async () => {
    const h = harness({ '1': page });
    h.queue.pauseUntil(5000);
    h.queue.want('1');
    await h.advanceTo(4999);
    expect(h.started.length).toBe(0);
    await h.advanceTo(5000);
    expect(h.started.length).toBe(1);
  });
});
