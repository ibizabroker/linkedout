import { describe, expect, test } from 'bun:test';
import type { AppendResult } from './domain.ts';
import { flushOutbox } from './flush.ts';
import { emptySync, enqueue, type SyncState } from './outbox.ts';
import type { SheetRow } from './row.ts';

const a = { jobId: '1', row: ['a'] };
const b = { jobId: '2', row: ['b'] };
const c = { jobId: '3', row: ['c'] };
const queued: SyncState = [a, b, c].reduce(enqueue, emptySync());

function harness(results: readonly AppendResult[]) {
  const sent: SheetRow[] = [];
  const saved: SyncState[] = [];
  let next = 0;
  return {
    sent,
    saved,
    deps: {
      append: async (row: SheetRow) => {
        sent.push(row);
        return results[next++] ?? 'ok';
      },
      persist: async (state: SyncState) => {
        saved.push(state);
      },
    },
  };
}

describe('flushing the outbox', () => {
  test('rows are written in application order and each is recorded as written', async () => {
    const { sent, saved, deps } = harness([]);
    const { state, outcome } = await flushOutbox(queued, deps);
    expect(sent).toEqual([['a'], ['b'], ['c']]);
    expect(outcome).toEqual({ kind: 'drained' });
    expect(state.outbox).toEqual([]);
    expect(state.written).toEqual(['1', '2', '3']);
    expect(saved.map((s) => s.written.length)).toEqual([1, 2, 3]);
  });

  test('a failure stops the flush and keeps that row and the rows after it', async () => {
    const { sent, saved, deps } = harness(['ok', 'error']);
    const { state, outcome } = await flushOutbox(queued, deps);
    expect(sent).toEqual([['a'], ['b']]);
    expect(outcome).toEqual({ kind: 'stopped', reason: 'error' });
    expect(state.written).toEqual(['1']);
    expect(state.outbox).toEqual([b, c]);
    expect(state.failures).toBe(1);
    expect(saved[saved.length - 1]).toEqual(state);
  });

  test('an expired sign-in and a missing sheet both stop with their own reason', async () => {
    expect((await flushOutbox(queued, harness(['auth-expired']).deps)).outcome).toEqual({
      kind: 'stopped',
      reason: 'auth-expired',
    });
    expect((await flushOutbox(queued, harness(['missing']).deps)).outcome).toEqual({
      kind: 'stopped',
      reason: 'missing',
    });
  });

  test('flushing again after a failure writes each row once', async () => {
    const first = await flushOutbox(queued, harness(['ok', 'error']).deps);
    const again = harness([]);
    const second = await flushOutbox(first.state, again.deps);
    expect(again.sent).toEqual([['b'], ['c']]);
    expect(second.state.written).toEqual(['1', '2', '3']);
    expect(second.state.failures).toBe(0);
  });

  test('an empty outbox writes nothing', async () => {
    const { sent, deps } = harness([]);
    const { outcome } = await flushOutbox(emptySync(), deps);
    expect(sent).toEqual([]);
    expect(outcome).toEqual({ kind: 'drained' });
  });
});
