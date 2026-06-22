// NodeDefinitions.ts — node-as-data-contract registry. Shape from NGS `NodeType`
// (compile(b,io)→TSL preferred; evaluate() requires permission). No React/XYFlow imports.
// Phase 4 ports NodeStudio MaterialCompiler/TslDefinitions + NGS node library in here / under nodes/.

import type { BackendClass } from '@/WebGPUCapabilities';

export type NodeDomain =
  | 'core' | 'math' | 'tsl' | 'materials' | 'geometry' | 'fluid' | 'paint'
  | 'particles' | 'postfx' | 'scene' | 'camera' | 'lights' | 'interaction'
  | 'ui' | 'agents' | 'export';

export type PortType =
  | 'bool' | 'i32' | 'u32' | 'f32' | 'vec2' | 'vec3' | 'vec4'
  | 'color_linear' | 'color_srgb' | 'texture2D' | 'sampler' | 'storageTexture'
  | 'buffer' | 'storageBuffer' | 'geometry' | 'material' | 'object3D'
  | 'scene' | 'camera' | 'light' | 'renderTarget' | 'event' | 'signal' | 'component';

export interface Port {
  key: string;
  label: string;
  type: PortType;
  optional?: boolean;
}

export interface Param {
  type: PortType;
  default: unknown;
  range?: [number, number];
  step?: number;
  ui?: 'drag' | 'slider' | 'toggle' | 'select' | 'color';
  modulatable?: boolean;
  doc?: string;
}

export interface NodeDefinition {
  type: string; // "<domain>/<name>"
  version: number | string;
  domain: NodeDomain;
  behavior?: 'operator' | 'generator' | 'output' | 'parent';
  backendClass: BackendClass;
  requires?: string[];
  meta: { title: string; subtitle?: string; category: string; tags?: string[]; color?: string };
  ports: { inputs: Port[]; outputs: Port[] };
  params?: Record<string, Param>;
  /** TSL/functional nodes: produce a shader fragment. Inherently safe (preferred). */
  compile?: (b: unknown, io: unknown) => void;
  /** Imperative nodes: run JS at eval time. Require explicit permission to load. */
  evaluate?: (ctx: unknown) => void;
  /** Pure dataflow compute: input-port values + params → output-port values (GraphRuntime.evaluate). */
  eval?: (inputs: Record<string, unknown>, params: Record<string, unknown>) => Record<string, unknown>;
}

/** Identity helper for typed defs (compile-time shape enforcement). */
export const defineNode = <T extends NodeDefinition>(def: T): T => def;

const REGISTRY = new Map<string, NodeDefinition>();

export function registerNode(def: NodeDefinition): void {
  if (REGISTRY.has(def.type)) throw new Error(`duplicate node type: ${def.type}`);
  REGISTRY.set(def.type, def);
}

export const getNode = (type: string): NodeDefinition | undefined => REGISTRY.get(type);
export const allNodes = (): NodeDefinition[] => [...REGISTRY.values()];

// ── Seed nodes (real, minimal). Phase 4 brings the full library. ────────────
registerNode(
  defineNode({
    type: 'math/add',
    version: 1,
    domain: 'math',
    behavior: 'operator',
    backendClass: 'webgl-compatible',
    meta: { title: 'Add', subtitle: 'a + b', category: 'Math', color: '#7fd1c4' },
    ports: {
      inputs: [
        { key: 'a', label: 'A', type: 'f32' },
        { key: 'b', label: 'B', type: 'f32' },
      ],
      outputs: [{ key: 'out', label: 'Out', type: 'f32' }],
    },
    params: { b: { type: 'f32', default: 0, ui: 'drag', step: 0.1, modulatable: true } },
    compile: () => {
      /* Phase 4: emit `a.add(b)` via TSLNodes builder */
    },
    eval: (i, p) => ({ out: num(i.a) + (i.b !== undefined ? num(i.b) : num(p.b)) }),
  }),
);

const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);

