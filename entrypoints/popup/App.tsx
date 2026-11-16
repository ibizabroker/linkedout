import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { browser, type Browser } from 'wxt/browser';
import { SettingsIcon } from 'lucide-react';
import logoUrl from '@/assets/icon.svg';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  UNREADABLE_CHOICE_TEXT,
  emptyHideSet,
  failedPageReport,
  notJobsListReport,
  readyPopup,
  withKind,
  type HideKind,
  type HideSet,
  type MenuRow,
  type PageReport,
  type PopupModel,
} from '@/lib/hide/domain';
import {
  PAGE_REPORT_PORT,
  parsePageReportMessage,
  serializePreview,
} from '@/lib/hide/page-report';
import type { ApplicantLimit } from '@/lib/hide/applicants';
import {
  ApplicantLimitSection,
  LIMIT_SAVE_FAILED_TEXT,
  useApplicantLimitSession,
} from './ApplicantLimit';
import { requestHideSet, watchHideSet } from '@/lib/hide/store';
import { Group } from './Group';
import { useBlocklistSession } from '@/lib/ui/BlockedCompanies';
import {
  JobTrackerSection,
  TrackerProblem,
  trackedReadout,
  useTrackerSession,
} from './JobTracker';

export default function App() {
  return <PopupApp />;
}

export function PopupApp(): ReactElement {
  const { report, sendPreview } = usePageReport();
  const limit = useApplicantLimitSession(sendPreview);
  const { model, setKind, saveFailed } = useHideSetSession(
    report,
    limit.limit?.enabled === true,
  );

  const blocklist = useBlocklistSession();
  const tracker = useTrackerSession();
  const message = messageLine(
    model,
    saveFailed,
    limit.failed ? LIMIT_SAVE_FAILED_TEXT : blocklist.failureText,
  );

  return (
    <main className="flex flex-col">
      <header className="flex items-center gap-2 py-2.5 pr-2 pl-3">
        <h1 className="flex flex-1 items-center gap-2 text-sm font-semibold">
          <img src={logoUrl} alt="" width={18} height={18} />
          LinkedOut
        </h1>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Open settings"
          className="text-muted-foreground"
          onClick={() => {
            void browser.runtime.openOptionsPage();
          }}
        >
          <SettingsIcon />
        </Button>
      </header>
      <Readout
        hidden={report?.kind === 'jobs-list' ? report.hiddenCount : undefined}
        tracked={trackedReadout(tracker.view)}
        blocked={blocklist.companies?.length}
      />
      <p
        role="status"
        className={
          message.text === ''
            ? 'sr-only'
            : `border-t border-border px-3 py-[7px] ${TONE_CLASS[message.tone]}`
        }
      >
        {message.text}
      </p>
      <TrackerProblem view={tracker.view} act={tracker.act} />
      {model.phase === 'loading' ? null : (
        <>
          <HideRows rows={model.menu} onSetKind={setKind} />
          <ApplicantLimitSection session={limit} />
          <JobTrackerSection view={tracker.view} act={tracker.act} />
        </>
      )}
    </main>
  );
}

function Readout(props: {
  readonly hidden: number | undefined;
  readonly tracked:
    | { readonly added: number; readonly waiting: number }
    | undefined;
  readonly blocked: number | undefined;
}): ReactElement {
  const { hidden, tracked, blocked } = props;
  return (
    <p className="flex flex-wrap gap-x-3.5 px-3 pb-2 text-muted-foreground">
      <span>
        Hidden here <Figure>{hidden ?? '–'}</Figure>
      </span>
      {tracked === undefined ? null : (
        <span>
          Tracked <Figure>{tracked.added}</Figure>
          {tracked.waiting === 0 ? null : ` · ${tracked.waiting} waiting`}
        </span>
      )}
      {blocked === undefined ? null : (
        <span>
          Blocked <Figure>{blocked}</Figure>
        </span>
      )}
    </p>
  );
}

function Figure(props: { readonly children: number | string }): ReactElement {
  return (
    <span className="font-semibold text-foreground tabular-nums">
      {props.children}
    </span>
  );
}

type Tone = 'muted' | 'failure';

const TONE_CLASS: Record<Tone, string> = {
  muted: 'text-muted-foreground',
  failure: 'text-destructive',
};

const SAVE_FAILED_TEXT = 'Your choice could not be saved. Try again.';

function messageLine(
  model: PopupModel,
  saveFailed: boolean,
  blocklistFailure: string | undefined,
): { readonly text: string; readonly tone: Tone } {
  if (saveFailed) {
    return { text: SAVE_FAILED_TEXT, tone: 'failure' };
  }
  if (blocklistFailure !== undefined) {
    return { text: blocklistFailure, tone: 'failure' };
  }
  if (model.phase === 'loading') {
    return { text: '', tone: 'muted' };
  }
  if (model.phase === 'unreadable') {
    return { text: model.text, tone: 'failure' };
  }
  const { status } = model;
  switch (status.kind) {
    case 'pending':
      return { text: '', tone: 'muted' };
    case 'failed':
      return { text: status.text, tone: 'failure' };
    case 'hiding':
    case 'showing':
      return { text: '', tone: 'muted' };
    case 'paused':
      return { text: status.text, tone: 'muted' };
    case 'elsewhere':
      return { text: status.text, tone: 'muted' };
    default:
      return unexpectedStatus(status);
  }
}

