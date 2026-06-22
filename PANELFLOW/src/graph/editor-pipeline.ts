import { type Connection, type Edge } from '@xyflow/react';
import { type EdgeIR, type GraphIR, validateGraph, type GraphValidation } from '@/graph/GraphRuntime';
import { getNode, type NodeDefinition, type PortType } from '@/graph/NodeDefinitions';
import type { FluidityEdge, FluidityNode, FluidityNodeData } from '@/graph/graph-store';

// Back-compat for saved UI graphs created before `runtimeType` existed.
const TYPE_FOR_LABEL: Record<string, string> = {
  UV: 'tsl/uv',
  WAVE: 'tsl/wave',
  GRADIENT: 'tsl/gradient',
  ADD: 'tsl/add',
  MULTIPLY: 'tsl/multiply',
  NOISE: 'tsl/noise',
  FBM: 'tsl/fbm',
  CONST: 'core/const',
};

const UI_TERMINALS = new Set(['MATERIAL', 'LIVE PREVIEW']);
const LIVE_PREVIEW_PORTS = {
  inputs: [{ key: 'target', label: 'Target', type: 'component' as PortType }],
  outputs: [],
};
const MATERIAL_PORTS = {
  inputs: [{ key: 'color', label: 'Color', type: 'color_linear' as PortType }],
  outputs: [],
};

export const inputToParam = (v: unknown): unknown =>
  typeof v === 'string' && v.startsWith('#') ? parseInt(v.slice(1), 16)
    : typeof v === 'string' && v !== '' && !Number.isNaN(Number(v)) ? Number(v)
      : v;

export const paramToInput = (type: PortType | undefined, v: unknown): number | string | boolean =>
  (type === 'color_linear' || type === 'color_srgb') && typeof v === 'number'
    ? '#' + (v >>> 0).toString(16).padStart(6, '0')
    : typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean'
      ? v
      : '';

export function runtimeTypeOf(node: FluidityNode): string | undefined {
  if (node.data.runtimeType) return node.data.runtimeType;
  return TYPE_FOR_LABEL[node.data.label];
}

export function editorPortsOf(node: FluidityNode): {
  inputs: { key: string; label: string; type?: PortType }[];
  outputs: { key: string; label: string; type?: PortType }[];
} {
  if (node.data.label === 'LIVE PREVIEW') return LIVE_PREVIEW_PORTS;
  if (node.data.label === 'MATERIAL') return MATERIAL_PORTS;
  const runtime = runtimeTypeOf(node);
  const def = runtime ? getNode(runtime) : undefined;
  if (def) return def.ports;
  return {
    inputs: Object.keys(node.data.inputs ?? {}).map((key) => ({ key, label: key })),
    outputs: [{ key: 'out', label: 'Out' }],
  };
}

export function editorToRuntimeGraph(nodes: FluidityNode[], edges: FluidityEdge[]): GraphIR {
  const irNodes: GraphIR['nodes'] = [];
  for (const node of nodes) {
    const type = runtimeTypeOf(node);
    if (!type || !getNode(type) || UI_TERMINALS.has(node.data.label)) continue;
    irNodes.push({
      id: node.id,
      type,
      params: Object.fromEntries(Object.entries(node.data.inputs ?? {}).map(([k, v]) => [k, inputToParam(v)])),
    });
  }

  const irIds = new Set(irNodes.map((n) => n.id));
  const irById = new Map(irNodes.map((n) => [n.id, n] as const));
  const usedInputs = new Map<string, Set<string>>();
  const irEdges: EdgeIR[] = [];

  for (const edge of edges) {
    if (!irIds.has(edge.source) || !irIds.has(edge.target)) continue;
    const sourceDef = getNode(irById.get(edge.source)!.type);
    const targetDef = getNode(irById.get(edge.target)!.type);
    const used = usedInputs.get(edge.target) ?? new Set<string>();
    const sourcePort = edge.sourceHandle ?? sourceDef?.ports.outputs[0]?.key ?? 'out';
    const targetPort = edge.targetHandle ?? chooseTargetPort(sourceDef, targetDef, used);
    if (!targetPort) continue;
    used.add(targetPort);
    usedInputs.set(edge.target, used);
    irEdges.push({ from: { node: edge.source, port: sourcePort }, to: { node: edge.target, port: targetPort } });
  }

  return { nodes: irNodes, edges: irEdges };
}

export function validateEditorGraph(nodes: FluidityNode[], edges: FluidityEdge[]): GraphValidation {
  return validateGraph(editorToRuntimeGraph(nodes, edges), getNode);
}

