declare module 'bun:test' {
  export function describe(name: string, fn: () => void): void;
  export function test(name: string, fn: () => void | Promise<void>): void;

  type Matcher = {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toBeUndefined(): void;
    toContain(expected: unknown): void;
  };

  export function expect(actual: unknown): Matcher & { readonly not: Matcher };
}
