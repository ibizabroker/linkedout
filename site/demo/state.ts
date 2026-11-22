import {
  emptyBlocklist,
  isBlocked,
  withBlocked,
  withoutBlocked,
  serializeBlocklist,
  type Blocklist,
} from '@/lib/block/domain';
import { offLimit, serializeLimit, type ApplicantLimit } from '@/lib/hide/applicants';
import {
  emptyHideSet,
  hasKind,
  hideRules,
  jobsListReport,
  serializeHideSet,
  shouldMarkHidden,
  type HideKind,
  type HideSet,
  type PageReport,
} from '@/lib/hide/domain';
import { COLUMNS, STATUSES, columnIndex, type Status } from '@/lib/tracker/columns';
import {
  serializeTracker,
  sheetFromId,
  summarizeSync,
  type Connection,
  type SyncSummary,
} from '@/lib/tracker/domain';
import type { JobFacts } from '@/lib/tracker/job-facts';
import {
  delivered,
  emptySync,
  forNewSheet,
  isKnown,
  serializeOutbox,
  serializeWritten,
  type SyncState,
} from '@/lib/tracker/outbox';
import { buildRow, type SheetRow } from '@/lib/tracker/row';
import { DEMO_JOBS, type DemoJob } from './jobs';

export const DEMO_SPREADSHEET_ID = 'demo';

export type DemoTab = 'jobs' | 'settings' | 'sheet';

export type SheetEntry = {
  readonly jobId: string;
  readonly row: SheetRow;
};

export type DemoState = {
  readonly tab: DemoTab;
  readonly openedTabs: readonly DemoTab[];
  readonly switched: boolean;
  readonly hideSet: HideSet;
  readonly limit: ApplicantLimit;
  readonly preview: ApplicantLimit | undefined;
  readonly blocklist: Blocklist;
  readonly connection: Connection | null;
  readonly sync: SyncState;
  readonly authExpired: boolean;
  readonly applied: readonly string[];
  readonly rows: readonly SheetEntry[];
};

export type JobView = DemoJob & { readonly blocked: boolean; readonly hidden: boolean };

export type TallySegment = {
  readonly count: number;
  readonly cleared: boolean;
};

export type Tally = {
  readonly total: number;
  readonly visible: number;
  readonly applied: TallySegment;
  readonly viewed: TallySegment;
  readonly saved: TallySegment;
  readonly reposted: TallySegment;
  readonly agencies: TallySegment;
  readonly overLimit: TallySegment;
};

export function initialState(): DemoState {
  return {
    tab: 'jobs',
    openedTabs: ['jobs'],
    switched: false,
    hideSet: emptyHideSet(),
    limit: offLimit(),
    preview: undefined,
    blocklist: emptyBlocklist(),
    connection: null,
    sync: emptySync(),
    authExpired: false,
    applied: DEMO_JOBS.filter((job) => job.applied).map((job) => job.id),
    rows: [],
  };
}

export function jobViews(state: DemoState): readonly JobView[] {
  const rules = hideRules(
    { status: 'ready', set: state.hideSet },
    { status: 'ready', list: state.blocklist },
    { status: 'ready', limit: state.preview ?? state.limit },
  );
  return DEMO_JOBS.map((base) => {
    const applied = state.applied.includes(base.id);
    const job = { ...base, applied };
    const hidden = shouldMarkHidden(true, rules, {
      badges: {
        applied,
        viewed: job.viewed,
        saved: job.saved,
        reposted: job.reposted,
      },
      company: job.company,
      applicants: job.applicants,
    });
    return { ...job, hidden, blocked: isBlocked(state.blocklist, job.company) };
  });
}

export function pageReport(state: DemoState): PageReport {
  return jobsListReport(jobViews(state).filter((job) => job.hidden).length);
}

export function tally(state: DemoState): Tally {
  const views = jobViews(state);
  const segment = (members: readonly JobView[], cleared: boolean): TallySegment => ({
    count: members.length,
    cleared: members.length > 0 && cleared,
  });
  const badge = (kind: HideKind, members: readonly JobView[]): TallySegment =>
    segment(members, hasKind(state.hideSet, kind));
  const agencies = views.filter((job) => job.agency);
  const overLimit = overLimitJobs(state).length;
  return {
    total: views.length,
    visible: views.filter((job) => !job.hidden).length,
    applied: badge(
      'applied',
      views.filter((job) => job.applied),
    ),
    viewed: badge(
      'viewed',
      views.filter((job) => job.viewed),
    ),
    saved: badge(
      'saved',
      views.filter((job) => job.saved),
    ),
    reposted: badge(
      'reposted',
      views.filter((job) => job.reposted),
    ),
    agencies: segment(
      agencies,
      agencies.every((job) => job.blocked),
    ),
    overLimit: { count: overLimit, cleared: overLimit > 0 },
  };
}

