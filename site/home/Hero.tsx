import { Puzzle } from 'lucide-react';
import type { ReactElement } from 'react';
import { STORE_URL } from './links';

export function Hero(): ReactElement {
  return (
    <div className="hero">
      <h1>LinkedIn Jobs, without the noise.</h1>
      <div className="hero-cta">
        <a className="key key--hero" href={STORE_URL}>
          <Puzzle aria-hidden="true" />
          Add to Chrome
        </a>
        <p className="hero-note">Desktop Chrome extension</p>
      </div>
    </div>
  );
}
