import { Ban, Check, Send } from 'lucide-react';
import type { ReactElement } from 'react';
import type { JobView } from '../demo/state';
import { demoStore } from '../demo/install';
import { confirmBlock } from './block';

export function JobDetails(props: {
  readonly job: JobView | undefined;
}): ReactElement {
  const { job } = props;
  if (job === undefined) {
    return <section aria-label="Job details" className="details" />;
  }
  return (
    <section aria-label="Job details" className="details">
      <h2>{job.title}</h2>
      <p className="details-company">{job.company}</p>
      <dl className="facts">
        <dt>Location</dt>
        <dd>
          {job.location === job.workplace
            ? job.location
            : `${job.location} (${job.workplace})`}
        </dd>
        <dt>Posted</dt>
        <dd>{job.postedAgo}</dd>
        <dt>Applicants</dt>
        <dd>{job.applicants.toLocaleString('en-US')}</dd>
      </dl>
      <div className="details-actions">
        <button
          type="button"
          className="key key--medium"
          aria-disabled={job.applied}
          onClick={() => demoStore.apply(job.id)}
        >
          {job.applied ? (
            <Check aria-hidden="true" />
          ) : (
            <Send aria-hidden="true" />
          )}
          {job.applied ? 'Applied' : 'Apply'}
        </button>
        <button
          type="button"
          className="key key--medium"
          onClick={() => confirmBlock(job.company)}
        >
          <Ban aria-hidden="true" />
          Block {job.company}
        </button>
      </div>
      <h3 className="about-title">About the job</h3>
      <ul className="about">
        {job.about.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
