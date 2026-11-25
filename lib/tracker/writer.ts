import { browser } from 'wxt/browser';
import { addAppliedTime } from '../stats/cache.ts';
import { decideApplication, type Verdict } from './decision.ts';
import { flushOutbox } from './flush.ts';
import { appendRow } from './google.ts';
import type { JobFacts } from './job-facts.ts';
import { enqueue, isKnown, retryDelayMinutes } from './outbox.ts';
import { appliedAtOf, buildRow } from './row.ts';
import { readSnapshot, writeAuthExpired, writeSync } from './snapshot.ts';

export const FLUSH_ALARM = 'linkedout-tracker-flush';

export async function recordApplication(facts: JobFacts, now: number): Promise<Verdict> {
  const { connection, sync } = await readSnapshot();
  const verdict = decideApplication({
    connectedAt: connection?.connectedAt ?? null,
    known: isKnown(sync, facts.jobId),
    facts,
    now,
  });
  if (verdict.kind === 'record') {
    const offset = new Date(verdict.appliedAt).getTimezoneOffset();
    const row = buildRow(facts, verdict.appliedAt, offset);
    await writeSync(enqueue(sync, { jobId: facts.jobId, row }));
  }
  return verdict;
}

export async function flush(): Promise<void> {
  const { connection, sync, authExpired } = await readSnapshot();
  if (connection === null) {
    return;
  }
  if (sync.outbox.length === 0) {
    await browser.alarms.clear(FLUSH_ALARM);
    return;
  }
  const { state, outcome } = await flushOutbox(sync, {
    append: async (row) => {
      const result = await appendRow(connection.sheet, row);
      if (result === 'ok') {
        await addAppliedTime(appliedAtOf(row)).catch(() => undefined);
      }
      return result;
    },
    persist: writeSync,
  });
  if (outcome.kind === 'drained') {
    if (authExpired) {
      await writeAuthExpired(false);
    }
    await browser.alarms.clear(FLUSH_ALARM);
    return;
  }
  if (outcome.reason !== 'error' && authExpired !== (outcome.reason === 'auth-expired')) {
    await writeAuthExpired(outcome.reason === 'auth-expired');
  }
  await browser.alarms.create(FLUSH_ALARM, { delayInMinutes: retryDelayMinutes(state.failures) });
}
