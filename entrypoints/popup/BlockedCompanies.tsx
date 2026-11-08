import { useEffect, useId, useState, type ReactElement } from 'react';
import { ChevronDownIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StoredBlocklistRead } from '@/lib/block/domain';
import { requestUnblock, watchBlocklist } from '@/lib/block/store';

export type BlockedCompanyRow = { readonly name: string };

const EMPTY_TEXT =
  'No blocked companies. Block one from a job card or the job details.';

export const BLOCKLIST_UNREADABLE_TEXT =
  'Could not load your blocked companies. Reopen the popup.';

export function useBlocklistSession(): {
  readonly companies: readonly BlockedCompanyRow[] | null | undefined;
  readonly unblock: (name: string) => void;
  readonly failureText: string | undefined;
} {
  const [read, setRead] = useState<StoredBlocklistRead | undefined>(undefined);
  const [unblockFailure, setUnblockFailure] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => watchBlocklist(setRead), []);

  function unblock(name: string): void {
    setUnblockFailure(undefined);
    requestUnblock(name).catch(() => {
      setUnblockFailure(`Could not unblock ${name}. Try again.`);
    });
  }

  if (read === undefined) {
    return { companies: undefined, unblock, failureText: unblockFailure };
  }
  if (read.status === 'unreadable') {
    return {
      companies: null,
      unblock,
      failureText: unblockFailure ?? BLOCKLIST_UNREADABLE_TEXT,
    };
  }
  return { companies: read.list.entries, unblock, failureText: unblockFailure };
}

export function BlockedCompanyList(props: {
  readonly companies: readonly BlockedCompanyRow[];
  readonly onUnblock: (name: string) => void;
}): ReactElement {
  if (props.companies.length === 0) {
    return <p className="text-sm text-muted-foreground">{EMPTY_TEXT}</p>;
  }
  return (
    <ul className="flex flex-col gap-1">
      {props.companies.map(({ name }) => (
        <li key={name} className="flex items-center justify-between gap-2">
          <span className="truncate text-sm">{name}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Unblock ${name}`}
            onClick={() => {
              props.onUnblock(name);
            }}
          >
            <XIcon />
          </Button>
        </li>
      ))}
    </ul>
  );
}

export function BlockedCompaniesSection(props: {
  readonly companies: readonly BlockedCompanyRow[] | null;
  readonly onUnblock: (name: string) => void;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const regionId = useId();
  return (
    <div className="mt-5 flex flex-col gap-1.5">
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-between px-0 hover:bg-transparent aria-expanded:bg-transparent dark:hover:bg-transparent"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        Blocked companies
        {props.companies === null ? '' : ` (${props.companies.length})`}
        <ChevronDownIcon
          data-icon="inline-end"
          className="text-muted-foreground transition-transform duration-150 group-aria-expanded/button:rotate-180"
        />
      </Button>
      <div id={regionId} hidden={!open}>
        {props.companies === null ? null : (
          <BlockedCompanyList
            companies={props.companies}
            onUnblock={props.onUnblock}
          />
        )}
      </div>
    </div>
  );
}
