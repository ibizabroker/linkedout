import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { sheetFromId, type TrackerView } from '@/lib/tracker/domain';
import type { UserAction } from '@/lib/tracker/messages';
import { accountStatus } from '@/lib/ui/tracker-session';
import { AccountPane } from './AccountPane';

const sheet = sheetFromId('abc_123', 'LinkedOut Job Tracker');
const sync = { added: 38, waiting: 2, authExpired: false };

function render(
  view: TrackerView,
  pending: UserAction | undefined = undefined,
): string {
  return renderToStaticMarkup(
    <AccountPane session={{ view, act: () => undefined, pending }} />,
  );
}

describe('Account pane', () => {
  test('offers Connect Google Sheets and says what LinkedOut can see when not connected', () => {
    const html = render({ kind: 'disconnected', busy: false });
    expect(html).toContain('Google account');
    expect(html).toContain('Connect Google Sheets');
    expect(html).toContain('can only see that');
    expect(html).not.toContain('Disconnect<');
    expect(html).not.toContain('Open sheet');
  });

  test('shows the connect in progress as a disabled Connecting key', () => {
    const html = render({ kind: 'disconnected', busy: true }, 'connect');
    expect(html).toContain('Connecting…');
    expect(html.includes('disabled=""')).toBe(true);
  });

  test('shows the sheet, the jobs added and Disconnect when connected', () => {
    const html = render({ kind: 'connected', sheet, sync, busy: false });
    expect(html).toContain('Connected');
    expect(html).toContain('LinkedOut Job Tracker');
    expect(html).toContain('aria-label="Open sheet"');
    expect(html).toContain('Jobs added');
    expect(html).toContain('38');
    expect(html).toContain(' · 2 waiting');
    expect(html).toContain('Disconnect');
    expect(html).toContain('The sheet stays in your Drive.');
    expect(html).not.toContain('Reconnect');
    expect(html).not.toContain('Sign-in expired');
  });

  test('puts Reconnect before Disconnect and flags the sign-in when it expired', () => {
    const html = render({
      kind: 'connected',
      sheet,
      sync: { ...sync, authExpired: true },
      busy: false,
    });
    expect(html).toContain('Sign-in expired');
    expect(html.indexOf('Reconnect') >= 0).toBe(true);
    expect(html.indexOf('Reconnect') < html.indexOf('Disconnect')).toBe(true);
  });

  test('offers a new sheet when the sheet was deleted', () => {
    const html = render({ kind: 'missing', sheet, sync, busy: false });
    expect(html).toContain('Not found');
    expect(html).toContain('New sheet');
    expect(html).not.toContain('aria-label="Open sheet"');
    expect(html).toContain('Disconnect');
  });

  test('shows the action that failed under the rows', () => {
    const html = render({
      kind: 'disconnected',
      busy: false,
      error: "Couldn't connect to Google. Try again.",
    });
    expect(html).toContain('role="alert"');
    expect(html).toContain('Couldn&#x27;t connect to Google. Try again.');
  });
});

describe('account status in the navigation', () => {
  test('reads Off, On or Needs you, and nothing without Google settings', () => {
    expect(accountStatus({ kind: 'disconnected', busy: false })).toEqual({
      text: 'Off',
      needsYou: false,
    });
    expect(
      accountStatus({ kind: 'connected', sheet, sync, busy: false }),
    ).toEqual({ text: 'On', needsYou: false });
    expect(
      accountStatus({
        kind: 'connected',
        sheet,
        sync: { ...sync, authExpired: true },
        busy: false,
      }),
    ).toEqual({ text: 'Needs you', needsYou: true });
    expect(
      accountStatus({ kind: 'missing', sheet, sync, busy: false }),
    ).toEqual({ text: 'Needs you', needsYou: true });
    expect(accountStatus({ kind: 'unavailable' })).toBeUndefined();
  });
});
