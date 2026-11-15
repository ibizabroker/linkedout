import { useEffect, useReducer, type ReactElement } from 'react';
import { Button } from '@/components/ui/button';
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

type Act = (action: UserAction) => void;

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

export function JobTrackerSection(props: {
  readonly view: TrackerView;
  readonly act: Act;
}): ReactElement | null {
  const { view, act } = props;
  if (view.kind === 'unavailable' || view.kind === 'loading') {
    return null;
  }
  return (
    <div className="mt-5 flex flex-col gap-1.5">
      <p className="text-sm font-medium">Job tracker</p>
      <Body view={view} act={act} />
      {view.error === undefined ? null : (
        <p role="alert" className="text-sm text-destructive">
          {view.error}
        </p>
      )}
    </div>
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
        <>
          <p className="text-sm text-muted-foreground">
            Save every job you apply to in a Google Sheet.
          </p>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={view.busy}
            onClick={() => {
              act('connect');
            }}
          >
            {view.busy ? 'Connecting…' : 'Connect Google Sheets'}
          </Button>
        </>
      );
    case 'connected':
      return (
        <>
          <p className="text-sm text-muted-foreground">
            Tracking to{' '}
            <strong className="font-medium text-foreground">
              LinkedOut Job Tracker
            </strong>
          </p>
          <SyncLines sync={view.sync} busy={view.busy} act={act} />
          <div className="flex gap-2">
            <Button asChild variant="outline" size="lg" className="flex-1">
              <a href={view.sheet.url} target="_blank" rel="noreferrer">
                Open sheet
              </a>
            </Button>
            <DisconnectButton busy={view.busy} act={act} />
          </div>
        </>
      );
    case 'missing':
      return (
        <>
          <p className="text-sm text-muted-foreground">Sheet not found.</p>
          <SyncLines sync={view.sync} busy={view.busy} act={act} />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1"
              disabled={view.busy}
              onClick={() => {
                act('recreate');
              }}
            >
              Create a new one
            </Button>
            <DisconnectButton busy={view.busy} act={act} />
          </div>
        </>
      );
    default:
      return unexpectedView(view);
  }
}

function jobCount(count: number): string {
  return `${count} ${count === 1 ? 'job' : 'jobs'}`;
}

function SyncLines(props: {
  readonly sync: SyncSummary;
  readonly busy: boolean;
  readonly act: Act;
}): ReactElement {
  const { sync, busy, act } = props;
  return (
    <>
      {sync.added === 0 ? null : (
        <p className="text-sm text-muted-foreground">
          {jobCount(sync.added)} added
        </p>
      )}
      {sync.waiting === 0 ? null : (
        <p className="text-sm text-muted-foreground">
          {jobCount(sync.waiting)} waiting to sync
        </p>
      )}
      {sync.authExpired ? (
        <>
          <p className="text-sm text-destructive">Google sign-in expired.</p>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={busy}
            onClick={() => {
              act('reconnect');
            }}
          >
            Reconnect
          </Button>
        </>
      ) : null}
    </>
  );
}

function DisconnectButton(props: {
  readonly busy: boolean;
  readonly act: Act;
}): ReactElement {
  return (
    <Button
      type="button"
      variant="ghost"
      size="lg"
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
