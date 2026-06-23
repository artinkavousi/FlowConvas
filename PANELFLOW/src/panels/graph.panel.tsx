/**
 * graph.panel.tsx — the node-graph canvas, now a regular dock panel.
 *
 * The graph used to be the dock's hardcoded centerpiece. In the control-panel-first
 * model it is just one optional panel opened from the rail like any other. It owns
 * its own <ReactFlowProvider> so the rest of the dock doesn't depend on React Flow.
 */

import { ReactFlowProvider } from '@xyflow/react';
import { Workflow } from 'lucide-react';
import { definePanel } from '@/panel-os/define-panel';
import { defaultPanelCapabilities } from '@/panel-os/panel-types';
import { GraphCanvas } from '@/graph/graph-canvas';
import { BottomControls } from '@/shell/minimap';

export const GraphPanel = definePanel({
  id: 'graph',
  title: 'Node Graph',
  description: 'Visual node-graph canvas for wiring components.',
  icon: Workflow,
  defaultPlacement: 'center',
  defaultSize: 600,
  capabilities: { ...defaultPanelCapabilities },
  component: function GraphView() {
    return (
      <ReactFlowProvider>
        <div className="relative w-full h-full">
          <GraphCanvas />
          <BottomControls />
        </div>
      </ReactFlowProvider>
    );
  },
});
