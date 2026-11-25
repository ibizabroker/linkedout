import { describe, expect, test } from 'bun:test';
import { scaleFor } from './scale';

const month = [0, 2, 1, 3, 0, 4, 2, 1, 0, 3, 2, 5, 1, 0, 2];

describe('Chart scale', () => {
  test('caps the axis when one value dwarfs the rest', () => {
    const scale = scaleFor([...month, 1, 100]);
    expect(scale.capped).toBe(true);
    expect(scale.top).toBe(7);
    expect(scale.ticks.every((tick) => tick <= scale.top)).toBe(true);
  });

  test('keeps a floor of 4 on a capped axis', () => {
    expect(scaleFor([1, 1, 30]).top).toBe(4);
  });

  test('stays linear for an ordinary month and reaches the tallest bar', () => {
    const scale = scaleFor(month);
    expect(scale.capped).toBe(false);
    expect(scale.top >= 5).toBe(true);
    expect(scale.ticks.at(-1)).toBe(scale.top);
  });

  test('does not cap a small spike that fits on a linear axis', () => {
    const scale = scaleFor([0, 1, 6]);
    expect(scale.capped).toBe(false);
    expect(scale.top >= 6).toBe(true);
  });

  test('does not cap when only one bar is above zero', () => {
    expect(scaleFor([0, 0, 9]).capped).toBe(false);
  });

  test('handles an empty chart', () => {
    const scale = scaleFor([0, 0, 0]);
    expect(scale.capped).toBe(false);
    expect(scale.top).toBe(1);
  });

  test('only offers whole-number ticks', () => {
    expect(scaleFor([1, 2]).ticks.every(Number.isInteger)).toBe(true);
  });
});