// core/const — a constant source (params.value → out). The simplest generator.
registerNode(
  defineNode({
    type: 'core/const',
    version: 1,
    domain: 'core',
    behavior: 'generator',
    backendClass: 'webgl-compatible',
    meta: { title: 'Const', subtitle: 'value', category: 'Core', color: '#9ca3af' },
    ports: { inputs: [], outputs: [{ key: 'out', label: 'Out', type: 'f32' }] },
    params: { value: { type: 'f32', default: 0, ui: 'drag', step: 0.1 } },
    eval: (_i, p) => ({ out: num(p.value) }),
  }),
);

// math/multiply — a * b.
registerNode(
  defineNode({
    type: 'math/multiply',
    version: 1,
    domain: 'math',
    behavior: 'operator',
    backendClass: 'webgl-compatible',
    meta: { title: 'Multiply', subtitle: 'a × b', category: 'Math', color: '#7fd1c4' },
    ports: {
      inputs: [
        { key: 'a', label: 'A', type: 'f32' },
        { key: 'b', label: 'B', type: 'f32' },
      ],
      outputs: [{ key: 'out', label: 'Out', type: 'f32' }],
    },
    params: { b: { type: 'f32', default: 1, ui: 'drag', step: 0.1 } },
    eval: (i, p) => ({ out: num(i.a) * (i.b !== undefined ? num(i.b) : num(p.b)) }),
  }),
);

registerNode(
  defineNode({
    type: 'math/subtract',
    version: 1,
    domain: 'math',
    behavior: 'operator',
    backendClass: 'webgl-compatible',
    meta: { title: 'Subtract', subtitle: 'a - b', category: 'Math', color: '#7fd1c4' },
    ports: {
      inputs: [
        { key: 'a', label: 'A', type: 'f32' },
        { key: 'b', label: 'B', type: 'f32' },
      ],
      outputs: [{ key: 'out', label: 'Out', type: 'f32' }],
    },
    params: { b: { type: 'f32', default: 0, ui: 'drag', step: 0.1 } },
    eval: (i, p) => ({ out: num(i.a) - (i.b !== undefined ? num(i.b) : num(p.b)) }),
  }),
);

registerNode(
  defineNode({
    type: 'math/divide',
    version: 1,
    domain: 'math',
    behavior: 'operator',
    backendClass: 'webgl-compatible',
    meta: { title: 'Divide', subtitle: 'a / b', category: 'Math', color: '#7fd1c4' },
    ports: {
      inputs: [
        { key: 'a', label: 'A', type: 'f32' },
        { key: 'b', label: 'B', type: 'f32' },
      ],
      outputs: [{ key: 'out', label: 'Out', type: 'f32' }],
    },
    params: { b: { type: 'f32', default: 1, ui: 'drag', step: 0.1 } },
    eval: (i, p) => {
      const bVal = i.b !== undefined ? num(i.b) : num(p.b);
      return { out: bVal === 0 ? 0 : num(i.a) / bVal };
    },
  }),
);

registerNode(
  defineNode({
    type: 'core/vec2',
    version: 1,
    domain: 'core',
    behavior: 'generator',
    backendClass: 'webgl-compatible',
    meta: { title: 'Vector2', subtitle: '(x, y)', category: 'Core', color: '#9ca3af' },
    ports: {
      inputs: [
        { key: 'x', label: 'X', type: 'f32' },
        { key: 'y', label: 'Y', type: 'f32' },
      ],
      outputs: [{ key: 'out', label: 'Out', type: 'vec2' }],
    },
    params: { 
      x: { type: 'f32', default: 0, ui: 'drag', step: 0.1 },
      y: { type: 'f32', default: 0, ui: 'drag', step: 0.1 }
    },
    eval: (i, p) => ({ 
      out: [
        i.x !== undefined ? num(i.x) : num(p.x),
        i.y !== undefined ? num(i.y) : num(p.y)
      ]
    }),
  }),
);

