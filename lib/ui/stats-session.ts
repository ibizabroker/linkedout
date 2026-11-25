import { useEffect, useState } from 'react';
import { watchStats, type StatsCache } from '@/lib/stats/cache';

export function useStatsCache(): StatsCache | undefined {
  const [cache, setCache] = useState<StatsCache | undefined>(undefined);
  useEffect(() => watchStats(setCache), []);
  return cache;
}
