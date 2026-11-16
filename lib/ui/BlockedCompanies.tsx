import { useEffect, useRef, useState, type ReactElement } from 'react';
import { CloseIcon, SearchIcon } from '@/components/ui/icons';
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

export function matchingCompanies(
  companies: readonly BlockedCompanyRow[],
  query: string,
): readonly BlockedCompanyRow[] {
  const needle = query.trim().toLowerCase();
  return companies.filter(({ name }) => name.toLowerCase().includes(needle));
}

export function BlockedCompanyList(props: {
  readonly companies: readonly BlockedCompanyRow[];
  readonly query?: string;
  readonly onUnblock: (name: string) => void;
}): ReactElement {
  const query = (props.query ?? '').trim();
  if (props.companies.length === 0) {
    return <p className="py-2.5 text-muted-foreground">{EMPTY_TEXT}</p>;
  }
  const shown = matchingCompanies(props.companies, query);
  if (shown.length === 0) {
    return (
      <p className="py-2.5 text-muted-foreground">
        No blocked company matches “{query}”.
      </p>
    );
  }
  return (
    <ul>
      {shown.map(({ name }) => (
        <li
          key={name}
          className="flex h-11 items-center gap-2 border-b border-border"
        >
          <span className="flex-1 truncate">{name}</span>
          <button
            type="button"
            className="icon-btn"
            aria-label={`Unblock ${name}`}
            onClick={() => {
              props.onUnblock(name);
            }}
          >
            <CloseIcon />
          </button>
        </li>
      ))}
    </ul>
  );
}

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA'].includes(target.tagName))
  );
}

function SearchWell(props: {
  readonly query: string;
  readonly onQuery: (query: string) => void;
}): ReactElement {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKeydown = (event: KeyboardEvent): void => {
      if (
        event.key === '/' &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTyping(event.target)
      ) {
        event.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeydown);
    return () => {
      document.removeEventListener('keydown', onKeydown);
    };
  }, []);
  return (
    <label className="mb-4 flex h-10 flex-none items-center gap-2.5 rounded-md bg-well pr-2 pl-3 text-muted-foreground shadow-[inset_0_1px_2px_rgb(0_0_0/0.08)] focus-within:ring-2 focus-within:ring-ring">
      <SearchIcon />
      <input
        ref={input}
        type="search"
        placeholder="Search blocked companies"
        aria-label="Search blocked companies"
        value={props.query}
        onChange={(event) => {
          props.onQuery(event.target.value);
        }}
        className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:appearance-none"
      />
      <kbd
        aria-hidden="true"
        className="inline-grid h-5 min-w-5 place-items-center rounded-[4px] border border-b-2 border-border border-b-key-edge bg-key px-1.5 font-[inherit] text-[11px] text-muted-foreground"
      >
        /
      </kbd>
    </label>
  );
}

export function BlockedCompaniesPane(props: {
  readonly companies: readonly BlockedCompanyRow[] | null | undefined;
  readonly failureText: string | undefined;
  readonly onUnblock: (name: string) => void;
}): ReactElement {
  const [query, setQuery] = useState('');
  const { companies } = props;
  return (
    <>
      <h1 className="text-xl font-semibold">Blocked companies</h1>
      <p className="mt-1 mb-5 text-muted-foreground">
        Their jobs are hidden from results. Block more from a job card or the
        job details.
      </p>
      {props.failureText === undefined ? null : (
        <p role="alert" className="mb-2 text-destructive">
          {props.failureText}
        </p>
      )}
      {companies == null || companies.length === 0 ? null : (
        <SearchWell query={query} onQuery={setQuery} />
      )}
      {companies == null ? null : (
        <div className="min-h-0 flex-1 overflow-auto border-t border-border">
          <BlockedCompanyList
            companies={companies}
            query={query}
            onUnblock={props.onUnblock}
          />
        </div>
      )}
    </>
  );
}
