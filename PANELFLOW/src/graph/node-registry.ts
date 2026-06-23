import {
  Activity,
  Boxes,
  Circle,
  Cpu,
  Layers,
  Move,
  Palette,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import type { NodeDefinition, NodeDomain, Param, PortType } from '@/graph/NodeDefinitions';
import { allNodes, getNode, registerNode } from '@/graph/NodeDefinitions';
import '@/nodes/tsl-material';
import type { FluidityNode, FluidityNodeData } from '@/graph/graph-store';

export interface NodeInputDef {
  key: string;
  label: string;
  type: 'number' | 'string' | 'boolean' | 'color';
  default: number | string | boolean;
  range?: [number, number];
  step?: number;
}

export interface NodeOutputDef {
  key: string;
  label: string;
  type?: PortType;
}

export interface NodeDef {
  id: string;
  label: string;
  category: FluidityNodeData['category'];
  themeColor?: string;
  icon: LucideIcon;
  inputs: NodeInputDef[];
  outputs: NodeOutputDef[];
  runtimeType?: string;
}

const DOMAIN_CATEGORY: Record<NodeDomain, FluidityNodeData['category']> = {
  core: 'input',
  math: 'math',
  tsl: 'advanced',
  materials: 'advanced',
  geometry: 'advanced',
  fluid: 'advanced',
  paint: 'advanced',
  particles: 'advanced',
  postfx: 'advanced',
  scene: 'advanced',
  camera: 'input',
  lights: 'input',
  interaction: 'input',
  ui: 'input',
  agents: 'advanced',
  export: 'output',
};

const DOMAIN_ICON: Partial<Record<NodeDomain, LucideIcon>> = {
  core: Circle,
  math: Plus,
  tsl: Waves,
  materials: Palette,
  geometry: Boxes,
  fluid: Waves,
  paint: Palette,
  particles: Sparkles,
  postfx: Sparkles,
  scene: Layers,
  camera: Move,
  lights: Activity,
  interaction: SlidersHorizontal,
  ui: Boxes,
  agents: Cpu,
  export: Activity,
};

function titleFrom(type: string, def: NodeDefinition): string {
  return (def.meta.title || type.split('/').pop() || type).replace(/\s+/g, ' ').toUpperCase();
}

function inputKind(param: Param): NodeInputDef['type'] {
  if (param.type === 'bool') return 'boolean';
  if (param.type === 'color_linear' || param.type === 'color_srgb' || param.ui === 'color') return 'color';
  if (param.type === 'f32' || param.type === 'i32' || param.type === 'u32') return 'number';
  return 'string';
}

function defaultFor(param: Param): number | string | boolean {
  if (typeof param.default === 'number' || typeof param.default === 'string' || typeof param.default === 'boolean') {
    if ((param.type === 'color_linear' || param.type === 'color_srgb' || param.ui === 'color') && typeof param.default === 'number') {
      return '#' + (param.default >>> 0).toString(16).padStart(6, '0');
    }
    return param.default;
  }
  return inputKind(param) === 'number' ? 0 : '';
}

function fromRuntime(def: NodeDefinition): NodeDef {
  return {
    id: def.type.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, ''),
    label: titleFrom(def.type, def),
    category: DOMAIN_CATEGORY[def.domain],
    themeColor: def.meta.color,
    icon: DOMAIN_ICON[def.domain] ?? Layers,
    inputs: Object.entries(def.params ?? {}).map(([key, param]) => ({
      key,
      label: key,
      type: inputKind(param),
      default: defaultFor(param),
      range: param.range,
      step: param.step,
    })),
    outputs: def.ports.outputs.map((p) => ({ key: p.key, label: p.label, type: p.type })),
    runtimeType: def.type,
  };
}

const runtimeEntries = Object.fromEntries(allNodes().map((def) => {
  const entry = fromRuntime(def);
  return [entry.id, entry];
}));

export const NODE_REGISTRY: Record<string, NodeDef> = {
  ...runtimeEntries,
  'material-output': {
    id: 'material-output',
    label: 'MATERIAL',
    category: 'output',
    themeColor: '#ef4444',
    icon: Activity,
    inputs: [{ key: 'color', label: 'Color', type: 'color', default: '#2dd4bf' }],
    outputs: [],
  },
};

export function getNodeDef(id: string): NodeDef | undefined {
  return NODE_REGISTRY[id];
}

/**
 * Register a runtime NodeDefinition AND surface it in NODE_REGISTRY so the graph
 * UI (spotlight search, makeNode) can use it. Idempotent — safe under HMR and
 * repeated calls. Used by hosts (e.g. ARTINOS) to expose their modules as nodes.
 */
export function registerRuntimeNode(def: NodeDefinition): NodeDef {
  const entry = fromRuntime(def);
  if (NODE_REGISTRY[entry.id]) return NODE_REGISTRY[entry.id];
  if (!getNode(def.type)) registerNode(def);
  NODE_REGISTRY[entry.id] = entry;
  return entry;
}

let spawnCounter = 0;

export const GRID_CELL = 40;
const snap = (v: number) => Math.round(v / GRID_CELL) * GRID_CELL;

/** Build a fully-formed graph node from a registry definition, snapped to the grid. */
export function makeNode(defId: string, position: { x: number; y: number }): FluidityNode {
  const def = NODE_REGISTRY[defId];
  if (!def) throw new Error(`Unknown node def: ${defId}`);
  const inputs: FluidityNodeData['inputs'] = {};
  for (const input of def.inputs) inputs[input.key] = input.default;
  return {
    id: `${defId}-${Date.now()}-${spawnCounter++}`,
    type: 'universal',
    position: { x: snap(position.x), y: snap(position.y) },
    data: { label: def.label, category: def.category, themeColor: def.themeColor, inputs, runtimeType: def.runtimeType },
  };
}
