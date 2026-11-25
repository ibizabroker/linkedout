import { useState, type ReactElement, type ReactNode } from 'react';
import { dailyBars, longDate, shortDate, weeklyBars } from '@/lib/stats/bars';
import { relativeTime } from '@/lib/stats/relative';
import { bests } from '@/lib/stats/series';
import { summarize } from '@/lib/stats/calendar';
import type { StatsCache } from '@/lib/stats/cache';
import { BarChart } from '@/lib/ui/BarChart';
import { ConnectKey } from '@/lib/ui/TrackerKeys';
import { useStatsCache, useStatsRefresh } from '@/lib/ui/stats-session';
import {
  isConnectedView,
  isSignInExpired,
  type ConnectedView,
  type TrackerSession,
} from '@/lib/ui/tracker-session';

export function StatsPane(props: {
  readonly session: TrackerSession;
}): ReactElement {
  const { session } = props;
  const { view } = session;
  return (
    <>
      <h1 className="text-xl font-semibold">Stats</h1>
      <p className="mt-1 mb-5 text-muted-foreground">
        Counted from the Applied on column of your tracker sheet.
      </p>
      {isConnectedView(view) ? (
        <Connected view={view} />
      ) : (
        <div className="flex items-center gap-3 border-t border-border pt-4">
          <p className="flex-1 text-muted-foreground">
            Connect Google Sheets to see how many jobs you have applied to.
          </p>
          <ConnectKey session={session} />
        </div>
      )}
    </>
  );
}

function Connected(props: {
  readonly view: ConnectedView;
}): ReactElement | null {
  const cache = useStatsCache();
  const { failed } = useStatsRefresh(true);
  if (cache === undefined) {
    return null;
  }
  const stale =
    failed && props.view.kind === 'connected' && !isSignInExpired(props.view);
  return <Figures cache={cache} stale={stale} />;
}

export function Figures(props: {
  readonly cache: StatsCache;
  readonly stale?: boolean;
}): ReactElement {
  const [now] = useState(Date.now);
  if (props.cache === null) {
    return (
      <p className="border-t border-border pt-4 text-muted-foreground">
        {props.stale === true
          ? "Couldn't read your sheet."
          : 'Reading your sheet…'}
      </p>
    );
  }
  const summary = summarize(props.cache.times, now);
  return (
    <>
      {props.stale === true ? (
        <p className="mb-3 text-muted-foreground">
          Last updated {relativeTime(props.cache.readAt, now)}
        </p>
      ) : null}
      <dl className="grid grid-cols-4 gap-4 border-t border-border pt-4">
        <Headline label="Today" value={summary.today} />
        <Headline label="This week" value={summary.thisWeek} />
        <Headline label="This month" value={summary.thisMonth} />
        <Headline label="All time" value={summary.allTime} />
      </dl>
      <ChartSection heading="Per day, last 30 days">
        <BarChart
          title="Applications per day, last 30 days"
          unit="applications"
          bars={dailyBars(props.cache.times, now)}
        />
      </ChartSection>
      <ChartSection heading="Per week, last 12 weeks">
        <BarChart
          title="Applications per week, last 12 weeks"
          unit="applications"
          bars={weeklyBars(props.cache.times, now)}
        />
      </ChartSection>
      <BestsList times={props.cache.times} now={now} />
    </>
  );
}

function BestsList(props: {
  readonly times: readonly number[];
  readonly now: number;
}): ReactElement {
  const { bestDay, bestWeek, weeklyAverage } = bests(props.times, props.now);
  return (
    <dl className="mt-8 border-t border-border">
      <BestRow
        label="Best day"
        value={
          bestDay === null
            ? '–'
            : `${bestDay.count} · ${longDate(bestDay.dayStart)}`
        }
      />
      <BestRow
        label="Best week"
        value={
          bestWeek === null
            ? '–'
            : `${bestWeek.count} · week of ${shortDate(bestWeek.weekStart)}`
        }
      />
      <BestRow
        label="Weekly average"
        value={String(Math.round(weeklyAverage * 10) / 10)}
      />
    </dl>
  );
}

function BestRow(props: {
  readonly label: string;
  readonly value: string;
}): ReactElement {
  return (
    <div className="flex h-11 items-center gap-3 border-b border-border">
      <dt className="w-[150px] shrink-0 text-muted-foreground">
        {props.label}
      </dt>
      <dd className="tabular-nums">{props.value}</dd>
    </div>
  );
}

function Headline(props: {
  readonly label: string;
  readonly value: number;
}): ReactElement {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{props.label}</dt>
      <dd className="text-xl font-semibold tabular-nums">{props.value}</dd>
    </div>
  );
}

function ChartSection(props: {
  readonly heading: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-xs text-muted-foreground">{props.heading}</h2>
      {props.children}
    </section>
  );
}
