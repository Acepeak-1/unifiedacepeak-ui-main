import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';

import { cn } from '@/lib/utils';

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'cursor-pointer relative inline-flex h-5 w-9 shrink-0 items-center overflow-hidden rounded-full border-0 shadow-xs outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation data-[state=checked]:bg-[#d92b2b] data-[state=unchecked]:bg-gray-300',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none absolute top-1/2 left-[2px] size-4 -translate-y-1/2 rounded-full bg-white shadow-sm transition-[left] duration-200 data-[state=checked]:left-[18px]',
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
