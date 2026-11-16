import * as React from 'react';
import { cn } from 'cn';

function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      className={cn(
        'h-[26px] w-full min-w-0 rounded-md border border-border bg-transparent px-2 text-[0.8125rem] tabular-nums transition-colors outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
