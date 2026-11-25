import { describe, expect, test } from 'bun:test';
import { sheetFromId } from './domain.ts';
import { parseActionReply, parseCheckReply, parseRequest, parseStatsReply } from './messages.ts';

describe('tracker requests', () => {
  test('a known action in a tracker message parses', () => {
    expect(parseRequest({ type: 'linkedout/tracker', action: 'recreate' })).toBe('recreate');
  });

  test('other messages and unknown actions are ignored', () => {
    expect(parseRequest({ type: 'linkedout/tracker', action: 'wipe' })).toBeUndefined();
    expect(parseRequest({ type: 'other', action: 'connect' })).toBeUndefined();
    expect(parseRequest(null)).toBeUndefined();
    expect(parseRequest('connect')).toBeUndefined();
  });
});

describe('tracker replies', () => {
  test('an action that finished carries the stored sheet or null', () => {
    const sheet = sheetFromId('abc');
    expect(parseActionReply({ status: 'done', sheet })).toEqual({ status: 'done', sheet });
    expect(parseActionReply({ status: 'done', sheet: null })).toEqual({
      status: 'done',
      sheet: null,
    });
  });

  test('cancel and failure replies parse', () => {
    expect(parseActionReply({ status: 'cancelled' })).toEqual({ status: 'cancelled' });
    expect(parseActionReply({ status: 'failed' })).toEqual({ status: 'failed' });
  });

  test('a done reply with a malformed sheet is rejected', () => {
    expect(
      parseActionReply({ status: 'done', sheet: { spreadsheetId: 'a', url: 'x' } }),
    ).toBeUndefined();
    expect(parseActionReply({ status: 'done' })).toBeUndefined();
    expect(parseActionReply(undefined)).toBeUndefined();
  });

  test('check replies parse to their result', () => {
    expect(parseCheckReply({ status: 'missing' })).toBe('missing');
    expect(parseCheckReply({ status: 'ok' })).toBe('ok');
    expect(parseCheckReply({ status: 'done' })).toBeUndefined();
  });
});

describe('stats refresh', () => {
  test('the refresh request parses', () => {
    expect(parseRequest({ type: 'linkedout/tracker', action: 'refresh-stats' })).toBe(
      'refresh-stats',
    );
  });

  test('a done reply carries the cache, a failed reply nothing', () => {
    const stats = { version: 1, times: [1, 2], readAt: 3 };
    expect(parseStatsReply({ status: 'done', stats })).toEqual({ status: 'done', stats });
    expect(parseStatsReply({ status: 'failed' })).toEqual({ status: 'failed' });
  });

  test('a done reply without a valid cache is rejected', () => {
    expect(parseStatsReply({ status: 'done' })).toBeUndefined();
    expect(parseStatsReply({ status: 'done', stats: { times: [] } })).toBeUndefined();
    expect(parseStatsReply(undefined)).toBeUndefined();
  });
});
