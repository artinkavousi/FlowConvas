/**
 * inspector.panel.tsx - ARTINOS active-module inspector.
 *
 * Control-first host panel. PANELFLOW owns the schema-driven controls and
 * bridge; ARTINOS adds module context, presets, and reference notes after the
 * working control surface.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Check, Copy, FileCode2, Info, Link2, Package, SlidersHorizontal, Sparkles } from 'lucide-react';
import {
  ControlPanel,
  definePanel,
  PanelShell,
  registerPanel,
  useBridgeStore,
  type PanelDefinition,
} from '@artinos/panelflow';
import { getModule } from '../registry/registry';
import { useStudioStore } from '../studio-store';

const INSPECTOR_ID = 'inspector';
const BASE_TITLE = 'Inspector';
const BASE_DESCRIPTION = 'Active module controls, presets, usage, dependencies, and agent notes.';

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked in some browser contexts; non-critical.
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-white/8 bg-black/36">
      <pre className="max-h-[180px] overflow-auto whitespace-pre-wrap p-3 pr-10 font-mono text-[10px] leading-relaxed text-white/66 custom-scrollbar">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md border border-white/8 bg-white/[0.045] text-white/55 transition hover:bg-white/10 hover:text-white"
        aria-label="Copy usage snippet"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
  );
}

function EmptyInspector() {
  return (
    <PanelShell noPadding>
      <div className="grid h-full min-h-[260px] place-items-center p-4">
        <div className="max-w-[340px] rounded-xl border border-dashed border-white/12 bg-white/[0.025] p-6 text-center">
          <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl border border-teal-300/18 bg-teal-300/8 text-teal-200/70">
            <SlidersHorizontal size={20} />
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/50">Inspector Ready</div>
          <p className="mt-2 text-xs leading-relaxed text-white/36">
            Load a module from Library. Controls appear first; usage and notes sit below them.
          </p>
        </div>
      </div>
    </PanelShell>
  );
}

function ReferenceSection({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/40">
        <span className="text-teal-200/60">{icon}</span>
        {title}
      </div>
      {children}
    </section>
  );
}

function InspectorView() {
  const activeModuleId = useStudioStore((s) => s.activeModuleId);
  const setActiveModule = useStudioStore((s) => s.setActiveModule);
  const setAllParams = useBridgeStore((s) => s.setAllParams);
  const module = activeModuleId ? getModule(activeModuleId) : undefined;

  useEffect(() => {
    registerPanel({
      ...ArtinosInspectorPanel,
      title: module ? module.name : BASE_TITLE,
      description: module ? `${module.category} - v${module.version} - ${module.description}` : BASE_DESCRIPTION,
    });
    return () => {
      registerPanel({ ...ArtinosInspectorPanel, title: BASE_TITLE, description: BASE_DESCRIPTION });
    };
  }, [module]);

  const groupCount = useMemo(() => {
    if (!module) return 0;
    return new Set(module.schema.parameters.map((p) => p.group || 'Properties')).size;
  }, [module]);

  if (!module) return <EmptyInspector />;

  const presetEntries = Object.entries(module.presets ?? {});
  const applyPreset = (preset: Record<string, unknown>) => {
    const base: Record<string, unknown> = {};
    for (const p of module.schema.parameters) base[p.key] = p.default;
    setAllParams(module.id, { ...base, ...preset });
  };

  return (
    <PanelShell noPadding>
      <div className="h-full min-h-0 overflow-y-auto custom-scrollbar px-3.5 py-3">
        {/* Controls first — borderless masonry, fills the width. */}
        <ControlPanel schema={module.schema} targetId={module.id} columnWidth="12rem" />

        {/* Everything else after the controls. */}
        <div className="mt-5 space-y-3 border-t border-white/[0.06] pt-4">
          {/* Compact meta line — no box. */}
          <div className="flex items-center gap-2 text-[9px]">
            <span className="font-black uppercase tracking-[0.16em] text-teal-200/80">{module.category}</span>
            <span className="font-mono text-white/30">{module.id}</span>
            <span className="ml-auto font-mono text-white/30">{module.schema.parameters.length} controls · {groupCount} groups</span>
          </div>

          {/* Presets — inline chips, no card. */}
          {presetEntries.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Sparkles size={11} className="text-teal-200/70" />
              {presetEntries.map(([name, values]) => (
                <button
                  key={name}
                  onClick={() => applyPreset(values)}
                  className="rounded-md bg-white/[0.05] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-white/60 transition hover:bg-teal-300/14 hover:text-white"
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          {/* Reference docs. */}
          <div className="text-[8px] font-black uppercase tracking-[0.22em] text-white/28">Module Reference</div>

          <ReferenceSection icon={<FileCode2 size={12} />} title="Usage">
            <CodeBlock code={module.usage} />
          </ReferenceSection>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-x-5 gap-y-3">
            <ReferenceSection icon={<Package size={12} />} title="Dependencies">
              <div className="flex flex-wrap gap-1.5">
                {module.dependencies.map((dep) => (
                  <span key={dep} className="rounded bg-white/[0.05] px-2 py-0.5 font-mono text-[10px] text-white/56">
                    {dep}
                  </span>
                ))}
              </div>
            </ReferenceSection>

            <ReferenceSection icon={<Link2 size={12} />} title="Related">
              {module.related && module.related.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {module.related.map((id) => {
                    const exists = !!getModule(id);
                    return (
                      <button
                        key={id}
                        disabled={!exists}
                        onClick={() => exists && setActiveModule(id)}
                        className={
                          'rounded px-2 py-0.5 text-[10px] font-semibold transition ' +
                          (exists ? 'bg-white/[0.05] text-white/68 hover:bg-teal-300/12 hover:text-white' : 'cursor-not-allowed text-white/22')
                        }
                      >
                        {id}{!exists && ' / missing'}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-white/30">None registered yet.</p>
              )}
            </ReferenceSection>
          </div>

          {module.reuseNotes && (
            <ReferenceSection icon={<Info size={12} />} title="Reuse Notes">
              <p className="text-[11px] leading-relaxed text-white/44">{module.reuseNotes}</p>
            </ReferenceSection>
          )}

          <ReferenceSection icon={<Info size={12} />} title="Agent Notes">
            <p className="text-[11px] leading-relaxed text-white/44">{module.agentNotes}</p>
          </ReferenceSection>
        </div>
      </div>
    </PanelShell>
  );
}

export const ArtinosInspectorPanel: PanelDefinition = definePanel({
  id: INSPECTOR_ID,
  title: BASE_TITLE,
  description: BASE_DESCRIPTION,
  icon: SlidersHorizontal,
  defaultPlacement: 'right',
  defaultSize: 520,
  minSize: 380,
  maxSize: 860,
  capabilities: { floatable: true, closable: false, resizable: true },
  component: InspectorView,
  tags: ['studio', 'inspector', 'controls'],
});
