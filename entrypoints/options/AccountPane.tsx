import type { ReactElement, ReactNode } from 'react';
import {
  ConnectKey,
  DisconnectKey,
  NewSheetKey,
  OpenSheetKey,
  ReconnectKey,
} from '@/lib/ui/TrackerKeys';
import {
  isSignInExpired,
  type ConnectedView,
  type TrackerSession,
} from '@/lib/ui/tracker-session';

export function AccountPane(props: {
  readonly session: TrackerSession;
}): ReactElement {
  const { session } = props;
  const { view } = session;
  return (
    <>
      <h1 className="text-xl font-semibold">Account</h1>
      <p className="mt-1 mb-5 text-muted-foreground">
        Connect Google Sheets to add each job you apply to as a row in a sheet
        in your Drive.
      </p>
      <div className="border-t border-border">
        {view.kind === 'disconnected' ? (
          <>
            <AccountRow label="Google account">
              <span className="flex-1" />
              <ConnectKey session={session} />
            </AccountRow>
            <Note>
              LinkedOut creates one sheet in your Drive and can only see that
              sheet.
            </Note>
          </>
        ) : null}
        {view.kind === 'connected' || view.kind === 'missing' ? (
          <Connected session={session} view={view} />
        ) : null}
        {view.kind === 'disconnected' ||
        view.kind === 'connected' ||
        view.kind === 'missing' ? (
          view.error === undefined ? null : (
            <p role="alert" className="pt-4 text-destructive">
              {view.error}
            </p>
          )
        ) : null}
      </div>
    </>
  );
}

function Connected(props: {
  readonly session: TrackerSession;
  readonly view: ConnectedView;
}): ReactElement {
  const { session, view } = props;
  const expired = isSignInExpired(view);
  return (
    <>
      <AccountRow label="Google account">
        <span className="flex-1">Connected</span>
        {expired ? <ReconnectKey session={session} /> : null}
        <DisconnectKey session={session} />
      </AccountRow>
      {expired ? (
        <AccountRow label="Status">
          <span className="flex-1 text-destructive">Sign-in expired</span>
        </AccountRow>
      ) : null}
      {view.kind === 'connected' ? (
        <>
          <AccountRow label="Sheet">
            <span className="flex-1 truncate">{view.sheet.name}</span>
            <OpenSheetKey sheet={view.sheet} />
          </AccountRow>
          <AccountRow label="Jobs added">
            <span className="flex-1">
              {view.sync.added}
              {view.sync.waiting === 0 ? null : (
                <span className="text-muted-foreground">
                  {` · ${view.sync.waiting} waiting`}
                </span>
              )}
            </span>
          </AccountRow>
        </>
      ) : (
        <AccountRow label="Sheet">
          <span className="flex-1 text-destructive">Not found</span>
          <NewSheetKey session={session} />
        </AccountRow>
      )}
      <Note>
        Disconnecting stops adding jobs. The sheet stays in your Drive.
      </Note>
    </>
  );
}

function AccountRow(props: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="flex h-12 items-center gap-3 border-b border-border">
      <span className="w-[150px] shrink-0 text-muted-foreground">
        {props.label}
      </span>
      {props.children}
    </div>
  );
}

function Note(props: { readonly children: ReactNode }): ReactElement {
  return <p className="pt-4 text-muted-foreground">{props.children}</p>;
}
