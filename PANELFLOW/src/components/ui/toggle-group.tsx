/**
 * toggle-group.tsx — premium themed Radix ToggleGroup. Used as a segmented
 * control for enums with few short options. Inset rail, glowing active segment.
 */
import { forwardRef } from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cn } from '@/lib/cn';

export const ToggleGroup = forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
>(function ToggleGroup({ className, ...props }, ref) {
  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn(
        'inline-flex gap-0.5 rounded-lg border border-white/[0.07] bg-black/40 p-0.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]',
        className,
      )}
      {...props}
    />
  );
});

export const ToggleGroupItem = forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(function ToggleGroupItem({ className, ...props }, ref) {
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        'rounded-[6px] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white/50 transition-all duration-150',
        'hover:text-white/85',
        'data-[state=on]:bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-accent)_92%,white),var(--color-accent))] data-[state=on]:text-black data-[state=on]:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_10px_var(--color-accent-glow)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40',
        className,
      )}
      {...props}
    />
  );
});
