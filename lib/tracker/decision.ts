import type { JobFacts } from './job-facts.ts';

export const MAX_APPLICATION_AGE_MS = 30 * 60_000;

export type SkipReason =
  | 'not-connected'
  | 'already-known'
  | 'not-applied'
  | 'before-connect'
  | 'too-old';

export type Verdict =
  | { readonly kind: 'record'; readonly appliedAt: number }
  | { readonly kind: 'skip'; readonly reason: SkipReason };

export function decideApplication(input: {
  readonly connectedAt: number | null;
  readonly known: boolean;
  readonly facts: JobFacts;
  readonly now: number;
}): Verdict {
  const { connectedAt, known, facts, now } = input;
  if (connectedAt === null) {
    return skip('not-connected');
  }
  if (known) {
    return skip('already-known');
  }
  if (!facts.applied || facts.appliedAt === null) {
    return skip('not-applied');
  }
  if (facts.appliedAt < connectedAt) {
    return skip('before-connect');
  }
  return now - facts.appliedAt > MAX_APPLICATION_AGE_MS
    ? skip('too-old')
    : { kind: 'record', appliedAt: facts.appliedAt };
}

function skip(reason: SkipReason): Verdict {
  return { kind: 'skip', reason };
}
