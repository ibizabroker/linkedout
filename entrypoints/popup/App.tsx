import { useEffect, useRef, useState, type ReactElement } from 'react';
import { browser, type Browser } from 'wxt/browser';
import { ChevronDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from '@/lib/hide/page-report';
import { requestHideSet, watchHideSet } from '@/lib/hide/store';

export default function App() {
  return <PopupApp />;
}

export function PopupApp(): ReactElement {
  const { model, setKind, saveFailed } = useHideSetSession();

  const status = statusLine(model, saveFailed);

  return (
    <main className="flex flex-col px-4 pt-5 pb-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-base font-semibold tracking-tight text-balance">
          LinkedOut
        </h1>
        <p
          role="status"
          className={`min-h-5 text-sm ${TONE_CLASS[status.tone]}`}
        >
          {status.text}
        </p>
      </div>
      {model.phase === 'loading' ? null : (
        <HideMenu
          triggerLabel={model.triggerLabel}
          rows={model.menu}
          onSetKind={setKind}
        />
      )}
    </main>
  );
}

type Tone = 'plain' | 'muted' | 'failure';

const TONE_CLASS: Record<Tone, string> = {
  plain: 'text-foreground',
  muted: 'text-muted-foreground',
  failure: 'text-destructive',
};

const SAVE_FAILED_TEXT = 'Your choice could not be saved. Try again.';

function statusLine(
  model: PopupModel,
  saveFailed: boolean,
): { readonly text: string; readonly tone: Tone } {
  if (saveFailed) {
    return { text: SAVE_FAILED_TEXT, tone: 'failure' };
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
      return { text: status.text, tone: 'plain' };
    case 'elsewhere':
      return { text: status.text, tone: 'muted' };
    default:
      return unexpectedStatus(status);
  }
}

function unexpectedStatus(value: never): never {
  throw new Error(`Unexpected status: ${JSON.stringify(value)}`);
}

function HideMenu(props: {
  readonly triggerLabel: string;
  readonly rows: readonly MenuRow[];
  readonly onSetKind: (kind: HideKind, on: boolean) => void;
}): ReactElement {
  return (
    <div className="mt-5 flex flex-col gap-1.5">
      <p className="text-sm font-medium">Hide from results</p>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full justify-between font-normal"
            aria-label={`Hide from results: ${props.triggerLabel}`}
          >
            {props.triggerLabel}
            <ChevronDownIcon
              data-icon="inline-end"
              className="text-muted-foreground transition-transform duration-150 group-aria-expanded/button:rotate-180"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="ring-inset">
          {props.rows.map((row) => (
            <DropdownMenuCheckboxItem
              key={row.kind}
              className="pl-[7px] **:data-[slot=dropdown-menu-checkbox-item-indicator]:right-[5px]"
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
    </div>
  );
}

function useHideSetSession(): {
  readonly model: PopupModel;
  readonly setKind: (kind: HideKind, on: boolean) => void;
  readonly saveFailed: boolean;
} {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'unreadable'>(
    'loading',
  );
  const [hideSet, setHideSet] = useState<HideSet | null>(null);
  const [report, setReport] = useState<PageReport | undefined>(undefined);
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

  return { model: popupModel(phase, hideSet, report), setKind, saveFailed };
}

function popupModel(
  phase: 'loading' | 'ready' | 'unreadable',
  hideSet: HideSet | null,
  report: PageReport | undefined,
): PopupModel {
  if (phase === 'loading' || hideSet === null) {
    return { phase: 'loading' };
  }

  if (phase === 'unreadable') {
    const { triggerLabel, menu } = readyPopup(hideSet, report);
    return {
      phase: 'unreadable',
      text: UNREADABLE_CHOICE_TEXT,
      triggerLabel,
      menu,
    };
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
