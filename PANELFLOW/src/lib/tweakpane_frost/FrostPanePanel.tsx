/**
 * FrostPanePanel — the schema-driven control panel, rendered with Tweakpane Frost.
 *
 * This is what PANELFLOW auto-generates for every registered component
 * (see control-engine `generatePanelFromSchema`). It is derived ENTIRELY from the
 * `ComponentSchema` + the shared `useBridgeStore` (keyed by `schema.id`), so the
 * same panel works for any component that registers a schema — copy-paste safe.
 *
 * - Groups (`ParameterDef.group`) become Tweakpane folders.
 * - `schema.modifiers` become a folder per modifier (with an enable toggle).
 * - Edits write to the bridge → the live component re-renders within a frame.
 * - External edits (e.g. presets via `setAllParams`) refresh the pane in place.
 */

import { useRef, useEffect } from 'react';
import { PanelShell } from '@/panel-os/panel-shell';
import type { ComponentSchema, ParameterDef } from '@/control-engine';
import { useBridgeStore, initializeBridgeDefaults } from '@/control-engine';
import './frost-tweakpane.css';

type AnyPane = any;

function toVecObject(value: any, axes: number): Record<string, number> {
  const labels = ['x', 'y', 'z'];
  const arr = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? labels.map((k) => value[k])
      : [];
  const out: Record<string, number> = {};
  for (let i = 0; i < axes; i++) out[labels[i]] = Number(arr[i] ?? 0);
  return out;
}

function fromVecObject(obj: Record<string, number>, axes: number): number[] {
  const labels = ['x', 'y', 'z'];
  return Array.from({ length: axes }, (_, i) => Number(obj[labels[i]] ?? 0));
}

function normalizeHexColor(value: any, fallback = '#ffffff'): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed;
    if (/^[0-9a-f]{6}$/i.test(trimmed)) return `#${trimmed}`;
    if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
      return `#${trimmed.slice(1).split('').map((c) => c + c).join('')}`;
    }
  }

  if (value && typeof value === 'object') {
    const r = Number(value.r ?? 255);
    const g = Number(value.g ?? 255);
    const b = Number(value.b ?? 255);
    const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  return fallback;
}

/** Adds one parameter's binding(s) to a container, wiring change → bridge. */
function addParamBinding(
  container: AnyPane,
  params: Record<string, any>,
  param: ParameterDef,
  initial: any,
  onParam: (key: string, value: any) => void,
): { refresh: (value: any) => void } {
  const label = param.label || param.key;
  const value = initial ?? param.default;

  if (param.type === 'vec2' || param.type === 'vec3') {
    const axes = param.type === 'vec2' ? 2 : 3;
    params[param.key] = toVecObject(value, axes);
    const opts: any = { label };
    if (param.min !== undefined) opts.min = param.min;
    if (param.max !== undefined) opts.max = param.max;
    if (param.step !== undefined) opts.step = param.step;
    const b = container.addBinding(params, param.key, opts);
    b.on('change', () => onParam(param.key, fromVecObject(params[param.key], axes)));
    return { refresh: (v) => { params[param.key] = toVecObject(v, axes); } };
  }

  if (param.type === 'range') {
    const min = param.min ?? 0;
    const max = param.max ?? 100;
    const arr = Array.isArray(value) ? value : [min, max];
    const loKey = `${param.key}__lo`;
    const hiKey = `${param.key}__hi`;
    params[loKey] = Number(arr[0] ?? min);
    params[hiKey] = Number(arr[1] ?? max);
    const emit = () => onParam(param.key, [params[loKey], params[hiKey]]);
    const common: any = { min, max, step: param.step ?? 1 };
    container.addBinding(params, loKey, { ...common, label: `${label} ▸ min` }).on('change', emit);
    container.addBinding(params, hiKey, { ...common, label: `${label} ▸ max` }).on('change', emit);
    return {
      refresh: (v) => {
        const a = Array.isArray(v) ? v : [min, max];
        params[loKey] = Number(a[0] ?? min);
        params[hiKey] = Number(a[1] ?? max);
      },
    };
  }

  // scalar types: number / color / boolean / string / enum
  params[param.key] = param.type === 'color' ? normalizeHexColor(value, normalizeHexColor(param.default)) : value;
  const opts: any = { label };
  if (param.min !== undefined) opts.min = param.min;
  if (param.max !== undefined) opts.max = param.max;
  if (param.step !== undefined) opts.step = param.step;
  if (param.type === 'enum' && param.options) {
    opts.options = Object.fromEntries(param.options.map((o) => [o.label, o.value]));
  }
  const b = container.addBinding(params, param.key, opts);
  b.on('change', (ev: any) => {
    const next = param.type === 'color' ? normalizeHexColor(ev.value, params[param.key]) : ev.value;
    params[param.key] = next;
    onParam(param.key, next);
  });
  return {
    refresh: (v) => {
      params[param.key] = param.type === 'color' ? normalizeHexColor(v, params[param.key]) : v;
    },
  };
}

