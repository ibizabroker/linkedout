import { useEffect, useReducer, type ReactElement } from 'react';
import { Button } from '@/components/ui/button';
import { Group, Row } from './Group';
import {
  CONNECT_FAILED_TEXT,
  initialView,
  summarizeSync,
  trackerReducer,
  type SyncSummary,
  type TrackerView,
} from '@/lib/tracker/domain';
import type { UserAction } from '@/lib/tracker/messages';
import { oauthConfigured, watchTracker } from '@/lib/tracker/snapshot';
import { requestTrackerAction, requestTrackerCheck } from '@/lib/tracker/store';

const DISCONNECT_FAILED_TEXT = "Couldn't disconnect. Try again.";

export function useTrackerSession(): {
  readonly view: TrackerView;
  readonly act: Act;
} {
  const [view, dispatch] = useReducer(
    trackerReducer,
    oauthConfigured(),
    initialView,
  );

  useEffect(() => {
    if (!oauthConfigured()) {
      return;
    }
    let first = true;
    return watchTracker((snapshot) => {
      dispatch({
        type: 'stored',
        sheet: snapshot.connection?.sheet ?? null,
        sync: summarizeSync(snapshot.sync, snapshot.authExpired),
      });
      if (first && snapshot.connection !== null) {
        void requestTrackerCheck().then(
          (result) => {
            dispatch({ type: 'checked', result });
          },
          () => undefined,
        );
      }
      first = false;
    });
  }, []);

  const act: Act = (action) => {
    dispatch({ type: 'started' });
    const failure =
      action === 'disconnect' ? DISCONNECT_FAILED_TEXT : CONNECT_FAILED_TEXT;
    requestTrackerAction(action).then(
      (reply) => {
        if (reply.status === 'done') {
          dispatch({ type: 'succeeded' });
        } else {
          dispatch({
            type: 'failed',
            error: reply.status === 'failed' ? failure : undefined,
          });
        }
      },
      () => {
        dispatch({ type: 'failed', error: failure });
      },
    );
  };

  return { view, act };
}

type Act = (action: UserAction) => void;

export function trackedReadout(
  view: TrackerView,
): { readonly added: number; readonly waiting: number } | undefined {
  return view.kind === 'connected' || view.kind === 'missing'
    ? view.sync
    : undefined;
}

export function TrackerProblem(props: {
  readonly view: TrackerView;
  readonly act: Act;
}): ReactElement | null {
  const { view, act } = props;
  if (
    (view.kind !== 'connected' && view.kind !== 'missing') ||
    !view.sync.authExpired
  ) {
    return null;
  }
  return (
    <div className="flex items-center gap-2 border-t border-border py-1.5 pr-2 pl-3">
      <span className="flex-1 text-destructive">Google sign-in expired.</span>
      <Button
        type="button"
        size="sm"
        disabled={view.busy}
        onClick={() => {
          act('reconnect');
        }}
      >
        Reconnect
      </Button>
    </div>
  );
}

export function JobTrackerSection(props: {
  readonly view: TrackerView;
  readonly act: Act;
}): ReactElement | null {
  const { view, act } = props;
  if (view.kind === 'unavailable' || view.kind === 'loading') {
    return null;
  }
  return (
    <Group label="Job tracker">
      <Body view={view} act={act} />
      {view.error === undefined ? null : (
        <p role="alert" className="px-3 py-1 text-destructive">
          {view.error}
        </p>
      )}
    </Group>
  );
}

function Body(props: {
  readonly view: Exclude<TrackerView, { kind: 'unavailable' | 'loading' }>;
  readonly act: Act;
}): ReactElement {
  const { view, act } = props;
  switch (view.kind) {
    case 'disconnected':
      return (
        <div className="flex min-h-7 items-center gap-3 pr-2 pl-3">
          <span className="flex-1 text-muted-foreground">
            Save every job you apply to in a Google Sheet.
          </span>
          <Button
            type="button"
            size="sm"
            disabled={view.busy}
            onClick={() => {
              act('connect');
            }}
          >
            {view.busy ? 'Connecting…' : 'Connect Google Sheets'}
          </Button>
        </div>
      );
    case 'connected':
      return (
        <>
          <Row label="Sheet">
            <span className="flex-1 truncate">{view.sheet.name}</span>
            <Button asChild variant="outline" size="sm">
              <a
                href={view.sheet.url}
                target="_blank"
                rel="noreferrer"
                aria-label="Open sheet"
              >
                Open
              </a>
            </Button>
          </Row>
          <Row label="Status">
            <span className="flex-1 truncate">{syncText(view.sync)}</span>
            <DisconnectButton busy={view.busy} act={act} />
          </Row>
        </>
      );
    case 'missing':
      return (
        <>
          <Row label="Sheet">
            <span className="flex-1 truncate">{view.sheet.name}</span>
            <DisconnectButton busy={view.busy} act={act} />
          </Row>
          <Row label="Status">
            <span className="flex-1 truncate">Sheet not found.</span>
            <Button
              type="button"
              size="sm"
              disabled={view.busy}
              onClick={() => {
                act('recreate');
              }}
            >
              Create a new one
            </Button>
          </Row>
        </>
      );
    default:
      return unexpectedView(view);
  }
}

function jobCount(count: number): string {
  return `${count} ${count === 1 ? 'job' : 'jobs'}`;
}

function syncText(sync: SyncSummary): string {
  const added = `${jobCount(sync.added)} added`;
  return sync.waiting === 0 ? added : `${added} · ${sync.waiting} waiting`;
}

function DisconnectButton(props: {
  readonly busy: boolean;
  readonly act: Act;
}): ReactElement {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={props.busy}
      onClick={() => {
        props.act('disconnect');
      }}
    >
      Disconnect
    </Button>
  );
}

function unexpectedView(value: never): never {
  throw new Error(`Unexpected tracker view: ${JSON.stringify(value)}`);
}
