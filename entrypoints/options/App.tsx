import { useEffect, useState, type ReactElement } from 'react';
import logoUrl from '@/assets/icon.svg';
import { AccountPane } from './AccountPane';
import {
  BlockedCompaniesPane,
  useBlocklistSession,
} from '@/lib/ui/BlockedCompanies';
import { accountStatus, useTrackerSession } from '@/lib/ui/tracker-session';

type PaneId = 'blocked' | 'account';

function paneFromHash(hash: string, accountAvailable: boolean): PaneId {
  return hash === '#account' && accountAvailable ? 'account' : 'blocked';
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
    <div className="mx-auto flex min-h-screen max-w-[760px]">
      <nav
        aria-label="Settings"
        className="flex w-[188px] flex-none flex-col gap-[3px] border-r border-border px-2.5 py-4"
      >
        <div className="flex items-center gap-2 px-[9px] pb-3 font-semibold">
          <img src={logoUrl} alt="" width={18} height={18} />
          LinkedOut settings
        </div>
        <NavItem
          href="#blocked"
          current={pane === 'blocked'}
          label="Blocked companies"
          aside={blocklist.companies?.length?.toString()}
        />
        {accountAvailable ? (
          <NavItem
            href="#account"
            current={pane === 'account'}
            label="Account"
            aside={status?.text}
            alert={status?.needsYou}
          />
        ) : null}
      </nav>
      <main className="flex min-w-0 flex-1 flex-col px-7 pt-5 pb-6">
        {pane === 'account' ? (
          <AccountPane session={tracker} />
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
      className={`flex h-[31px] items-center gap-2 rounded-md border border-b-2 px-[9px] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background ${props.current ? 'border-border border-b-key-edge bg-key font-semibold' : 'border-transparent hover:bg-muted'}`}
    >
      <span className="flex-1">{props.label}</span>
      {props.aside === undefined ? null : (
        <span
          className={`text-xs font-normal tabular-nums ${props.alert === true ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          {props.aside}
        </span>
      )}
    </a>
  );
}
