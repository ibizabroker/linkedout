import { useEffect, useState } from 'react';
import { watchStats, type StatsCache } from '@/lib/stats/cache';
import { requestStatsRefresh } from '@/lib/tracker/store';

export function useStatsCache(): StatsCache | undefined {
  const [cache, setCache] = useState<StatsCache | undefined>(undefined);
  useEffect(() => watchStats(setCache), []);
  return cache;
}

export function useStatsRefresh(enabled: boolean): { readonly failed: boolean } {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!enabled) {
      return;
    }
    let stopped = false;
    void requestStatsRefresh().then(
      (reply) => {
        if (!stopped) {
          setFailed(reply.status === 'failed');
        }
      },
      () => {
        if (!stopped) {
          setFailed(true);
        }
      },
    );
    return () => {
      stopped = true;
    };
  }, [enabled]);
  return { failed };
}
