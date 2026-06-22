/**
 * seed-graph.ts — Demo-only seed graph.
 *
 * The core graph store starts EMPTY so the package is portable. The demo app
 * hydrates this seed on first load to tell the ARTINOS story the moment the
 * studio opens: a real TSL material graph (tsl/uv → wave → gradient → material).
 */

import type { FluidityNode, FluidityEdge } from '@/graph/graph-store';

export const SEED_NODES: FluidityNode[] = [
  { id: 'uv', type: 'universal', position: { x: 0, y: 120 }, data: { label: 'UV', category: 'input', runtimeType: 'tsl/uv', inputs: { uv: 0 } } },
  { id: 'wave', type: 'universal', position: { x: 260, y: 180 }, data: { label: 'WAVE', category: 'advanced', runtimeType: 'tsl/wave', inputs: { freq: 8, speed: 0.5 } } },
  { id: 'gradient', type: 'universal', position: { x: 520, y: 120 }, data: { label: 'GRADIENT', category: 'advanced', runtimeType: 'tsl/gradient', inputs: { colorA: '#2dd4bf', colorB: '#7c3aed' } } },
  { id: 'material', type: 'universal', position: { x: 780, y: 160 }, data: { label: 'MATERIAL', category: 'output', inputs: { color: 0 } } },
];

export const SEED_EDGES: FluidityEdge[] = [
  { id: 'e1', source: 'uv', sourceHandle: 'out', target: 'wave', targetHandle: 'coord', type: 'animated' },
  { id: 'e2', source: 'wave', sourceHandle: 'out', target: 'gradient', targetHandle: 't', type: 'animated' },
  { id: 'e3', source: 'gradient', sourceHandle: 'out', target: 'material', targetHandle: 'color', type: 'animated' },
];
