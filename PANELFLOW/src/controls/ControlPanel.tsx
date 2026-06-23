/**
 * ControlPanel.tsx — PANELFLOW's dynamic, schema-driven control surface.
 *
 * Dense and borderless: parameters are grouped under a light label and flow in a
 * responsive masonry of columns. Compact controls (toggles, colours, dropdowns,
 * unranged numbers) sit on a single label↔control row; controls that need width
 * (sliders, segmented enums, vectors) stack their control under the label. No
 * nested cards or boxes — just whitespace and alignment.
 *
 * Self-contained and universal: any component that registers a schema gets this
 * panel for free, wired to the shared bridge.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import {
  useBridgeStore,
  initializeBridgeDefaults,
  type ComponentSchema,
  type ParameterDef,
} from '@/control-engine';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ColorField } from '@/components/ui/color-field';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

// ── Helpers ──────────────────────────────────────────────────────────────────

function toAxes(value: unknown, n: number): number[] {
  if (Array.isArray(value)) return Array.from({ length: n }, (_, i) => Number(value[i] ?? 0));
  if (value && typeof value === 'object') {
    const keys = ['x', 'y', 'z'];
    return Array.from({ length: n }, (_, i) => Number((value as Record<string, number>)[keys[i]] ?? 0));
  }
  return Array.from({ length: n }, () => 0);
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 3 });
}

function Lbl({ children }: { children: React.ReactNode }) {
  return <span className="min-w-0 truncate text-[10px] font-medium tracking-wide text-white/60">{children}</span>;
}

const valueInputCls =
  'w-11 shrink-0 rounded-md border border-white/[0.06] bg-black/35 px-1 py-0.5 text-right font-mono text-[10px] text-[var(--color-accent)] shadow-[inset_0_1px_1px_rgba(0,0,0,0.4)] transition-colors focus:border-[color-mix(in_srgb,var(--color-accent)_50%,transparent)] focus:bg-black/50 focus:outline-none';

// ── Field widgets ─────────────────────────────────────────────────────────────

function NumberSlider({ param, value, onChange }: { param: ParameterDef; value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-2">
      <Lbl>{param.label}</Lbl>
      <Slider
        className="flex-1"
        min={param.min}
        max={param.max}
        step={param.step ?? 0.01}
        value={[Number.isFinite(value) ? value : param.min!]}
        onValueChange={([v]) => onChange(v)}
      />
      <input
        value={editing ?? fmt(value)}
        onChange={(e) => setEditing(e.target.value)}
        onFocus={() => setEditing(String(value))}
        onBlur={() => {
          if (editing !== null) {
            const n = Number(editing);
            if (Number.isFinite(n)) onChange(n);
            setEditing(null);
          }
        }}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className={valueInputCls}
      />
    </div>
  );
}

function EnumField({ param, value, onChange }: { param: ParameterDef; value: unknown; onChange: (v: unknown) => void }) {
  const options = param.options ?? [];
  const useSegments = options.length <= 4 && options.every((o) => String(o.label).length <= 9);
  if (useSegments) {
    return (
      <div className="space-y-1">
        <Lbl>{param.label}</Lbl>
        <ToggleGroup
          type="single"
          className="w-full"
          value={String(value)}
          onValueChange={(v) => {
            if (!v) return;
            const picked = options.find((o) => String(o.value) === v);
            onChange(picked ? picked.value : v);
          }}
        >
          {options.map((o) => (
            <ToggleGroupItem key={String(o.value)} value={String(o.value)} className="flex-1">
              {o.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Lbl>{param.label}</Lbl>
      <Select
        value={String(value)}
        onValueChange={(v) => {
          const picked = options.find((o) => String(o.value) === v);
          onChange(picked ? picked.value : v);
        }}
      >
        <SelectTrigger className="w-[55%]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={String(o.value)} value={String(o.value)}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function VecField({ param, value, onChange, axes }: { param: ParameterDef; value: unknown; onChange: (v: number[]) => void; axes: number }) {
  const arr = toAxes(value ?? param.default, axes);
  const labels = ['X', 'Y', 'Z'];
  const hasRange = param.min !== undefined && param.max !== undefined;
  return (
    <div className="space-y-1">
      <Lbl>{param.label}</Lbl>
      {Array.from({ length: axes }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 shrink-0 font-mono text-[9px] text-white/35">{labels[i]}</span>
          {hasRange ? (
            <Slider
              className="flex-1"
              min={param.min}
              max={param.max}
              step={param.step ?? 0.01}
              value={[arr[i]]}
              onValueChange={([v]) => {
                const next = arr.slice();
                next[i] = v;
                onChange(next);
              }}
            />
          ) : (
            <Input
              type="number"
              value={arr[i]}
              step={param.step ?? 0.1}
              onChange={(e) => {
                const next = arr.slice();
                next[i] = Number(e.target.value);
                onChange(next);
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function RangeField({ param, value, onChange }: { param: ParameterDef; value: unknown; onChange: (v: number[]) => void }) {
  const min = param.min ?? 0;
  const max = param.max ?? 100;
  const [lo, hi] = toAxes(value ?? param.default, 2);
  return (
    <div className="flex items-center gap-2">
      <Lbl>{param.label}</Lbl>
      <Slider
        className="flex-1"
        min={min}
        max={max}
        step={param.step ?? 1}
        value={[lo, hi]}
        onValueChange={(v) => onChange(v as number[])}
      />
      <span className="shrink-0 font-mono text-[9px] text-[var(--color-accent)]/80">
        {fmt(lo)}–{fmt(hi)}
      </span>
    </div>
  );
}

function ControlField({ param, value, onChange }: { param: ParameterDef; value: unknown; onChange: (v: unknown) => void }) {
  const hasRange = param.min !== undefined && param.max !== undefined;

  if (param.type === 'number') {
    if (hasRange) return <NumberSlider param={param} value={Number(value)} onChange={onChange as (v: number) => void} />;
    return (
      <div className="flex items-center gap-2">
        <Lbl>{param.label}</Lbl>
        <Input
          type="number"
          className="w-20"
          value={Number(value)}
          step={param.step ?? 0.1}
          min={param.min}
          max={param.max}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    );
  }
  if (param.type === 'range') return <RangeField param={param} value={value} onChange={onChange as (v: number[]) => void} />;
  if (param.type === 'vec2') return <VecField param={param} value={value} onChange={onChange as (v: number[]) => void} axes={2} />;
  if (param.type === 'vec3') return <VecField param={param} value={value} onChange={onChange as (v: number[]) => void} axes={3} />;
  if (param.type === 'boolean') {
    return (
      <div className="flex items-center justify-between gap-2">
        <Lbl>{param.label}</Lbl>
        <Switch checked={Boolean(value)} onCheckedChange={onChange as (v: boolean) => void} />
      </div>
    );
  }
  if (param.type === 'color') {
    return (
      <div className="flex items-center gap-2">
        <Lbl>{param.label}</Lbl>
        <ColorField value={String(value ?? '')} onChange={onChange as (v: string) => void} className="w-[52%]" />
      </div>
    );
  }
  if (param.type === 'enum') return <EnumField param={param} value={value} onChange={onChange} />;
  return (
    <div className="flex items-center gap-2">
      <Lbl>{param.label}</Lbl>
      <Input value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// ── Public panel ──────────────────────────────────────────────────────────────

export interface ControlPanelProps {
  schema: ComponentSchema;
  /** Bridge value bucket (defaults to schema.id). */
  targetId?: string;
  /** Minimum group width for the responsive masonry (default 12rem). */
  columnWidth?: string;
  className?: string;
}

