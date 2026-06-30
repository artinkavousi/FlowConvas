import { useMemo, useState } from 'react';
import { Check, Copy, Trash2 } from 'lucide-react';
import { useInspectorStore } from '@/inspector/inspector-store';
import type { ConsoleLevel } from '@/inspector/types';

const LEVELS: { id: ConsoleLevel; label: string; tint: string }[] = [
  { id: 'info', label: 'Info', tint: 'text-white/65' },
  { id: 'warn', label: 'Warn', tint: 'text-amber-300' },
  { id: 'error', label: 'Error', tint: 'text-red-400' },
];

const LEVEL_STYLE: Record<ConsoleLevel, string> = {
  info: 'text-white/62',
  warn: 'text-amber-300/90',
  error: 'text-red-400/90',
};

export function ConsoleView() {
  const messages = useInspectorStore((s) => s.console);
  const clearConsole = useInspectorStore((s) => s.clearConsole);
  const [filters, setFilters] = useState<Record<ConsoleLevel, boolean>>({ info: true, warn: true, error: true });
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const visible = useMemo(() => {
    const q = query.toLowerCase();
    return messages.filter((m) => filters[m.level] && (q === '' || m.text.toLowerCase().includes(q)));
  }, [messages, filters, query]);

  const copyAll = () => {
    void navigator.clipboard.writeText(visible.map((m) => `[${m.level}] ${m.text}`).join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter…"
          className="min-w-0 flex-1 rounded-lg border border-white/8 bg-black/40 px-2.5 py-1.5 text-[11px] text-white outline-none transition focus:border-teal-300/50"
        />
        <button
          onClick={copyAll}
          title="Copy visible"
          className="rounded-lg border border-white/8 bg-white/[0.045] p-1.5 text-white/55 transition hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
        <button
          onClick={clearConsole}
          title="Clear"
          className="rounded-lg border border-white/8 bg-white/[0.045] p-1.5 text-white/55 transition hover:bg-white/10 hover:text-white"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="flex gap-1">
        {LEVELS.map((lvl) => {
          const active = filters[lvl.id];
          return (
            <button
              key={lvl.id}
              onClick={() => setFilters((f) => ({ ...f, [lvl.id]: !f[lvl.id] }))}
              className={
                'flex-1 rounded-lg border px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] transition ' +
                (active ? `border-white/12 bg-white/[0.06] ${lvl.tint}` : 'border-white/6 bg-black/24 text-white/28')
              }
            >
              {lvl.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar rounded-xl border border-white/7 bg-black/34 p-1.5 font-mono text-[10.5px] leading-relaxed">
        {visible.length === 0 ? (
          <div className="grid h-full min-h-[100px] place-items-center text-[10px] uppercase tracking-[0.18em] text-white/26">
            No messages
          </div>
        ) : (
          visible.map((m) => (
            <div key={m.id} className="flex items-start gap-2 border-b border-white/[0.035] px-1.5 py-1 last:border-0">
              <span className={`shrink-0 ${LEVEL_STYLE[m.level]}`}>›</span>
              <span className={`min-w-0 flex-1 whitespace-pre-wrap break-words ${LEVEL_STYLE[m.level]}`}>{m.text}</span>
              {m.count > 1 && (
                <span className="shrink-0 rounded-full bg-white/10 px-1.5 text-[9px] text-white/55">{m.count}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
