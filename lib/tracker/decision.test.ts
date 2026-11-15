import { describe, expect, test } from 'bun:test';
import { MAX_APPLICATION_AGE_MS, decideApplication } from './decision.ts';
import type { JobFacts } from './job-facts.ts';

const NOW = 1_800_000_000_000;
const CONNECTED_AT = NOW - 3_600_000;

const applied: JobFacts = {
  jobId: '1',
  applied: true,
  appliedAt: NOW - 60_000,
  onsiteApply: true,
  title: 't',
  company: 'c',
  location: 'l',
  workplace: null,
  reposted: false,
  applicants: null,
};

function decide(overrides: {
  connectedAt?: number | null;
  known?: boolean;
  facts?: Partial<JobFacts>;
}) {
  return decideApplication({
    connectedAt: overrides.connectedAt === undefined ? CONNECTED_AT : overrides.connectedAt,
    known: overrides.known ?? false,
    facts: { ...applied, ...overrides.facts },
    now: NOW,
  });
}

describe('which applications are recorded', () => {
  test('a fresh application made after connecting is recorded with its time', () => {
    expect(decide({})).toEqual({ kind: 'record', appliedAt: NOW - 60_000 });
  });

  test('nothing is recorded while the tracker is not connected', () => {
    expect(decide({ connectedAt: null })).toEqual({ kind: 'skip', reason: 'not-connected' });
  });

  test('a job already written or queued is skipped', () => {
    expect(decide({ known: true })).toEqual({ kind: 'skip', reason: 'already-known' });
  });

  test('a job LinkedIn does not report as applied is skipped', () => {
    expect(decide({ facts: { applied: false } })).toEqual({ kind: 'skip', reason: 'not-applied' });
    expect(decide({ facts: { appliedAt: null } })).toEqual({ kind: 'skip', reason: 'not-applied' });
  });

  test('an application from before the tracker connected is skipped', () => {
    const connectedAt = NOW - 600_000;
    expect(decide({ connectedAt, facts: { appliedAt: connectedAt - 1 } })).toEqual({
      kind: 'skip',
      reason: 'before-connect',
    });
    expect(decide({ connectedAt, facts: { appliedAt: connectedAt } })).toEqual({
      kind: 'record',
      appliedAt: connectedAt,
    });
  });

  test('an application older than 30 minutes is skipped, exactly 30 is kept', () => {
    const old = NOW - MAX_APPLICATION_AGE_MS - 1;
    expect(decide({ facts: { appliedAt: old } })).toEqual({ kind: 'skip', reason: 'too-old' });
    expect(decide({ facts: { appliedAt: old + 1 } }).kind).toBe('record');
  });
});
