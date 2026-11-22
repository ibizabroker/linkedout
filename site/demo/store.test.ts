import { describe, expect, test } from 'bun:test';
import { createDemoStore, type DemoStore } from './store';
import { jobViews, tally } from './state';

const HIDE_SET = 'linkedout/hide-set/replace';
const LIMIT = 'linkedout/applicant-limit/replace';
const BLOCK = 'linkedout/blocklist/block';
const UNBLOCK = 'linkedout/blocklist/unblock';
const TRACKER = 'linkedout/tracker';

function newStore(): DemoStore {
  return createDemoStore({ connectDelayMs: 0, now: () => Date.UTC(2026, 10, 21, 9, 30, 0) });
}

async function send(store: DemoStore, message: unknown): Promise<unknown> {
  const reply = store.handleMessage(message);
  if (reply === undefined) {
    throw new Error('message not handled');
  }
  return reply;
}

function hideKinds(store: DemoStore, kinds: readonly string[]): Promise<unknown> {
  return send(store, { type: HIDE_SET, document: { version: 1, kinds } });
}

function limit(store: DemoStore, enabled: boolean, max: number): Promise<unknown> {
  return send(store, { type: LIMIT, document: { version: 1, enabled, max } });
}

function hiddenIds(store: DemoStore): string[] {
  return jobViews(store.getState())
    .filter((job) => job.hidden)
    .map((job) => job.id);
}

function reportedCount(store: DemoStore): Promise<number | undefined> {
  return new Promise((resolve) => {
    const handle = store.openPageReport((message) => {
      handle.close();
      resolve((message as { hiddenCount?: number }).hiddenCount);
    });
  });
}

describe('start state', () => {
  test('shows every job with every switch off, nothing blocked and the tracker disconnected', () => {
    const store = newStore();
    expect(hiddenIds(store)).toEqual([]);
    expect(tally(store.getState()).total).toBe(12);
    const stored = store.storage();
    expect(stored['hide-set']).toEqual({ version: 1, kinds: [] });
    expect(stored['applicant-limit']).toEqual({ version: 1, enabled: false, max: 100 });
    expect(stored.blocklist).toEqual({ version: 1, entries: [] });
    expect(stored.tracker).toEqual({ version: 2, sheet: null, connectedAt: null });
    expect(store.getState().rows).toEqual([]);
  });
});

describe('hiding', () => {
  test('each switch hides the cards that carry its badge', async () => {
    const store = newStore();
    await hideKinds(store, ['applied']);
    expect(hiddenIds(store)).toEqual(['4102', '4106', '4110']);
    await hideKinds(store, ['viewed']);
    expect(hiddenIds(store)).toEqual(['4101', '4107', '4111', '4112']);
    await hideKinds(store, ['saved']);
    expect(hiddenIds(store)).toEqual(['4104', '4111']);
    await hideKinds(store, ['reposted']);
    expect(hiddenIds(store)).toEqual(['4105', '4109']);
  });

  test('switches combine and turning them off shows the cards again', async () => {
    const store = newStore();
    await hideKinds(store, ['applied', 'reposted']);
    expect(hiddenIds(store)).toEqual(['4102', '4105', '4106', '4109', '4110']);
    await hideKinds(store, []);
    expect(hiddenIds(store)).toEqual([]);
  });

  test('the applicant limit hides jobs over the maximum only while enabled', async () => {
    const store = newStore();
    await limit(store, false, 100);
    expect(hiddenIds(store)).toEqual([]);
    await limit(store, true, 500);
    expect(hiddenIds(store)).toEqual(['4103', '4105', '4107', '4109', '4112']);
    await limit(store, true, 1500);
    expect(hiddenIds(store)).toEqual(['4103']);
    await limit(store, true, 25);
    expect(hiddenIds(store)).toContain('4101');
    expect(hiddenIds(store)).not.toContain('4108');
  });

  test('a preview from the page report port applies until the stored limit changes', async () => {
    const store = newStore();
    await limit(store, true, 1500);
    const handle = store.openPageReport(() => undefined);
    handle.receive({ type: 'preview-limit', document: { version: 1, enabled: true, max: 100 } });
    expect(hiddenIds(store).length).toBe(8);
    await limit(store, true, 1500);
    expect(hiddenIds(store)).toEqual(['4103']);
  });

  test('closing the port drops the preview', async () => {
    const store = newStore();
    const handle = store.openPageReport(() => undefined);
    handle.receive({ type: 'preview-limit', document: { version: 1, enabled: true, max: 10 } });
    expect(hiddenIds(store).length).toBe(11);
    handle.close();
    expect(hiddenIds(store)).toEqual([]);
  });

  test('the page report posts the live hidden count', async () => {
    const store = newStore();
    const seen: unknown[] = [];
    store.openPageReport((message) => seen.push(message));
    await Promise.resolve();
    await hideKinds(store, ['applied']);
    expect(seen).toEqual([
      { kind: 'jobs-list', hiddenCount: 0, repostPaused: false },
      { kind: 'jobs-list', hiddenCount: 3, repostPaused: false },
    ]);
    expect(await reportedCount(store)).toBe(3);
  });

  test('storage watchers hear which keys changed', async () => {
    const store = newStore();
    const heard: string[] = [];
    store.watchStorage((changes) => heard.push(...Object.keys(changes)));
    await hideKinds(store, ['saved']);
    expect(heard).toEqual(['hide-set']);
  });

  test('a rejected document changes nothing', async () => {
    const store = newStore();
    let failed = false;
    await hideKinds(store, ['nonsense']).catch(() => {
      failed = true;
    });
    expect(failed).toBe(true);
    expect(store.storage()['hide-set']).toEqual({ version: 1, kinds: [] });
  });
});

