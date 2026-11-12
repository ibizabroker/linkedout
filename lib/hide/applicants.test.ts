import { describe, expect, test } from 'bun:test';
import {
  exceedsLimit,
  nearestStop,
  offLimit,
  parseLimitDocument,
  parseStoredLimit,
  parseTypedMax,
  serializeLimit,
  stopIndex,
} from './applicants.ts';

const on = (max: number) => ({ enabled: true, max });

describe('exceedsLimit', () => {
  test('hides only counts above the limit', () => {
    expect(exceedsLimit(201, on(200))).toBe(true);
    expect(exceedsLimit(200, on(200))).toBe(false);
    expect(exceedsLimit(3, on(200))).toBe(false);
  });

  test('unknown counts stay visible', () => {
    expect(exceedsLimit(undefined, on(10))).toBe(false);
  });

  test('a disabled limit hides nothing', () => {
    expect(exceedsLimit(5000, { enabled: false, max: 10 })).toBe(false);
  });

  test('over 100 hides only below a limit of 100', () => {
    expect(exceedsLimit('over-100', on(99))).toBe(true);
    expect(exceedsLimit('over-100', on(100))).toBe(false);
    expect(exceedsLimit('over-100', on(200))).toBe(false);
  });
});

describe('storage document', () => {
  test('missing is off at the default', () => {
    expect(parseStoredLimit(undefined)).toEqual({ status: 'ready', limit: offLimit() });
    expect(offLimit().max).toBe(100);
  });

  test('round trips', () => {
    const limit = on(250);
    expect(parseLimitDocument(serializeLimit(limit))).toEqual(limit);
  });

  test('rejects bad versions, shapes, and out of range values', () => {
    for (const bad of [
      { version: 2, enabled: true, max: 100 },
      { version: 1, enabled: 'yes', max: 100 },
      { version: 1, enabled: true, max: 0 },
      { version: 1, enabled: true, max: 2001 },
      { version: 1, enabled: true, max: 10.5 },
      { version: 1, enabled: true },
      null,
      [],
      'x',
    ]) {
      expect(parseLimitDocument(bad)).toBeUndefined();
    }
    expect(parseStoredLimit({ version: 9 })).toEqual({ status: 'unreadable' });
  });
});

describe('slider and number box', () => {
  test('off-stop values show the nearest stop', () => {
    expect(nearestStop(10)).toBe(10);
    expect(nearestStop(1)).toBe(10);
    expect(nearestStop(60)).toBe(50);
    expect(nearestStop(2000)).toBe(2000);
    expect(nearestStop(1700)).toBe(1500);
    expect(stopIndex(100)).toBe(4);
  });

  test('typed values accept whole numbers 1 to 2000', () => {
    expect(parseTypedMax('1')).toBe(1);
    expect(parseTypedMax(' 2000 ')).toBe(2000);
    expect(parseTypedMax('0')).toBeUndefined();
    expect(parseTypedMax('2001')).toBeUndefined();
    expect(parseTypedMax('1.5')).toBeUndefined();
    expect(parseTypedMax('')).toBeUndefined();
    expect(parseTypedMax('-3')).toBeUndefined();
  });
});
