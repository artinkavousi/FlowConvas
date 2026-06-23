/**
 * switch.tsx — premium themed Radix Switch. Inset off-state, glowing accent
 * gradient on, smooth haloed thumb.
 */
import { forwardRef } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/cn';

export const Switch = forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        'peer relative inline-flex h-[18px] w-[34px] shrink-0 cursor-pointer items-center rounded-full border transition-all duration-200',
        'border-white/10 bg-black/45 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]',
        'data-[state=checked]:border-[color-mix(in_srgb,var(--color-accent)_55%,transparent)] data-[state=checked]:bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-accent)_70%,transparent),var(--color-accent))] data-[state=checked]:shadow-[0_0_10px_var(--color-accent-glow),inset_0_1px_1px_rgba(255,255,255,0.25)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/45 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block h-3.5 w-3.5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.5)] transition-transform duration-200 ease-out data-[state=checked]:translate-x-[17px] data-[state=unchecked]:translate-x-[2px]" />
    </SwitchPrimitive.Root>
  );
});
