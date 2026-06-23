/**
 * slider.tsx — premium themed Radix Slider. Inset glass track, glowing accent
 * fill, refined haloed thumb. Supports single and multi-thumb (range).
 */
import { forwardRef } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/cn';

export const Slider = forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(function Slider({ className, ...props }, ref) {
  const thumbCount = Array.isArray(props.value ?? props.defaultValue)
    ? (props.value ?? props.defaultValue)!.length
    : 1;
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn('group/sld relative flex w-full touch-none select-none items-center py-1.5', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-[5px] w-full grow overflow-hidden rounded-full bg-black/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.05]">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-accent)_55%,transparent),var(--color-accent))] shadow-[0_0_10px_var(--color-accent-glow)]" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className="block h-3.5 w-3.5 rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff,#e3fbf5_55%,#bdeee4)] shadow-[0_1px_3px_rgba(0,0,0,0.55),0_0_0_1.5px_color-mix(in_srgb,var(--color-accent)_70%,transparent),0_0_10px_var(--color-accent-glow)] outline-none transition-all duration-150 ease-out hover:scale-[1.18] active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/60 disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  );
});
