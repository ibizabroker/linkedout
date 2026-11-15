export type TrackerSheet = {
  readonly spreadsheetId: string;
  readonly url: string;
};

export type StoredTracker = {
  readonly version: 1;
  readonly sheet: TrackerSheet | null;
};

export type TrackerView =
  | { readonly kind: 'unavailable' }
  | { readonly kind: 'loading' }
  | { readonly kind: 'disconnected'; readonly busy: boolean; readonly error?: string }
  | {
      readonly kind: 'connected';
      readonly sheet: TrackerSheet;
      readonly busy: boolean;
      readonly error?: string;
    }
  | { readonly kind: 'missing'; readonly busy: boolean; readonly error?: string };

export type CheckResult = 'ok' | 'missing' | 'error';
export type AppendResult = 'ok' | 'missing' | 'auth-expired' | 'error';
export type SignInFailure = 'cancelled' | 'failed';

export type TrackerEvent =
  | { readonly type: 'stored'; readonly sheet: TrackerSheet | null }
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

export function parseStoredTracker(raw: unknown): TrackerSheet | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return null;
  }
  const doc = raw as Record<string, unknown>;
  if (doc.version !== 1 || typeof doc.sheet !== 'object' || doc.sheet === null) {
    return null;
  }
  const { spreadsheetId, url } = doc.sheet as Record<string, unknown>;
  if (typeof spreadsheetId !== 'string' || !SPREADSHEET_ID.test(spreadsheetId)) {
    return null;
  }
  const sheet = sheetFromId(spreadsheetId);
  return url === sheet.url ? sheet : null;
}

export function serializeTracker(sheet: TrackerSheet | null): StoredTracker {
  return { version: 1, sheet };
}

export function trackerReducer(view: TrackerView, event: TrackerEvent): TrackerView {
  if (view.kind === 'unavailable') {
    return view;
  }
  switch (event.type) {
    case 'stored':
      return fromStored(view, event.sheet);
    case 'started':
      return view.kind === 'loading' ? view : { ...view, busy: true, error: undefined };
    case 'succeeded':
      return view.kind === 'loading' ? view : { ...view, busy: false };
    case 'failed':
      return view.kind === 'loading' ? view : { ...view, busy: false, error: event.error };
    case 'checked':
      return view.kind === 'connected' && event.result === 'missing'
        ? { kind: 'missing', busy: false }
        : view;
    default:
      return unexpected(event);
  }
}

function fromStored(view: TrackerView, sheet: TrackerSheet | null): TrackerView {
  if (sheet === null) {
    return view.kind === 'disconnected' ? view : { kind: 'disconnected', busy: false };
  }
  if (view.kind === 'connected') {
    return { ...view, sheet };
  }
  return { kind: 'connected', sheet, busy: false };
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
