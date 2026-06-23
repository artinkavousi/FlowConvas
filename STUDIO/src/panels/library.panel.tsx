/**
 * library.panel.tsx — the module library, as a PANELFLOW dock panel.
 *
 * Replaces the old full-page Gallery: search / filter the registry and click a
 * module to load it. Selecting a module sets the active project (studio-store);
 * `useActiveModule` then auto-generates its control panel in the dock.
 */

import { useState, type ReactNode } from 'react';
import { Library } from 'lucide-react';
import clsx from 'clsx';
import { definePanel } from '@artinos/panelflow';
import { searchModules, listCategories, REGISTRY } from '../registry/registry';
import { useStudioStore } from '../studio-store';

function LibraryView() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const activeModuleId = useStudioStore((s) => s.activeModuleId);
  const setActiveModule = useStudioStore((s) => s.setActiveModule);

  const categories = listCategories();
  const results = searchModules({ query: query || undefined, category: category ?? undefined });

  return (
    <div className="flex flex-col h-full w-full min-h-0">
      <div className="p-3 flex flex-col gap-2 shrink-0">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search modules…"
          className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--color-accent)] transition-colors"
        />
        <div className="flex flex-wrap gap-1.5">
          <Chip active={category === null} onClick={() => setCategory(null)}>All</Chip>
          {categories.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3 pb-3 flex flex-col gap-2">
        {results.length === 0 ? (
          <div className="text-center py-12 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {REGISTRY.length === 0 ? 'The library is empty.' : 'No modules match your search.'}
          </div>
        ) : (
          results.map((m) => {
            const isActive = m.id === activeModuleId;
            return (
              <button
                key={m.id}
                onClick={() => setActiveModule(m.id)}
                className={clsx(
                  'group text-left rounded-xl p-3 border transition-all',
                  isActive
                    ? 'border-[var(--color-accent)]/60 bg-[var(--color-accent)]/[0.06]'
                    : 'glass-panel border-white/10 hover:border-[var(--color-accent)]/40 hover:-translate-y-0.5',
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{m.name}</h3>
                  <span
                    className="text-[8px] uppercase tracking-[0.2em] px-1.5 py-0.5 rounded shrink-0"
                    style={{ color: 'var(--color-accent)', background: 'rgba(45,212,191,0.1)' }}
                  >
                    {m.category}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                  {m.description}
                </p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all',
        active ? 'bg-white text-black' : 'bg-black/40 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white',
      )}
    >
      {children}
    </button>
  );
}

export const LibraryPanel = definePanel({
  id: 'library',
  title: 'Library',
  description: 'Browse and load reusable modules.',
  icon: Library,
  defaultPlacement: 'left',
  defaultSize: 320,
  minSize: 260,
  maxSize: 520,
  capabilities: { floatable: true, closable: true, resizable: true },
  component: LibraryView,
  tags: ['studio'],
});
