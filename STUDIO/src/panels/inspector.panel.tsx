/**
 * inspector.panel.tsx - ARTINOS active-module inspector.
 *
 * This host panel overrides PANELFLOW's generic inspector in STUDIO. It keeps the
 * user's active component/project controls, presets, usage, dependencies, related
 * modules, and agent notes in one place while PANELFLOW still owns the control
 * schema, Frost pane, dock, and bridge.
 */

import { useState, type ReactNode } from 'react';
import { Check, Copy, Info, SlidersHorizontal, Sparkles } from 'lucide-react';
import {
  definePanel,
  FrostPanePanel,
  PanelShell,
  useBridgeStore,
} from '@artinos/panelflow';
import { getModule } from '../registry/registry';
import { useStudioStore } from '../studio-store';

function Section({ title, children, compact = false }: { title: string; children: ReactNode; compact?: boolean }) {
  return (
    <section className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-[9px] font-black uppercase tracking-[0.24em] text-white/36">{title}</div>
      </div>
      {children}
    </section>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked in some browser contexts; this is non-critical.
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/8 bg-black/36">
      <pre className="max-h-[190px] overflow-auto whitespace-pre-wrap p-3 pr-10 font-mono text-[10px] leading-relaxed text-white/72 custom-scrollbar">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg border border-white/8 bg-white/[0.045] text-white/55 transition hover:bg-white/10 hover:text-white"
        aria-label="Copy usage snippet"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
  );
}

function EmptyInspector() {
  return (
    <PanelShell>
      <div className="grid h-full min-h-[260px] place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.018] p-6 text-center">
        <div>
          <SlidersHorizontal size={24} className="mx-auto mb-4 text-white/22" />
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/44">Inspector</div>
          <p className="mt-2 max-w-[280px] text-xs leading-relaxed text-white/34">
            Load a module from Library. Its controls, presets, usage, dependencies, and notes appear here.
          </p>
        </div>
      </div>
    </PanelShell>
  );
}

function InspectorView() {
  const activeModuleId = useStudioStore((s) => s.activeModuleId);
  const setActiveModule = useStudioStore((s) => s.setActiveModule);
  const setAllParams = useBridgeStore((s) => s.setAllParams);
  const module = activeModuleId ? getModule(activeModuleId) : undefined;

  if (!module) return <EmptyInspector />;

  const applyPreset = (preset: Record<string, unknown>) => {
    const base: Record<string, unknown> = {};
    for (const p of module.schema.parameters) base[p.key] = p.default;
    setAllParams(module.id, { ...base, ...preset });
  };

  return (
    <PanelShell>
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto custom-scrollbar">
        <div className="rounded-2xl border border-teal-300/14 bg-teal-300/[0.045] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg border border-teal-300/24 bg-teal-300/10 text-teal-300">
                  <Sparkles size={15} />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-black text-white/88">{module.name}</h2>
                  <div className="mt-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-teal-200/58">{module.category}</div>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-white/43">{module.description}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <MiniStat label="Params" value={module.schema.parameters.length} />
            <MiniStat label="Presets" value={Object.keys(module.presets ?? {}).length} />
            <MiniStat label="Version" value={module.version} />
          </div>
        </div>

        <Section title="Controls">
          <div className="min-h-[360px] overflow-hidden rounded-2xl border border-white/8 bg-black/16">
            <FrostPanePanel schema={module.schema} targetId={module.id} />
          </div>
        </Section>

        {module.presets && Object.keys(module.presets).length > 0 && (
          <Section title="Presets" compact>
            <div className="flex flex-wrap gap-2">
              {Object.entries(module.presets).map(([name, values]) => (
                <button
                  key={name}
                  onClick={() => applyPreset(values)}
                  className="rounded-lg border border-white/8 bg-white/[0.045] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/62 transition hover:border-teal-300/32 hover:bg-teal-300/10 hover:text-white"
                >
                  {name}
                </button>
              ))}
            </div>
          </Section>
        )}

        <Section title="Usage">
          <CodeBlock code={module.usage} />
        </Section>

        <Section title="Dependencies" compact>
          <div className="flex flex-wrap gap-1.5">
            {module.dependencies.map((dep) => (
              <span key={dep} className="rounded-md border border-white/7 bg-white/[0.035] px-2 py-1 font-mono text-[10px] text-white/58">
                {dep}
              </span>
            ))}
          </div>
        </Section>

        {module.related && module.related.length > 0 && (
          <Section title="Related" compact>
            <div className="flex flex-wrap gap-2">
              {module.related.map((id) => {
                const exists = !!getModule(id);
                return (
                  <button
                    key={id}
                    disabled={!exists}
                    onClick={() => exists && setActiveModule(id)}
                    className={
                      'rounded-lg border px-3 py-1.5 text-[10px] font-semibold transition ' +
                      (exists
                        ? 'border-teal-300/28 text-white/70 hover:bg-teal-300/10 hover:text-white'
                        : 'cursor-not-allowed border-white/5 text-white/25')
                    }
                  >
                    {id}{!exists && ' / missing'}
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        <Section title="Agent Notes">
          <div className="rounded-xl border border-white/7 bg-white/[0.025] p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/48">
              <Info size={13} />
              Reuse Context
            </div>
            <p className="text-xs leading-relaxed text-white/43">{module.agentNotes}</p>
          </div>
        </Section>
      </div>
    </PanelShell>
  );
}

function MiniStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/7 bg-black/22 px-2.5 py-2">
      <div className="text-[8px] font-black uppercase tracking-[0.16em] text-white/28">{label}</div>
      <div className="mt-1 truncate font-mono text-[11px] font-bold text-white/76">{value}</div>
    </div>
  );
}

export const ArtinosInspectorPanel = definePanel({
  id: 'inspector',
  title: 'Inspector',
  description: 'Active module controls, presets, usage, dependencies, and agent notes.',
  icon: SlidersHorizontal,
  defaultPlacement: 'right',
  defaultSize: 430,
  minSize: 340,
  maxSize: 620,
  capabilities: { floatable: true, closable: false, resizable: true },
  component: InspectorView,
  tags: ['studio', 'inspector', 'controls'],
});
