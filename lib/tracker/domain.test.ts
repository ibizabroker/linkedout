import { describe, expect, test } from 'bun:test';
import {
  classifyAppend,
  classifyCheck,
  classifySignInError,
  initialView,
  NO_SYNC,
  parseStoredTracker,
  serializeTracker,
  sheetFromId,
  summarizeSync,
  trackerReducer,
  type TrackerEvent,
  type TrackerView,
} from './domain.ts';

const sheet = sheetFromId('abc_123-XYZ');
const other = sheetFromId('second');
const connection = { sheet, connectedAt: 1_700_000_000_000 };
const syncing = { added: 2, waiting: 1, authExpired: false };

function run(start: TrackerView, ...events: TrackerEvent[]): TrackerView {
  return events.reduce(trackerReducer, start);
}

describe('stored tracker document', () => {
  test('a saved sheet reads back with the moment it connected', () => {
    expect(parseStoredTracker(serializeTracker(connection))).toEqual(connection);
  });

  test('missing, disconnected, and malformed documents read as disconnected', () => {
    expect(parseStoredTracker(undefined)).toBe(null);
    expect(parseStoredTracker(serializeTracker(null))).toBe(null);
    expect(parseStoredTracker('garbage')).toBe(null);
    expect(parseStoredTracker([])).toBe(null);
    expect(parseStoredTracker({ version: 1, sheet })).toBe(null);
    expect(parseStoredTracker({ version: 2, sheet })).toBe(null);
    expect(parseStoredTracker({ version: 2, sheet, connectedAt: 'now' })).toBe(null);
    const badId = { spreadsheetId: 7, url: sheet.url };
    expect(parseStoredTracker({ version: 2, sheet: badId, connectedAt: 1 })).toBe(null);
    const empty = { spreadsheetId: '', url: '' };
    expect(parseStoredTracker({ version: 2, sheet: empty, connectedAt: 1 })).toBe(null);
  });

  test('a url that is not the sheet link for its id reads as disconnected', () => {
    const sheet = { spreadsheetId: 'abc', url: 'https://evil.example/' };
    const forged = { version: 2, sheet, connectedAt: 1 };
    expect(parseStoredTracker(forged)).toBe(null);
  });
});

describe('tracker view', () => {
  test('a build without oauth2 hides the section for good', () => {
    const hidden = initialView(false);
    expect(hidden).toEqual({ kind: 'unavailable' });
    expect(run(hidden, { type: 'stored', sheet, sync: NO_SYNC }, { type: 'started' })).toEqual(
      hidden,
    );
  });

  test('the first storage read settles loading', () => {
    expect(run(initialView(true), { type: 'stored', sheet: null, sync: NO_SYNC })).toEqual({
      kind: 'disconnected',
      busy: false,
    });
    expect(run(initialView(true), { type: 'stored', sheet, sync: NO_SYNC })).toEqual({
      kind: 'connected',
      sheet,
      sync: NO_SYNC,
      busy: false,
    });
  });

  test('connecting is busy until storage shows the sheet', () => {
    const view = run(
      { kind: 'disconnected', busy: false },
      { type: 'started' },
      { type: 'stored', sheet, sync: NO_SYNC },
      { type: 'succeeded' },
    );
    expect(view).toEqual({ kind: 'connected', sheet, sync: NO_SYNC, busy: false });
  });

  test('a cancelled sign-in returns to disconnected with no error', () => {
    const view = run(
      { kind: 'disconnected', busy: false },
      { type: 'started' },
      { type: 'failed' },
    );
    expect(view).toEqual({ kind: 'disconnected', busy: false, error: undefined });
  });

  test('a failed sign-in keeps one error line until the next attempt', () => {
    const failed = run(
      { kind: 'disconnected', busy: false },
      { type: 'started' },
      { type: 'failed', error: 'nope' },
    );
    expect(failed).toEqual({ kind: 'disconnected', busy: false, error: 'nope' });
    expect(run(failed, { type: 'started' })).toEqual({
      kind: 'disconnected',
      busy: true,
      error: undefined,
    });
  });

  test('disconnect clears the sheet', () => {
    const view = run(
      { kind: 'connected', sheet, sync: NO_SYNC, busy: false },
      { type: 'started' },
      { type: 'stored', sheet: null, sync: NO_SYNC },
    );
    expect(view).toEqual({ kind: 'disconnected', busy: false });
  });

  test('a check that finds the sheet gone moves to missing', () => {
    const connected: TrackerView = { kind: 'connected', sheet, sync: NO_SYNC, busy: false };
    expect(run(connected, { type: 'checked', result: 'missing' })).toEqual({
      kind: 'missing',
      sheet,
      sync: NO_SYNC,
      busy: false,
    });
  });

  test('a check that errors or passes keeps the popup connected', () => {
    const connected: TrackerView = { kind: 'connected', sheet, sync: NO_SYNC, busy: false };
    expect(run(connected, { type: 'checked', result: 'error' })).toEqual(connected);
    expect(run(connected, { type: 'checked', result: 'ok' })).toEqual(connected);
  });

  test('a late check cannot undo a disconnect', () => {
    const view = run(
      { kind: 'connected', sheet, sync: NO_SYNC, busy: false },
      { type: 'stored', sheet: null, sync: NO_SYNC },
      { type: 'checked', result: 'missing' },
    );
    expect(view).toEqual({ kind: 'disconnected', busy: false });
  });

  test('recreating from missing lands on the new sheet', () => {
    const view = run(
      { kind: 'missing', sheet, sync: NO_SYNC, busy: false },
      { type: 'started' },
      { type: 'stored', sheet: other, sync: NO_SYNC },
      { type: 'succeeded' },
    );
    expect(view).toEqual({ kind: 'connected', sheet: other, sync: NO_SYNC, busy: false });
  });

  test('a failed recreate stays missing with the error', () => {
    const view = run(
      { kind: 'missing', sheet, sync: NO_SYNC, busy: false },
      { type: 'started' },
      { type: 'failed', error: 'x' },
    );
    expect(view).toEqual({ kind: 'missing', sheet, sync: NO_SYNC, busy: false, error: 'x' });
  });
});

