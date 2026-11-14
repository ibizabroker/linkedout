import { describe, expect, test } from 'bun:test';
import {
  classifyCheck,
  classifySignInError,
  initialView,
  parseStoredTracker,
  serializeTracker,
  sheetFromId,
  trackerReducer,
  type TrackerEvent,
  type TrackerView,
} from './domain.ts';

const sheet = sheetFromId('abc_123-XYZ');
const other = sheetFromId('second');

function run(start: TrackerView, ...events: TrackerEvent[]): TrackerView {
  return events.reduce(trackerReducer, start);
}

describe('stored tracker document', () => {
  test('a saved sheet reads back', () => {
    expect(parseStoredTracker(serializeTracker(sheet))).toEqual(sheet);
  });

  test('missing, disconnected, and malformed documents read as disconnected', () => {
    expect(parseStoredTracker(undefined)).toBe(null);
    expect(parseStoredTracker(serializeTracker(null))).toBe(null);
    expect(parseStoredTracker('garbage')).toBe(null);
    expect(parseStoredTracker([])).toBe(null);
    expect(parseStoredTracker({ version: 2, sheet })).toBe(null);
    expect(parseStoredTracker({ version: 1, sheet: { spreadsheetId: 7, url: sheet.url } })).toBe(
      null,
    );
    expect(parseStoredTracker({ version: 1, sheet: { spreadsheetId: '', url: '' } })).toBe(null);
  });

  test('a url that is not the sheet link for its id reads as disconnected', () => {
    const forged = { version: 1, sheet: { spreadsheetId: 'abc', url: 'https://evil.example/' } };
    expect(parseStoredTracker(forged)).toBe(null);
  });
});

describe('tracker view', () => {
  test('a build without oauth2 hides the section for good', () => {
    const hidden = initialView(false);
    expect(hidden).toEqual({ kind: 'unavailable' });
    expect(run(hidden, { type: 'stored', sheet }, { type: 'started' })).toEqual(hidden);
  });

  test('the first storage read settles loading', () => {
    expect(run(initialView(true), { type: 'stored', sheet: null })).toEqual({
      kind: 'disconnected',
      busy: false,
    });
    expect(run(initialView(true), { type: 'stored', sheet })).toEqual({
      kind: 'connected',
      sheet,
      busy: false,
    });
  });

  test('connecting is busy until storage shows the sheet', () => {
    const view = run(
      { kind: 'disconnected', busy: false },
      { type: 'started' },
      { type: 'stored', sheet },
      { type: 'succeeded' },
    );
    expect(view).toEqual({ kind: 'connected', sheet, busy: false });
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
      { kind: 'connected', sheet, busy: false },
      { type: 'started' },
      { type: 'stored', sheet: null },
    );
    expect(view).toEqual({ kind: 'disconnected', busy: false });
  });

  test('a check that finds the sheet gone moves to missing', () => {
    const connected: TrackerView = { kind: 'connected', sheet, busy: false };
    expect(run(connected, { type: 'checked', result: 'missing' })).toEqual({
      kind: 'missing',
      busy: false,
    });
  });

  test('a check that errors or passes keeps the popup connected', () => {
    const connected: TrackerView = { kind: 'connected', sheet, busy: false };
    expect(run(connected, { type: 'checked', result: 'error' })).toEqual(connected);
    expect(run(connected, { type: 'checked', result: 'ok' })).toEqual(connected);
  });

  test('a late check cannot undo a disconnect', () => {
    const view = run(
      { kind: 'connected', sheet, busy: false },
      { type: 'stored', sheet: null },
      { type: 'checked', result: 'missing' },
    );
    expect(view).toEqual({ kind: 'disconnected', busy: false });
  });

  test('recreating from missing lands on the new sheet', () => {
    const view = run(
      { kind: 'missing', busy: false },
      { type: 'started' },
      { type: 'stored', sheet: other },
      { type: 'succeeded' },
    );
    expect(view).toEqual({ kind: 'connected', sheet: other, busy: false });
  });

  test('a failed recreate stays missing with the error', () => {
    const view = run(
      { kind: 'missing', busy: false },
      { type: 'started' },
      { type: 'failed', error: 'x' },
    );
    expect(view).toEqual({ kind: 'missing', busy: false, error: 'x' });
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
