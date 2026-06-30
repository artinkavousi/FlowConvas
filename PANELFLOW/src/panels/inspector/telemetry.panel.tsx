/**
 * Telemetry panel — the dedicated home for all renderer monitoring.
 *
 * Sub-tabs (Performance · Memory · Timeline · Console · Viewer) read from
 * `useInspectorStore`, fed by the headless `ArtinosInspector`. Only the active
 * sub-tab mounts, so the heavier Timeline/Viewer work is cost-gated.
 */

import { useState } from 'react';
import { Activity, Boxes, Database, Gauge, Terminal } from 'lucide-react';
import { definePanel } from '@/panel-os/define-panel';
import { PanelShell } from '@/panel-os/panel-shell';
import { defaultPanelCapabilities } from '@/panel-os/panel-types';
import { useInspectorStore } from '@/inspector/inspector-store';
import { PerformanceView } from './views/PerformanceView';
import { MemoryView } from './views/MemoryView';
import { TimelineView } from './views/TimelineView';
import { ConsoleView } from './views/ConsoleView';
import { ViewerView } from './views/ViewerView';

type TabId = 'performance' | 'memory' | 'timeline' | 'console' | 'viewer';

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'performance', label: 'Perf', icon: Gauge },
  { id: 'memory', label: 'Memory', icon: Database },
  { id: 'timeline', label: 'Timeline', icon: Activity },
  { id: 'console', label: 'Console', icon: Terminal },
  { id: 'viewer', label: 'Viewer', icon: Boxes },
];

function StatusStrip() {
  const attached = useInspectorStore((s) => s.attached);
  const backend = useInspectorStore((s) => s.backend);
  const paused = useInspectorStore((s) => s.paused);
  const fps = useInspectorStore((s) => s.fps);

  const dotClass = !attached
    ? 'bg-white/25'
    : paused
      ? 'bg-amber-400'
      : 'bg-emerald-400';
  const status = !attached ? 'No renderer' : paused ? 'Paused' : 'Live';

  return (
    <div className="flex items-center justify-between rounded-lg border border-white/7 bg-black/28 px-3 py-1.5">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
        <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/45">{status}</span>
        {backend && <span className="font-mono text-[9px] text-white/35">{backend}</span>}
      </div>
      <span className="font-mono text-[11px] font-bold text-white/80">{fps > 0 ? `${fps.toFixed(0)} FPS` : '-- FPS'}</span>
    </div>
  );
}

function TelemetryView() {
  const unread = useInspectorStore((s) => s.unread);
  const markRead = useInspectorStore((s) => s.markConsoleRead);
  const [tab, setTab] = useState<TabId>('performance');

  const select = (id: TabId) => {
    setTab(id);
    if (id === 'console') markRead();
  };

  const consoleBadge = unread.error + unread.warn;

  return (
    <PanelShell>
      <div className="flex h-full min-h-0 flex-col gap-3">
        <StatusStrip />

        <div className="grid grid-cols-5 gap-1 rounded-xl border border-white/8 bg-black/30 p-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => select(id)}
                className={
                  'relative flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[8.5px] font-black uppercase tracking-[0.1em] transition ' +
                  (active ? 'bg-white text-black' : 'text-white/42 hover:bg-white/[0.055] hover:text-white/75')
                }
              >
                <Icon size={13} />
                {label}
                {id === 'console' && consoleBadge > 0 && !active && (
                  <span
                    className={
                      'absolute right-1 top-1 h-1.5 w-1.5 rounded-full ' + (unread.error > 0 ? 'bg-red-400' : 'bg-amber-400')
                    }
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
          {tab === 'performance' && <PerformanceView />}
          {tab === 'memory' && <MemoryView />}
          {tab === 'timeline' && <TimelineView />}
          {tab === 'console' && <ConsoleView />}
          {tab === 'viewer' && <ViewerView />}
        </div>
      </div>
    </PanelShell>
  );
}

export const TelemetryPanel = definePanel({
  id: 'telemetry',
  title: 'Telemetry',
  description: 'Renderer performance, memory, timeline, console, and buffer inspector.',
  icon: Activity,
  defaultPlacement: 'bottom',
  defaultSize: 420,
  minSize: 340,
  maxSize: 720,
  capabilities: { ...defaultPanelCapabilities },
  component: TelemetryView,
  tags: ['core', 'telemetry', 'performance', 'diagnostics', 'inspector'],
});
