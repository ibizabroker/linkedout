import { useEffect, useId, useRef, useState, type ReactElement } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  APPLICANT_STOPS,
  offLimit,
  parseTypedMax,
  stopIndex,
  type ApplicantLimit,
} from '@/lib/hide/applicants';
import {
  requestApplicantLimit,
  watchApplicantLimit,
} from '@/lib/hide/applicant-store';

export const LIMIT_SAVE_FAILED_TEXT =
  'Your applicant limit could not be saved. Try again.';

export type LimitSession = {
  readonly limit: ApplicantLimit | undefined;
  readonly draftMax: number | undefined;
  readonly failed: boolean;
  readonly setEnabled: (enabled: boolean) => void;
  readonly previewMax: (max: number) => void;
  readonly commitMax: (max: number) => void;
};

export function useApplicantLimitSession(
  preview: (limit: ApplicantLimit) => void,
): LimitSession {
  const [limit, setLimit] = useState<ApplicantLimit | undefined>(undefined);
  const [draftMax, setDraftMax] = useState<number | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const limitRef = useRef<ApplicantLimit | undefined>(undefined);
  const savedRef = useRef<ApplicantLimit | undefined>(undefined);
  const ticket = useRef(0);
  const inflight = useRef(0);

  useEffect(() => {
    return watchApplicantLimit((read) => {
      if (inflight.current > 0) {
        return;
      }
      const next = read.status === 'ready' ? read.limit : offLimit();
      limitRef.current = next;
      savedRef.current = next;
      setLimit(next);
    });
  }, []);

  function save(next: ApplicantLimit): void {
    setFailed(false);
    limitRef.current = next;
    setLimit(next);
    setDraftMax(undefined);
    const mine = ticket.current + 1;
    ticket.current = mine;
    inflight.current += 1;
    void requestApplicantLimit(next).then(
      (stored) => {
        inflight.current -= 1;
        if (ticket.current === mine) {
          limitRef.current = stored;
          savedRef.current = stored;
          setLimit(stored);
        }
      },
      () => {
        inflight.current -= 1;
        if (ticket.current !== mine) {
          return;
        }
        setFailed(true);
        const last = savedRef.current;
        if (last !== undefined) {
          limitRef.current = last;
          setLimit(last);
          preview(last);
        }
      },
    );
  }

  return {
    limit,
    draftMax,
    failed,
    setEnabled(enabled) {
      const current = limitRef.current;
      if (current !== undefined) {
        save({ enabled, max: current.max });
      }
    },
    previewMax(max) {
      const current = limitRef.current;
      if (current !== undefined) {
        setDraftMax(max);
        preview({ enabled: current.enabled, max });
      }
    },
    commitMax(max) {
      const current = limitRef.current;
      if (current !== undefined) {
        save({ enabled: current.enabled, max });
      }
    },
  };
}

export function ApplicantLimitSection(props: {
  readonly session: LimitSession;
}): ReactElement | null {
  const { limit, draftMax, setEnabled, previewMax, commitMax } = props.session;
  const checkId = useId();
  const [typed, setTyped] = useState<string | undefined>(undefined);
  if (limit === undefined) {
    return null;
  }

  const max = draftMax ?? limit.max;
  const shown = typed ?? String(max);

  function commitTyped(): void {
    const value = parseTypedMax(shown) ?? limit?.max;
    setTyped(undefined);
    if (value === undefined) {
      return;
    }
    if (value === limit?.max) {
      previewMax(value);
    } else {
      commitMax(value);
    }
  }

  return (
    <div className="mt-5 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Checkbox
          id={checkId}
          checked={limit.enabled}
          onCheckedChange={(checked) => {
            if (typeof checked === 'boolean') {
              setEnabled(checked);
            }
          }}
        />
        <label htmlFor={checkId} className="text-sm font-medium">
          Hide by applicant count
        </label>
      </div>
      <div className="flex items-center gap-3">
        <Slider
          min={0}
          max={APPLICANT_STOPS.length - 1}
          step={1}
          value={[stopIndex(max)]}
          disabled={!limit.enabled}
          onValueChange={([index]) => {
            const stop =
              index === undefined ? undefined : APPLICANT_STOPS[index];
            if (stop !== undefined) {
              setTyped(undefined);
              previewMax(stop);
            }
          }}
          onValueCommit={([index]) => {
            const stop =
              index === undefined ? undefined : APPLICANT_STOPS[index];
            if (stop !== undefined) {
              commitMax(stop);
            }
          }}
          thumbProps={{
            'aria-label': 'Applicant limit',
            'aria-valuetext': `${max} applicants`,
          }}
        />
        <Input
          aria-label="Applicant limit number"
          inputMode="numeric"
          className="w-16 shrink-0 text-right"
          value={shown}
          disabled={!limit.enabled}
          onChange={(event) => {
            const text = event.target.value;
            setTyped(text);
            const value = parseTypedMax(text);
            if (value !== undefined) {
              previewMax(value);
            }
          }}
          onBlur={commitTyped}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              commitTyped();
            }
          }}
        />
      </div>
    </div>
  );
}
