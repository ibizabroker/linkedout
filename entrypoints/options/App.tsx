import { useEffect, useState, type ReactElement } from 'react';
import logoUrl from '@/assets/icon.svg';
import { AccountPane } from './AccountPane';
import { StatsPane } from './StatsPane';
import {
  BlockedCompaniesPane,
  useBlocklistSession,
} from '@/lib/ui/BlockedCompanies';
import { accountStatus, useTrackerSession } from '@/lib/ui/tracker-session';

type PaneId = 'blocked' | 'account' | 'stats';

function paneFromHash(hash: string, accountAvailable: boolean): PaneId {
  if (!accountAvailable) {
    return 'blocked';
  }
  return hash === '#account'
    ? 'account'
    : hash === '#stats'
      ? 'stats'
      : 'blocked';
}

function useHash(): string {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = (): void => {
      setHash(window.location.hash);
    };
    window.addEventListener('hashchange', onChange);
    return () => {
      window.removeEventListener('hashchange', onChange);
    };
  }, []);
  return hash;
}

export default function App(): ReactElement {
  const blocklist = useBlocklistSession();
  const tracker = useTrackerSession();
  const status = accountStatus(tracker.view);
  const accountAvailable = tracker.view.kind !== 'unavailable';
  const pane = paneFromHash(useHash(), accountAvailable);

  return (
    <div className="settings flex h-screen flex-col md:flex-row">
      <nav
        aria-label="Settings"
        className="flex flex-none flex-col gap-1 border-b border-border px-2 py-3 md:w-[280px] md:border-r md:border-b-0 md:p-4"
      >
        <div className="flex items-center gap-2.5 px-3 pb-2 text-base font-semibold md:pt-1 md:pb-4">
          <img src={logoUrl} alt="" width={22} height={22} />
          LinkedOut Settings
        </div>
        <div className="flex flex-wrap gap-0.5 md:gap-1 md:flex-col md:flex-nowrap">
          <NavItem
            href="#blocked"
            current={pane === 'blocked'}
            label="Blocked companies"
            aside={blocklist.companies?.length?.toString()}
          />
          {accountAvailable ? (
            <>
              <NavItem
                href="#stats"
                current={pane === 'stats'}
                label="Stats"
                aside={undefined}
              />
              <NavItem
                href="#account"
                current={pane === 'account'}
                label="Account"
                aside={status?.text}
                alert={status?.needsYou}
              />
            </>
          ) : null}
        </div>
      </nav>
      <main className="relative min-w-0 flex-1 overflow-y-auto px-5 pt-6 pb-8 sm:px-8 md:pt-9 lg:px-14">
        <div className="mx-auto flex min-h-full max-w-[760px] flex-col">
          {pane === 'account' ? (
            <AccountPane session={tracker} />
          ) : pane === 'stats' ? (
            <StatsPane session={tracker} />
          ) : (
            <BlockedCompaniesPane
              companies={blocklist.companies}
              failureText={blocklist.failureText}
              onUnblock={blocklist.unblock}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem(props: {
  readonly href: string;
  readonly current: boolean;
  readonly label: string;
  readonly aside: string | undefined;
  readonly alert?: boolean;
}): ReactElement {
  return (
    <a
      href={props.href}
      aria-current={props.current ? 'page' : undefined}
      className={`flex h-9 flex-none items-center gap-1.5 rounded-md whitespace-nowrap md:flex-auto md:gap-2 md:px-3 border border-b-2 px-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background ${props.current ? 'border-border border-b-key-edge bg-key font-semibold' : 'border-transparent hover:bg-muted'}`}
    >
      <span className="md:flex-1">{props.label}</span>
      {props.aside === undefined ? null : (
        <span
          className={`text-[13px] font-normal tabular-nums ${props.alert === true ? 'text-destructive' : 'hidden text-muted-foreground sm:inline'}`}
        >
          {props.aside}
        </span>
      )}
    </a>
  );
}
