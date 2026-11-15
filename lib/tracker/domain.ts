import type { SyncState } from './outbox.ts';

export type TrackerSheet = {
  readonly spreadsheetId: string;
  readonly url: string;
};

export type Connection = {
  readonly sheet: TrackerSheet;
  readonly connectedAt: number;
};

export type StoredTracker = {
  readonly version: 2;
  readonly sheet: TrackerSheet | null;
  readonly connectedAt: number | null;
};

export type SyncSummary = {
  readonly added: number;
  readonly waiting: number;
  readonly authExpired: boolean;
};

export type TrackerView =
  | { readonly kind: 'unavailable' }
  | { readonly kind: 'loading' }
  | { readonly kind: 'disconnected'; readonly busy: boolean; readonly error?: string }
  | {
      readonly kind: 'connected';
      readonly sheet: TrackerSheet;
      readonly sync: SyncSummary;
      readonly busy: boolean;
      readonly error?: string;
    }
  | {
      readonly kind: 'missing';
      readonly sheet: TrackerSheet;
      readonly sync: SyncSummary;
      readonly busy: boolean;
      readonly error?: string;
    };

export type CheckResult = 'ok' | 'missing' | 'error';
export type AppendResult = 'ok' | 'missing' | 'auth-expired' | 'error';
export type SignInFailure = 'cancelled' | 'failed';

export type TrackerEvent =
  | { readonly type: 'stored'; readonly sheet: TrackerSheet | null; readonly sync: SyncSummary }
  | { readonly type: 'started' }
  | { readonly type: 'succeeded' }
  | { readonly type: 'failed'; readonly error?: string }
  | { readonly type: 'checked'; readonly result: CheckResult };

export const CONNECT_FAILED_TEXT = "Couldn't connect to Google. Try again.";

const SHEET_URL_PREFIX = 'https://docs.google.com/spreadsheets/d/';
const SPREADSHEET_ID = /^[A-Za-z0-9_-]+$/;

export function sheetFromId(spreadsheetId: string): TrackerSheet {
  return { spreadsheetId, url: `${SHEET_URL_PREFIX}${spreadsheetId}/edit` };
}

export function initialView(oauthConfigured: boolean): TrackerView {
  return oauthConfigured ? { kind: 'loading' } : { kind: 'unavailable' };
}

export const NO_SYNC: SyncSummary = { added: 0, waiting: 0, authExpired: false };

export function summarizeSync(state: SyncState, authExpired: boolean): SyncSummary {
  return { added: state.written.length, waiting: state.outbox.length, authExpired };
}

export function parseStoredTracker(raw: unknown): Connection | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return null;
  }
  const doc = raw as Record<string, unknown>;
  const sheet = parseSheet(doc.sheet);
  const { connectedAt } = doc;
  if (
    doc.version !== 2 ||
    sheet === null ||
    typeof connectedAt !== 'number' ||
    !Number.isFinite(connectedAt)
  ) {
    return null;
  }
  return { sheet, connectedAt };
}

export function parseSheet(raw: unknown): TrackerSheet | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const { spreadsheetId, url } = raw as Record<string, unknown>;
  if (typeof spreadsheetId !== 'string' || !SPREADSHEET_ID.test(spreadsheetId)) {
    return null;
  }
  const sheet = sheetFromId(spreadsheetId);
  return url === sheet.url ? sheet : null;
}

export function serializeTracker(connection: Connection | null): StoredTracker {
  return connection === null
    ? { version: 2, sheet: null, connectedAt: null }
    : { version: 2, sheet: connection.sheet, connectedAt: connection.connectedAt };
}

export function trackerReducer(view: TrackerView, event: TrackerEvent): TrackerView {
  if (view.kind === 'unavailable') {
    return view;
  }
  switch (event.type) {
    case 'stored':
      return fromStored(view, event.sheet, event.sync);
    case 'started':
      return view.kind === 'loading' ? view : { ...view, busy: true, error: undefined };
    case 'succeeded':
      return view.kind === 'loading' ? view : { ...view, busy: false };
    case 'failed':
      return view.kind === 'loading' ? view : { ...view, busy: false, error: event.error };
    case 'checked':
      return view.kind === 'connected' && event.result === 'missing'
        ? { kind: 'missing', sheet: view.sheet, sync: view.sync, busy: false }
        : view;
    default:
      return unexpected(event);
  }
}

function fromStored(view: TrackerView, sheet: TrackerSheet | null, sync: SyncSummary): TrackerView {
  if (sheet === null) {
    return view.kind === 'disconnected' ? view : { kind: 'disconnected', busy: false };
  }
  if (view.kind === 'missing' && view.sheet.spreadsheetId === sheet.spreadsheetId) {
    return { ...view, sync };
  }
  if (view.kind === 'connected') {
    return { ...view, sheet, sync };
  }
  return { kind: 'connected', sheet, sync, busy: false };
}

export function classifySignInError(message: string | undefined): SignInFailure {
  const text = (message ?? '').toLowerCase();
  return text.includes('did not approve') || text.includes('canceled') || text.includes('cancelled')
    ? 'cancelled'
    : 'failed';
}

export function classifyCheck(status: number, trashed: boolean | undefined): CheckResult {
  if (status === 404 || (status === 200 && trashed === true)) {
    return 'missing';
  }
  return status === 200 ? 'ok' : 'error';
}

export function classifyAppend(status: number): AppendResult {
  if (status === 200) {
    return 'ok';
  }
  if (status === 401) {
    return 'auth-expired';
  }
  return status === 404 ? 'missing' : 'error';
}

function unexpected(value: never): never {
  throw new Error(`Unexpected tracker event: ${JSON.stringify(value)}`);
}
