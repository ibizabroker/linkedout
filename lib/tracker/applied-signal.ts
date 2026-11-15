import { JOB_CARD, cardBadges } from '../hide/card-badges.ts';
import { jobIdOf } from '../hide/job-page.ts';

const PANE_APPLIED = /^Applied(?:\s+(?![A-Z])|$)/;
const VIEW_PATH = /^\/jobs\/view\/(\d+)(?:\/|$)/;
const JOB_ID = /^\d+$/;

export function currentJobIdOf(location: { pathname: string; search: string }): string | undefined {
  const viewed = VIEW_PATH.exec(location.pathname)?.[1];
  if (viewed !== undefined) {
    return viewed;
  }
  const current = new URLSearchParams(location.search).get('currentJobId');
  return current !== null && JOB_ID.test(current) ? current : undefined;
}

export function appliedJobIds(
  doc: Document,
  location: { pathname: string; search: string },
  wants: (jobId: string) => boolean = () => true,
): string[] {
  const ids = new Set<string>();
  for (const card of doc.querySelectorAll(JOB_CARD)) {
    const jobId = jobIdOf(card);
    if (jobId !== undefined && wants(jobId) && cardBadges(card).applied) {
      ids.add(jobId);
    }
  }
  const current = currentJobIdOf(location);
  if (current !== undefined && wants(current) && paneSaysApplied(doc)) {
    ids.add(current);
  }
  return [...ids];
}

function paneSaysApplied(doc: Document): boolean {
  for (const node of doc.querySelectorAll('*')) {
    if (
      node.children.length === 0 &&
      PANE_APPLIED.test((node.textContent ?? '').trim()) &&
      node.closest(JOB_CARD) === null
    ) {
      return true;
    }
  }
  return false;
}
