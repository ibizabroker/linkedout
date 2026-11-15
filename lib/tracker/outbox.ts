import type { SheetCell, SheetRow } from './row.ts';

export type OutboxEntry = {
  readonly jobId: string;
  readonly row: SheetRow;
};

export type SyncState = {
  readonly written: readonly string[];
  readonly outbox: readonly OutboxEntry[];
  readonly failures: number;
};

export type StoredWritten = { readonly version: 1; readonly jobIds: readonly string[] };
export type StoredOutbox = {
  readonly version: 1;
  readonly entries: readonly OutboxEntry[];
  readonly failures: number;
};

const JOB_ID = /^\d+$/;
const MIN_RETRY_MINUTES = 1;
const MAX_RETRY_MINUTES = 30;

export function emptySync(): SyncState {
  return { written: [], outbox: [], failures: 0 };
}

export function isKnown(state: SyncState, jobId: string): boolean {
  return state.written.includes(jobId) || state.outbox.some((entry) => entry.jobId === jobId);
}

export function enqueue(state: SyncState, entry: OutboxEntry): SyncState {
  return isKnown(state, entry.jobId) ? state : { ...state, outbox: [...state.outbox, entry] };
}

export function delivered(state: SyncState, jobId: string): SyncState {
  const outbox = state.outbox.filter((entry) => entry.jobId !== jobId);
  return {
    written: state.written.includes(jobId) ? state.written : [...state.written, jobId],
    outbox,
    failures: 0,
  };
}

export function deliveryFailed(state: SyncState): SyncState {
  return { ...state, failures: state.failures + 1 };
}

export function retryDelayMinutes(failures: number): number {
  return Math.min(MAX_RETRY_MINUTES, MIN_RETRY_MINUTES * 2 ** Math.max(0, failures - 1));
}

export function serializeWritten(state: SyncState): StoredWritten {
  return { version: 1, jobIds: state.written };
}

export function serializeOutbox(state: SyncState): StoredOutbox {
  return { version: 1, entries: state.outbox, failures: state.failures };
}

export function parseSync(writtenRaw: unknown, outboxRaw: unknown): SyncState {
  const written = parseWritten(writtenRaw);
  const stored = parseOutbox(outboxRaw);
  return { written, outbox: stored.entries, failures: stored.failures };
}

function parseWritten(raw: unknown): readonly string[] {
  const jobIds = isRecord(raw) && raw.version === 1 ? raw.jobIds : undefined;
  return Array.isArray(jobIds)
    ? jobIds.filter((id): id is string => typeof id === 'string' && JOB_ID.test(id))
    : [];
}

function parseOutbox(raw: unknown): { entries: OutboxEntry[]; failures: number } {
  if (!isRecord(raw) || raw.version !== 1 || !Array.isArray(raw.entries)) {
    return { entries: [], failures: 0 };
  }
  const entries = raw.entries.filter(isEntry);
  const failures =
    typeof raw.failures === 'number' && raw.failures > 0 ? Math.floor(raw.failures) : 0;
  return { entries, failures };
}

function isEntry(value: unknown): value is OutboxEntry {
  return (
    isRecord(value) &&
    typeof value.jobId === 'string' &&
    JOB_ID.test(value.jobId) &&
    Array.isArray(value.row) &&
    value.row.every(isCell)
  );
}

function isCell(value: unknown): value is SheetCell {
  return typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