describe('tracker view sync lines', () => {
  const connected: TrackerView = { kind: 'connected', sheet, sync: NO_SYNC, busy: false };

  test('storage changes update the counts without leaving connected', () => {
    expect(run(connected, { type: 'stored', sheet, sync: syncing })).toEqual({
      ...connected,
      sync: syncing,
    });
  });

  test('a missing sheet stays missing while its queue changes', () => {
    const missing = run(connected, { type: 'checked', result: 'missing' });
    expect(run(missing, { type: 'stored', sheet, sync: syncing })).toEqual({
      kind: 'missing',
      sheet,
      sync: syncing,
      busy: false,
    });
  });

  test('a late check keeps the counts it was connected with', () => {
    const view = run(
      connected,
      { type: 'stored', sheet, sync: syncing },
      { type: 'checked', result: 'missing' },
    );
    expect(view).toEqual({ kind: 'missing', sheet, sync: syncing, busy: false });
  });

  test('counts come from the written set, the outbox, and the expired flag', () => {
    const state = { written: ['1', '2'], outbox: [{ jobId: '3', row: [] }], failures: 1 };
    expect(summarizeSync(state, true)).toEqual({ added: 2, waiting: 1, authExpired: true });
  });
});

describe('error classification', () => {
  test('closing or declining the Google window is a cancel', () => {
    expect(classifySignInError('The user did not approve access.')).toBe('cancelled');
    expect(classifySignInError('Authorization page could not be loaded: canceled')).toBe(
      'cancelled',
    );
  });

  test('anything else is a failure', () => {
    expect(classifySignInError('OAuth2 not granted or revoked.')).toBe('failed');
    expect(classifySignInError('Failed to fetch')).toBe('failed');
    expect(classifySignInError(undefined)).toBe('failed');
  });

  test('a 404 or a trashed file means the sheet is missing', () => {
    expect(classifyCheck(404, undefined)).toBe('missing');
    expect(classifyCheck(200, true)).toBe('missing');
  });

  test('a live file is ok and every other status is an error', () => {
    expect(classifyCheck(200, false)).toBe('ok');
    expect(classifyCheck(200, undefined)).toBe('ok');
    expect(classifyCheck(500, undefined)).toBe('error');
    expect(classifyCheck(403, undefined)).toBe('error');
    expect(classifyCheck(401, undefined)).toBe('error');
  });
});

describe('classifyAppend', () => {
  test('each response maps to what the writer does next', () => {
    expect(classifyAppend(200)).toBe('ok');
    expect(classifyAppend(401)).toBe('auth-expired');
    expect(classifyAppend(404)).toBe('missing');
    expect(classifyAppend(429)).toBe('error');
    expect(classifyAppend(500)).toBe('error');
  });
});
