/**
 * StudioViewport — the host-owned viewport content for the PANELFLOW workspace.
 *
 * Renders the ACTIVE module's live preview fullscreen (the running "project").
 * Controls live in the editor dock as auto-generated PANELFLOW panels — not here.
 * When no module is active, shows a hero prompting the user to open the Library.
 */

import { Layers, Command } from 'lucide-react';
import { useStudioStore } from '../studio-store';
import { getModule } from '../registry/registry';
import { PreviewStage } from './PreviewStage';
import { useStudioPerformanceMonitor } from './use-performance-monitor';

export function StudioViewport() {
  const activeModuleId = useStudioStore((s) => s.activeModuleId);
  const module = activeModuleId ? getModule(activeModuleId) : undefined;

  // Generic perf monitor + pipeline/mode indicator for whatever module is loaded.
  useStudioPerformanceMonitor(module);

  if (!module) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-teal-500/10 border border-teal-500/20">
            <Layers size={18} className="text-teal-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>ARTINOS</span>
            <span className="text-[11px] uppercase tracking-[0.3em]" style={{ color: 'var(--color-accent)' }}>Studio</span>
          </div>
        </div>
        <p className="text-sm max-w-sm text-center leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          Open the <span className="text-white/80 font-medium">Library</span> panel in the dock — or press
          <kbd className="mx-1.5 px-1.5 py-0.5 rounded bg-white/10 text-white/70 inline-flex items-center gap-1 align-middle text-xs"><Command size={11} /> K</kbd>
          — to load a module. It runs here; its controls appear in the dock.
        </p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <PreviewStage key={module.id} module={module} />
    </div>
  );
}
