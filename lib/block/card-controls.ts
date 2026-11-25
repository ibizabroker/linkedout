import { createBanIcon } from '@/lib/block/ban-icon';
import { pickCompanyName } from '@/lib/block/company-name';
import { openBlockConfirmation } from '@/lib/block/confirm-panel';
import { requestBlock } from '@/lib/block/store';

const DISMISS = 'button[aria-label^="Dismiss "][aria-label$=" job"]';
const CONTROL_ATTR = 'data-linkedout-block';
const CARD_ATTR = 'data-linkedout-card';
const OPEN_ATTR = 'data-linkedout-open';

export const BLOCK_CONTROL_CSS =
  `:has(> [${CONTROL_ATTR}]){position:relative}` +
  `[${CARD_ATTR}]:not([${OPEN_ATTR}]):not(:hover):not(:focus-within) [${CONTROL_ATTR}]{visibility:hidden !important}` +
  `[${CONTROL_ATTR}]{position:absolute;top:100%;left:50%;transform:translateX(-50%);display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;padding:0;border:0;border-radius:50%;background:transparent;color:inherit;cursor:pointer}` +
  `[${CONTROL_ATTR}]:hover{background:rgba(0,0,0,0.08)}`;

export function cardCompany(card: Element): string | undefined {
  return pickCompanyName([...card.querySelectorAll('p')].map((p) => p.textContent ?? ''));
}

export function syncBlockControl(card: Element, name: string | undefined): void {
  const dismiss = card.querySelector(DISMISS);
  const existing = card.querySelector(`[${CONTROL_ATTR}]`);

  if (name === undefined || dismiss === null) {
    existing?.remove();
    card.removeAttribute(CARD_ATTR);
    return;
  }

  const label = `Block ${name}`;
  if (existing !== null) {
    if (existing.getAttribute('aria-label') !== label) {
      existing.setAttribute('aria-label', label);
      existing.setAttribute('title', label);
    }
    return;
  }

  const button = card.ownerDocument.createElement('button');
  button.type = 'button';
  button.setAttribute(CONTROL_ATTR, '');
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);
  button.append(createBanIcon(card.ownerDocument, { size: 16 }));
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const current = button.getAttribute('aria-label')?.slice('Block '.length) ?? name;
    card.setAttribute(OPEN_ATTR, '');
    openBlockConfirmation(
      current,
      () => requestBlock(current),
      () => card.removeAttribute(OPEN_ATTR),
    );
  });
  for (const type of ['keydown', 'keyup', 'mousedown', 'pointerdown']) {
    button.addEventListener(type, (event) => event.stopPropagation());
  }
  dismiss.before(button);
  card.setAttribute(CARD_ATTR, '');
}

export function removeBlockControls(doc: Document): void {
  for (const control of doc.querySelectorAll(`[${CONTROL_ATTR}]`)) {
    control.remove();
  }
  for (const card of doc.querySelectorAll(`[${CARD_ATTR}]`)) {
    card.removeAttribute(CARD_ATTR);
  }
}
