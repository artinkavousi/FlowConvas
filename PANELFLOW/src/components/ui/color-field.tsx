/**
 * color-field.tsx — premium color control: a swatch that opens a popover with a
 * native picker + hex input. Value is a hex string.
 */
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Input } from './input';
import { cn } from '@/lib/cn';

function normalizeHex(v: string): string {
  const t = (v || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(t)) return t;
  if (/^[0-9a-f]{6}$/i.test(t)) return `#${t}`;
  return '#000000';
}

export function ColorField({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  const hex = normalizeHex(value);
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Pick color"
            className="h-6 w-6 shrink-0 rounded-md border border-white/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_1px_3px_rgba(0,0,0,0.4)] ring-1 ring-black/30 transition-all duration-150 hover:scale-110 hover:ring-[color-mix(in_srgb,var(--color-accent)_50%,transparent)]"
            style={{ background: hex }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <input
            type="color"
            value={hex}
            onChange={(e) => onChange(e.target.value)}
            className="h-28 w-40 cursor-pointer rounded-md border border-white/10 bg-transparent p-0"
          />
        </PopoverContent>
      </Popover>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onChange(normalizeHex(e.target.value))}
        className="uppercase"
        spellCheck={false}
      />
    </div>
  );
}
