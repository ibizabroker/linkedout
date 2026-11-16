import * as React from 'react';
import { Slot } from 'radix-ui';

type KeyProps = Omit<React.ComponentProps<'button'>, 'children'> & {
  readonly tone?: 'accent' | 'neutral';
  readonly busy?: boolean;
  readonly icon?: React.ReactNode;
  readonly iconOnly?: boolean;
  readonly asChild?: boolean;
  readonly children?: React.ReactNode;
};

function Key({
  tone = 'accent',
  busy = false,
  icon,
  iconOnly = false,
  asChild = false,
  children,
  className,
  ...props
}: KeyProps) {
  const shared = {
    'data-slot': 'key',
    'data-tone': tone,
    'data-busy': busy ? '' : undefined,
    'data-icon-only': iconOnly ? '' : undefined,
    className: ['ink-key', className].filter(Boolean).join(' '),
  };
  if (asChild) {
    return (
      <Slot.Root {...shared} {...props}>
        {children}
      </Slot.Root>
    );
  }
  return (
    <button
      type="button"
      {...shared}
      {...props}
      disabled={busy || props.disabled}
    >
      {icon}
      {children === undefined ? null : <span>{children}</span>}
    </button>
  );
}

export { Key };
