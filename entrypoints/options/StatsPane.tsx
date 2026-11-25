import { useState, type ReactElement, type ReactNode } from 'react';
import { dailyBars, weeklyBars } from '@/lib/stats/bars';
import { summarize } from '@/lib/stats/calendar';
import type { StatsCache } from '@/lib/stats/cache';
import { BarChart } from '@/lib/ui/BarChart';
import { ConnectKey } from '@/lib/ui/TrackerKeys';
import { useStatsCache, useStatsRefresh } from '@/lib/ui/stats-session';
import { isConnectedView, type TrackerSession } from '@/lib/ui/tracker-session';

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
        <Connected />
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

function Connected(): ReactElement | null {
  const cache = useStatsCache();
  useStatsRefresh(true);
  if (cache === undefined) {
    return null;
  }
  return <Figures cache={cache} />;
}

export function Figures(props: { readonly cache: StatsCache }): ReactElement {
  const [now] = useState(Date.now);
  if (props.cache === null) {
    return (
      <p className="border-t border-border pt-4 text-muted-foreground">
        Reading your sheet…
      </p>
    );
  }
  const summary = summarize(props.cache.times, now);
  return (
    <>
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
    </>
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