function overLimitJobs(state: DemoState): readonly DemoJob[] {
  const rules = hideRules(
    { status: 'ready', set: emptyHideSet() },
    { status: 'ready', list: emptyBlocklist() },
    { status: 'ready', limit: state.preview ?? state.limit },
  );
  return DEMO_JOBS.filter((job) =>
    shouldMarkHidden(true, rules, {
      badges: { applied: false, viewed: false, saved: false, reposted: false },
      company: job.company,
      applicants: job.applicants,
    }),
  );
}

export function trackedSummary(state: DemoState): SyncSummary {
  return summarizeSync(state.sync, state.authExpired);
}

export function storageOf(state: DemoState): Record<string, unknown> {
  const stored: Record<string, unknown> = {
    'hide-set': serializeHideSet(state.hideSet),
    'applicant-limit': serializeLimit(state.limit),
    blocklist: serializeBlocklist(state.blocklist),
    tracker: serializeTracker(state.connection),
    'tracker-written': serializeWritten(state.sync),
    'tracker-outbox': serializeOutbox(state.sync),
  };
  if (state.authExpired) {
    stored['tracker-auth-expired'] = true;
  }
  return stored;
}

export function withTab(state: DemoState, tab: DemoTab): DemoState {
  const openedTabs = state.openedTabs.includes(tab) ? state.openedTabs : [...state.openedTabs, tab];
  return { ...state, tab, openedTabs };
}

export function withHideSet(state: DemoState, hideSet: HideSet): DemoState {
  return { ...state, hideSet, switched: true };
}

export function withLimit(state: DemoState, limit: ApplicantLimit): DemoState {
  return { ...state, limit, preview: undefined, switched: true };
}

export function withPreview(state: DemoState, preview: ApplicantLimit | undefined): DemoState {
  return { ...state, preview };
}

export function withBlock(state: DemoState, name: string, now: number): DemoState {
  return { ...state, blocklist: withBlocked(state.blocklist, name, now) };
}

export function withUnblock(state: DemoState, name: string): DemoState {
  return { ...state, blocklist: withoutBlocked(state.blocklist, name) };
}

export function withConnection(state: DemoState, now: number): DemoState {
  return {
    ...state,
    connection: { sheet: sheetFromId(DEMO_SPREADSHEET_ID), connectedAt: now },
    authExpired: false,
  };
}

export function withoutConnection(state: DemoState): DemoState {
  return { ...state, connection: null, sync: emptySync(), authExpired: false };
}

export function withRenewedSignIn(state: DemoState): DemoState {
  return { ...state, authExpired: false };
}

export function withNewSheet(state: DemoState): DemoState {
  return state.connection === null ? state : { ...state, sync: forNewSheet(state.sync) };
}

export function withApplication(state: DemoState, jobId: string, now: number): DemoState {
  const job = DEMO_JOBS.find((candidate) => candidate.id === jobId);
  if (job === undefined || state.applied.includes(jobId)) {
    return state;
  }
  const applied = [...state.applied, jobId];
  if (state.connection === null || isKnown(state.sync, jobId)) {
    return { ...state, applied };
  }
  return {
    ...state,
    applied,
    sync: delivered(state.sync, jobId),
    rows: [...state.rows, { jobId, row: buildRow(factsOf(job, now), now, 0) }],
  };
}

export function withRowStatus(state: DemoState, jobId: string, status: Status): DemoState {
  if (!STATUSES.includes(status)) {
    return state;
  }
  const at = columnIndex('Status');
  return {
    ...state,
    rows: state.rows.map((entry) =>
      entry.jobId === jobId
        ? { ...entry, row: entry.row.map((cell, index) => (index === at ? status : cell)) }
        : entry,
    ),
  };
}

export const SHEET_COLUMNS = COLUMNS;

function factsOf(job: DemoJob, now: number): JobFacts {
  return {
    jobId: job.id,
    applied: true,
    appliedAt: now,
    onsiteApply: job.easyApply,
    title: job.title,
    company: job.company,
    location: job.location,
    workplace: job.workplace,
    reposted: job.reposted,
    applicants: job.applicants,
  };
}
