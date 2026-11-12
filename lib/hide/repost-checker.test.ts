import { describe, expect, test } from 'bun:test';
import type { PostingsOutcome, RepostFacts } from './job-postings.ts';
import { FIRST_BACKOFF_MS, SINGLE_GAP_MS, createRepostChecker } from './repost-checker.ts';

const fact: RepostFacts = { reposted: false };

function ok(...ids: string[]): PostingsOutcome {
  return { kind: 'ok', postings: new Map(ids.map((id) => [id, fact])) };
}

type Reply = (ids: readonly string[]) => PostingsOutcome;

function harness(batchReply: Reply, singleReply: Reply = batchReply) {
  let clock = 0;
  const timers: { at: number; run: () => void; live: boolean }[] = [];
  const batches: string[][] = [];
  const singles: { id: string; at: number }[] = [];
  const cache = new Map<string, boolean>();
  const recorded: string[] = [];
  const pauses: (number | undefined)[] = [];
  let cacheLoads = 0;
  let changes = 0;
  const checker = createRepostChecker({
    fetchBatch: async (ids) => {
      batches.push([...ids]);
      return batchReply(ids);
    },
    fetchOne: async (id) => {
      singles.push({ id, at: clock });
      return singleReply([id]);
    },
    loadCache: async () => {
      cacheLoads += 1;
    },
    cachedReposted: (id) => cache.get(id),
    onRecord: (results) => recorded.push(...results.keys()),
    onChange: () => {
      changes += 1;
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
      for (let i = 0; i < 5; i += 1) {
        await Promise.resolve();
      }
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
  return {
    checker,
    batches,
    singles,
    cache,
    recorded,
    pauses,
    advanceTo,
    cacheLoads: () => cacheLoads,
    changes: () => changes,
  };
}

const all: Reply = (ids) => ok(...ids);
const ids = (n: number, from = 1) => Array.from({ length: n }, (_, i) => String(from + i));

describe('repost checker, batch path', () => {
  test('newly listed jobs go out at once with no timer, and nothing is persisted', async () => {
    const h = harness(all);
    for (const id of ids(5)) {
      h.checker.want(id);
    }
    expect(h.batches).toEqual([]);
    await h.advanceTo(0);
    expect(h.batches).toEqual([ids(5)]);
    expect(h.recorded).toEqual([]);
    expect(h.cacheLoads()).toBe(0);
    expect(h.checker.isReposted('1')).toBe(false);
  });

  test('a request carries at most 25 ids and chunks follow back to back', async () => {
    const h = harness(all);
    for (const id of ids(30)) {
      h.checker.want(id);
    }
    await h.advanceTo(0);
    expect(h.batches.map((b) => b.length)).toEqual([25, 5]);
  });

  test('a job is requested once per session, answered or left out', async () => {
    const h = harness((asked) => ok(asked[0]!));
    h.checker.want('1');
    h.checker.want('2');
    await h.advanceTo(0);
    h.checker.want('1');
    h.checker.want('2');
    await h.advanceTo(0);
    expect(h.batches.flat().sort()).toEqual(['1', '2']);
  });

  test('answers are readable and clear forgets them', async () => {
    const h = harness((asked) => ({
      kind: 'ok',
      postings: new Map(asked.map((id) => [id, { reposted: true, applies: 3 }])),
    }));
    h.checker.want('1');
    await h.advanceTo(0);
    expect(h.checker.isReposted('1')).toBe(true);
    h.checker.clear();
    expect(h.checker.isReposted('1')).toBe(false);
    h.checker.want('1');
    await h.advanceTo(0);
    expect(h.batches.length).toBe(2);
  });

  test('a throttled answer pauses without falling back, then asks again after the backoff', async () => {
    let calls = 0;
    const h = harness((asked) => (calls++ === 0 ? { kind: 'throttled' } : ok(...asked)));
    h.checker.want('1');
    await h.advanceTo(FIRST_BACKOFF_MS - 1);
    expect(h.checker.isPaused()).toBe(true);
    expect(h.pauses).toEqual([FIRST_BACKOFF_MS]);
    h.checker.want('2');
    await h.advanceTo(FIRST_BACKOFF_MS - 1);
    expect(h.batches.length).toBe(1);
    await h.advanceTo(FIRST_BACKOFF_MS);
    expect(h.checker.isPaused()).toBe(false);
    expect(h.pauses[1]).toBeUndefined();
    h.checker.want('1');
    await h.advanceTo(FIRST_BACKOFF_MS);
    expect(h.batches[1]).toEqual(['1']);
    expect(h.singles.length).toBe(0);
    expect(h.cacheLoads()).toBe(0);
  });

  test('a stored pause holds requests until it ends', async () => {
    const h = harness(all);
    h.checker.pauseUntil(5000);
    h.checker.want('1');
    await h.advanceTo(4999);
    expect(h.batches.length).toBe(0);
    await h.advanceTo(5000);
    h.checker.want('1');
    await h.advanceTo(5000);
    expect(h.batches.length).toBe(1);
  });
});

describe('repost checker, fallback path', () => {
  const failBatch = (batch: Reply = () => ({ kind: 'failed' })) => batch;

  test('a failed batch loads the cache and downloads one job at a time, a second apart', async () => {
    const h = harness(failBatch(), all);
    h.checker.want('1');
    await h.advanceTo(0);
    for (const id of ids(2, 2)) {
      h.checker.want(id);
    }
    await h.advanceTo(20_000);
    expect(h.batches.length).toBe(1);
    expect(h.cacheLoads()).toBe(1);
    expect(h.singles.map((s) => s.id)).toEqual(['1', '2', '3']);
    expect(h.singles[1]!.at - h.singles[0]!.at).toBe(SINGLE_GAP_MS);
    expect(h.recorded).toEqual(['1', '2', '3']);
  });

  test('queued batch ids move to the fallback too', async () => {
    const h = harness(failBatch(), all);
    for (const id of ids(3)) {
      h.checker.want(id);
    }
    await h.advanceTo(20_000);
    expect(h.singles.map((s) => s.id)).toEqual(['1', '2', '3']);
  });

  test('jobs already in the persisted cache are not downloaded and still hide', async () => {
    const h = harness(failBatch(), all);
    h.cache.set('2', true);
    for (const id of ids(3)) {
      h.checker.want(id);
    }
    await h.advanceTo(20_000);
    expect(h.singles.map((s) => s.id)).toEqual(['1', '3']);
    expect(h.checker.isReposted('2')).toBe(true);
  });

  test('a job whose own page fails is not retried', async () => {
    const h = harness(failBatch(), () => ({ kind: 'failed' }));
    h.checker.want('1');
    await h.advanceTo(10_000);
    h.checker.want('1');
    await h.advanceTo(20_000);
    expect(h.singles.length).toBe(1);
    expect(h.recorded).toEqual([]);
  });

  test('throttling a download pauses and keeps the job for after the backoff', async () => {
    let calls = 0;
    const h = harness(failBatch(), (asked) =>
      calls++ === 0 ? { kind: 'throttled' } : ok(...asked),
    );
    h.checker.want('1');
    await h.advanceTo(FIRST_BACKOFF_MS - 1);
    expect(h.checker.isPaused()).toBe(true);
    expect(h.singles.length).toBe(1);
    await h.advanceTo(FIRST_BACKOFF_MS + 1);
    expect(h.singles.map((s) => s.id)).toEqual(['1', '1']);
  });
});