describe('blocking', () => {
  test('blocking a company hides all of its jobs and lists it in storage', async () => {
    const store = newStore();
    expect(await send(store, { type: BLOCK, name: 'Brightpath Staffing' })).toBe(true);
    expect(hiddenIds(store)).toEqual(['4103', '4105', '4112']);
    const stored = store.storage().blocklist as { entries: { name: string }[] };
    expect(stored.entries.map((entry) => entry.name)).toEqual(['Brightpath Staffing']);
  });

  test('blocking matches the company name ignoring case and spacing', async () => {
    const store = newStore();
    await send(store, { type: BLOCK, name: '  northgate   TALENT partners ' });
    expect(hiddenIds(store)).toEqual(['4107', '4109']);
  });

  test('unblocking brings the jobs back', async () => {
    const store = newStore();
    await send(store, { type: BLOCK, name: 'Northgate Talent Partners' });
    await send(store, { type: UNBLOCK, name: 'Northgate Talent Partners' });
    expect(hiddenIds(store)).toEqual([]);
    expect(store.storage().blocklist).toEqual({ version: 1, entries: [] });
  });

  test('a blank name is rejected', async () => {
    const store = newStore();
    let failed = false;
    await send(store, { type: BLOCK, name: '  ' }).catch(() => {
      failed = true;
    });
    expect(failed).toBe(true);
  });
});

describe('applying', () => {
  test('applying gives the job the Applied badge and hides it when Applied is on', async () => {
    const store = newStore();
    await hideKinds(store, ['applied']);
    store.apply('4108');
    const job = jobViews(store.getState()).find((view) => view.id === '4108');
    expect(job?.applied).toBe(true);
    expect(job?.hidden).toBe(true);
  });

  test('without the tracker no sheet row is added', () => {
    const store = newStore();
    store.apply('4108');
    expect(store.getState().rows).toEqual([]);
    expect(store.storage()['tracker-written']).toEqual({ version: 1, jobIds: [] });
  });

  test('with the tracker connected a row lands in the sheet and Tracked grows', async () => {
    const store = newStore();
    await send(store, { type: TRACKER, action: 'connect' });
    store.apply('4108');
    const [entry] = store.getState().rows;
    expect(entry?.row[1]).toBe('Quillworks');
    expect(entry?.row[2]).toBe('Customer Success Manager');
    expect(entry?.row[3]).toBe('Applied');
    expect(entry?.row[6]).toBe('Easy Apply');
    expect(entry?.row[0]).toBe('2026-11-21 09:30:00');
    expect(store.storage()['tracker-written']).toEqual({ version: 1, jobIds: ['4108'] });
  });

  test('applying twice adds one row', async () => {
    const store = newStore();
    await send(store, { type: TRACKER, action: 'connect' });
    store.apply('4108');
    store.apply('4108');
    expect(store.getState().rows.length).toBe(1);
  });

  test('a job that was already applied adds no row', async () => {
    const store = newStore();
    await send(store, { type: TRACKER, action: 'connect' });
    store.apply('4102');
    expect(store.getState().rows).toEqual([]);
  });

  test('the Status dropdown rewrites the Status cell of that row', async () => {
    const store = newStore();
    await send(store, { type: TRACKER, action: 'connect' });
    store.apply('4108');
    store.apply('4104');
    store.setRowStatus('4108', 'Interviewing');
    const statuses = store.getState().rows.map((entry) => entry.row[3]);
    expect(statuses).toEqual(['Interviewing', 'Applied']);
  });
});

