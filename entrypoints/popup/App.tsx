import { useEffect, useRef, useState, type ReactElement } from 'react';
import { browser, type Browser } from 'wxt/browser';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  UNREADABLE_CHOICE_TEXT,
  failedPageReport,
  notJobsListReport,
  readyPopup,
  withKind,
  type HideKind,
  type HideSet,
  type MenuRow,
  type PageReport,
  type PopupModel,
  type StatusLine,
} from '@/lib/hide/domain';
import {
  PAGE_REPORT_PORT,
  parsePageReportMessage,
} from '@/lib/hide/page-report';
import { requestHideSet, watchHideSet } from '@/lib/hide/store';

export default function App() {
  return <PopupApp />;
}

export function PopupApp(): ReactElement {
  const { model, setKind } = useHideSetSession();

  return (
    <main className="flex flex-col px-4 pt-5 pb-14">
      <div className="flex flex-col gap-2">
        <h1 className="text-base font-semibold tracking-tight text-balance">
          LinkedOut
        </h1>
        {model.phase === 'unreadable' ? (
          <p role="status">{model.text}</p>
        ) : null}
        {model.phase === 'ready' ? <StatusText status={model.status} /> : null}
      </div>
      {model.phase === 'ready' ? (
        <HideMenu
          triggerLabel={model.triggerLabel}
          rows={model.menu}
          onSetKind={setKind}
        />
      ) : null}
    </main>
  );
}

function StatusText(props: {
  readonly status: StatusLine;
}): ReactElement | null {
  const { status } = props;
  if (status.kind === 'pending') {
    return null;
  }

  if (status.kind === 'hiding') {
    return (
      <div role="status" className="flex flex-col gap-0.5 text-sm">
        <p>{status.text}</p>
        <p className="tabular-nums">{status.countLine}</p>
      </div>
    );
  }

  return (
    <p role="status" className="text-sm">
      {status.text}
    </p>
  );
}

function HideMenu(props: {
  readonly triggerLabel: string;
  readonly rows: readonly MenuRow[];
  readonly onSetKind: (kind: HideKind, on: boolean) => void;
}): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className="mt-4 flex h-9 w-full cursor-pointer items-center justify-between rounded-md bg-background px-3 text-sm font-medium ring-1 ring-foreground/10 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
      >
        {props.triggerLabel}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {props.rows.map((row) => (
          <DropdownMenuCheckboxItem
            key={row.kind}
            checked={row.checked}
            onSelect={(event) => {
              event.preventDefault();
            }}
            onCheckedChange={(checked) => {
              if (typeof checked !== 'boolean') {
                return;
              }
              props.onSetKind(row.kind, checked);
            }}
          >
            {row.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function useHideSetSession(): {
  readonly model: PopupModel;
  readonly setKind: (kind: HideKind, on: boolean) => void;
} {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'unreadable'>(
    'loading',
  );
  const [hideSet, setHideSet] = useState<HideSet | null>(null);
  const [report, setReport] = useState<PageReport | undefined>(undefined);
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
        resolvedRef.current = null;
        hideSetRef.current = null;
        setHideSet(null);
        setPhase('unreadable');
        return;
      }

      resolvedRef.current = read.set;
      hideSetRef.current = read.set;
      setHideSet(read.set);
      setPhase('ready');
    });
  }, []);

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

  function setKind(kind: HideKind, on: boolean): void {
    const current = hideSetRef.current;
    if (current === null) {
      return;
    }

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
      },
      () => {
        inflight.current -= 1;
        if (epoch.current !== ticket) {
          return;
        }
        const last = resolvedRef.current;
        if (last === null) {
          return;
        }
        hideSetRef.current = last;
        setHideSet(last);
      },
    );
  }

  return { model: popupModel(phase, hideSet, report), setKind };
}

function popupModel(
  phase: 'loading' | 'ready' | 'unreadable',
  hideSet: HideSet | null,
  report: PageReport | undefined,
): PopupModel {
  if (phase === 'unreadable') {
    return { phase: 'unreadable', text: UNREADABLE_CHOICE_TEXT };
  }

  if (phase === 'loading' || hideSet === null) {
    return { phase: 'loading' };
  }

  return { phase: 'ready', ...readyPopup(hideSet, report) };
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
