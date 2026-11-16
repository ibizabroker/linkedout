import type { ReactElement } from 'react';
import { Group, Row } from './Group';
import {
  ConnectKey,
  NewSheetKey,
  OpenSheetKey,
  ReconnectKey,
} from '@/lib/ui/TrackerKeys';
import {
  isConnectedView,
  isSignInExpired,
  syncText,
  type TrackerSession,
} from '@/lib/ui/tracker-session';

export function trackedReadout(
  session: TrackerSession,
): { readonly added: number; readonly waiting: number } | undefined {
  return isConnectedView(session.view) ? session.view.sync : undefined;
}

export function TrackerProblem(props: {
  readonly session: TrackerSession;
}): ReactElement | null {
  if (!isSignInExpired(props.session.view)) {
    return null;
  }
  return (
    <div className="flex h-9 items-center gap-2 border-t border-border pr-2.5 pl-3">
      <span className="flex-1 text-destructive">Google sign-in expired.</span>
      <ReconnectKey session={props.session} />
    </div>
  );
}

export function JobTrackerSection(props: {
  readonly session: TrackerSession;
}): ReactElement | null {
  const { view } = props.session;
  if (view.kind === 'unavailable' || view.kind === 'loading') {
    return null;
  }
  return (
    <Group label="Job tracker">
      <Body session={props.session} />
      {view.error === undefined ? null : (
        <p role="alert" className="px-3 py-1 text-destructive">
          {view.error}
        </p>
      )}
    </Group>
  );
}

function Body(props: {
  readonly session: TrackerSession;
}): ReactElement | null {
  const { view } = props.session;
  switch (view.kind) {
    case 'disconnected':
      return (
        <Row label="Sheet" keyed="text">
          <span className="flex-1" />
          <ConnectKey session={props.session} />
        </Row>
      );
    case 'connected':
      return (
        <>
          <Row label="Sheet" keyed="icon">
            <span className="flex-1 truncate">{view.sheet.name}</span>
            <OpenSheetKey sheet={view.sheet} />
          </Row>
          <Row label="Status">
            <span className="flex-1 truncate">{syncText(view.sync)}</span>
          </Row>
        </>
      );
    case 'missing':
      return (
        <Row label="Sheet" keyed="text">
          <span className="flex-1 truncate text-destructive">Not found</span>
          <NewSheetKey session={props.session} />
        </Row>
      );
    case 'unavailable':
    case 'loading':
      return null;
    default:
      return unexpectedView(view);
  }
}

function unexpectedView(value: never): never {
  throw new Error(`Unexpected tracker view: ${JSON.stringify(value)}`);
}
