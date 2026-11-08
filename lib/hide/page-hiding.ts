import { browser, type Browser } from 'wxt/browser';
import {
  HIDE_CATALOG,
  jobsListReport,
  notJobsListReport,
  shouldMarkHidden,
  textIsLeafBadge,
  type CardFacts,
  type HideSet,
  type PageReport,
} from '@/lib/hide/domain';
import {
  BLOCK_CONTROL_CSS,
  removeBlockControls,
  syncBlockControl,
} from '@/lib/blocklist/card-controls';
import { closeBlockConfirmation } from '@/lib/blocklist/confirm-panel';
import { PAGE_REPORT_PORT, serializePageReport } from '@/lib/hide/page-report';
import { watchHideSet } from '@/lib/hide/store';

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
  let latest: HideSet | undefined;
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

  const stopWatch = watchHideSet((read) => {
    if (read.status !== 'ready') {
      latest = undefined;
      clearMarks(doc);
      return;
    }

    latest = read.set;
    publish(reconcile(doc, read.set));
  });

  ctx.onInvalidated(() => {
    observer.disconnect();
    style.remove();
    clearMarks(doc);
    closeBlockConfirmation();
    stopWatch();
    browser.runtime.onConnect.removeListener(onConnect);
    for (const port of ports) {
      port.disconnect();
    }
    ports.clear();
  });

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
  const facts = { applied: false, viewed: false, saved: false };

  for (const node of card.querySelectorAll('*')) {
    const childTextContents = [...node.children].map((child) => child.textContent ?? '');
    for (const row of HIDE_CATALOG) {
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

function reconcile(doc: Document, set: HideSet): PageReport {
  const pathname = doc.location?.pathname ?? '';
  if (!onJobsResultsList(pathname)) {
    clearMarks(doc);
    return notJobsListReport();
  }

  let marked = 0;
  for (const card of doc.querySelectorAll(JOB_CARD)) {
    const hidden = shouldMarkHidden(true, set, cardFacts(card));
    card.toggleAttribute(HIDDEN_ATTR, hidden);
    syncBlockControl(card);
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
