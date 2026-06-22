import React, { useState } from 'react';
import { SlidersHorizontal, ChevronRight, ChevronDown } from 'lucide-react';
import { definePanel } from '@/panel-os/define-panel';
import { PanelShell } from '@/panel-os/panel-shell';
import { useGraphStore, type FluidityNode } from '@/graph/graph-store';
import { getNodeDef } from '@/graph/node-registry';
import { defaultPanelCapabilities } from '@/panel-os/panel-types';
import { GooeySlider } from '@/components/GooeySlider';

function Section({ title, defaultOpen = false, children, headerRight = null }: any) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/5 rounded-md overflow-hidden bg-white/[0.02]">
      <button 
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-white/70 hover:text-white/90 bg-white/[0.04] hover:bg-white/[0.06] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span className="font-medium tracking-wide text-xs">{title}</span>
        </div>
        {headerRight}
      </button>
      {isOpen && (
        <div className="p-3 bg-black/40 flex flex-col gap-4">
          {children}
        </div>
      )}
    </div>
  );
}

const NodeInspector: React.FC<{ node: FluidityNode }> = ({ node }) => {
  const updateNodeInput = useGraphStore(s => s.updateNodeInput);
  
  // Find the exact node definition to know how to render the inputs
  const def = node.data.runtimeType ? getNodeDef(node.data.runtimeType.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')) : null;
  const inputs = def?.inputs || [];
  
  return (
    <Section 
      title={node.data?.label || node.type} 
      defaultOpen={true}
      headerRight={
        <span className="text-[10px] text-white/40 font-mono tracking-tighter hidden group-hover:block transition-opacity opacity-50">{node.id}</span>
      }
    >
      {inputs.map(input => {
        const value = node.data.inputs?.[input.key] ?? input.default;
        
        return (
          <div key={input.key} className="space-y-1.5 flex flex-col">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[10px] uppercase tracking-widest text-white/50">{input.label || input.key}</span>
              <span className="text-[9px] text-white/30 font-mono">{input.type}</span>
            </div>
            
            {input.type === 'number' && (
              <div className="flex flex-col gap-2">
                <input
                  type="number"
                  value={Number(value)}
                  step={input.step || 0.1}
                  onChange={(e) => updateNodeInput(node.id, input.key, Number(e.target.value))}
                  className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--color-accent)] font-mono text-left transition-colors"
                />
                {input.range && (
                  <GooeySlider 
                    min={input.range[0]} 
                    max={input.range[1]} 
                    step={input.step || 0.01}
                    value={Number(value)}
                    onChange={(val) => updateNodeInput(node.id, input.key, val)}
                    color={node.data.themeColor || "var(--color-accent)"}
                    textColor="#0c0c0c"
                    className="mt-1"
                  />
                )}
              </div>
            )}
            
            {input.type === 'color' && (
              <div className="flex gap-2 items-center">
                <input 
                  type="color" 
                  value={String(value)}
                  onChange={(e) => updateNodeInput(node.id, input.key, e.target.value)}
                  className="w-8 h-8 rounded bg-black/40 border border-white/10 cursor-pointer p-0.5 box-content shrink-0"
                />
                <input 
                  type="text" 
                  value={String(value)}
                  onChange={(e) => updateNodeInput(node.id, input.key, e.target.value)}
                  className="flex-1 w-full bg-black border border-white/10 rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[var(--color-accent)] uppercase transition-colors"
                />
              </div>
            )}

            {input.type === 'boolean' && (
              <label className="flex items-center gap-2 cursor-pointer mt-0.5 bg-black/20 hover:bg-black/40 border border-white/5 p-2 rounded transition-colors group">
                <input 
                  type="checkbox" 
                  checked={Boolean(value)}
                  onChange={(e) => updateNodeInput(node.id, input.key, e.target.checked)}
                  className="accent-[var(--color-accent)] w-4 h-4 rounded border-white/20 bg-black cursor-pointer"
                />
                <span className="text-xs text-white/70 select-none cursor-pointer group-hover:text-white transition-colors">{Boolean(value) ? 'Enabled' : 'Disabled'}</span>
              </label>
            )}
            
            {input.type === 'string' && (
              <input 
                type="text" 
                value={String(value)}
                onChange={(e) => updateNodeInput(node.id, input.key, e.target.value)}
                className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            )}
          </div>
        );
      })}
      {inputs.length === 0 && (
        <div className="text-[10px] text-white/30 uppercase tracking-widest py-2">No mutable properties</div>
      )}
    </Section>
  );
}

export const InspectorPanel = definePanel({
  id: 'inspector',
  title: 'Inspector',
  description: 'Inspect selected node properties.',
  icon: SlidersHorizontal,
  minSize: 200,
  maxSize: 600,
  defaultSize: 300,
  defaultPlacement: 'right',
  capabilities: { ...defaultPanelCapabilities },
  component: function InspectorView() {
    const nodes = useGraphStore(s => s.nodes);
    const selectedNodes = nodes.filter(n => n.selected);

    return (
      <PanelShell>
        <div className="flex flex-col h-full w-full text-sm overflow-y-auto custom-scrollbar">
          {selectedNodes.length === 0 ? (
            <div className="p-4 text-white/30 text-center flex items-center justify-center h-full text-xs">
              Select a node to inspect its properties.
            </div>
          ) : (
            <div className="p-2 flex flex-col gap-2">
              {selectedNodes.map(node => (
                <NodeInspector key={node.id} node={node} />
              ))}
            </div>
          )}
        </div>
      </PanelShell>
    );
  }
});
