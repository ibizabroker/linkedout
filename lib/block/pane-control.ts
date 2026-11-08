import { findTopCardCompany, paneButtonView } from '@/lib/block/pane-company';
import { emptyBlocklist, isBlocked, type Blocklist } from '@/lib/block/domain';
import { requestBlock, watchBlocklist } from '@/lib/block/store';
import { closeBlockConfirmation, openBlockConfirmation } from '@/lib/block/confirm-panel';

const PANE = '[data-sdui-screen$="SemanticJobDetails"]';
const CONTROL_ATTR = 'data-linkedout-pane-block';
const STYLE_ID = 'linkedout-pane-block-style';
const SEARCH_PREFIXES = ['/jobs/search', '/jobs/search-results'] as const;
const BAN_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>';
const CSS =
  `[${CONTROL_ATTR}]{display:inline-flex;align-items:center;gap:4px;height:24px;margin-left:8px;margin-right:auto;padding:0 8px;border:1px solid color-mix(in srgb,currentColor 25%,transparent);border-radius:6px;background:transparent;color:inherit;font:500 12px/1 system-ui,sans-serif;white-space:nowrap;cursor:pointer}` +
  `[${CONTROL_ATTR}]:hover:not(:disabled){background:color-mix(in srgb,currentColor 10%,transparent)}` +
  `[${CONTROL_ATTR}]:disabled{cursor:default;opacity:0.6}`;

export function startPaneBlockControl(
  doc: Document,
  ctx: { onInvalidated(callback: () => void): void },
): void {
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  doc.head.append(style);

  let blocklist: Blocklist = emptyBlocklist();
  const observer = new MutationObserver(() => syncPaneControl(doc, blocklist));
  observer.observe(doc.body, { childList: true, subtree: true, characterData: true });
  const stopWatch = watchBlocklist((read) => {
    blocklist = read.status === 'ready' ? read.list : emptyBlocklist();
    syncPaneControl(doc, blocklist);
  });
  syncPaneControl(doc, blocklist);

  ctx.onInvalidated(() => {
    observer.disconnect();
    style.remove();
    removeControls(doc);
    closeBlockConfirmation();
    stopWatch();
  });
}

export function syncPaneControl(doc: Document, blocklist: Blocklist): void {
  const pathname = doc.location?.pathname ?? '';
  const onList = SEARCH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const anchors = onList ? [...(doc.querySelector(PANE)?.querySelectorAll('a[href]') ?? [])] : [];
  const found = findTopCardCompany(
    anchors.map((a) => ({ href: a.getAttribute('href') ?? '', text: a.textContent ?? '' })),
  );
  const company = found === undefined ? undefined : anchors[found.index];

  if (found === undefined || company === undefined) {
    removeControls(doc);
    return;
  }

  const target = company.parentElement?.closest('a') ?? company;
  const controls = [...doc.querySelectorAll<HTMLButtonElement>(`[${CONTROL_ATTR}]`)];
  const keep = controls.find((c) => c.previousElementSibling === target);
  for (const control of controls) {
    if (control !== keep) {
      control.remove();
    }
  }

  const button = keep ?? createButton(doc);
  applyView(button, found.name, isBlocked(blocklist, found.name));
  if (keep === undefined) {
    target.after(button);
  }
}

function applyView(button: HTMLButtonElement, name: string, blocked: boolean): void {
  const view = paneButtonView(name, blocked);
  if (button.getAttribute('aria-label') === view.label && button.disabled === view.disabled) {
    return;
  }
  button.setAttribute('aria-label', view.label);
  button.setAttribute('title', view.label);
  button.disabled = view.disabled;
  button.innerHTML = view.disabled ? '' : BAN_ICON;
  button.append(view.text);
  button.dataset.name = name;
}

function createButton(doc: Document): HTMLButtonElement {
  const button = doc.createElement('button');
  button.type = 'button';
  button.setAttribute(CONTROL_ATTR, '');
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const name = button.dataset.name ?? '';
    openBlockConfirmation(name, () => requestBlock(name));
  });
  for (const type of ['keydown', 'keyup', 'mousedown', 'pointerdown']) {
    button.addEventListener(type, (event) => event.stopPropagation());
  }
  return button;
}

function removeControls(doc: Document): void {
  for (const control of doc.querySelectorAll(`[${CONTROL_ATTR}]`)) {
    control.remove();
  }
}
