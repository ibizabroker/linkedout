import { useEffect, useState, type ReactElement } from 'react';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StoredBlocklistRead } from '@/lib/block/domain';
import { requestUnblock, watchBlocklist } from '@/lib/block/store';

export type BlockedCompanyRow = { readonly name: string };

const EMPTY_TEXT =
  'No blocked companies. Block one from a job card or the job details.';

export const BLOCKLIST_UNREADABLE_TEXT = 'Could not load blocked companies.';

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
      setUnblockFailure('Could not unblock that company. Try again.');
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
    return <p className="py-2 text-muted-foreground">{EMPTY_TEXT}</p>;
  }
  return (
    <ul className="border-t border-border">
      {props.companies.map(({ name }) => (
        <li
          key={name}
          className="flex h-[30px] items-center gap-2 border-b border-border"
        >
          <span className="flex-1 truncate">{name}</span>
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

export function BlockedCompaniesPage(props: {
  readonly companies: readonly BlockedCompanyRow[] | null | undefined;
  readonly failureText: string | undefined;
  readonly onUnblock: (name: string) => void;
}): ReactElement {
  return (
    <main className="mx-auto flex w-[560px] max-w-full flex-col px-4 pt-8 pb-10">
      <h1 className="text-[0.9375rem] font-semibold">Blocked companies</h1>
      <p className="mt-0.5 mb-2 text-muted-foreground">
        Their jobs are hidden from results. Block more from a job card or the
        job details.
      </p>
      {props.failureText === undefined ? null : (
        <p role="alert" className="mb-2 text-destructive">
          {props.failureText}
        </p>
      )}
      {props.companies == null ? null : (
        <BlockedCompanyList
          companies={props.companies}
          onUnblock={props.onUnblock}
        />
      )}
    </main>
  );
}
