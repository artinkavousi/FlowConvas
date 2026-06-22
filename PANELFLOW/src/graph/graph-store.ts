import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react';
import { makeEditorEdge, normalizeEditorEdges } from '@/graph/editor-pipeline';

export type FluidityNodeData = {
  label: string;
  category: 'input' | 'math' | 'advanced' | 'output';
  inputs: Record<string, number | string | boolean>;
  /** Runtime node type, e.g. `tsl/wave`. UI-only terminals such as MATERIAL omit this. */
  runtimeType?: string;
  themeColor?: string;
  energy?: number;
  osPanelId?: string;
  size?: { width: number; height: number };
};
export type FluidityNode = Node<FluidityNodeData>;
export type FluidityEdge = Edge;

export interface SceneSettings {
  viewMode: '2d' | '3d';
  env: string;
  geometry: string;
  showGrid: boolean;
  showStats: boolean;
  showGizmos: boolean;
  backend: 'webgpu' | 'webgl';
  toneMapping: 'aces' | 'linear' | 'cineon' | 'agx';
  material: 'standard' | 'physical' | 'toon' | 'custom_tsl' | 'transmission' | 'subsurface';
  shadows: boolean;
  volumetrics: boolean;
  wireframe: boolean;
  autoRotate: boolean;
  bloom: boolean;
  ao: boolean;
  dof: boolean;
  ssr: boolean;
  ssgi: boolean;
  antialiasing: 'msaa' | 'smaa' | 'fxaa' | 'none';
  debugMode: 'none' | 'normals' | 'depth' | 'uv';
}

export interface StatsState {
  fps: number;
  triangles: number;
  calls: number;
  renderer: string;
  memory: number; // in MB
  computeTime: number; // in ms
}

interface GraphState {
  nodes: FluidityNode[];
  edges: FluidityEdge[];
  scene: SceneSettings;
  stats: StatsState;
  selectedNodeId: string | null;
  generatedCode: string;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (conn: Connection) => void;
  setNodes: (updater: (n: FluidityNode[]) => FluidityNode[]) => void;
  addNode: (node: FluidityNode) => void;
  removeNodes: (ids: string[]) => void;
  updateNodeInput: (id: string, key: string, value: number | string | boolean) => void;
  setSelectedNode: (id: string | null) => void;
  updateScene: (patch: Partial<SceneSettings>) => void;
  setStats: (patch: Partial<StatsState>) => void;
  loadGraph: (nodes: FluidityNode[], edges: FluidityEdge[]) => void;
}

const DEFAULT_SCENE: SceneSettings = {
  viewMode: '3d',
  env: 'studio',
  geometry: 'sphere',
  showGrid: true,
  showStats: true,
  showGizmos: true,
  backend: 'webgpu',
  toneMapping: 'aces',
  material: 'custom_tsl',
  shadows: true,
  volumetrics: false,
  wireframe: false,
  autoRotate: false,
  bloom: false,
  ao: false,
  dof: false,
  ssr: false,
  ssgi: false,
  antialiasing: 'msaa',
  debugMode: 'none',
};

const DEFAULT_STATS: StatsState = {
  fps: 0,
  triangles: 0,
  calls: 0,
  renderer: 'WebGPU',
  memory: 0,
  computeTime: 0,
};

export const useGraphStore = create<GraphState>((set, get) => ({
  // Core store starts empty — the host (or demo) hydrates nodes/edges.
  nodes: [],
  edges: [],
  scene: DEFAULT_SCENE,
  stats: DEFAULT_STATS,
  selectedNodeId: null,
  generatedCode: '',
  onNodesChange: (changes) => {
    const nodes = applyNodeChanges(changes, get().nodes) as FluidityNode[];
    set({ nodes });
  },
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },
  onConnect: (conn) => {
    const edge = makeEditorEdge(conn, get().nodes, get().edges);
    if (!edge) return;
    set({ edges: addEdge(edge, get().edges) });
  },
  setNodes: (updater) => {
    set({ nodes: updater(get().nodes) });
  },
  addNode: (node) => {
    set({ nodes: [...get().nodes, node] });
  },
  removeNodes: (ids) => {
    const idSet = new Set(ids);
    set({
      nodes: get().nodes.filter((n) => !idSet.has(n.id)),
      edges: get().edges.filter((e) => !idSet.has(e.source) && !idSet.has(e.target)),
    });
  },
  updateNodeInput: (id, key, value) => {
    const nodes = get().nodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, inputs: { ...n.data.inputs, [key]: value } } } : n,
    );
    set({ nodes });
  },
  setSelectedNode: (id) => set({ selectedNodeId: id }),
  updateScene: (patch) => set({ scene: { ...get().scene, ...patch } }),
  setStats: (patch) => set({ stats: { ...get().stats, ...patch } }),
  loadGraph: (nodes, edges) => {
    const normalizedEdges = normalizeEditorEdges(nodes, edges);
    set({ nodes, edges: normalizedEdges, selectedNodeId: null });
  },
}));

// ---- Persistence (SSR-safe, debounced) -------------------------------------
const GRAPH_STORAGE_KEY = 'fluidity:graph';

if (typeof window !== 'undefined') {
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  useGraphStore.subscribe((s) => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        window.localStorage.setItem(
          GRAPH_STORAGE_KEY,
          JSON.stringify({ nodes: s.nodes, edges: s.edges, scene: s.scene }),
        );
      } catch {
        /* storage unavailable — non-fatal */
      }
    }, 300);
  });
}

/**
 * Restore a persisted graph. Call from a client effect after mount (avoids SSR mismatch).
 * If nothing is persisted and a `seed` is provided, the seed graph is loaded instead
 * (used by the demo to populate the canvas on first run).
 */
export function hydrateGraph(seed?: { nodes: FluidityNode[]; edges: FluidityEdge[] }): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(GRAPH_STORAGE_KEY);
    if (!raw) {
      if (seed) useGraphStore.getState().loadGraph(seed.nodes, seed.edges);
      return;
    }
    const data = JSON.parse(raw) as { nodes?: FluidityNode[]; edges?: FluidityEdge[]; scene?: SceneSettings };
    if (Array.isArray(data.nodes) && Array.isArray(data.edges)) {
      // Filter out any stale/invalid node types left over in local storage.
      const validNodes = data.nodes.filter(n => n.type === 'universal' || n.type === 'os-panel');
      const validNodesSet = new Set(validNodes.map(n => n.id));
      const edges = normalizeEditorEdges(validNodes, data.edges).filter(e => validNodesSet.has(e.source) && validNodesSet.has(e.target));
      useGraphStore.setState({
        nodes: validNodes,
        edges,
        scene: data.scene ?? useGraphStore.getState().scene,
      });
    } else if (seed) {
      useGraphStore.getState().loadGraph(seed.nodes, seed.edges);
    }
  } catch {
    /* corrupt/stale payload — fall back to defaults */
  }
}

export function resetWorkspace(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(GRAPH_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
