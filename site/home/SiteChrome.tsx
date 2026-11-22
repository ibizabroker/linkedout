import type { ReactElement } from 'react';
import logoUrl from '@/assets/icon.svg';
import { GITHUB_URL, ISSUES_URL, STORE_URL } from './links';

function Brand(): ReactElement {
  return (
    <a href="./" className="brand">
      <img src={logoUrl} alt="" width={28} height={28} />
      LinkedOut
    </a>
  );
}

export function Topbar(): ReactElement {
  return (
    <div className="wrap">
      <header className="topbar">
        <Brand />
        <nav className="nav" aria-label="Site">
          <a href="privacy/">Privacy</a>
          <a href={GITHUB_URL}>GitHub</a>
        </nav>
      </header>
    </div>
  );
}

export function Footer(): ReactElement {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-main">
          <Brand />
          <nav className="footer-links" aria-label="Footer">
            <a href={STORE_URL}>Add to Chrome</a>
            <a href={GITHUB_URL}>GitHub</a>
            <a href="privacy/">Privacy</a>
            <a href={ISSUES_URL}>Report an issue</a>
          </nav>
        </div>
        <p className="footer-note">
          MIT licensed · Not affiliated with or endorsed by LinkedIn
        </p>
      </div>
    </footer>
  );
}
