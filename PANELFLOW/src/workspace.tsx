import { useEffect, type ReactNode } from 'react';
import { ViewportSlot } from '@/shell/viewport-slot';
import { EditorDock } from '@/shell/editor-dock';
import { hydrateGraph, useGraphStore, type FluidityNode, type FluidityEdge } from '@/graph/graph-store';
import { usePanelOSStore } from '@/panel-os/panel-store';
import { CommandPalette, openPanelById } from '@/shell/command-palette';
import { Layers } from 'lucide-react';

const RAIL_PANELS = ['scene', 'inspector', 'engine-status', 'code'];

export interface WorkspaceProps {
  /** Host-provided viewport content. If omitted, shows an empty viewport area. */
  viewport?: ReactNode;
  /** Optional seed graph loaded on first run when nothing is persisted. */
  seed?: { nodes: FluidityNode[]; edges: FluidityEdge[] };
}

export function Workspace({ viewport, seed }: WorkspaceProps) {
  const togglePalette = usePanelOSStore((s) => s.toggleCommandPalette);

  useEffect(() => { hydrateGraph(seed); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing = el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA';
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        togglePalette();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        openPanelById(RAIL_PANELS[Number(e.key) - 1]);
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !typing) {
        const { selectedNodeId, removeNodes } = useGraphStore.getState();
        if (selectedNodeId) removeNodes([selectedNodeId]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePalette]);

  return (
    <main className="relative w-full h-full overflow-hidden" style={{ background: '#0a0a0a', color: 'var(--color-text)' }}>
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ 
          background: 'radial-gradient(circle at 50% -20%, rgba(255,255,255,0.05), transparent 70%), url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.03\'/%3E%3C/svg%3E")',
          backgroundSize: '100% 100%, 128px 128px',
          backgroundRepeat: 'no-repeat, repeat'
        }}
      />

      <ViewportSlot>{viewport}</ViewportSlot>
      <EditorDock />
      <CommandPalette />
    </main>
  );
}
