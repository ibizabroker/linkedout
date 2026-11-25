import { describe, expect, test } from 'bun:test';
import { compareToAverage } from './comparison';

describe('Comparison with the average', () => {
  test('says how many times the average a high bar is', () => {
    expect(compareToAverage(4, 2.2)).toBe('1.8× your average');
  });

  test('says how far below the average a low bar is', () => {
    expect(compareToAverage(1, 1.25)).toBe('20% below average');
  });

  test('says nothing when there is no average', () => {
    expect(compareToAverage(0, 0)).toBeUndefined();
  });
});
