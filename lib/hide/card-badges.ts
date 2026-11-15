import { BADGE_ROWS, textIsLeafBadge, type CardFacts } from '@/lib/hide/domain';

export const JOB_CARD =
  'li[data-occludable-job-id], div[role="button"][componentkey^="job-card-component-ref-"]';

export function cardBadges(card: Element): Omit<CardFacts, 'reposted'> {
  const facts = { applied: false, viewed: false, saved: false };

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