describe('tracker', () => {
  test('connect finishes with a sheet whose url matches its id', async () => {
    const store = newStore();
    const reply = (await send(store, { type: TRACKER, action: 'connect' })) as {
      status: string;
      sheet: { spreadsheetId: string; url: string };
    };
    expect(reply.status).toBe('done');
    expect(reply.sheet.spreadsheetId).toBe('demo');
    expect(reply.sheet.url).toBe('https://docs.google.com/spreadsheets/d/demo/edit');
    const stored = store.storage().tracker as { version: number; connectedAt: number };
    expect(stored.version).toBe(2);
    expect(stored.connectedAt).toBe(Date.UTC(2026, 10, 21, 9, 30, 0));
  });

  test('connect waits before it connects', async () => {
    const store = createDemoStore({ connectDelayMs: 30 });
    const pending = send(store, { type: TRACKER, action: 'connect' });
    expect(store.getState().connection).toBe(null);
    await pending;
    expect(store.getState().connection === null).toBe(false);
  });

  test('disconnect clears the connection and the tracked count but keeps the sheet rows', async () => {
    const store = newStore();
    await send(store, { type: TRACKER, action: 'connect' });
    store.apply('4108');
    const reply = await send(store, { type: TRACKER, action: 'disconnect' });
    expect(reply).toEqual({ status: 'done', sheet: null });
    expect(store.storage().tracker).toEqual({ version: 2, sheet: null, connectedAt: null });
    expect(store.storage()['tracker-written']).toEqual({ version: 1, jobIds: [] });
    expect(store.getState().rows.length).toBe(1);
  });

  test('applying after a disconnect adds no row', async () => {
    const store = newStore();
    await send(store, { type: TRACKER, action: 'connect' });
    await send(store, { type: TRACKER, action: 'disconnect' });
    store.apply('4108');
    expect(store.getState().rows).toEqual([]);
  });

  test('reconnect and recreate need a connection, check always reads ok', async () => {
    const store = newStore();
    expect(await send(store, { type: TRACKER, action: 'reconnect' })).toEqual({ status: 'failed' });
    expect(await send(store, { type: TRACKER, action: 'recreate' })).toEqual({ status: 'failed' });
    expect(await send(store, { type: TRACKER, action: 'check' })).toEqual({ status: 'ok' });
    await send(store, { type: TRACKER, action: 'connect' });
    store.apply('4108');
    const reply = (await send(store, { type: TRACKER, action: 'recreate' })) as { status: string };
    expect(reply.status).toBe('done');
    expect(store.storage()['tracker-written']).toEqual({ version: 1, jobIds: [] });
  });

  test('messages the demo does not own are left unanswered', () => {
    const store = newStore();
    expect(store.handleMessage({ type: 'something/else' })).toBeUndefined();
    expect(store.handleMessage('text')).toBeUndefined();
  });
});

