import { describe, expect, test } from 'bun:test';
import { factsMessage, parseFactsMessage } from './facts-message.ts';
import type { JobFacts } from './job-facts.ts';

const facts: JobFacts = {
  jobId: '4480699030',
  applied: true,
  appliedAt: 1794708579385,
  onsiteApply: false,
  title: 'Software Engineer',
  company: 'Mercury',
  location: 'San Francisco, CA',
  workplace: 'Remote',
  reposted: true,
  applicants: 116,
};

describe('facts message', () => {
  test('job facts read back, including a missing time, workplace, and count', () => {
    expect(parseFactsMessage(factsMessage(facts))).toEqual(facts);
    const sparse = { ...facts, appliedAt: null, workplace: null, applicants: null };
    expect(parseFactsMessage(factsMessage(sparse))).toEqual(sparse);
  });

  test('facts with a wrong field are rejected', () => {
    expect(parseFactsMessage(factsMessage({ ...facts, jobId: 'x' }))).toBeUndefined();
    expect(
      parseFactsMessage(factsMessage({ ...facts, workplace: 'Moon' as never })),
    ).toBeUndefined();
    expect(parseFactsMessage(factsMessage({ ...facts, appliedAt: NaN }))).toBeUndefined();
    expect(parseFactsMessage({ type: 'linkedout/tracker/facts' })).toBeUndefined();
  });
});
