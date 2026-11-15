import { describe, expect, test } from 'bun:test';
import {
  deliveryFailed,
  delivered,
  emptySync,
  enqueue,
  isKnown,
  parseSync,
  retryDelayMinutes,
  serializeOutbox,
  serializeWritten,
  type SyncState,
} from './outbox.ts';

const a = { jobId: '1', row: ['a'] };
const b = { jobId: '2', row: ['b', 2] };

describe('outbox transitions', () => {
  test('a new application waits in application order', () => {
    const state = enqueue(enqueue(emptySync(), a), b);
    expect(state.outbox).toEqual([a, b]);
  });

  test('the same job queued twice, or queued after it was written, adds nothing', () => {
    const queued = enqueue(emptySync(), a);
    expect(enqueue(queued, { ...a, row: ['other'] })).toEqual(queued);
    const written = delivered(queued, '1');
    expect(enqueue(written, a)).toEqual(written);
  });

  test('a delivered entry leaves the outbox and joins the written set together', () => {
    const state = delivered(enqueue(enqueue(emptySync(), a), b), '1');
    expect(state.outbox).toEqual([b]);
    expect(state.written).toEqual(['1']);
    expect(isKnown(state, '1')).toBe(true);
    expect(isKnown(state, '2')).toBe(true);
    expect(isKnown(state, '3')).toBe(false);
  });

  test('a failure keeps every entry and counts toward the backoff; a delivery resets it', () => {
    const failed = deliveryFailed(deliveryFailed(enqueue(emptySync(), a)));
    expect(failed.outbox).toEqual([a]);
    expect(failed.written).toEqual([]);
    expect(failed.failures).toBe(2);
    expect(delivered(failed, '1').failures).toBe(0);
  });

  test('a deleted row stays deleted because the written set only grows', () => {
    const state = delivered(enqueue(emptySync(), a), '1');
    expect(isKnown(state, '1')).toBe(true);
  });

  test('retries back off from one minute to thirty', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 20].map(retryDelayMinutes)).toEqual([1, 2, 4, 8, 16, 30, 30, 30]);
  });
});

describe('stored sync documents', () => {
  test('both documents read back what was saved', () => {
    const state: SyncState = { written: ['9'], outbox: [a, b], failures: 3 };
    expect(parseSync(serializeWritten(state), serializeOutbox(state))).toEqual(state);
  });

  test('missing or malformed documents read as empty', () => {
    expect(parseSync(undefined, undefined)).toEqual(emptySync());
    expect(parseSync('x', { version: 2, entries: [a] })).toEqual(emptySync());
  });

  test('entries and ids that are not well formed are dropped', () => {
    const state = parseSync(
      { version: 1, jobIds: ['1', 'x', 2] },
      {
        version: 1,
        entries: [a, { jobId: 'x', row: [] }, { jobId: '3', row: [{}] }],
        failures: -1,
      },
    );
    expect(state).toEqual({ written: ['1'], outbox: [a], failures: 0 });
  });
});