registerNode(
  defineNode({
    type: 'geometry/sphere',
    version: 1,
    domain: 'geometry',
    behavior: 'generator',
    backendClass: 'webgl-compatible',
    meta: { title: 'Sphere', subtitle: 'Primitive', category: 'Geometry', color: '#f59e0b' },
    ports: {
      inputs: [
        { key: 'radius', label: 'Radius', type: 'f32' },
        { key: 'segments', label: 'Segments', type: 'i32' },
      ],
      outputs: [{ key: 'geo', label: 'Geometry', type: 'geometry' }],
    },
    params: {
      radius: { type: 'f32', default: 1, ui: 'drag', step: 0.1 },
      segments: { type: 'f32', default: 32, ui: 'slider', range: [3, 128], step: 1 },
    },
    eval: () => ({ geo: null }),
  }),
);

registerNode(
  defineNode({
    type: 'geometry/box',
    version: 1,
    domain: 'geometry',
    behavior: 'generator',
    backendClass: 'webgl-compatible',
    meta: { title: 'Box', subtitle: 'Primitive', category: 'Geometry', color: '#f59e0b' },
    ports: {
      inputs: [
        { key: 'width', label: 'Width', type: 'f32' },
        { key: 'height', label: 'Height', type: 'f32' },
        { key: 'depth', label: 'Depth', type: 'f32' },
      ],
      outputs: [{ key: 'geo', label: 'Geometry', type: 'geometry' }],
    },
    params: {
      width: { type: 'f32', default: 1, ui: 'drag', step: 0.1 },
      height: { type: 'f32', default: 1, ui: 'drag', step: 0.1 },
      depth: { type: 'f32', default: 1, ui: 'drag', step: 0.1 },
    },
    eval: () => ({ geo: null }),
  }),
);
registerNode(
  defineNode({
    type: 'math/sine',
    version: 1,
    domain: 'math',
    behavior: 'operator',
    backendClass: 'webgl-compatible',
    meta: { title: 'Sine', subtitle: 'sin(x)', category: 'Math', color: '#7fd1c4' },
    ports: {
      inputs: [{ key: 'x', label: 'X', type: 'f32' }],
      outputs: [{ key: 'out', label: 'Out', type: 'f32' }],
    },
    params: {},
    eval: (i) => ({ out: Math.sin(num(i.x)) }),
  }),
);

registerNode(
  defineNode({
    type: 'math/noise',
    version: 1,
    domain: 'math',
    behavior: 'operator',
    backendClass: 'webgl-compatible',
    meta: { title: 'Noise', subtitle: 'simplex', category: 'Math', color: '#7fd1c4' },
    ports: {
      inputs: [{ key: 'uv', label: 'UV', type: 'vec2' }],
      outputs: [{ key: 'out', label: 'Out', type: 'f32' }],
    },
    params: { scale: { type: 'f32', default: 1, ui: 'drag', step: 0.1 } },
    eval: (_i, _p) => ({ out: 0 }), // Mock eval
  }),
);

registerNode(
  defineNode({
    type: 'core/vec3',
    version: 1,
    domain: 'core',
    behavior: 'generator',
    backendClass: 'webgl-compatible',
    meta: { title: 'Vector3', subtitle: '(x, y, z)', category: 'Core', color: '#9ca3af' },
    ports: {
      inputs: [
        { key: 'x', label: 'X', type: 'f32' },
        { key: 'y', label: 'Y', type: 'f32' },
        { key: 'z', label: 'Z', type: 'f32' },
      ],
      outputs: [{ key: 'out', label: 'Out', type: 'vec3' }],
    },
    params: { 
      x: { type: 'f32', default: 0, ui: 'drag', step: 0.1 },
      y: { type: 'f32', default: 0, ui: 'drag', step: 0.1 },
      z: { type: 'f32', default: 0, ui: 'drag', step: 0.1 }
    },
    eval: (i, p) => ({ 
      out: [
        i.x !== undefined ? num(i.x) : num(p.x),
        i.y !== undefined ? num(i.y) : num(p.y),
        i.z !== undefined ? num(i.z) : num(p.z)
      ]
    }),
  }),
);