export interface FrostPanePanelProps {
  schema: ComponentSchema;
  /** Bridge value bucket. Defaults to schema.id for legacy schema-level panels. */
  targetId?: string;
}

export function FrostPanePanel({ schema, targetId = schema.id }: FrostPanePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const setParam = useBridgeStore((s) => s.setParam);

  useEffect(() => {
    initializeBridgeDefaults(schema, targetId);
  }, [schema.id, targetId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let pane: AnyPane = null;
    let disposed = false;
    const params: Record<string, any> = {};
    const refreshers = new Map<string, (value: any) => void>();

    const onParam = (key: string, value: any) => setParam(targetId, key, value);
    const colorParams = schema.parameters.filter((param) => param.type === 'color');
    const mirrorColorTextEdit = (event: Event) => {
      const input = event.target as HTMLInputElement | null;
      if (!input || input.tagName !== 'INPUT' || colorParams.length === 0) return;
      if (!/^#?[0-9a-f]{6}$/i.test(input.value.trim())) return;
      const colorInputs = Array.from(container.querySelectorAll('input')).filter((el) => /^#?[0-9a-f]{6}$/i.test((el as HTMLInputElement).value.trim()));
      const index = colorInputs.indexOf(input);
      const param = colorParams[index];
      if (!param) return;
      onParam(param.key, normalizeHexColor(input.value, normalizeHexColor(param.default)));
    };

    const init = async () => {
      const { Pane } = await import('./tweakpane.js');
      if (disposed) return;

      container.classList.add('frost-tweakpane');
      pane = new Pane({ container });

      try {
        const plugins = await import('./tweakpane-plugins.js');
        if (plugins.EssentialsPlugin) pane.registerPlugin(plugins.EssentialsPlugin);
        if (plugins.CamerakitPlugin) pane.registerPlugin(plugins.CamerakitPlugin);
      } catch { /* plugins optional */ }
      if (disposed) { try { pane.dispose(); } catch { /* ignore */ } return; }

      const values = useBridgeStore.getState().getParams(targetId);

      // Group parameters by `group` → one folder each (single group renders flat).
      const grouped = new Map<string, ParameterDef[]>();
      for (const p of schema.parameters) {
        const g = p.group || 'Properties';
        if (!grouped.has(g)) grouped.set(g, []);
        grouped.get(g)!.push(p);
      }
      const flat = grouped.size <= 1;
      for (const [groupName, ps] of grouped) {
        const container2 = flat ? pane : pane.addFolder({ title: groupName, expanded: true });
        for (const p of ps) {
          const reg = addParamBinding(container2, params, p, values[p.key], onParam);
          refreshers.set(p.key, reg.refresh);
        }
      }

      // Modifiers → a folder each.
      for (const mod of schema.modifiers ?? []) {
        const folder = pane.addFolder({ title: mod.name, expanded: mod.enabled });
        for (const p of mod.parameters) {
          const key = `${mod.id}.${p.key}`;
          const reg = addParamBinding(
            folder,
            params,
            { ...p, key },
            values[key],
            onParam,
          );
          refreshers.set(key, reg.refresh);
        }
      }

      // Push external bridge changes (presets, host pushes) back into the pane.
      unsub = useBridgeStore.subscribe((state) => {
        const v = state.componentValues[targetId];
        if (!v || !pane) return;
        let changed = false;
        for (const [key, refresh] of refreshers) {
          if (key in v) { refresh(v[key]); changed = true; }
        }
        if (changed) { try { pane.refresh(); } catch { /* ignore */ } }
      });
    };

    let unsub: (() => void) | undefined;
    init().catch((e) => console.warn('[FrostPanePanel] init failed:', e));
    container.addEventListener('input', mirrorColorTextEdit, true);
    container.addEventListener('change', mirrorColorTextEdit, true);

    return () => {
      disposed = true;
      container.removeEventListener('input', mirrorColorTextEdit, true);
      container.removeEventListener('change', mirrorColorTextEdit, true);
      unsub?.();
      if (pane) { try { pane.dispose(); } catch { /* ignore */ } }
      container.classList.remove('frost-tweakpane');
      container.innerHTML = '';
    };
  }, [schema, targetId, setParam]);

  return (
    <PanelShell noPadding>
      <div
        ref={containerRef}
        className="frost-tweakpane w-full h-full overflow-y-auto custom-scrollbar p-2"
        style={{ minHeight: 200 }}
      />
    </PanelShell>
  );
}
