export type PaneAnchor = { readonly href: string; readonly text: string };

const COMPANY_PATH = '/company/';
const JOB_PATH = '/jobs/view/';

export function findTopCardCompany(
  anchors: readonly PaneAnchor[],
): { index: number; name: string } | undefined {
  for (const [index, anchor] of anchors.entries()) {
    if (anchor.href.includes(JOB_PATH)) {
      return undefined;
    }
    const name = anchor.text.replace(/\s+/g, ' ').trim();
    if (anchor.href.includes(COMPANY_PATH) && name !== '') {
      return { index, name };
    }
  }
  return undefined;
}

export type PaneButtonView = { label: string; text: 'Block' | 'Blocked'; disabled: boolean };

export function paneButtonView(name: string, blocked: boolean): PaneButtonView {
  return blocked
    ? { label: `Blocked ${name}`, text: 'Blocked', disabled: true }
    : { label: `Block ${name}`, text: 'Block', disabled: false };
}
