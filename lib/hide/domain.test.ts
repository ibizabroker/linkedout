import { describe, expect, test } from 'bun:test';
import {
  defaultHideSet,
  emptyHideSet,
  hasKind,
  parseReplaceDocument,
  parseStoredHideSet,
  readyPopup,
  shouldMarkHidden,
  textIsLeafBadge,
  withKind,
} from './domain.ts';

describe('parseStoredHideSet', () => {
  test('a missing value includes applied and viewed', () => {
    const parsed = parseStoredHideSet(undefined);
    expect(parsed.status).toBe('ready');
    if (parsed.status !== 'ready') {
      return;
    }
    expect(hasKind(parsed.set, 'applied')).toBe(true);
    expect(hasKind(parsed.set, 'viewed')).toBe(true);
  });

  test('a saved applied-only choice stays applied-only', () => {
    const parsed = parseStoredHideSet({ version: 1, kinds: ['applied'] });
    expect(parsed.status).toBe('ready');
    if (parsed.status !== 'ready') {
      return;
    }
    expect(parsed.set.kinds).toEqual(['applied']);
    expect(hasKind(parsed.set, 'viewed')).toBe(false);
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
    expect(parseReplaceDocument({ version: 1, kinds: ['saved'] })).toBeUndefined();
    expect(parseReplaceDocument({ version: 1, kinds: ['applied', 'dismissed'] })).toBeUndefined();
  });

  test('accepts an empty kind list as a clear', () => {
    expect(parseReplaceDocument({ version: 1, kinds: [] })?.kinds).toEqual([]);
  });
});

describe('withKind', () => {
  test('is idempotent', () => {
    const selected = defaultHideSet();
    expect(withKind(selected, 'applied', true).kinds).toEqual(['applied', 'viewed']);
    expect(selected.kinds).toEqual(['applied', 'viewed']);

    const cleared = withKind(withKind(selected, 'applied', false), 'viewed', false);
    expect(cleared.kinds).toEqual([]);
    expect(withKind(cleared, 'applied', false).kinds).toEqual([]);
    expect(withKind(cleared, 'viewed', true).kinds).toEqual(['viewed']);
    expect(withKind(withKind(cleared, 'viewed', true), 'applied', true).kinds).toEqual([
      'applied',
      'viewed',
    ]);
  });
});

describe('readyPopup', () => {
  test('names the trigger, the hiding sentence, and the count', () => {
    const ready = readyPopup(defaultHideSet(), { kind: 'jobs-list', hiddenCount: 2 });
    expect(ready.triggerLabel).toBe('Applied, Viewed');
    expect(ready.status).toEqual({ kind: 'hiding', text: '2 cards hidden on this list' });
  });

  test('a single hidden card is singular', () => {
    const ready = readyPopup(defaultHideSet(), { kind: 'jobs-list', hiddenCount: 1 });
    expect(ready.status).toEqual({ kind: 'hiding', text: '1 card hidden on this list' });
  });

  test('no hidden cards says there is nothing to hide', () => {
    const ready = readyPopup(defaultHideSet(), { kind: 'jobs-list', hiddenCount: 0 });
    expect(ready.status).toEqual({ kind: 'hiding', text: 'No cards to hide on this list' });
  });

  test('an empty set on a jobs list says every card is showing', () => {
    const ready = readyPopup(emptyHideSet(), { kind: 'jobs-list', hiddenCount: 4 });
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
    expect(ready.status).toEqual({
      kind: 'failed',
      text: 'Could not check this list. Reload the tab.',
    });
  });

  test('a missing report has no status sentence', () => {
    const ready = readyPopup(defaultHideSet(), undefined);
    expect(ready.status).toEqual({ kind: 'pending' });
    expect('text' in ready.status).toBe(false);
  });

  test('clearing only Applied leaves Viewed in the trigger', () => {
    const ready = readyPopup(withKind(defaultHideSet(), 'applied', false), undefined);
    expect(ready.triggerLabel).toBe('Viewed');
  });

  test('an empty set reads Nothing hidden with both rows unchecked', () => {
    const ready = readyPopup(emptyHideSet(), undefined);
    expect(ready.triggerLabel).toBe('Nothing hidden');
    expect(ready.menu).toEqual([
      { kind: 'applied', label: 'Applied', checked: false },
      { kind: 'viewed', label: 'Viewed', checked: false },
    ]);
  });
});

describe('shouldMarkHidden', () => {
  const both = defaultHideSet();
  const appliedOnly = withKind(both, 'viewed', false);
  const viewedOnly = withKind(both, 'applied', false);
  const applied = { applied: true, viewed: false };
  const viewed = { applied: false, viewed: true };

  test('is false off a jobs list', () => {
    expect(shouldMarkHidden(false, both, applied)).toBe(false);
    expect(shouldMarkHidden(false, both, viewed)).toBe(false);
  });

  test('hides a selected applied card and not one when the set is empty', () => {
    expect(shouldMarkHidden(true, both, applied)).toBe(true);
    expect(shouldMarkHidden(true, appliedOnly, applied)).toBe(true);
    expect(shouldMarkHidden(true, emptyHideSet(), applied)).toBe(false);
  });

  test('hides a viewed card only when viewed is selected', () => {
    expect(shouldMarkHidden(true, both, viewed)).toBe(true);
    expect(shouldMarkHidden(true, viewedOnly, viewed)).toBe(true);
    expect(shouldMarkHidden(true, appliedOnly, viewed)).toBe(false);
  });

  test('keeps an applied card when only viewed is selected', () => {
    expect(shouldMarkHidden(true, viewedOnly, applied)).toBe(false);
  });
});

describe('textIsLeafBadge', () => {
  test('accepts exactly Viewed after trimming', () => {
    expect(textIsLeafBadge('Viewed', [], 'Viewed')).toBe(true);
    expect(textIsLeafBadge('  Viewed\n', [], 'Viewed')).toBe(true);
  });

  test('rejects other casing, longer text, and localized labels', () => {
    expect(textIsLeafBadge('viewed', [], 'Viewed')).toBe(false);
    expect(textIsLeafBadge('Viewed 2 days ago', [], 'Viewed')).toBe(false);
    expect(textIsLeafBadge('Visto', [], 'Viewed')).toBe(false);
  });

  test('rejects a wrapper whose child already carries the badge', () => {
    expect(textIsLeafBadge('Viewed', ['Viewed'], 'Viewed')).toBe(false);
  });
});
