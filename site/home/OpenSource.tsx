import { ArrowUpRight } from 'lucide-react';
import type { ReactElement } from 'react';
import { GITHUB_URL } from './links';

export function OpenSource(): ReactElement {
  return (
    <section className="oss" aria-labelledby="oss-title">
      <h2 id="oss-title">Open source, with no servers and no analytics.</h2>
      <div className="oss-body">
        <p>
          LinkedOut is free and MIT licensed, so you can read every line it
          runs. It has no servers of its own and no analytics. What it keeps
          stays in your browser, or in your own Google Drive if you connect the
          tracker.
        </p>
        <a className="key key--medium" href={GITHUB_URL}>
          <ArrowUpRight aria-hidden="true" />
          View on GitHub
        </a>
      </div>
    </section>
  );
}
