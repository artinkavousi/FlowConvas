/**
 * agent.panel.tsx — the agent-operability surface (plan-completion D-B).
 *
 * Renders the registry as agent-facing records (id, category, tags, agentNotes,
 * usage, dependencies, validation) with copy-as-JSON actions, plus the reuse-first
 * checklist (ARTINOS-PRD §15). Reads the registry; embeds no LLM.
 */

import { useMemo, useState } from 'react';
import { Bot, Check, Copy, ClipboardList } from 'lucide-react';
import clsx from 'clsx';
import { definePanel } from '@artinos/panelflow';
import { REGISTRY, searchModules } from '../registry/registry';
import { useStudioStore } from '../studio-store';
import type { ArtinosModule } from '../registry/types';

const REUSE_CHECKLIST = [
  'Is there already a similar module in ARTINOS?',
  'Can an existing module be extended instead of duplicated?',
  'Should this become a new reusable module?',
  'Should this get its own showcase + registry entry?',
  'Should this expose inspector controls?',
  'Should this become a graph node?',
  'Is this likely to be reused in future projects?',
];

/** The machine-readable record an agent reads to discover/use/extend a module. */
function agentRecord(m: ArtinosModule) {
  return {
    id: m.id,
    name: m.name,
    category: m.category,
    tags: m.tags,
    dependencies: m.dependencies,
    sourcePath: m.sourcePath,
    usage: m.usage,
    agentNotes: m.agentNotes,
    presets: m.presets ? Object.keys(m.presets) : [],
    related: m.related ?? [],
    validation: m.validation ?? null,
    version: m.version,
  };
}

function CopyButton({ getText, label }: { getText: () => string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(getText());
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        } catch {
          /* clipboard can be blocked; non-critical */
        }
      }}
      className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white/55 transition hover:bg-teal-300/15 hover:text-white"
    >
      {done ? <Check size={11} /> : <Copy size={11} />} {label}
    </button>
  );
}

function AgentView() {
  const [query, setQuery] = useState('');
  const setActiveModule = useStudioStore((s) => s.setActiveModule);
  const results = useMemo(() => searchModules({ query: query || undefined }), [query]);

  const allRecords = () => JSON.stringify(REGISTRY.map(agentRecord), null, 2);

  return (
    <div className="flex h-full w-full min-h-0 flex-col text-xs">
      <div className="shrink-0 space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-teal-200/80">
            <Bot size={13} /> Agent Surface
          </span>
          <CopyButton getText={allRecords} label={`Copy all (${REGISTRY.length})`} />
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search agent records…"
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-[var(--color-accent)] focus:outline-none"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar px-3 pb-3">
        <div className="space-y-2">
          {results.map((m) => (
            <div key={m.id} className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <button
                  onClick={() => setActiveModule(m.id)}
                  className="text-sm font-semibold text-white/90 hover:text-[var(--color-accent)]"
                >
                  {m.name}
                </button>
                <span className="rounded bg-teal-400/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.2em] text-teal-300/90">
                  {m.category}
                </span>
              </div>
              <p className="mb-2 line-clamp-2 text-[11px] leading-relaxed text-white/45">{m.agentNotes}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[9px] text-white/30">{m.dependencies.join(' · ')}</span>
                <span className="ml-auto" />
                <CopyButton getText={() => JSON.stringify(agentRecord(m), null, 2)} label="Record" />
                <CopyButton getText={() => m.usage} label="Usage" />
              </div>
            </div>
          ))}
          {results.length === 0 && (
            <div className="py-10 text-center text-[11px] text-white/35">No records match.</div>
          )}
        </div>

        {/* Reuse-first checklist (ARTINOS-PRD §15). */}
        <div className="mt-4 rounded-xl border border-dashed border-white/12 p-3">
          <div className="mb-2 inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/45">
            <ClipboardList size={12} /> Reuse-first checklist
          </div>
          <ol className="space-y-1">
            {REUSE_CHECKLIST.map((q, i) => (
              <li key={i} className="flex gap-2 text-[11px] leading-relaxed text-white/50">
                <span className="text-teal-300/60">{i + 1}.</span> {q}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

export const AgentPanel = definePanel({
  id: 'agent',
  title: 'Agent',
  description: 'Agent-readable registry records, copy actions, and the reuse-first checklist.',
  icon: Bot,
  defaultPlacement: 'left',
  defaultSize: 340,
  minSize: 280,
  maxSize: 560,
  capabilities: { floatable: true, closable: true, resizable: true },
  component: AgentView,
  tags: ['studio', 'agent'],
});