export function ControlPanel({ schema, targetId, columnWidth = '12rem', className }: ControlPanelProps) {
  const id = targetId ?? schema.id;

  useEffect(() => {
    initializeBridgeDefaults(schema, id);
  }, [schema, id]);

  const values = useBridgeStore((s) => s.componentValues[id]);
  const setParam = useBridgeStore((s) => s.setParam);
  const handle = useCallback((key: string, value: unknown) => setParam(id, key, value), [id, setParam]);

  const groups = useMemo(() => {
    const map = new Map<string, ParameterDef[]>();
    for (const p of schema.parameters) {
      const g = p.group || 'Properties';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(p);
    }
    return Array.from(map.entries());
  }, [schema]);

  if (schema.parameters.length === 0) {
    return <div className="py-8 text-center text-[10px] uppercase tracking-widest text-white/30">No controllable parameters</div>;
  }

  return (
    <div className={cn('w-full', className)} style={{ columnWidth, columnGap: '1.5rem' }}>
      {groups.map(([groupName, params]) => (
        <div key={groupName} className="mb-5 break-inside-avoid">
          <div className="mb-2.5 flex items-center gap-2 pb-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent-glow)]" />
            <span className="text-[9px] font-black uppercase tracking-[0.22em] text-white/65">{groupName}</span>
            <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(255,255,255,0.10),transparent)]" />
          </div>
          <div className="flex flex-col gap-3">
            {params.map((param) => (
              <ControlField
                key={param.key}
                param={param}
                value={values?.[param.key] ?? param.default}
                onChange={(v) => handle(param.key, v)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