export function previewTargetOf(nodes: FluidityNode[]): string | undefined {
  const target = nodes.find((n) => n.data.label === 'LIVE PREVIEW')?.data.inputs.target;
  return typeof target === 'string' ? target : undefined;
}

export function editorGraphSummary(nodes: FluidityNode[], edges: FluidityEdge[]) {
  const graph = editorToRuntimeGraph(nodes, edges);
  const validation = validateGraph(graph, getNode);
  return { graph, validation, previewTarget: previewTargetOf(nodes) };
}

export function runtimeToEditorGraph(graph: GraphIR): { nodes: FluidityNode[]; edges: FluidityEdge[] } {
  const nodes: FluidityNode[] = graph.nodes.map((node, index) => {
    const def = getNode(node.type);
    const category: FluidityNodeData['category'] =
      def?.domain === 'core' ? 'input' : def?.domain === 'math' ? 'math' : def?.behavior === 'output' ? 'output' : 'advanced';
    const inputs = Object.fromEntries(Object.entries(node.params ?? {}).map(([k, v]) => {
      const param = def?.params?.[k];
      return [k, paramToInput(param?.type, v)];
    })) as FluidityNodeData['inputs'];
    return {
      id: node.id,
      type: 'universal',
      position: { x: 120 + index * 240, y: 160 + (index % 2) * 120 },
      data: {
        label: (def?.meta.title ?? node.type).toUpperCase(),
        category,
        inputs,
        runtimeType: node.type,
      },
    };
  });
  const edges: FluidityEdge[] = graph.edges.map((edge, index) => ({
    id: `workflow-edge-${index}-${edge.from.node}-${edge.to.node}`,
    source: edge.from.node,
    target: edge.to.node,
    sourceHandle: edge.from.port,
    targetHandle: edge.to.port,
    type: 'animated',
  }));
  return { nodes, edges };
}

export function makeEditorEdge(
  connection: Connection,
  nodes: FluidityNode[],
  existingEdges: FluidityEdge[],
): FluidityEdge | undefined {
  if (!connection.source || !connection.target || connection.source === connection.target) return undefined;
  const source = nodes.find((n) => n.id === connection.source);
  const target = nodes.find((n) => n.id === connection.target);
  if (!source || !target) return undefined;

  const sourcePorts = editorPortsOf(source).outputs;
  const targetPorts = editorPortsOf(target).inputs;
  const sourcePort = connection.sourceHandle ?? sourcePorts[0]?.key;
  const targetPort = connection.targetHandle ?? targetPorts.find((p) => !existingEdges.some((e) => e.target === target.id && e.targetHandle === p.key))?.key;
  if (!sourcePort || !targetPort) return undefined;

  const sourceType = sourcePorts.find((p) => p.key === sourcePort)?.type;
  const targetType = targetPorts.find((p) => p.key === targetPort)?.type;
  if (sourceType && targetType && sourceType !== targetType) return undefined;

  return {
    id: `edge-${connection.source}-${sourcePort}-${connection.target}-${targetPort}-${Date.now()}`,
    source: connection.source,
    target: connection.target,
    sourceHandle: sourcePort,
    targetHandle: targetPort,
    type: 'animated',
  } satisfies Edge;
}

export function normalizeEditorEdges(nodes: FluidityNode[], edges: FluidityEdge[]): FluidityEdge[] {
  const normalized: FluidityEdge[] = [];
  for (const edge of edges) {
    const fixed = makeEditorEdge({
      source: edge.source,
      sourceHandle: edge.sourceHandle ?? null,
      target: edge.target,
      targetHandle: edge.targetHandle ?? null,
    }, nodes, normalized);
    if (fixed) {
      normalized.push({ ...edge, ...fixed, id: edge.id, type: edge.type ?? 'animated' });
    }
  }
  return normalized;
}

function outType(def: NodeDefinition | undefined): PortType | undefined {
  return def?.ports.outputs[0]?.type;
}

function chooseTargetPort(
  sourceDef: NodeDefinition | undefined,
  targetDef: NodeDefinition | undefined,
  used: Set<string>,
): string | undefined {
  const inputs = targetDef?.ports.inputs ?? [];
  if (inputs.length === 0) return undefined;
  const sourceType = outType(sourceDef);
  const typed = inputs.find((p) => !used.has(p.key) && p.type === sourceType);
  if (typed) return typed.key;
  return inputs.find((p) => !used.has(p.key))?.key;
}
