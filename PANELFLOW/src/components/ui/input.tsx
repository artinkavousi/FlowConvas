/**
 * input.tsx — premium themed text/number input. Glass surface, soft inner
 * highlight, glowing accent focus ring.
 */
import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-7 w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-2 font-mono text-[11px] text-white/85 transition-all duration-150',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-white/30',
        'hover:border-white/15 hover:bg-white/[0.05]',
        'focus:border-[color-mix(in_srgb,var(--color-accent)_55%,transparent)] focus:bg-white/[0.06] focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-accent)_18%,transparent)] focus:outline-none',
        className,
      )}
      {...props}
    />
  );
});
