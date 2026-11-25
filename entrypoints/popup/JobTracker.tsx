import { useEffect, useState, type ReactElement } from 'react';
import { Figure, Group, Row } from './Group';
import {
  ConnectKey,
  NewSheetKey,
  OpenSheetKey,
  ReconnectKey,
} from '@/lib/ui/TrackerKeys';
import { summarize } from '@/lib/stats/calendar';
import { requestStatsRefresh } from '@/lib/tracker/store';
import { useStatsCache } from '@/lib/ui/stats-session';
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
          <StatsStrip />
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

function StatsStrip(): ReactElement | null {
  const cache = useStatsCache();
  const [now] = useState(Date.now);
  const missing = cache === null;
  useEffect(() => {
    if (missing) {
      void requestStatsRefresh().catch(() => undefined);
    }
  }, [missing]);
  if (cache === undefined || cache === null) {
    return null;
  }
  return <StatsLine {...summarize(cache.times, now)} />;
}

export function StatsLine(props: {
  readonly today: number;
  readonly thisWeek: number;
  readonly lastWeek: number;
}): ReactElement {
  const { today, thisWeek, lastWeek } = props;
  return (
    <p className="flex h-7 items-center gap-x-1 pr-3 pl-3 text-muted-foreground">
      <span>
        Today <Figure>{today}</Figure>
      </span>
      <span aria-hidden="true">·</span>
      <span>
        This week <Figure>{thisWeek}</Figure>
      </span>
      <span aria-hidden="true">·</span>
      <span>
        Last week <Figure>{lastWeek}</Figure>
      </span>
    </p>
  );
}

function unexpectedView(value: never): never {
  throw new Error(`Unexpected tracker view: ${JSON.stringify(value)}`);
}
