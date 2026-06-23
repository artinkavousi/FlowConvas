/**
 * console.panel.tsx — the Console / diagnostics dock panel (PRD §6.1).
 *
 * A thin mirror, not a logging framework (plan-completion D-D): it taps
 * console.* + window error events into a ring buffer, shows runtime capability
 * status (WebGPU/WebGL2), and the active module's validation status. One
 * module-level singleton patches the console once for the life of the app.
 */

import { useSyncExternalStore } from 'react';
import { Terminal, Cpu, CircleCheck, CircleAlert, CircleHelp } from 'lucide-react';
import clsx from 'clsx';
import { definePanel } from '@artinos/panelflow';
import { useStudioStore } from '../studio-store';
import { getModule } from '../registry/registry';

type Level = 'log' | 'info' | 'warn' | 'error';
interface Entry {
  id: number;
  level: Level;
  text: string;
  at: number;
}

const MAX_ENTRIES = 200;

/** Singleton console/error tap. Patches console once; never restores (app-lifetime). */
const ConsoleBus = (() => {
  let entries: Entry[] = [];
  const listeners = new Set<() => void>();
  let seq = 0;
  let installed = false;

  const emit = () => listeners.forEach((l) => l());

  const push = (level: Level, args: unknown[]) => {
    const text = args
      .map((a) => {
        if (typeof a === 'string') return a;
        try {
          return JSON.stringify(a);
        } catch {
          return String(a);
        }
      })
      .join(' ');
    // New array reference each push so useSyncExternalStore detects the change.
    const next = entries.concat({ id: seq++, level, text, at: Date.now() });
    entries = next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next;
    emit();
  };

  const install = () => {
    if (installed || typeof window === 'undefined') return;
    installed = true;
    (['log', 'info', 'warn', 'error'] as Level[]).forEach((level) => {
      const original = console[level].bind(console);
      console[level] = (...args: unknown[]) => {
        push(level, args);
        original(...args);
      };
    });
    window.addEventListener('error', (e) => push('error', [e.message]));
    window.addEventListener('unhandledrejection', (e) => push('error', [`Unhandled rejection: ${String((e as PromiseRejectionEvent).reason)}`]));
  };

  return {
    install,
    clear: () => {
      entries = [];
      emit();
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    snapshot: () => entries,
  };
})();

ConsoleBus.install();

/** Capability probe — local, no PANELFLOW internals (D-D). */
function detectBackend(): 'webgpu' | 'webgl2' | 'none' {
  if (typeof navigator !== 'undefined' && 'gpu' in navigator) return 'webgpu';
  try {
    const c = document.createElement('canvas');
    if (c.getContext('webgl2')) return 'webgl2';
  } catch {
    /* ignore */
  }
  return 'none';
}

function ConsoleView() {
  const entries = useSyncExternalStore(ConsoleBus.subscribe, ConsoleBus.snapshot);
  const activeModuleId = useStudioStore((s) => s.activeModuleId);
  const module = activeModuleId ? getModule(activeModuleId) : undefined;
  const backend = detectBackend();

  const errors = entries.filter((e) => e.level === 'error').length;
  const warns = entries.filter((e) => e.level === 'warn').length;

  return (
    <div className="flex flex-col h-full w-full min-h-0 text-xs">
      {/* status strip */}
      <div className="shrink-0 px-3 py-2 flex items-center gap-3 border-b border-white/10">
        <StatusPill icon={Cpu} tone={backend === 'none' ? 'warn' : 'ok'}>
          {backend === 'webgpu' ? 'WebGPU' : backend === 'webgl2' ? 'WebGL2' : 'No GPU'}
        </StatusPill>
        {module && <ValidationPill module={module} />}
        <div className="ml-auto flex items-center gap-2 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
          <span className={errors ? 'text-red-400' : ''}>{errors} err</span>
          <span className={warns ? 'text-amber-400' : ''}>{warns} warn</span>
          <button
            onClick={() => ConsoleBus.clear()}
            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* log stream */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3 py-2 font-mono leading-relaxed">
        {entries.length === 0 ? (
          <div className="text-center py-10 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            Console is clean — no output captured.
          </div>
        ) : (
          entries.map((e) => (
            <div
              key={e.id}
              className={clsx(
                'whitespace-pre-wrap break-words py-0.5',
                e.level === 'error' && 'text-red-400',
                e.level === 'warn' && 'text-amber-300',
                e.level === 'info' && 'text-sky-300',
                e.level === 'log' && 'text-white/70',
              )}
            >
              <span className="opacity-40 mr-2">{e.level}</span>
              {e.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatusPill({ icon: Icon, tone, children }: { icon: typeof Cpu; tone: 'ok' | 'warn'; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold',
        tone === 'ok' ? 'text-teal-300 bg-teal-500/10' : 'text-amber-300 bg-amber-500/10',
      )}
    >
      <Icon size={11} />
      {children}
    </span>
  );
}

function ValidationPill({ module }: { module: ReturnType<typeof getModule> }) {
  const v = module?.validation;
  const pass = v && v.build && v.preview && v.console;
  const Icon = !v ? CircleHelp : pass ? CircleCheck : CircleAlert;
  const label = !v ? 'unvalidated' : pass ? 'validated' : 'check failed';
  const cls = !v ? 'text-white/40 bg-white/5' : pass ? 'text-teal-300 bg-teal-500/10' : 'text-red-400 bg-red-500/10';
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold', cls)}>
      <Icon size={11} />
      {module?.name}: {label}
    </span>
  );
}

export const ConsolePanel = definePanel({
  id: 'console',
  title: 'Console',
  description: 'Runtime diagnostics, console output, and capability status.',
  icon: Terminal,
  defaultPlacement: 'bottom',
  defaultSize: 220,
  minSize: 140,
  maxSize: 480,
  capabilities: { floatable: true, closable: true, resizable: true },
  component: ConsoleView,
  tags: ['studio'],
});