describe('tally', () => {
  const struckSegments = (store: DemoStore): string[] => {
    const t = tally(store.getState());
    return (['applied', 'viewed', 'saved', 'reposted', 'agencies', 'overLimit'] as const).filter(
      (key) => t[key].cleared,
    );
  };

  test('counts each category on its own, so a job can sit in several', () => {
    const store = newStore();
    expect(tally(store.getState())).toEqual({
      total: 12,
      visible: 12,
      applied: { count: 3, cleared: false },
      viewed: { count: 4, cleared: false },
      saved: { count: 2, cleared: false },
      reposted: { count: 2, cleared: false },
      agencies: { count: 5, cleared: false },
      overLimit: { count: 0, cleared: false },
    });
  });

  test('a switch strikes only its own segment', async () => {
    const store = newStore();
    await hideKinds(store, ['applied']);
    expect(struckSegments(store)).toEqual(['applied']);
    await hideKinds(store, ['applied', 'saved']);
    expect(struckSegments(store)).toEqual(['applied', 'saved']);
    await hideKinds(store, []);
    expect(struckSegments(store)).toEqual([]);
  });

  test('still showing equals the visible cards', async () => {
    const store = newStore();
    await hideKinds(store, ['applied', 'viewed']);
    const visible = jobViews(store.getState()).filter((job) => !job.hidden).length;
    expect(tally(store.getState()).visible).toBe(visible);
    expect(visible).toBe(12 - hiddenIds(store).length);
  });

  test('agencies clear once every agency is blocked', async () => {
    const store = newStore();
    await send(store, { type: BLOCK, name: 'Brightpath Staffing' });
    expect(tally(store.getState()).agencies.cleared).toBe(false);
    await send(store, { type: BLOCK, name: 'Northgate Talent Partners' });
    const blocked = tally(store.getState());
    expect(blocked.agencies).toEqual({ count: 5, cleared: true });
    expect(blocked.visible).toBe(7);
  });

  test('the over-limit segment follows the limit', async () => {
    const store = newStore();
    await limit(store, true, 500);
    expect(tally(store.getState()).overLimit).toEqual({ count: 5, cleared: true });
    await limit(store, false, 500);
    expect(tally(store.getState()).overLimit.count).toBe(0);
  });

  test('applying to a job adds it to the applied segment', () => {
    const store = newStore();
    store.apply('4108');
    expect(tally(store.getState()).applied.count).toBe(4);
  });
});

describe('opened tabs and first switch', () => {
  test('tabs are remembered in the order they were opened', () => {
    const store = newStore();
    expect(store.getState().openedTabs).toEqual(['jobs']);
    store.setTab('sheet');
    store.setTab('jobs');
    store.setTab('settings');
    store.setTab('sheet');
    expect(store.getState().openedTabs).toEqual(['jobs', 'sheet', 'settings']);
    store.reset();
    expect(store.getState().openedTabs).toEqual(['jobs']);
  });

  test('the first change to a switch or the limit is remembered until reset', async () => {
    const store = newStore();
    expect(store.getState().switched).toBe(false);
    await block(store);
    expect(store.getState().switched).toBe(false);
    await hideKinds(store, ['applied']);
    await hideKinds(store, []);
    expect(store.getState().switched).toBe(true);
    store.reset();
    expect(store.getState().switched).toBe(false);
    await limit(store, true, 50);
    expect(store.getState().switched).toBe(true);
  });
});

function block(store: DemoStore): Promise<unknown> {
  return send(store, { type: BLOCK, name: 'Quillworks' });
}

describe('tabs and reset', () => {
  test('tab changes are shared state', () => {
    const store = newStore();
    store.setTab('settings');
    expect(store.getState().tab).toBe('settings');
    store.setTab('sheet');
    expect(store.getState().tab).toBe('sheet');
  });

  test('reset returns every part of the demo to the start state', async () => {
    const store = newStore();
    await hideKinds(store, ['applied', 'viewed']);
    await limit(store, true, 50);
    await send(store, { type: BLOCK, name: 'Quillworks' });
    await send(store, { type: TRACKER, action: 'connect' });
    store.apply('4108');
    store.setTab('sheet');
    store.reset();
    expect(hiddenIds(store)).toEqual([]);
    expect(store.getState().tab).toBe('jobs');
    expect(store.getState().rows).toEqual([]);
    expect(store.storage()).toEqual(newStore().storage());
    expect(jobViews(store.getState()).find((job) => job.id === '4108')?.applied).toBe(false);
  });

  test('reset tells storage watchers what changed', async () => {
    const store = newStore();
    await hideKinds(store, ['applied']);
    const heard: string[] = [];
    store.watchStorage((changes) => heard.push(...Object.keys(changes)));
    store.reset();
    expect(heard).toEqual(['hide-set']);
  });

  test('a connect that finishes after a reset is cancelled', async () => {
    const store = createDemoStore({ connectDelayMs: 20 });
    const pending = send(store, { type: TRACKER, action: 'connect' });
    store.reset();
    expect(await pending).toEqual({ status: 'cancelled' });
    expect(store.getState().connection).toBe(null);
  });
});
