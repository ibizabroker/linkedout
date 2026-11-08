import { describe, expect, test } from 'bun:test';
import { emptyBlocklist, withBlocked } from '@/lib/block/domain';
import {
  defaultHideSet,
  emptyHideSet,
  hasKind,
  hideRules,
  jobsListReport,
  parseReplaceDocument,
  parseStoredHideSet,
  readyPopup,
  shouldMarkHidden,
  textIsLeafBadge,
  withKind,
  type HideSet,
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

  test('a missing value does not include saved', () => {
    const parsed = parseStoredHideSet(undefined);
    expect(parsed.status).toBe('ready');
    if (parsed.status !== 'ready') {
      return;
    }
    expect(hasKind(parsed.set, 'saved')).toBe(false);
  });

  test('a stored applied and viewed choice stays without saved', () => {
    const parsed = parseStoredHideSet({ version: 1, kinds: ['applied', 'viewed'] });
    expect(parsed.status).toBe('ready');
    if (parsed.status !== 'ready') {
      return;
    }
    expect(parsed.set.kinds).toEqual(['applied', 'viewed']);
    expect(hasKind(parsed.set, 'saved')).toBe(false);
  });

  test('a stored choice with saved keeps it', () => {
    const parsed = parseStoredHideSet({ version: 1, kinds: ['applied', 'saved'] });
    expect(parsed.status).toBe('ready');
    if (parsed.status !== 'ready') {
      return;
    }
    expect(parsed.set.kinds).toEqual(['applied', 'saved']);
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
    expect(parseReplaceDocument({ version: 1, kinds: ['dismissed'] })).toBeUndefined();
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
    const ready = readyPopup(emptyHideSet(), { kind: 'jobs-list', hiddenCount: 0 });
    expect(ready.triggerLabel).toBe('Nothing hidden');
    expect(ready.status).toEqual({ kind: 'showing', text: 'Showing every card' });
  });

  test('an empty set with blocked cards hidden reports the count', () => {
    const ready = readyPopup(emptyHideSet(), jobsListReport(3));
    expect(ready.status).toEqual({ kind: 'hiding', text: '3 cards hidden on this list' });
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

  test('a default set trigger still reads Applied, Viewed', () => {
    expect(readyPopup(defaultHideSet(), undefined).triggerLabel).toBe('Applied, Viewed');
  });

  test('the trigger lists Saved last when every row is on', () => {
    const all = withKind(defaultHideSet(), 'saved', true);
    expect(readyPopup(all, undefined).triggerLabel).toBe('Applied, Viewed, Saved');
  });

  test('an empty set reads Nothing hidden with all rows unchecked', () => {
    const ready = readyPopup(emptyHideSet(), undefined);
    expect(ready.triggerLabel).toBe('Nothing hidden');
    expect(ready.menu).toEqual([
      { kind: 'applied', label: 'Applied', checked: false },
      { kind: 'viewed', label: 'Viewed', checked: false },
      { kind: 'saved', label: 'Saved', checked: false },
    ]);
  });
});

describe('shouldMarkHidden', () => {
  const both = defaultHideSet();
  const appliedOnly = withKind(both, 'viewed', false);
  const viewedOnly = withKind(both, 'applied', false);
  const savedOnly = withKind(emptyHideSet(), 'saved', true);
  const applied = { applied: true, viewed: false, saved: false };
  const viewed = { applied: false, viewed: true, saved: false };
  const saved = { applied: false, viewed: false, saved: true };

  const rules = (set: HideSet) => ({ set, blocklist: emptyBlocklist() });
  const card = (badges: typeof applied, company?: string) => ({ badges, company });
  const none = { applied: false, viewed: false, saved: false };
  const cbre = withBlocked(emptyBlocklist(), 'CBRE', 1);
  const blockedRules = (set = emptyHideSet()) => ({ set, blocklist: cbre });

  test('hides a blocked company with an empty hide set', () => {
    expect(shouldMarkHidden(true, blockedRules(), card(none, 'CBRE'))).toBe(true);
  });

  test('hides a blocked company when the set is non-empty and no badge matches', () => {
    expect(shouldMarkHidden(true, blockedRules(both), card(none, 'CBRE'))).toBe(true);
  });

  test('blocking Amazon leaves Amazon Web Services visible', () => {
    const amazon = { set: emptyHideSet(), blocklist: withBlocked(emptyBlocklist(), 'Amazon', 1) };
    expect(shouldMarkHidden(true, amazon, card(none, 'Amazon Web Services (AWS)'))).toBe(false);
    expect(shouldMarkHidden(true, amazon, card(none, 'Amazon'))).toBe(true);
  });

  test('the company match ignores case and surrounding whitespace', () => {
    expect(shouldMarkHidden(true, blockedRules(), card(none, '  cbre '))).toBe(true);
  });

  test('a card with no company and no matching badge stays visible', () => {
    expect(shouldMarkHidden(true, blockedRules(both), card(none))).toBe(false);
  });

  test('a blocked company stays visible off a jobs list', () => {
    expect(shouldMarkHidden(false, blockedRules(), card(none, 'CBRE'))).toBe(false);
  });

  test('an unreadable hide set hides a blocked card but not an applied card', () => {
    const rulesNow = hideRules({ status: 'unreadable' }, { status: 'ready', list: cbre });
    expect(shouldMarkHidden(true, rulesNow, card(none, 'CBRE'))).toBe(true);
    expect(shouldMarkHidden(true, rulesNow, card(applied, 'Acme'))).toBe(false);
  });

  test('an unreadable blocklist hides an applied card but not a blocked card', () => {
    const rulesNow = hideRules({ status: 'ready', set: both }, { status: 'unreadable' });
    expect(shouldMarkHidden(true, rulesNow, card(applied, 'Acme'))).toBe(true);
    expect(shouldMarkHidden(true, rulesNow, card(none, 'CBRE'))).toBe(false);
  });

  test('is false off a jobs list', () => {
    expect(shouldMarkHidden(false, rules(both), card(applied))).toBe(false);
    expect(shouldMarkHidden(false, rules(both), card(viewed))).toBe(false);
  });

  test('hides a selected applied card and not one when the set is empty', () => {
    expect(shouldMarkHidden(true, rules(both), card(applied))).toBe(true);
    expect(shouldMarkHidden(true, rules(appliedOnly), card(applied))).toBe(true);
    expect(shouldMarkHidden(true, rules(emptyHideSet()), card(applied))).toBe(false);
  });

  test('hides a viewed card only when viewed is selected', () => {
    expect(shouldMarkHidden(true, rules(both), card(viewed))).toBe(true);
    expect(shouldMarkHidden(true, rules(viewedOnly), card(viewed))).toBe(true);
    expect(shouldMarkHidden(true, rules(appliedOnly), card(viewed))).toBe(false);
  });

  test('hides a saved card only when saved is selected', () => {
    expect(shouldMarkHidden(true, rules(both), card(saved))).toBe(false);
    expect(shouldMarkHidden(true, rules(savedOnly), card(saved))).toBe(true);
  });

  test('keeps viewed and applied cards when only saved is selected', () => {
    expect(shouldMarkHidden(true, rules(savedOnly), card(viewed))).toBe(false);
    expect(shouldMarkHidden(true, rules(savedOnly), card(applied))).toBe(false);
  });

  test('keeps an applied card when only viewed is selected', () => {
    expect(shouldMarkHidden(true, rules(viewedOnly), card(applied))).toBe(false);
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

  test('rejects other forms of Saved', () => {
    expect(textIsLeafBadge('saved', [], 'Saved')).toBe(false);
    expect(textIsLeafBadge('Save', [], 'Saved')).toBe(false);
    expect(textIsLeafBadge('Saved 2 days ago', [], 'Saved')).toBe(false);
    expect(textIsLeafBadge('Guardado', [], 'Saved')).toBe(false);
  });

  test('rejects a wrapper whose child already carries the badge', () => {
    expect(textIsLeafBadge('Viewed', ['Viewed'], 'Viewed')).toBe(false);
  });
});
