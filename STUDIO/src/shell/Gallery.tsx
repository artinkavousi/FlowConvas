/**
 * Gallery.tsx — browse / search / filter the ARTINOS module library.
 *
 * Premium creative-lab grid (not a dashboard table): glass cards over the dark
 * workspace, teal accents, hover lift. Clicking a card opens its showcase.
 */

import { useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { searchModules, listCategories, REGISTRY } from '../registry/registry';
import { useStudioStore } from '../studio-store';

export function Gallery() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const openShowcase = useStudioStore((s) => s.openShowcase);

  const categories = listCategories();
  const results = searchModules({ query: query || undefined, category: category ?? undefined });

  return (
    <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
      <div className="mx-auto max-w-6xl px-8 pt-16 pb-[520px]">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
              ARTINOS
            </h1>
            <span className="text-[11px] uppercase tracking-[0.3em]" style={{ color: 'var(--color-accent)' }}>
              Studio
            </span>
          </div>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Reusable creative block library — {REGISTRY.length} module{REGISTRY.length === 1 ? '' : 's'}.
          </p>
        </div>

        {/* Search */}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search modules…"
          className="w-full mb-4 rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--color-accent)] transition-colors"
        />

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Chip active={category === null} onClick={() => setCategory(null)}>All</Chip>
          {categories.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
          ))}
        </div>

        {/* Grid / empty states */}
        {REGISTRY.length === 0 ? (
          <div className="text-center py-24 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            The library is empty — convert or add a module to get started.
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-24 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No modules match your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((m) => (
              <button
                key={m.id}
                onClick={() => openShowcase(m.id)}
                className="glass-panel group text-left rounded-2xl p-5 border border-white/10 hover:border-[var(--color-accent)]/50 transition-all hover:-translate-y-1"
              >
                <div className="mb-3">
                  <span
                    className="text-[9px] uppercase tracking-[0.2em] px-2 py-1 rounded-md"
                    style={{ color: 'var(--color-accent)', background: 'rgba(45,212,191,0.1)' }}
                  >
                    {m.category}
                  </span>
                </div>
                <h3 className="text-base font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>
                  {m.name}
                </h3>
                <p className="text-xs leading-relaxed mb-4 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                  {m.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {m.tags.slice(0, 4).map((t) => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                      {t}
                    </span>
                  ))}
                </div>
              </button>
            ))}
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
      className={clsx(
        'px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all',
        active ? 'bg-white text-black' : 'bg-black/40 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white',
      )}
    >
      {children}
    </button>
  );
}
