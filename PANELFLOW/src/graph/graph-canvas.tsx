import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
  type OnSelectionChangeParams,
  PanOnScrollMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useGraphStore, type FluidityNode } from '@/graph/graph-store';
import { usePanelOSStore } from '@/panel-os/panel-store';
import { DotGridBackground } from '@/graph/dot-grid-background';
import { UniversalNode } from '@/graph/universal-node';
import { AnimatedEdge } from '@/graph/animated-edge';
import { useMomentumBridge } from '@/graph/physics-bridge';
import { emitBounce } from '@/graph/physics-events';
import { SpotlightSearch } from '@/graph/spotlight-search';
import { makeNode } from '@/graph/node-registry';
import { getAutoLayout } from '@/graph/layout';
import { OSPanelNode } from '@/graph/os-panel-node';

const nodeTypes: NodeTypes = { universal: UniversalNode, 'os-panel': OSPanelNode };
const edgeTypes: EdgeTypes = { animated: AnimatedEdge };

function GraphCanvasInner() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const onNodesChange = useGraphStore((s) => s.onNodesChange);
  const onEdgesChange = useGraphStore((s) => s.onEdgesChange);
  const onConnect = useGraphStore((s) => s.onConnect);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const addNode = useGraphStore((s) => s.addNode);

  const bridge = useMomentumBridge({ onBounce: emitBounce });
  const rf = useReactFlow();
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  useEffect(() => {
    // Initial fit view
    const timer = setTimeout(() => {
      rf.fitView({ padding: 0.2, maxZoom: 1.0, duration: 600 });
    }, 100);
    return () => clearTimeout(timer);
  }, [rf]);

  const handleLayout = useCallback(() => {
    const currentState = useGraphStore.getState();
    const arranged = getAutoLayout(currentState.nodes, currentState.edges);
    currentState.setNodes(() => arranged.nodes as unknown as FluidityNode[]);
    setTimeout(() => {
      // Fit to components without scaling them down, ensuring consistent 1.0 zoom level
      rf.fitView({ padding: 0.2, duration: 400, maxZoom: 1, minZoom: 1 });
    }, 50);
  }, [rf]);

  useEffect(() => {
    const handleFloatPanel = (e: Event) => {
      const payload = (e as CustomEvent<{ panelId: string, screenPosition?: { x: number, y: number }, size?: { width: number, height: number } }>).detail;
      const panelId = payload?.panelId || (payload as unknown as string);
      if (!panelId || typeof panelId !== 'string') return;

      const memory = usePanelOSStore.getState().floatMemory[panelId];
      let position = { x: 0, y: 0 };
      
      if (memory && memory.position) {
        position = memory.position;
        // Restore coherent canvas zoom/panning state tracked dynamically
        rf.setViewport(memory.viewport, { duration: 400 });
      } else {
        const positionOnScreen = payload.screenPosition || {
          x: window.innerWidth - 420,
          y: window.innerHeight / 2 - 200,
        };
        position = rf.screenToFlowPosition(positionOnScreen);
        
        // Ensure same zoom level as original UI
        rf.zoomTo(1, { duration: 400 });
      }
      
      addNode({
        id: `panel-${panelId}-${Date.now()}`,
        type: 'os-panel',
        position,
        data: { osPanelId: panelId, label: panelId, category: 'output', inputs: {}, size: payload?.size },
      });
    };
    
    window.addEventListener('fluidity:float-panel', handleFloatPanel);
    return () => window.removeEventListener('fluidity:float-panel', handleFloatPanel);
  }, [rf, addNode, handleLayout]);

  const onSelectionChange = useCallback(
    (p: OnSelectionChangeParams) => {
      setSelectedNode(p.nodes[0]?.id ?? null);
    },
    [setSelectedNode],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing = el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA';
      if (e.code === 'Space' && !e.repeat && !typing) {
        e.preventDefault();
        setSpotlightOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handlePick = useCallback(
    (defId: string) => {
      const center = rf.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      addNode(makeNode(defId, center));
      setTimeout(handleLayout, 50);
    },
    [rf, addNode, handleLayout],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const defId = e.dataTransfer.getData('application/fluidity-node');
      if (!defId) return;
      const pos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addNode(makeNode(defId, pos));
      setTimeout(handleLayout, 50);
    },
    [rf, addNode, handleLayout],
  );

  return (
    <>
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onSelectionChange={onSelectionChange}
      onNodeDragStart={bridge.onNodeDragStart}
      onNodeDrag={bridge.onNodeDrag}
      onNodeDragStop={bridge.onNodeDragStop}
      onNodeMouseEnter={bridge.onNodeMouseEnter}
      onNodeMouseLeave={bridge.onNodeMouseLeave}
      onDrop={onDrop}
      onDragOver={onDragOver}
      fitView
      panOnScroll={true}
      panOnScrollMode={PanOnScrollMode.Free}
      proOptions={{ hideAttribution: true }}
      minZoom={0.2}
      maxZoom={2.5}
      style={{ background: 'transparent' }}
    >
      <DotGridBackground />
      <MiniMap
        pannable
        zoomable
        position="bottom-right"
        style={{ background: 'transparent', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.05)' }}
        maskColor="rgba(0, 0, 0, 0.6)"
        nodeColor="rgba(255, 255, 255, 0.15)"
        nodeStrokeWidth={0}
        nodeBorderRadius={4}
      />
    </ReactFlow>
    <SpotlightSearch open={spotlightOpen} onClose={() => setSpotlightOpen(false)} onPick={handlePick} />
    </>
  );
}

/** The graph surface. Must be rendered inside a <ReactFlowProvider> (the editor dock provides it). */
export function GraphCanvas() {
  return <GraphCanvasInner />;
}
