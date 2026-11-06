const JOB_CARD = 'li[data-occludable-job-id]';
const APPLIED_LABEL = 'Applied';
const SEARCH_PATHS = ['/jobs/search', '/jobs/search-results'] as const;
const HIDDEN_ATTR = 'data-linkedout-applied';
const STYLE_ID = 'linkedout-applied-style';

function isSearchResults(path: string): boolean {
  return SEARCH_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function isApplied(card: Element): boolean {
  for (const node of card.querySelectorAll('*')) {
    if (node.textContent?.trim() !== APPLIED_LABEL) continue;
    const childMatches = [...node.children].some((child) => child.textContent?.trim() === APPLIED_LABEL);
    if (!childMatches) return true;
  }
  return false;
}

function setHidden(card: Element, hidden: boolean): void {
  card.toggleAttribute(HIDDEN_ATTR, hidden);
}

function reconcile(doc: Document): void {
  const onSearch = isSearchResults(doc.location.pathname);
  for (const card of doc.querySelectorAll(JOB_CARD)) {
    setHidden(card, onSearch && isApplied(card));
  }
}

function release(doc: Document): void {
  for (const card of doc.querySelectorAll(`[${HIDDEN_ATTR}]`)) setHidden(card, false);
}

function hiddenStyle(doc: Document): HTMLStyleElement {
  const existing = doc.getElementById(STYLE_ID);
  if (existing instanceof HTMLStyleElement) return existing;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `[${HIDDEN_ATTR}]{display:none !important}`;
  return style;
}

export default defineContentScript({
  matches: ['*://www.linkedin.com/*'],
  main(ctx) {
    const style = hiddenStyle(document);
    document.head.append(style);
    reconcile(document);
    const observer = new MutationObserver(() => reconcile(document));
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    ctx.onInvalidated(() => {
      observer.disconnect();
      style.remove();
      release(document);
    });
  },
});
