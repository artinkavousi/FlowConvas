/**
 * App.tsx — Demo application for PANELFLOW.
 * 
 * This file is NOT part of the library output.
 * It demonstrates how a host project uses PANELFLOW with a Three.js viewport.
 */

import { Workspace } from './workspace';
import { PanelFlowProvider } from '@/panel-os/PanelFlowProvider';
import Viewport from '@/shell/viewport';
import { registerComponent } from '@/control-engine';
import { SEED_NODES, SEED_EDGES } from '@/demo/seed-graph';

// Demo: register a sample component so an auto-generated control panel
// appears in the icon rail and command palette. This exercises the
// Control Panel Engine end-to-end (schema → panel → bridge state).
registerComponent({
  id: 'demo-sphere',
  name: 'Animated Sphere',
  description: 'A sample component showing every auto-generated control type.',
  category: 'demo',
  parameters: [
    { key: 'radius', label: 'Radius', type: 'number', default: 1, min: 0.1, max: 5, step: 0.1, group: 'Geometry' },
    { key: 'segments', label: 'Segments', type: 'number', default: 32, min: 3, max: 128, step: 1, group: 'Geometry' },
    { key: 'wireframe', label: 'Wireframe', type: 'boolean', default: false, group: 'Geometry' },
    { key: 'color', label: 'Color', type: 'color', default: '#2dd4bf', group: 'Material' },
    { key: 'label', label: 'Label', type: 'string', default: 'Sphere', group: 'Material' },
    {
      key: 'shading', label: 'Shading', type: 'enum', default: 'standard', group: 'Material',
      options: [
        { label: 'Standard', value: 'standard' },
        { label: 'Phong', value: 'phong' },
        { label: 'Toon', value: 'toon' },
      ],
    },
    { key: 'position', label: 'Position', type: 'vec3', default: [0, 0, 0], min: -10, max: 10, step: 0.1, group: 'Transform' },
    { key: 'tiling', label: 'Tiling', type: 'vec2', default: [1, 1], min: 0, max: 10, step: 0.1, group: 'Transform' },
    { key: 'clip', label: 'Clip Range', type: 'range', default: [0.1, 100], min: 0.1, max: 100, step: 0.1, group: 'Transform' },
  ],
});

export default function App() {
  return (
    <PanelFlowProvider theme="dark">
      <Workspace viewport={<Viewport />} seed={{ nodes: SEED_NODES, edges: SEED_EDGES }} />
    </PanelFlowProvider>
  );
}
