import { Ban, Send } from 'lucide-react';
import type { ReactElement } from 'react';
import type { JobView } from '../demo/state';
import { demoStore } from '../demo/install';
import { confirmBlock } from './block';

const BADGES = [
  ['applied', 'Applied'],
  ['viewed', 'Viewed'],
  ['saved', 'Saved'],
  ['reposted', 'Reposted'],
] as const;

export function monogram(company: string): string {
  return company
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export function JobList(props: {
  readonly jobs: readonly JobView[];
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
}): ReactElement {
  return (
    <ul aria-label="Jobs" className="list">
      {props.jobs.map((job) => {
        const badges = BADGES.filter(([flag]) => job[flag]).map(
          ([, text]) => text,
        );
        return (
          <li
            key={job.id}
            className="fold"
            data-job={job.id}
            data-hidden={job.hidden}
            inert={job.hidden}
          >
            <div className="clip">
              <div className="card" data-selected={job.id === props.selectedId}>
                <button
                  type="button"
                  className="card-main"
                  aria-current={
                    job.id === props.selectedId ? 'true' : undefined
                  }
                  onClick={() => props.onSelect(job.id)}
                >
                  <span className="mono" aria-hidden="true">
                    {monogram(job.company)}
                  </span>
                  <span className="card-text">
                    <span className="card-title">{job.title}</span>
                    <span className="card-company">{job.company}</span>
                    <span className="card-meta">
                      {job.location} · {job.postedAgo} ·{' '}
                      {job.applicants.toLocaleString('en-US')} applicants
                    </span>
                    {badges.length > 0 ? (
                      <span className="card-badges">{badges.join(' · ')}</span>
                    ) : null}
                  </span>
                </button>
                <div className="card-actions">
                  <button
                    type="button"
                    className="key key--small mobile-only"
                    aria-disabled={job.applied}
                    onClick={() => demoStore.apply(job.id)}
                  >
                    <Send aria-hidden="true" />
                    {job.applied ? 'Applied' : 'Apply'}
                  </button>
                  <button
                    type="button"
                    className="key key--small"
                    aria-label={`Block ${job.company}`}
                    onClick={() => confirmBlock(job.company)}
                  >
                    <Ban aria-hidden="true" />
                    Block
                  </button>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
