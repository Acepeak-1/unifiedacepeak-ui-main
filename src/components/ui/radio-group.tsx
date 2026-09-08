import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { CircleIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('grid gap-3', className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        /* The checked ring+tint+shadow (`ring-2 ring-primary/30
           shadow-md bg-primary/10`) read as one oversized, blurred blob
           rather than a clean small dot in a ring — reported against two
           separate radio groups now, so this is a rendering defect to fix
           here rather than a per-instance preference to override each
           time it comes up. Checked state is just a coloured border and
           the dot (rendered by the indicator below) now. */
        "relative after:absolute after:-inset-2 after:content-[''] border-gray-400 text-primary bg-white data-[state=checked]:border-primary data-[state=checked]:bg-white focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-all outline-none focus-visible:ring-[3px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 touch-manipulation",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="absolute inset-0 flex items-center justify-center"
      >
        {/* The indicator's own box has no intrinsic size — its only child
            was `absolute`, taking it out of flow, so the indicator
            collapsed to 0×0 and rendered wherever that landed inside the
            item's content box instead of at its true center. `absolute
            inset-0` stretches it to fill the item itself, so the flex
            centering here actually centers the dot within the full circle. */}
        {/* Lucide icons stroke in `currentColor` by default, and this item
            sets `text-primary` on itself for exactly that reason — but at
            this icon's tiny rendered size, that stroke's width reads as a
            second, thicker ring around the dot's own edge, making the
            whole thing look like one oversized blob rather than a small
            fill inside a clean 16px circle. `strokeWidth={0}` leaves only
            the fill. */}
        <CircleIcon className="fill-primary size-1.5" strokeWidth={0} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
