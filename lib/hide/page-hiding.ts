import { browser, type Browser } from 'wxt/browser';
import {
  BADGE_ROWS,
  hideRules,
  jobsListReport,
  notJobsListReport,
  shouldMarkHidden,
  textIsLeafBadge,
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
import { PAGE_REPORT_PORT, serializePageReport } from '@/lib/hide/page-report';
import { watchHideSet } from '@/lib/hide/store';
import { watchBlocklist } from '@/lib/block/store';
import type { StoredBlocklistRead } from '@/lib/block/domain';

const JOB_CARD =
  'li[data-occludable-job-id], div[role="button"][componentkey^="job-card-component-ref-"]';
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
  let latest: HideRules | undefined;
  let lastReport: PageReport | undefined;

  const onConnect = (port: Browser.runtime.Port): void => {
    if (port.name !== PAGE_REPORT_PORT) {
      return;
    }

    ports.add(port);
    port.onDisconnect.addListener(() => {
      ports.delete(port);
    });

    if (lastReport !== undefined) {
      postReport(port, lastReport);
    }
  };

  browser.runtime.onConnect.addListener(onConnect);

  const style = ensureStyle(doc);
  const observer = new MutationObserver(() => {
    if (latest === undefined) {
      return;
    }
    publish(reconcile(doc, latest));
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

  ctx.onInvalidated(() => {
    observer.disconnect();
    style.remove();
    clearMarks(doc);
    closeBlockConfirmation();
    stopHideWatch();
    stopBlockWatch();
    browser.runtime.onConnect.removeListener(onConnect);
    for (const port of ports) {
      port.disconnect();
    }
    ports.clear();
  });

  function applyRules(): void {
    if (hideRead === undefined || blockRead === undefined) {
      return;
    }
    latest = hideRules(hideRead, blockRead);
    publish(reconcile(doc, latest));
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

function cardFacts(card: Element): CardFacts {
  const facts = { applied: false, viewed: false, saved: false, reposted: false };

  for (const node of card.querySelectorAll('*')) {
    const childTextContents = [...node.children].map((child) => child.textContent ?? '');
    for (const row of BADGE_ROWS) {
      if (facts[row.kind]) {
        continue;
      }
      if (textIsLeafBadge(node.textContent ?? '', childTextContents, row.badgeText)) {
        facts[row.kind] = true;
      }
    }
  }

  return facts;
}

function reconcile(doc: Document, rules: HideRules): PageReport {
  const pathname = doc.location?.pathname ?? '';
  if (!onJobsResultsList(pathname)) {
    clearMarks(doc);
    return notJobsListReport();
  }

  let marked = 0;
  for (const card of doc.querySelectorAll(JOB_CARD)) {
    const company = cardCompany(card);
    const hidden = shouldMarkHidden(true, rules, { badges: cardFacts(card), company });
    card.toggleAttribute(HIDDEN_ATTR, hidden);
    syncBlockControl(card, company);
    if (hidden) {
      marked += 1;
    }
  }

  return jobsListReport(marked);
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
    return previous.hiddenCount === next.hiddenCount;
  }

  return true;
}
