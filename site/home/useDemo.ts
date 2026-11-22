import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { demoStore } from '../demo/install';
import { jobViews, tally, type DemoState, type JobView, type Tally } from '../demo/state';

export function useDemo(): {
  readonly state: DemoState;
  readonly jobs: readonly JobView[];
  readonly tally: Tally;
} {
  const state = useSyncExternalStore(demoStore.subscribe, demoStore.getState);
  const jobs = useMemo(() => jobViews(state), [state]);
  const counts = useMemo(() => tally(state), [state]);
  return { state, jobs, tally: counts };
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useCountUp(target: number, durationMs = 400): number {
  const [shown, setShown] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    const from = current.current;
    const started = performance.now();
    const reduced = prefersReducedMotion();
    const animation = { frame: 0 };
    const step = (at: number): void => {
      const progress = reduced ? 1 : Math.min(1, (at - started) / durationMs);
      current.current = Math.round(from + (target - from) * (1 - (1 - progress) ** 3));
      setShown(current.current);
      if (progress < 1) {
        animation.frame = requestAnimationFrame(step);
      }
    };
    animation.frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(animation.frame);
    };
  }, [target, durationMs]);
  return shown;
}
