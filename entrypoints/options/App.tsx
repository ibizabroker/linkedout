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
    <div className="settings flex min-h-screen">
      <nav
        aria-label="Settings"
        className="sticky top-0 flex h-screen w-[280px] flex-none flex-col gap-1 border-r border-border p-4"
      >
        <div className="flex items-center gap-2.5 px-3 pt-1 pb-4 text-base font-semibold">
          <img src={logoUrl} alt="" width={22} height={22} />
          LinkedOut Settings
        </div>
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
      </nav>
      <main className="flex h-screen min-w-0 max-w-[760px] flex-1 flex-col pt-9 pr-10 pb-8 pl-14">
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
      className={`flex h-9 items-center gap-2 rounded-md border border-b-2 px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background ${props.current ? 'border-border border-b-key-edge bg-key font-semibold' : 'border-transparent hover:bg-muted'}`}
    >
      <span className="flex-1">{props.label}</span>
      {props.aside === undefined ? null : (
        <span
          className={`text-[13px] font-normal tabular-nums ${props.alert === true ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          {props.aside}
        </span>
      )}
    </a>
  );
}
