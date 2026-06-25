/**
 * lab-capsules.panel.tsx — dedicated Lab capsule browser.
 *
 * Labs are faithful project replicas with their own portable module snapshots.
 * This panel keeps them separate from the reusable-module Library while still
 * loading them through the same active-module viewport/control pipeline.
 */

import { useMemo, useState } from 'react';
import { FlaskConical, Layers3, PackageOpen, Search, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import { definePanel } from '@artinos/panelflow';
import { getModule, REGISTRY } from '../registry/registry';
import { useStudioStore } from '../studio-store';
import type { ArtinosModule } from '../registry/types';

const labs = REGISTRY.filter((m) => m.category === 'lab' || m.tags.includes('lab'));

function relatedModules(lab: ArtinosModule) {
  return (lab.related ?? []).map((id) => getModule(id)).filter((m): m is ArtinosModule => Boolean(m));
}

function CapsuleStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 px-2.5 py-2">
      <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/32">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white/85">{value}</div>
    </div>
  );
}

function LabCapsulesView() {
  const [query, setQuery] = useState('');
  const [selectedLabId, setSelectedLabId] = useState(labs[0]?.id ?? null);
  const activeModuleId = useStudioStore((s) => s.activeModuleId);
  const setActiveModule = useStudioStore((s) => s.setActiveModule);
  const visibleLabs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return labs;
    return labs.filter((lab) => (
      [lab.name, lab.id, lab.description, lab.sourcePath, ...(lab.related ?? []), ...lab.tags]
        .join(' ')
        .toLowerCase()
        .includes(q)
    ));
  }, [query]);
  const selectedLab = visibleLabs.find((lab) => lab.id === selectedLabId) ?? visibleLabs[0] ?? null;
  const selectedRelated = selectedLab ? relatedModules(selectedLab) : [];
  const selectedPresetCount = selectedLab?.presets ? Object.keys(selectedLab.presets).length : 0;
  const selectLab = (labId: string) => {
    setSelectedLabId(labId);
    setActiveModule(labId);
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col text-xs">
      <div className="shrink-0 border-b border-white/[0.06] px-3 py-2.5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="min-w-0 text-[10px] text-white/38">
            {visibleLabs.length} of {labs.length} labs
          </div>
          <span className="rounded-md border border-teal-300/20 bg-teal-300/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-teal-200">
            {labs.length}
          </span>
        </div>
        <label className="relative block">
          <span className="sr-only">Search labs</span>
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-white/28" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search labs, source, modules..."
            className="h-9 w-full rounded-lg border border-white/8 bg-black/34 pl-8 pr-3 text-xs text-white outline-none transition placeholder:text-white/24 focus:border-teal-300/45 focus:bg-black/46"
          />
        </label>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)]">
        {visibleLabs.length === 0 ? (
          <div className="m-3 rounded-xl border border-dashed border-white/12 p-5 text-center text-[11px] leading-relaxed text-white/38">
            No labs are registered yet.
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b border-white/[0.055] p-2">
              <div className="grid gap-1.5">
                {visibleLabs.map((lab) => {
                  const isActive = lab.id === activeModuleId;
                  const isSelected = lab.id === selectedLab?.id;
                  const related = relatedModules(lab);
                  const presetCount = lab.presets ? Object.keys(lab.presets).length : 0;

                  return (
                    <button
                      key={lab.id}
                      onClick={() => selectLab(lab.id)}
                      aria-label={`Load ${lab.name}`}
                      className={clsx(
                        'w-full rounded-lg border px-2.5 py-2 text-left transition',
                        isSelected
                          ? 'border-teal-300/45 bg-teal-300/[0.07]'
                          : 'border-white/[0.065] bg-white/[0.022] hover:border-teal-300/28 hover:bg-white/[0.04]',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-[12px] font-semibold text-white/88">{lab.name}</div>
                          <div className="mt-0.5 truncate font-mono text-[9px] text-white/30">{lab.id}</div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <span className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[9px] text-white/46">
                            {related.length}s
                          </span>
                          <span className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[9px] text-white/46">
                            {presetCount}p
                          </span>
                          {isActive && <span className="h-1.5 w-1.5 rounded-full bg-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.8)]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedLab && (
              <div className="min-h-0 overflow-y-auto custom-scrollbar p-3">
                {(() => {
                  const lab = selectedLab;
                  const isActive = lab.id === activeModuleId;
                  const related = selectedRelated;
                  const presetCount = selectedPresetCount;

                  return (
                    <article
                      className={clsx(
                        'rounded-xl border p-3 transition-all',
                        isActive
                          ? 'border-teal-300/55 bg-teal-300/[0.07] shadow-[0_0_28px_rgba(45,212,191,0.08)]'
                          : 'border-white/10 bg-white/[0.025]',
                      )}
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-white/92">{lab.name}</h3>
                          <div className="mt-1 font-mono text-[9px] text-white/30">{lab.sourcePath}</div>
                        </div>
                        {isActive && (
                          <span className="shrink-0 rounded-md border border-teal-300/25 bg-teal-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-teal-100">
                            Loaded
                          </span>
                        )}
                      </div>

                      <p className="line-clamp-2 text-[11px] leading-relaxed text-white/48">{lab.description}</p>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <CapsuleStat label="Snapshots" value={related.length || '-'} />
                        <CapsuleStat label="Presets" value={presetCount || '-'} />
                        <CapsuleStat label="Version" value={lab.version} />
                      </div>

                      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-2.5">
                        <div className="mb-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/38">
                          <Layers3 size={12} /> Canonical Modules
                        </div>
                        {related.length === 0 ? (
                          <div className="text-[11px] text-white/35">No related modules recorded.</div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {related.map((m) => (
                              <button
                                key={m.id}
                                onClick={() => setActiveModule(m.id)}
                                className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-bold text-white/58 transition hover:border-teal-300/35 hover:text-teal-100"
                              >
                                {m.id}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[9px] text-white/32">
                        <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-1">
                          <ShieldCheck size={11} /> {lab.validation?.build ? 'build' : 'build?'}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-1">
                          <FlaskConical size={11} /> {lab.validation?.preview ? 'preview' : 'preview?'}
                        </span>
                        {lab.dependencies.map((dep) => (
                          <span key={dep} className="rounded-md bg-white/[0.035] px-2 py-1 font-mono">
                            {dep}
                          </span>
                        ))}
                      </div>
                    </article>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export const LabCapsulesPanel = definePanel({
  id: 'lab-capsules',
  title: 'Lab',
  description: 'Faithful Lab replicas.',
  icon: PackageOpen,
  defaultPlacement: 'left',
  defaultSize: 360,
  minSize: 300,
  maxSize: 620,
  capabilities: { floatable: true, closable: true, resizable: true },
  component: LabCapsulesView,
  tags: ['studio', 'lab', 'capsule'],
});
