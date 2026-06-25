/**
 * library.panel.tsx — the module library, as a PANELFLOW dock panel.
 *
 * Replaces the old full-page Gallery: search / filter the registry and click a
 * module to load it. Selecting a module sets the active project (studio-store);
 * `useActiveModule` then auto-generates its control panel in the dock.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { Library, Search } from 'lucide-react';
import clsx from 'clsx';
import { definePanel } from '@artinos/panelflow';
import { REGISTRY } from '../registry/registry';
import { useStudioStore } from '../studio-store';

function LibraryView() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const activeModuleId = useStudioStore((s) => s.activeModuleId);
  const setActiveModule = useStudioStore((s) => s.setActiveModule);

  const modules = useMemo(
    () => REGISTRY.filter((m) => m.category !== 'lab' && !m.tags.includes('lab')),
    [],
  );
  const categories = useMemo(
    () => Array.from(new Set(modules.map((m) => m.category))).sort(),
    [modules],
  );
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return modules.filter((m) => {
      if (category && m.category !== category) return false;
      if (!q) return true;
      const haystack = [m.name, m.id, m.category, m.description, ...m.tags, ...(m.related ?? [])]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [category, modules, query]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const module of modules) counts.set(module.category, (counts.get(module.category) ?? 0) + 1);
    return counts;
  }, [modules]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="shrink-0 border-b border-white/[0.06] px-3 py-2.5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="min-w-0 text-[10px] text-white/38">
            {results.length} of {modules.length} reusable modules
          </div>
          {category && (
            <button
              onClick={() => setCategory(null)}
              className="rounded-md border border-white/8 bg-white/[0.035] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/48 transition hover:border-teal-300/30 hover:text-teal-200"
            >
              Clear
            </button>
          )}
        </div>

        <label className="relative block">
          <span className="sr-only">Search reusable modules</span>
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-white/28" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, tag, dependency..."
            className="h-9 w-full rounded-lg border border-white/8 bg-black/34 pl-8 pr-3 text-xs text-white outline-none transition placeholder:text-white/24 focus:border-teal-300/45 focus:bg-black/46"
          />
        </label>

        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar" role="listbox" aria-label="Module categories">
          <Chip active={category === null} onClick={() => setCategory(null)}>
            All <span>{modules.length}</span>
          </Chip>
          {categories.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {c} <span>{categoryCounts.get(c) ?? 0}</span>
            </Chip>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar p-2">
        {results.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-[11px] leading-relaxed text-white/36">
            No reusable modules match the current filters.
          </div>
        ) : (
          <div className="space-y-1.5">
            {results.map((m) => {
              const isActive = m.id === activeModuleId;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveModule(m.id)}
                  aria-label={`Load ${m.name}`}
                  className={clsx(
                    'group w-full rounded-lg border px-2.5 py-2 text-left transition',
                    isActive
                      ? 'border-teal-300/55 bg-teal-300/[0.07] shadow-[inset_2px_0_0_rgba(45,212,191,0.85)]'
                      : 'border-white/[0.065] bg-white/[0.022] hover:border-teal-300/28 hover:bg-white/[0.04]',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-semibold text-white/86">{m.name}</div>
                      <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                        <span className="truncate font-mono text-[9px] text-white/32">{m.id}</span>
                        <span className="rounded bg-teal-300/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-teal-200/80">
                          {m.category}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right font-mono text-[9px] text-white/34">
                      {m.schema.parameters.length}c
                      <br />
                      {m.dependencies.length}d
                    </div>
                  </div>
                  <p className="mt-1 line-clamp-1 text-[10px] leading-relaxed text-white/42">{m.description}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      role="option"
      aria-selected={active}
      className={clsx(
        'flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition',
        active ? 'bg-white text-black' : 'border border-white/8 bg-black/32 text-white/48 hover:bg-white/9 hover:text-white/82',
      )}
    >
      {children}
    </button>
  );
}

export const LibraryPanel = definePanel({
  id: 'library',
  title: 'Library',
  description: 'Reusable modules.',
  icon: Library,
  defaultPlacement: 'left',
  defaultSize: 320,
  minSize: 260,
  maxSize: 520,
  capabilities: { floatable: true, closable: true, resizable: true },
  component: LibraryView,
  tags: ['studio'],
});
