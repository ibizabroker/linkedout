import type { ReactElement, ReactNode } from 'react';

function Svg(props: {
  readonly className: string;
  readonly size?: number;
  readonly strokeWidth?: number;
  readonly children: ReactNode;
}): ReactElement {
  const size = props.size ?? 14;
  return (
    <svg
      className={props.className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth ?? 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {props.children}
    </svg>
  );
}

function ChainHalves(): ReactElement {
  return (
    <>
      <g className="left">
        <path d="M9 17H7A5 5 0 0 1 7 7h2" />
      </g>
      <g className="right">
        <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
      </g>
      <path className="bar" d="M8 12h8" />
    </>
  );
}

export function LinkIcon(): ReactElement {
  return (
    <Svg className="i-link">
      <ChainHalves />
    </Svg>
  );
}

export function UnlinkIcon(): ReactElement {
  return (
    <Svg className="i-unlink">
      <ChainHalves />
      <path className="breaks" d="M12 2.5v3M12 18.5v3" />
    </Svg>
  );
}

export function PlusIcon(): ReactElement {
  return (
    <Svg className="i-plus" strokeWidth={2.4}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function ExternalLinkIcon(): ReactElement {
  return (
    <Svg className="i-ext">
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </Svg>
  );
}

export function BanIcon(): ReactElement {
  return (
    <Svg className="i-ban">
      <circle cx="12" cy="12" r="9" />
      <path className="slash" d="m5.7 5.7 12.6 12.6" />
    </Svg>
  );
}

export function SearchIcon(): ReactElement {
  return (
    <Svg className="i-search">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Svg>
  );
}

export function CloseIcon(): ReactElement {
  return (
    <Svg className="i-spin-quarter">
      <path d="M18 6 6 18M6 6l12 12" />
    </Svg>
  );
}

export function GearIcon(): ReactElement {
  return (
    <Svg className="i-spin-quarter" size={16}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  );
}
