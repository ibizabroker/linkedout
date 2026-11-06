import { describe, expect, test } from 'bun:test';
import {
  defaultHideSet,
  hasKind,
  parseReplaceDocument,
  parseStoredHideSet,
  readyPopup,
  shouldMarkHidden,
  withKind,
} from './domain.ts';

describe('parseStoredHideSet', () => {
  test('a missing value includes applied', () => {
    const parsed = parseStoredHideSet(undefined);
    expect(parsed.status).toBe('ready');
    if (parsed.status !== 'ready') {
      return;
    }
    expect(hasKind(parsed.set, 'applied')).toBe(true);
  });

  test('an empty kind list stays empty', () => {
    const parsed = parseStoredHideSet({ version: 1, kinds: [] });
    expect(parsed.status).toBe('ready');
    if (parsed.status !== 'ready') {
      return;
    }
    expect(parsed.set.kinds).toEqual([]);
  });

  test('a broken value is unreadable and is not the default', () => {
    const broken = [
      null,
      1,
      'applied',
      { version: 1 },
      { version: 2, kinds: ['applied'] },
      { version: 1, kinds: [1] },
      { kinds: [] },
    ];
    const fallback = { status: 'ready' as const, set: defaultHideSet() };

    for (const value of broken) {
      const parsed = parseStoredHideSet(value);
      expect(parsed.status).toBe('unreadable');
      expect(parsed).not.toEqual(fallback);
      if (parsed.status === 'ready') {
        expect(hasKind(parsed.set, 'applied')).toBe(false);
      }
    }
  });
});

describe('parseReplaceDocument', () => {
  test('rejects a document that contains a string outside the catalog', () => {
    expect(parseReplaceDocument({ version: 1, kinds: ['viewed'] })).toBeUndefined();
    expect(parseReplaceDocument({ version: 1, kinds: ['applied', 'saved'] })).toBeUndefined();
  });

  test('accepts an empty kind list as a clear', () => {
    expect(parseReplaceDocument({ version: 1, kinds: [] })?.kinds).toEqual([]);
  });
});

describe('withKind', () => {
  test('is idempotent', () => {
    const selected = defaultHideSet();
    expect(withKind(selected, 'applied', true).kinds).toEqual(['applied']);
    expect(selected.kinds).toEqual(['applied']);

    const cleared = withKind(selected, 'applied', false);
    expect(cleared.kinds).toEqual([]);
    expect(withKind(cleared, 'applied', false).kinds).toEqual([]);
    expect(withKind(cleared, 'applied', true).kinds).toEqual(['applied']);
  });
});

describe('readyPopup', () => {
  test('names the trigger, the hiding sentence, and the count', () => {
    const ready = readyPopup(defaultHideSet(), { kind: 'jobs-list', hiddenCount: 2 });
    expect(ready.triggerLabel).toBe('Applied');
    expect(ready.status).toEqual({
      kind: 'hiding',
      text: 'Hiding on this list',
      countLine: '2 cards hidden',
    });
  });

  test('an empty set on a jobs list says every card is showing', () => {
    const empty = withKind(defaultHideSet(), 'applied', false);
    const ready = readyPopup(empty, { kind: 'jobs-list', hiddenCount: 4 });
    expect(ready.triggerLabel).toBe('Nothing hidden');
    expect(ready.status).toEqual({ kind: 'showing', text: 'Showing every card' });
  });

  test('a page that is not a jobs list asks for a jobs search', () => {
    const ready = readyPopup(defaultHideSet(), { kind: 'not-jobs-list' });
    expect(ready.status).toEqual({
      kind: 'elsewhere',
      text: 'Open a Jobs search to hide cards',
    });
  });

  test('a failed report says the list could not be checked', () => {
    const ready = readyPopup(defaultHideSet(), { kind: 'failed' });
    expect(ready.status).toEqual({ kind: 'failed', text: 'The list could not be checked' });
  });

  test('a missing report has no status sentence', () => {
    const ready = readyPopup(defaultHideSet(), undefined);
    expect(ready.status).toEqual({ kind: 'pending' });
    expect('text' in ready.status).toBe(false);
  });
});

describe('shouldMarkHidden', () => {
  test('is false off a jobs list, true for a selected applied card, and false when the set is empty', () => {
    const selected = defaultHideSet();
    const empty = withKind(selected, 'applied', false);
    const applied = { applied: true };

    expect(shouldMarkHidden(false, selected, applied)).toBe(false);
    expect(shouldMarkHidden(true, selected, applied)).toBe(true);
    expect(shouldMarkHidden(true, empty, applied)).toBe(false);
  });
});
