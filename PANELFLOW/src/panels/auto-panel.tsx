/**
 * auto-panel.tsx — Renders a control panel from a ComponentSchema.
 * 
 * Maps parameter types to appropriate UI widgets:
 * - number (with range) → GooeySlider
 * - number (no range) → number input
 * - color → color picker + hex input
 * - boolean → styled toggle
 * - string → text input
 * - enum → chip selector
 * - vec2/vec3 → multi-axis sliders
 * - range → dual-thumb slider
 */

import React, { useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { PanelShell } from '@/panel-os/panel-shell';
import { GooeySlider } from '@/components/GooeySlider';
import { useBridgeStore, initializeBridgeDefaults, type ComponentSchema, type ParameterDef } from '@/control-engine';

// ── Section Component ──────────────────────────────────────────────────────

function Section({ title, defaultOpen = true, children }: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  return (
    <div className="border border-white/5 rounded-md overflow-hidden bg-white/[0.02]">
      <button
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-white/70 hover:text-white/90 bg-white/[0.04] hover:bg-white/[0.06] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span className="font-medium tracking-wide text-xs">{title}</span>
        </div>
      </button>
      {isOpen && (
        <div className="p-3 bg-black/40 flex flex-col gap-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Parameter Widgets ──────────────────────────────────────────────────────

function NumberControl({ param, value, onChange }: {
  param: ParameterDef;
  value: number;
  onChange: (v: number) => void;
}) {
  const hasRange = param.min !== undefined && param.max !== undefined;
  return (
    <div className="flex flex-col gap-2">
      <input
        type="number"
        value={value}
        step={param.step || 0.1}
        min={param.min}
        max={param.max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--color-accent)] font-mono text-left transition-colors"
      />
      {hasRange && (
        <GooeySlider
          min={param.min!}
          max={param.max!}
          step={param.step || 0.01}
          value={value}
          onChange={onChange}
          color="var(--color-accent)"
          textColor="#0c0c0c"
        />
      )}
    </div>
  );
}

function ColorControl({ param, value, onChange }: {
  param: ParameterDef;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2 items-center">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded bg-black/40 border border-white/10 cursor-pointer p-0.5 box-content shrink-0"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 w-full bg-black border border-white/10 rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[var(--color-accent)] uppercase transition-colors"
      />
    </div>
  );
}

function BooleanControl({ param, value, onChange }: {
  param: ParameterDef;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer mt-0.5 bg-black/20 hover:bg-black/40 border border-white/5 p-2 rounded transition-colors group">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[var(--color-accent)] w-4 h-4 rounded border-white/20 bg-black cursor-pointer"
      />
      <span className="text-xs text-white/70 select-none cursor-pointer group-hover:text-white transition-colors">
        {value ? 'Enabled' : 'Disabled'}
      </span>
    </label>
  );
}

function StringControl({ param, value, onChange }: {
  param: ParameterDef;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors"
    />
  );
}

function EnumControl({ param, value, onChange }: {
  param: ParameterDef;
  value: any;
  onChange: (v: any) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {(param.options || []).map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
              isActive
                ? 'bg-white text-black shadow-sm'
                : 'bg-black/40 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function toNumberArray(value: any, fallback: number[]): number[] {
  if (Array.isArray(value)) return value.map(Number);
  if (value && typeof value === 'object') {
    // Accept {x,y,z} objects too.
    const keys = ['x', 'y', 'z'];
    const arr = keys.filter((k) => k in value).map((k) => Number(value[k]));
    if (arr.length) return arr;
  }
  return fallback;
}

function VecControl({ param, value, onChange, axes }: {
  param: ParameterDef;
  value: any;
  onChange: (v: number[]) => void;
  axes: number;
}) {
  const labels = ['X', 'Y', 'Z'];
  const fallback = Array.from({ length: axes }, () => 0);
  const arr = toNumberArray(value ?? param.default, fallback);
  const hasRange = param.min !== undefined && param.max !== undefined;

  const setAxis = (i: number, v: number) => {
    const next = arr.slice();
    next[i] = v;
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: axes }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-white/40 w-3 shrink-0">{labels[i]}</span>
          <input
            type="number"
            value={arr[i] ?? 0}
            step={param.step || 0.1}
            min={param.min}
            max={param.max}
            onChange={(e) => setAxis(i, Number(e.target.value))}
            className="flex-1 min-w-0 bg-black border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--color-accent)] font-mono transition-colors"
          />
          {hasRange && (
            <input
              type="range"
              value={arr[i] ?? 0}
              min={param.min}
              max={param.max}
              step={param.step || 0.01}
              onChange={(e) => setAxis(i, Number(e.target.value))}
              className="flex-1 min-w-0 accent-[var(--color-accent)]"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function RangeControl({ param, value, onChange }: {
  param: ParameterDef;
  value: any;
  onChange: (v: number[]) => void;
}) {
  const min = param.min ?? 0;
  const max = param.max ?? 100;
  const step = param.step || 1;
  const [lo, hi] = toNumberArray(value ?? param.default, [min, max]);

  const setLo = (v: number) => onChange([Math.min(v, hi), hi]);
  const setHi = (v: number) => onChange([lo, Math.max(v, lo)]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={lo}
          min={min}
          max={max}
          step={step}
          onChange={(e) => setLo(Number(e.target.value))}
          className="flex-1 min-w-0 bg-black border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--color-accent)] font-mono transition-colors"
        />
        <span className="text-[9px] text-white/30">to</span>
        <input
          type="number"
          value={hi}
          min={min}
          max={max}
          step={step}
          onChange={(e) => setHi(Number(e.target.value))}
          className="flex-1 min-w-0 bg-black border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--color-accent)] font-mono transition-colors"
        />
      </div>
      <div className="relative flex items-center">
        <input
          type="range"
          value={lo}
          min={min}
          max={max}
          step={step}
          onChange={(e) => setLo(Number(e.target.value))}
          className="flex-1 accent-[var(--color-accent)]"
        />
        <input
          type="range"
          value={hi}
          min={min}
          max={max}
          step={step}
          onChange={(e) => setHi(Number(e.target.value))}
          className="flex-1 accent-[var(--color-accent)]"
        />
      </div>
    </div>
  );
}

// ── Parameter Renderer ─────────────────────────────────────────────────────

function ParameterControl({ param, value, onChange }: {
  param: ParameterDef;
  value: any;
  onChange: (v: any) => void;
}) {
  return (
    <div className="space-y-1.5 flex flex-col">
      <div className="flex justify-between items-end mb-1">
        <span className="text-[10px] uppercase tracking-widest text-white/50">
          {param.label}
        </span>
        <span className="text-[9px] text-white/30 font-mono">{param.type}</span>
      </div>

      {param.type === 'number' && (
        <NumberControl param={param} value={Number(value)} onChange={onChange} />
      )}
      {param.type === 'color' && (
        <ColorControl param={param} value={String(value)} onChange={onChange} />
      )}
      {param.type === 'boolean' && (
        <BooleanControl param={param} value={Boolean(value)} onChange={onChange} />
      )}
      {param.type === 'string' && (
        <StringControl param={param} value={String(value)} onChange={onChange} />
      )}
      {param.type === 'enum' && (
        <EnumControl param={param} value={value} onChange={onChange} />
      )}
      {param.type === 'vec2' && (
        <VecControl param={param} value={value} onChange={onChange} axes={2} />
      )}
      {param.type === 'vec3' && (
        <VecControl param={param} value={value} onChange={onChange} axes={3} />
      )}
      {param.type === 'range' && (
        <RangeControl param={param} value={value} onChange={onChange} />
      )}
    </div>
  );
}

// ── Auto-Generated Panel ───────────────────────────────────────────────────

export function AutoGeneratedPanel({ schema }: { schema: ComponentSchema }) {
  // Initialize bridge defaults on first render
  React.useEffect(() => {
    initializeBridgeDefaults(schema);
  }, [schema.id]);

  const values = useBridgeStore((s) => s.componentValues[schema.id] || {});
  const setParam = useBridgeStore((s) => s.setParam);

  const handleChange = useCallback(
    (key: string, value: any) => {
      setParam(schema.id, key, value);
    },
    [schema.id, setParam],
  );

  // Group parameters by group field
  const grouped = new Map<string, ParameterDef[]>();
  for (const param of schema.parameters) {
    const group = param.group || 'Properties';
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group)!.push(param);
  }

  return (
    <PanelShell>
      <div className="flex flex-col h-full w-full text-sm overflow-y-auto custom-scrollbar p-2 gap-2">
        {/* Description */}
        {schema.description && (
          <div className="text-[10px] text-white/40 px-2 py-1 mb-1">
            {schema.description}
          </div>
        )}

        {/* Parameter Groups */}
        {Array.from(grouped.entries()).map(([groupName, params]) => (
          <Section key={groupName} title={groupName} defaultOpen>
            {params.map((param) => (
              <ParameterControl
                key={param.key}
                param={param}
                value={values[param.key] ?? param.default}
                onChange={(v) => handleChange(param.key, v)}
              />
            ))}
          </Section>
        ))}

        {/* Modifiers */}
        {schema.modifiers && schema.modifiers.length > 0 && (
          <Section title="Modifiers">
            {schema.modifiers.map((mod) => (
              <div key={mod.id} className="border-l-2 border-white/10 pl-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                    {mod.name}
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mod.enabled}
                      readOnly
                      className="accent-[var(--color-accent)]"
                    />
                    <span className="text-[9px] text-white/40">
                      {mod.enabled ? 'ON' : 'OFF'}
                    </span>
                  </label>
                </div>
                {mod.enabled &&
                  mod.parameters.map((param) => (
                    <ParameterControl
                      key={param.key}
                      param={param}
                      value={values[`${mod.id}.${param.key}`] ?? param.default}
                      onChange={(v) => handleChange(`${mod.id}.${param.key}`, v)}
                    />
                  ))}
              </div>
            ))}
          </Section>
        )}

        {/* Empty state */}
        {schema.parameters.length === 0 && !schema.modifiers?.length && (
          <div className="text-[10px] text-white/30 uppercase tracking-widest py-8 text-center">
            No controllable parameters
          </div>
        )}
      </div>
    </PanelShell>
  );
}
