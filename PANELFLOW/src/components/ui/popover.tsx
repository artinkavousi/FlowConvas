/**
 * popover.tsx — themed Radix Popover.
 */
import { forwardRef } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/cn';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export const PopoverContent = forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(function PopoverContent({ className, align = 'center', sideOffset = 6, ...props }, ref) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'glass-panel z-[200] rounded-lg border border-white/10 bg-[var(--color-surface)]/95 p-3 shadow-[var(--shadow-drag)] backdrop-blur-xl outline-none',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
