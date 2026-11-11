import { describe, expect, test } from 'bun:test';
import type { PostingsOutcome } from './job-postings.ts';
import type { RepostFacts } from './repost-cache.ts';
import {
  BATCH_GAP_MS,
  COLLECT_MS,
  FIRST_BACKOFF_MS,
  SINGLE_GAP_MS,
  createRepostBatcher,
} from './repost-batcher.ts';

const fact: RepostFacts = { reposted: false };

function ok(...ids: string[]): PostingsOutcome {
  return { kind: 'ok', postings: new Map(ids.map((id) => [id, fact])) };
}

type Reply = (ids: readonly string[]) => PostingsOutcome;

function harness(reply: Reply, wantOnChecked: string[] = []) {
  let clock = 0;
  const timers: { at: number; run: () => void; live: boolean }[] = [];
  const batches: { ids: string[]; at: number }[] = [];
  const singles: { id: string; at: number }[] = [];
  const known = new Set<string>();
  const pauses: (number | undefined)[] = [];
  const batcher = createRepostBatcher({
    fetchBatch: async (ids) => {
      batches.push({ ids: [...ids], at: clock });
      return reply(ids);
    },
    fetchOne: async (id) => {
      singles.push({ id, at: clock });
      return reply([id]);
    },
    isKnown: (id) => known.has(id),
    onChecked: (results) => {
      for (const id of results.keys()) {
        known.add(id);
      }
      for (const next of wantOnChecked) {
        batcher.want(next);
      }
    },
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
  return { batcher, batches, singles, known, pauses, advanceTo };
}

const all: Reply = (ids) => ok(...ids);
const ids = (n: number, from = 1) => Array.from({ length: n }, (_, i) => String(from + i));

describe('repost batcher', () => {
  test('wants made close together leave in one request after the collect window', async () => {
    const h = harness(all);
    for (const id of ids(5)) {
      h.batcher.want(id);
    }
    await h.advanceTo(COLLECT_MS - 1);
    expect(h.batches.length).toBe(0);
    await h.advanceTo(COLLECT_MS);
    expect(h.batches).toEqual([{ ids: ids(5), at: COLLECT_MS }]);
  });

  test('a request carries at most 25 ids and the next waits out the gap', async () => {
    const h = harness(all);
    for (const id of ids(30)) {
      h.batcher.want(id);
    }
    await h.advanceTo(10_000);
    expect(h.batches.map((b) => b.ids.length)).toEqual([25, 5]);
    expect(h.batches[1]!.at - h.batches[0]!.at >= BATCH_GAP_MS).toBe(true);
  });

  test('a want made while recording a result still waits out the gap', async () => {
    const h = harness(all, ['99']);
    h.batcher.want('1');
    await h.advanceTo(COLLECT_MS + BATCH_GAP_MS - 1);
    expect(h.batches.length).toBe(1);
    await h.advanceTo(COLLECT_MS + BATCH_GAP_MS);
    expect(h.batches.length).toBe(2);
  });

  test('a known id is never requested', async () => {
    const h = harness(all);
    h.batcher.want('1');
    await h.advanceTo(5000);
    h.batcher.want('1');
    await h.advanceTo(10000);
    expect(h.batches.length).toBe(1);
  });

  test('ids the answer leaves out are skipped for the rest of the session', async () => {
    const h = harness((asked) => ok(asked[0]!));
    h.batcher.want('1');
    h.batcher.want('2');
    await h.advanceTo(5000);
    h.batcher.want('2');
    await h.advanceTo(10000);
    expect(h.batches.length).toBe(1);
  });

  test('clear forgets waiting ids', async () => {
    const h = harness(all);
    h.batcher.want('1');
    h.batcher.clear();
    await h.advanceTo(5000);
    expect(h.batches.length).toBe(0);
  });

  test('a limited answer stops requests, then resumes after the backoff', async () => {
    let calls = 0;
    const h = harness((asked) => (calls++ === 0 ? { kind: 'limited' } : ok(...asked)));
    h.batcher.want('1');
    await h.advanceTo(FIRST_BACKOFF_MS - 1);
    expect(h.batcher.isPaused()).toBe(true);
    expect(h.batches.length).toBe(1);
    expect(h.pauses).toEqual([COLLECT_MS + FIRST_BACKOFF_MS]);
    await h.advanceTo(COLLECT_MS + FIRST_BACKOFF_MS + COLLECT_MS);
    expect(h.pauses[1]).toBeUndefined();
    expect(h.batches.length).toBe(2);
    expect(h.batches[1]!.ids).toEqual(['1']);
  });

  test('a stored pause holds requests until it ends', async () => {
    const h = harness(all);
    h.batcher.pauseUntil(5000);
    h.batcher.want('1');
    await h.advanceTo(4999);
    expect(h.batches.length).toBe(0);
    await h.advanceTo(5000 + COLLECT_MS);
    expect(h.batches.length).toBe(1);
  });

  test('a failed batch switches to one request per job, a second apart', async () => {
    const h = harness((asked) => (asked.length > 1 ? { kind: 'failed' } : ok(...asked)));
    for (const id of ids(3)) {
      h.batcher.want(id);
    }
    await h.advanceTo(20_000);
    expect(h.batches.length).toBe(1);
    expect(h.singles.map((s) => s.id)).toEqual(['1', '2', '3']);
    expect(h.singles[1]!.at - h.singles[0]!.at).toBe(SINGLE_GAP_MS);
    expect(h.singles[2]!.at - h.singles[1]!.at).toBe(SINGLE_GAP_MS);
  });

  test('a job whose own page fails is not retried', async () => {
    const h = harness(() => ({ kind: 'failed' }));
    h.batcher.want('1');
    await h.advanceTo(10_000);
    h.batcher.want('1');
    await h.advanceTo(20_000);
    expect(h.batches.length).toBe(1);
    expect(h.singles.length).toBe(1);
  });
});
