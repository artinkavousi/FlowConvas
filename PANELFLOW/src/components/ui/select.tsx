/**
 * select.tsx — themed Radix Select (dropdown). Scales to many options.
 */
import { forwardRef } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;
export const SelectGroup = SelectPrimitive.Group;

export const SelectTrigger = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(function SelectTrigger({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex h-7 w-full items-center justify-between gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 text-[11px] text-white/85 transition-all duration-150',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-white/15 hover:bg-white/[0.05]',
        'focus:border-[color-mix(in_srgb,var(--color-accent)_55%,transparent)] focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-accent)_18%,transparent)] focus:outline-none',
        'data-[placeholder]:text-white/40 data-[state=open]:border-[color-mix(in_srgb,var(--color-accent)_55%,transparent)]',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDown size={12} className="opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

export const SelectContent = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(function SelectContent({ className, children, position = 'popper', ...props }, ref) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        className={cn(
          'glass-panel z-[200] max-h-72 min-w-[8rem] overflow-hidden rounded-lg border border-white/10 bg-[var(--color-surface)]/95 p-1 shadow-[var(--shadow-drag)] backdrop-blur-xl',
          position === 'popper' && 'data-[side=bottom]:translate-y-1',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-0.5">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

export const SelectItem = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(function SelectItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-md py-1 pl-6 pr-2 text-[11px] text-white/75 outline-none',
        'focus:bg-[var(--color-accent-dim)] focus:text-white data-[state=checked]:text-[var(--color-accent)]',
        className,
      )}
      {...props}
    >
      <span className="absolute left-1 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check size={12} />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});
