import { useReactFlow } from '@xyflow/react';
import { Minus, Plus, Maximize, Monitor, Sun, Download, Share2, AlignCenter } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';
import { Tooltip } from '@/components/ui/tooltip';
import { usePanelOSStore } from '@/panel-os/panel-store';
import { useGraphStore } from '@/graph/graph-store';
import { getAutoLayout } from '@/graph/layout';

/** Bottom-center zoom/fit control cluster. Lives inside the editor dock. */
export function BottomControls() {
  const rf = useReactFlow();
  const theme = usePanelOSStore((s) => s.theme);
  const setTheme = usePanelOSStore((s) => s.setTheme);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const setNodes = useGraphStore((s) => s.setNodes);

  const exportGraph = () => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fluidity-graph.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLayout = () => {
    const arranged = getAutoLayout(nodes, edges);
    setNodes(() => arranged.nodes as any);
    setTimeout(() => {
      rf.fitView({ padding: 0.2, duration: 400, minZoom: 1, maxZoom: 1 });
    }, 50);
  };

  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 glass-panel px-1.5 py-1 pointer-events-auto"
      style={{ borderRadius: 'var(--radius-xl)' }}
    >
      <Tooltip text="Zoom out"><IconButton onClick={() => rf.zoomOut()} aria-label="Zoom out"><Minus size={14} /></IconButton></Tooltip>
      <Tooltip text="Auto Layout">
        <button
          onClick={handleLayout}
          className="px-2.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <AlignCenter size={12} />
          Layout
        </button>
      </Tooltip>
      <Tooltip text="Zoom in"><IconButton onClick={() => rf.zoomIn()} aria-label="Zoom in"><Plus size={14} /></IconButton></Tooltip>
      <div className="w-px h-5 mx-1" style={{ background: 'var(--color-border)' }} />
      <Tooltip text="Reset view"><IconButton onClick={() => rf.fitView({ duration: 300 })} aria-label="Reset view"><Maximize size={13} /></IconButton></Tooltip>
      <Tooltip text="Display"><IconButton aria-label="Display"><Monitor size={13} /></IconButton></Tooltip>
      <Tooltip text="Toggle theme"><IconButton onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme"><Sun size={13} /></IconButton></Tooltip>
      <Tooltip text="Export graph"><IconButton onClick={exportGraph} aria-label="Export graph"><Download size={13} /></IconButton></Tooltip>
      <Tooltip text="Share"><IconButton aria-label="Share"><Share2 size={13} /></IconButton></Tooltip>
    </div>
  );
}
