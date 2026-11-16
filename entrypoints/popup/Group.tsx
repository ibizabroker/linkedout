import { useId, type ReactElement, type ReactNode } from 'react';

export function Group(props: {
  readonly label: string;
  readonly children: ReactNode;
  readonly className?: string;
}): ReactElement {
  const labelId = useId();
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className={`border-t border-border pt-0.5 pb-1.5 ${props.className ?? ''}`}
    >
      <p
        id={labelId}
        className="px-3 pt-2 pb-0.5 text-xs text-muted-foreground"
      >
        {props.label}
      </p>
      {props.children}
    </div>
  );
}

export function Row(props: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="flex h-7 items-center pr-2 pl-3">
      <span className="w-[104px] shrink-0 text-muted-foreground">
        {props.label}
      </span>
      {props.children}
    </div>
  );
}
