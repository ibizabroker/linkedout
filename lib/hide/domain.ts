export const HIDE_CATALOG = [
  { kind: 'applied', menuLabel: 'Applied', badgeText: 'Applied', defaultOn: true },
  { kind: 'viewed', menuLabel: 'Viewed', badgeText: 'Viewed', defaultOn: true },
] as const;

export type HideKind = (typeof HIDE_CATALOG)[number]['kind'];

const hideSetBrand: unique symbol = Symbol('HideSet');

export type HideSet = {
  readonly [hideSetBrand]: typeof hideSetBrand;
  readonly kinds: readonly HideKind[];
};

export type CardFacts = {
  readonly [Kind in HideKind]: boolean;
};

export type PageReport =
  | { readonly kind: 'jobs-list'; readonly hiddenCount: number }
  | { readonly kind: 'not-jobs-list' }
  | { readonly kind: 'failed' };

export type MenuRow = {
  readonly kind: HideKind;
  readonly label: string;
  readonly checked: boolean;
};

export type StatusLine =
  | { readonly kind: 'pending' }
  | { readonly kind: 'failed'; readonly text: 'Could not check this list. Reload the tab.' }
  | { readonly kind: 'elsewhere'; readonly text: 'Open a Jobs search to hide cards' }
  | { readonly kind: 'showing'; readonly text: 'Showing every card' }
  | { readonly kind: 'hiding'; readonly text: string };

export type ReadyPopup = {
  readonly triggerLabel: string;
  readonly menu: readonly MenuRow[];
  readonly status: StatusLine;
};

export const UNREADABLE_CHOICE_TEXT = 'Could not load your choice. Choose again.';

export type PopupModel =
  | { readonly phase: 'loading' }
  | ({
      readonly phase: 'unreadable';
      readonly text: typeof UNREADABLE_CHOICE_TEXT;
    } & Pick<ReadyPopup, 'triggerLabel' | 'menu'>)
  | ({ readonly phase: 'ready' } & ReadyPopup);

export type StoredHideRead =
  | { readonly status: 'ready'; readonly set: HideSet }
  | { readonly status: 'unreadable' };

export function defaultHideSet(): HideSet {
  return hideSet(HIDE_CATALOG.flatMap((row) => (row.defaultOn ? [row.kind] : [])));
}

export function emptyHideSet(): HideSet {
  return hideSet([]);
}

export function withKind(set: HideSet, kind: HideKind, on: boolean): HideSet {
  const next = new Set(set.kinds);
  if (on) {
    next.add(kind);
  } else {
    next.delete(kind);
  }
  return hideSet([...next]);
}

export function hasKind(set: HideSet, kind: HideKind): boolean {
  return set.kinds.includes(kind);
}

export function parseStoredHideSet(raw: unknown): StoredHideRead {
  if (raw === undefined) {
    return { status: 'ready', set: defaultHideSet() };
  }

  const kinds = readVersionOneKinds(raw);
  if (kinds === undefined) {
    return { status: 'unreadable' };
  }

  return { status: 'ready', set: hideSet(kinds.filter(isHideKind)) };
}

export function parseReplaceDocument(raw: unknown): HideSet | undefined {
  const kinds = readVersionOneKinds(raw);
  if (kinds === undefined) {
    return undefined;
  }

  const accepted: HideKind[] = [];
  for (const kind of kinds) {
    if (!isHideKind(kind)) {
      return undefined;
    }
    accepted.push(kind);
  }

  return hideSet(accepted);
}

export function serializeHideSet(set: HideSet): {
  readonly version: 1;
  readonly kinds: readonly HideKind[];
} {
  return { version: 1, kinds: set.kinds };
}

export function textIsLeafBadge(
  textContent: string,
  childTextContents: readonly string[],
  badgeText: string,
): boolean {
  if (textContent.trim() !== badgeText) {
    return false;
  }

  return !childTextContents.some((child) => child.trim() === badgeText);
}

export function shouldMarkHidden(
  onJobsResultsList: boolean,
  set: HideSet,
  facts: CardFacts,
): boolean {
  if (!onJobsResultsList) {
    return false;
  }

  return set.kinds.some((kind) => facts[kind]);
}

export function readyPopup(set: HideSet, report: PageReport | undefined): ReadyPopup {
  const selectedLabels = HIDE_CATALOG.flatMap((row) =>
    hasKind(set, row.kind) ? [row.menuLabel] : [],
  );

  return {
    triggerLabel: selectedLabels.length === 0 ? 'Nothing hidden' : selectedLabels.join(', '),
    menu: HIDE_CATALOG.map((row) => ({
      kind: row.kind,
      label: row.menuLabel,
      checked: hasKind(set, row.kind),
    })),
    status: statusLine(set, report),
  };
}

export function jobsListReport(hiddenCount: number): PageReport {
  if (!Number.isInteger(hiddenCount) || hiddenCount < 0) {
    throw new Error('hiddenCount must be an integer greater than or equal to 0');
  }

  return { kind: 'jobs-list', hiddenCount };
}

export function notJobsListReport(): PageReport {
  return { kind: 'not-jobs-list' };
}

export function failedPageReport(): PageReport {
  return { kind: 'failed' };
}

function statusLine(set: HideSet, report: PageReport | undefined): StatusLine {
  if (report === undefined) {
    return { kind: 'pending' };
  }

  switch (report.kind) {
    case 'failed':
      return { kind: 'failed', text: 'Could not check this list. Reload the tab.' };
    case 'not-jobs-list':
      return { kind: 'elsewhere', text: 'Open a Jobs search to hide cards' };
    case 'jobs-list':
      if (set.kinds.length === 0) {
        return { kind: 'showing', text: 'Showing every card' };
      }
      return { kind: 'hiding', text: hidingText(report.hiddenCount) };
    default:
      return unexpected(report);
  }
}

function hidingText(hiddenCount: number): string {
  if (hiddenCount === 0) {
    return 'No cards to hide on this list';
  }
  if (hiddenCount === 1) {
    return '1 card hidden on this list';
  }
  return `${hiddenCount} cards hidden on this list`;
}

function unexpected(value: never): never {
  throw new Error(`Unexpected page report: ${JSON.stringify(value)}`);
}

function hideSet(kinds: readonly HideKind[]): HideSet {
  const selected = new Set(kinds);
  const ordered: HideKind[] = [];
  for (const row of HIDE_CATALOG) {
    if (selected.has(row.kind)) {
      ordered.push(row.kind);
    }
  }

  return {
    [hideSetBrand]: hideSetBrand,
    kinds: Object.freeze(ordered),
  };
}

function isHideKind(value: string): value is HideKind {
  return HIDE_CATALOG.some((row) => row.kind === value);
}

function readVersionOneKinds(raw: unknown): readonly string[] | undefined {
  if (!isRecord(raw) || raw.version !== 1 || !Array.isArray(raw.kinds)) {
    return undefined;
  }

  const kinds: string[] = [];
  for (const kind of raw.kinds) {
    if (typeof kind !== 'string') {
      return undefined;
    }
    kinds.push(kind);
  }

  return kinds;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
