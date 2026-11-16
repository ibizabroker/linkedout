import * as React from 'react';
import { cn } from 'cn';
import { Switch as SwitchPrimitive } from 'radix-ui';

function Switch({
  className,
  label,
  value,
  ...props
}: Omit<
  React.ComponentProps<typeof SwitchPrimitive.Root>,
  'children' | 'aria-label' | 'aria-describedby'
> & {
  readonly label: string;
  readonly value: string;
}) {
  const valueId = React.useId();
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      aria-label={label}
      aria-describedby={valueId}
      className={cn(
        'group/switch flex h-7 w-full cursor-pointer items-center rounded-md px-3 text-left text-[0.8125rem] outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="w-[104px] shrink-0 text-muted-foreground"
      >
        {label}
      </span>
      <span id={valueId} className="flex-1 truncate">
        {value}
      </span>
      <span
        data-slot="switch-track"
        className="relative h-4 w-[26px] shrink-0 rounded-full bg-input transition-colors duration-150 group-data-[state=checked]/switch:bg-primary"
      >
        <SwitchPrimitive.Thumb
          data-slot="switch-thumb"
          className="pointer-events-none absolute top-0.5 left-0.5 block size-3 rounded-full bg-background transition-transform duration-150 data-[state=checked]:translate-x-2.5"
        />
      </span>
    </SwitchPrimitive.Root>
  );
}

export { Switch };
