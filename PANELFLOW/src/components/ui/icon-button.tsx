import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { active = false, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center p-1.5 rounded-md border transition-all duration-150 hover:scale-105 active:scale-95',
        active
          ? 'bg-[var(--color-accent-dim)] text-[var(--color-accent)] border-[var(--color-accent-dim)]'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/5 border-transparent',
        className,
      )}
      {...props}
    />
  );
});
