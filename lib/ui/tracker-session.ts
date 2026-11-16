import { useEffect, useReducer, useState } from 'react';
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

export type Act = (action: UserAction) => void;

export type TrackerSession = {
  readonly view: TrackerView;
  readonly act: Act;
  readonly pending: UserAction | undefined;
};

export type ConnectedView = Extract<TrackerView, { kind: 'connected' | 'missing' }>;

export function useTrackerSession(): TrackerSession {
  const [view, dispatch] = useReducer(trackerReducer, oauthConfigured(), initialView);
  const [pending, setPending] = useState<UserAction | undefined>(undefined);

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
    setPending(action);
    const failure = action === 'disconnect' ? DISCONNECT_FAILED_TEXT : CONNECT_FAILED_TEXT;
    requestTrackerAction(action).then(
      (reply) => {
        setPending(undefined);
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
        setPending(undefined);
        dispatch({ type: 'failed', error: failure });
      },
    );
  };

  return { view, act, pending };
}

export function isConnectedView(view: TrackerView): view is ConnectedView {
  return view.kind === 'connected' || view.kind === 'missing';
}

export function isSignInExpired(view: TrackerView): boolean {
  return isConnectedView(view) && view.sync.authExpired;
}

export function jobCount(count: number): string {
  return `${count} ${count === 1 ? 'job' : 'jobs'}`;
}

export function syncText(sync: SyncSummary): string {
  const added = `${jobCount(sync.added)} added`;
  return sync.waiting === 0 ? added : `${added} · ${sync.waiting} waiting`;
}

export type AccountStatus = {
  readonly text: string;
  readonly needsYou: boolean;
};

export function accountStatus(view: TrackerView): AccountStatus | undefined {
  switch (view.kind) {
    case 'unavailable':
    case 'loading':
      return undefined;
    case 'disconnected':
      return { text: 'Off', needsYou: false };
    case 'connected':
    case 'missing':
      return view.kind === 'missing' || view.sync.authExpired
        ? { text: 'Needs you', needsYou: true }
        : { text: 'On', needsYou: false };
    default:
      return unexpectedView(view);
  }
}

function unexpectedView(value: never): never {
  throw new Error(`Unexpected tracker view: ${JSON.stringify(value)}`);
}