registerNode(
  defineNode({
    type: 'core/color',
    version: 1,
    domain: 'core',
    behavior: 'generator',
    backendClass: 'webgl-compatible',
    meta: { title: 'Color', subtitle: 'RGB', category: 'Core', color: '#eab308' },
    ports: {
      inputs: [],
      outputs: [{ key: 'out', label: 'Color', type: 'color_srgb' }],
    },
    params: { value: { type: 'color_srgb', default: '#ffffff', ui: 'color' } },
    eval: (_i, p) => ({ out: p.value }),
  }),
);

registerNode(
  defineNode({
    type: 'core/time',
    version: 1,
    domain: 'core',
    behavior: 'generator',
    backendClass: 'webgl-compatible',
    meta: { title: 'Time', subtitle: 't', category: 'Core', color: '#f87171' },
    ports: {
      inputs: [],
      outputs: [{ key: 'out', label: 'Time', type: 'f32' }],
    },
    params: {},
    eval: (_i, _p) => ({ out: Date.now() / 1000 }), // runtime handles actual time
  }),
);

registerNode(
  defineNode({
    type: 'materials/standard',
    version: 1,
    domain: 'materials',
    behavior: 'generator',
    backendClass: 'webgpu-preferred',
    meta: { title: 'Standard Material', subtitle: 'PBR', category: 'Materials', color: '#c084fc' },
    ports: {
      inputs: [
        { key: 'color', label: 'Color Node', type: 'color_srgb' },
        { key: 'roughness', label: 'Roughness', type: 'f32' },
        { key: 'metalness', label: 'Metalness', type: 'f32' },
        { key: 'normalMap', label: 'Normal Map', type: 'texture2D' }
      ],
      outputs: [{ key: 'material', label: 'Material', type: 'material' }],
    },
    params: {
      roughness: { type: 'f32', default: 0.5, ui: 'slider', range: [0, 1] },
      metalness: { type: 'f32', default: 0.5, ui: 'slider', range: [0, 1] }
    },
    eval: () => ({ material: null }), // WebGPU logic
  }),
);

registerNode(
  defineNode({
    type: 'camera/perspective',
    version: 1,
    domain: 'camera',
    behavior: 'generator',
    backendClass: 'webgl-compatible',
    meta: { title: 'Perspective Cam', subtitle: '3D', category: 'Camera', color: '#60a5fa' },
    ports: {
      inputs: [
        { key: 'fov', label: 'FOV', type: 'f32' },
        { key: 'near', label: 'Near', type: 'f32' },
        { key: 'far', label: 'Far', type: 'f32' },
      ],
      outputs: [{ key: 'camera', label: 'Camera', type: 'camera' }],
    },
    params: {
      fov: { type: 'f32', default: 50, ui: 'slider', range: [10, 150], step: 1 },
      near: { type: 'f32', default: 0.1, ui: 'slider', range: [0.01, 10], step: 0.01 },
      far: { type: 'f32', default: 1000, ui: 'slider', range: [10, 10000], step: 10 },
    },
    eval: () => ({ camera: null }),
  }),
);

registerNode(
  defineNode({
    type: 'postfx/bloom',
    version: 1,
    domain: 'postfx',
    behavior: 'operator',
    backendClass: 'webgl-compatible',
    meta: { title: 'Bloom', subtitle: 'Glow effect', category: 'PostFX', color: '#f472b6' },
    ports: {
      inputs: [
        { key: 'scene', label: 'Scene', type: 'scene' },
        { key: 'intensity', label: 'Intensity', type: 'f32' },
        { key: 'radius', label: 'Radius', type: 'f32' },
        { key: 'threshold', label: 'Threshold', type: 'f32' },
      ],
      outputs: [{ key: 'out', label: 'Out', type: 'renderTarget' }],
    },
    params: {
      intensity: { type: 'f32', default: 1, ui: 'slider', range: [0, 5], step: 0.1 },
      radius: { type: 'f32', default: 0.5, ui: 'slider', range: [0, 2], step: 0.1 },
      threshold: { type: 'f32', default: 0.8, ui: 'slider', range: [0, 1], step: 0.05 },
    },
    eval: () => ({ out: null }),
  }),
);
