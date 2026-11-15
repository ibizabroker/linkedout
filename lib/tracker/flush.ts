import type { AppendResult } from './domain.ts';
import { delivered, deliveryFailed, type SyncState } from './outbox.ts';
import type { SheetRow } from './row.ts';

export type FlushOutcome =
  | { readonly kind: 'drained' }
  | { readonly kind: 'stopped'; readonly reason: Exclude<AppendResult, 'ok'> };

export async function flushOutbox(
  start: SyncState,
  deps: {
    readonly append: (row: SheetRow) => Promise<AppendResult>;
    readonly persist: (state: SyncState) => Promise<void>;
  },
): Promise<{ readonly state: SyncState; readonly outcome: FlushOutcome }> {
  let state = start;
  for (let head = state.outbox[0]; head !== undefined; head = state.outbox[0]) {
    const result = await deps.append(head.row);
    if (result !== 'ok') {
      state = deliveryFailed(state);
      await deps.persist(state);
      return { state, outcome: { kind: 'stopped', reason: result } };
    }
    state = delivered(state, head.jobId);
    await deps.persist(state);
  }
  return { state, outcome: { kind: 'drained' } };
}
