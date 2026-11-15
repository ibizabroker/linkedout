import { browser, type Browser } from 'wxt/browser';
import {
  hasKind,
  hideRules,
  jobsListReport,
  notJobsListReport,
  shouldMarkHidden,
  type CardFacts,
  type HideRules,
  type PageReport,
  type StoredHideRead,
} from '@/lib/hide/domain';
import {
  BLOCK_CONTROL_CSS,
  cardCompany,
  removeBlockControls,
  syncBlockControl,
} from '@/lib/block/card-controls';
import { closeBlockConfirmation } from '@/lib/block/confirm-panel';
import { type ApplicantLimit, type StoredLimitRead } from '@/lib/hide/applicants';
import { watchApplicantLimit } from '@/lib/hide/applicant-store';
import { JOB_CARD, cardBadges } from '@/lib/hide/card-badges';
import { jobIdOf } from '@/lib/hide/job-page';
import { startRepostWatch } from '@/lib/hide/repost-watch';
import { PAGE_REPORT_PORT, parsePreviewMessage, serializePageReport } from '@/lib/hide/page-report';
import type { RepostWatch } from '@/lib/hide/repost-watch';
import { watchHideSet } from '@/lib/hide/store';
import { watchBlocklist } from '@/lib/block/store';
import type { StoredBlocklistRead } from '@/lib/block/domain';

const HIDDEN_ATTR = 'data-linkedout-hidden';
const STYLE_ID = 'linkedout-hidden-style';
const HIDDEN_CSS = `[data-linkedout-hidden]{display:none !important}${BLOCK_CONTROL_CSS}`;
const SEARCH_PREFIXES = ['/jobs/search', '/jobs/search-results'] as const;

export function startJobListHiding(
  doc: Document,
  ctx: { onInvalidated(callback: () => void): void },
): void {
  const ports = new Set<Browser.runtime.Port>();
  let hideRead: StoredHideRead | undefined;
  let blockRead: StoredBlocklistRead | undefined;
  let limitRead: StoredLimitRead | undefined;
  let preview: ApplicantLimit | undefined;
  let latest: HideRules | undefined;
  let lastReport: PageReport | undefined;

  const onConnect = (port: Browser.runtime.Port): void => {
    if (port.name !== PAGE_REPORT_PORT) {
      return;
    }

    ports.add(port);
    port.onMessage.addListener((message: unknown) => {
      const limit = parsePreviewMessage(message);
      if (limit !== undefined) {
        preview = limit;
        applyRules();
      }
    });
    port.onDisconnect.addListener(() => {
      ports.delete(port);
      if (preview !== undefined) {
        preview = undefined;
        applyRules();
      }
    });

    if (lastReport !== undefined) {
      postReport(port, lastReport);
    }
  };

  browser.runtime.onConnect.addListener(onConnect);

  const reposts = startRepostWatch(() => {
    if (latest !== undefined) {
      publish(reconcile(doc, latest, reposts));
    }
  });
  const style = ensureStyle(doc);
  const observer = new MutationObserver(() => {
    if (latest === undefined) {
      return;
    }
    publish(reconcile(doc, latest, reposts));
  });
  observer.observe(doc.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  const stopHideWatch = watchHideSet((read) => {
    hideRead = read;
    applyRules();
  });
  const stopBlockWatch = watchBlocklist((read) => {
    blockRead = read;
    applyRules();
  });

  const stopLimitWatch = watchApplicantLimit((read) => {
    limitRead = read;
    preview = undefined;
    applyRules();
  });

  ctx.onInvalidated(() => {
    observer.disconnect();
    reposts.stop();
    style.remove();
    clearMarks(doc);
    closeBlockConfirmation();
    stopHideWatch();
    stopBlockWatch();
    stopLimitWatch();
    browser.runtime.onConnect.removeListener(onConnect);
    for (const port of ports) {
      port.disconnect();
    }
    ports.clear();
  });

  function applyRules(): void {
    if (hideRead === undefined || blockRead === undefined || limitRead === undefined) {
      return;
    }
    latest = hideRules(hideRead, blockRead, limitRead);
    if (preview !== undefined && latest.applicantLimit !== preview) {
      latest = { ...latest, applicantLimit: preview };
    }
    publish(reconcile(doc, latest, reposts));
  }

  function publish(report: PageReport): void {
    if (reportsMatch(lastReport, report)) {
      return;
    }

    lastReport = report;
    for (const port of ports) {
      postReport(port, report);
    }
  }

  function postReport(port: Browser.runtime.Port, report: PageReport): void {
    try {
      port.postMessage(serializePageReport(report));
    } catch {
      ports.delete(port);
    }
  }
}

function onJobsResultsList(pathname: string): boolean {
  return SEARCH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function cardFacts(card: Element, reposts: RepostWatch): CardFacts {
  const jobId = jobIdOf(card);
  return {
    ...cardBadges(card),
    reposted: jobId !== undefined && reposts.isReposted(jobId),
  };
}

function reconcile(doc: Document, rules: HideRules, reposts: RepostWatch): PageReport {
  const pathname = doc.location?.pathname ?? '';
  if (!onJobsResultsList(pathname)) {
    reposts.track([], { reposts: false, counts: false });
    clearMarks(doc);
    return notJobsListReport();
  }

  const cards = doc.querySelectorAll(JOB_CARD);
  const checkReposts = hasKind(rules.set, 'reposted');
  const checkCounts = rules.applicantLimit.enabled;
  reposts.track(cards, { reposts: checkReposts, counts: checkCounts });

  let marked = 0;
  for (const card of cards) {
    const company = cardCompany(card);
    const jobId = jobIdOf(card);
    const applicants = jobId === undefined ? undefined : reposts.applicantsOf(jobId);
    const hidden = shouldMarkHidden(true, rules, {
      badges: cardFacts(card, reposts),
      company,
      applicants,
    });
    card.toggleAttribute(HIDDEN_ATTR, hidden);
    syncBlockControl(card, company);
    if (hidden) {
      marked += 1;
    }
  }

  return jobsListReport(marked, (checkReposts || checkCounts) && reposts.isPaused());
}

function clearMarks(doc: Document): void {
  removeBlockControls(doc);
  for (const card of doc.querySelectorAll(`[${HIDDEN_ATTR}]`)) {
    card.toggleAttribute(HIDDEN_ATTR, false);
  }
}

function ensureStyle(doc: Document): HTMLStyleElement {
  const existing = doc.getElementById(STYLE_ID);
  if (existing instanceof HTMLStyleElement) {
    return existing;
  }

  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = HIDDEN_CSS;
  doc.head.append(style);
  return style;
}

function reportsMatch(previous: PageReport | undefined, next: PageReport): boolean {
  if (previous === undefined || previous.kind !== next.kind) {
    return false;
  }

  if (previous.kind === 'jobs-list' && next.kind === 'jobs-list') {
    return previous.hiddenCount === next.hiddenCount && previous.repostPaused === next.repostPaused;
  }

  return true;
}