function unexpectedStatus(value: never): never {
  throw new Error(`Unexpected status: ${JSON.stringify(value)}`);
}

function HideRows(props: {
  readonly rows: readonly MenuRow[];
  readonly onSetKind: (kind: HideKind, on: boolean) => void;
}): ReactElement {
  return (
    <Group label="Hide from results">
      {props.rows.map((row) => (
        <Switch
          key={row.kind}
          label={row.label}
          value={row.checked ? 'Hidden' : 'Shown'}
          checked={row.checked}
          onCheckedChange={(checked) => {
            props.onSetKind(row.kind, checked);
          }}
        />
      ))}
    </Group>
  );
}

function usePageReport(): {
  readonly report: PageReport | undefined;
  readonly sendPreview: (limit: ApplicantLimit) => void;
} {
  const [report, setReport] = useState<PageReport | undefined>(undefined);
  const [pagePort, setPagePort] = useState<Browser.runtime.Port | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;
    let port: Browser.runtime.Port | undefined;
    let sawMessage = false;

    void browser.tabs.query({ active: true, currentWindow: true }).then(
      (tabs) => {
        if (cancelled) {
          return;
        }

        const tab = tabs[0];
        const hostname = hostnameOf(tab?.url);
        if (hostname === undefined) {
          setReport(failedPageReport());
          return;
        }

        if (hostname !== 'www.linkedin.com') {
          setReport(notJobsListReport());
          return;
        }

        if (tab?.id === undefined) {
          setReport(failedPageReport());
          return;
        }

        try {
          port = browser.tabs.connect(tab.id, { name: PAGE_REPORT_PORT });
          setPagePort(port);
        } catch {
          setReport(failedPageReport());
          return;
        }

        if (cancelled) {
          port.disconnect();
          return;
        }

        port.onMessage.addListener((message: unknown) => {
          if (cancelled) {
            return;
          }
          sawMessage = true;
          setReport(parsePageReportMessage(message));
        });
        port.onDisconnect.addListener(() => {
          if (cancelled || sawMessage) {
            return;
          }
          setReport(failedPageReport());
        });
      },
      () => {
        if (!cancelled) {
          setReport(failedPageReport());
        }
      },
    );

    return () => {
      cancelled = true;
      port?.disconnect();
    };
  }, []);

  const sendPreview = useCallback(
    (limit: ApplicantLimit): void => {
      try {
        pagePort?.postMessage(serializePreview(limit));
      } catch {
        setPagePort(undefined);
      }
    },
    [pagePort],
  );

  return { report, sendPreview };
}

function useHideSetSession(
  report: PageReport | undefined,
  countFilterOn: boolean,
): {
  readonly model: PopupModel;
  readonly setKind: (kind: HideKind, on: boolean) => void;
  readonly saveFailed: boolean;
} {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'unreadable'>(
    'loading',
  );
  const [hideSet, setHideSet] = useState<HideSet | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const hideSetRef = useRef<HideSet | null>(null);
  const resolvedRef = useRef<HideSet | null>(null);
  const epoch = useRef(0);
  const inflight = useRef(0);

  useEffect(() => {
    return watchHideSet((read) => {
      if (inflight.current > 0) {
        return;
      }

      if (read.status !== 'ready') {
        const empty = emptyHideSet();
        resolvedRef.current = empty;
        hideSetRef.current = empty;
        setHideSet(empty);
        setPhase('unreadable');
        return;
      }

      resolvedRef.current = read.set;
      hideSetRef.current = read.set;
      setHideSet(read.set);
      setPhase('ready');
    });
  }, []);

  function setKind(kind: HideKind, on: boolean): void {
    const current = hideSetRef.current;
    if (current === null) {
      return;
    }

    setSaveFailed(false);
    const next = withKind(current, kind, on);
    hideSetRef.current = next;
    setHideSet(next);
    const ticket = epoch.current + 1;
    epoch.current = ticket;
    inflight.current += 1;

    void requestHideSet(next).then(
      (stored) => {
        inflight.current -= 1;
        if (epoch.current !== ticket) {
          return;
        }
        resolvedRef.current = stored;
        hideSetRef.current = stored;
        setHideSet(stored);
        setPhase('ready');
      },
      () => {
        inflight.current -= 1;
        if (epoch.current !== ticket) {
          return;
        }
        setSaveFailed(true);
        const last = resolvedRef.current;
        if (last === null) {
          return;
        }
        hideSetRef.current = last;
        setHideSet(last);
      },
    );
  }

  return {
    model: popupModel(phase, hideSet, report, countFilterOn),
    setKind,
    saveFailed,
  };
}

function popupModel(
  phase: 'loading' | 'ready' | 'unreadable',
  hideSet: HideSet | null,
  report: PageReport | undefined,
  countFilterOn: boolean,
): PopupModel {
  if (phase === 'loading' || hideSet === null) {
    return { phase: 'loading' };
  }

  if (phase === 'unreadable') {
    const { triggerLabel, menu } = readyPopup(hideSet, report, countFilterOn);
    return {
      phase: 'unreadable',
      text: UNREADABLE_CHOICE_TEXT,
      triggerLabel,
      menu,
    };
  }

  return { phase: 'ready', ...readyPopup(hideSet, report, countFilterOn) };
}

function hostnameOf(url: string | undefined): string | undefined {
  if (url === undefined || url.length === 0) {
    return undefined;
  }

  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}
