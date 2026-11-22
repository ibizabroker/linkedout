import type { ReactElement } from 'react';
import type { Tally, TallySegment } from '../demo/state';
import { useCountUp } from './useDemo';

type Part = {
  readonly id: string;
  readonly count: number;
  readonly label: string;
  readonly cleared: boolean;
};

function parts(tally: Tally): readonly Part[] {
  const struck = (id: string, segment: TallySegment, label: string): Part => ({
    id,
    count: segment.count,
    label,
    cleared: segment.cleared,
  });
  return [
    { id: 'total', count: tally.total, label: 'jobs', cleared: false },
    struck('applied', tally.applied, 'applied'),
    struck('viewed', tally.viewed, 'viewed'),
    struck('saved', tally.saved, 'saved'),
    struck('reposted', tally.reposted, 'reposted'),
    struck('agencies', tally.agencies, 'from agencies'),
    ...(tally.overLimit.count > 0
      ? [struck('over-limit', tally.overLimit, 'over the limit')]
      : []),
  ];
}

export function TallyLine(props: { readonly tally: Tally }): ReactElement {
  const list = parts(props.tally);
  const worth = useCountUp(props.tally.visible);
  const spoken = [
    ...list.map(
      (part) => `${part.count} ${part.label}${part.cleared ? ', cleared' : ''}`,
    ),
    `${props.tally.visible} still showing`,
  ].join('. ');

  return (
    <div className="tally" aria-live="polite" aria-atomic="true">
      <p className="tally-line" aria-hidden="true">
        {list.map((part) => (
          <span
            key={part.id}
            className="seg"
            data-seg={part.id}
            data-cleared={part.cleared}
          >
            <span className="seg-text">
              <b>{part.count.toLocaleString('en-US')}</b> {part.label}
            </span>
          </span>
        ))}
        <span className="seg seg-worth" data-seg="worth">
          <span className="seg-text">
            <b>{worth}</b> still showing
          </span>
        </span>
      </p>
      <p className="sr">{spoken}</p>
    </div>
  );
}
