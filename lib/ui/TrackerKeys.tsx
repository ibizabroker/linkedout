import type { ReactElement } from 'react';
import { Key } from '@/components/ui/key';
import {
  ExternalLinkIcon,
  LinkIcon,
  PlusIcon,
  UnlinkIcon,
} from '@/components/ui/icons';
import type { TrackerSheet } from '@/lib/tracker/domain';
import type { TrackerSession } from './tracker-session';

type KeyProps = { readonly session: TrackerSession };

function inFlight(session: TrackerSession): boolean {
  return 'busy' in session.view && session.view.busy;
}

export function ConnectKey(props: KeyProps): ReactElement {
  const busy = props.session.pending === 'connect';
  return (
    <Key
      busy={busy}
      disabled={inFlight(props.session)}
      icon={<LinkIcon />}
      onClick={() => {
        props.session.act('connect');
      }}
    >
      {busy ? 'Connecting…' : 'Connect Google Sheets'}
    </Key>
  );
}

export function ReconnectKey(props: KeyProps): ReactElement {
  const busy = props.session.pending === 'reconnect';
  return (
    <Key
      busy={busy}
      disabled={inFlight(props.session)}
      icon={<LinkIcon />}
      onClick={() => {
        props.session.act('reconnect');
      }}
    >
      {busy ? 'Reconnecting…' : 'Reconnect'}
    </Key>
  );
}

export function NewSheetKey(props: KeyProps): ReactElement {
  const busy = props.session.pending === 'recreate';
  return (
    <Key
      busy={busy}
      disabled={inFlight(props.session)}
      icon={<PlusIcon />}
      onClick={() => {
        props.session.act('recreate');
      }}
    >
      {busy ? 'Creating…' : 'New sheet'}
    </Key>
  );
}

export function DisconnectKey(props: KeyProps): ReactElement {
  const busy = props.session.pending === 'disconnect';
  return (
    <Key
      tone="neutral"
      busy={busy}
      disabled={inFlight(props.session)}
      icon={<UnlinkIcon />}
      onClick={() => {
        props.session.act('disconnect');
      }}
    >
      {busy ? 'Disconnecting…' : 'Disconnect'}
    </Key>
  );
}

export function OpenSheetKey(props: {
  readonly sheet: TrackerSheet;
}): ReactElement {
  return (
    <Key asChild iconOnly>
      <a
        href={props.sheet.url}
        target="_blank"
        rel="noreferrer"
        aria-label="Open sheet"
        title="Open sheet"
      >
        <ExternalLinkIcon />
      </a>
    </Key>
  );
}
