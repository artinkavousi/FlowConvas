import type { NodeDefinition } from './NodeDefinitions';

export interface GraphIR {
  nodes: { id: string; type: string; params?: Record<string, unknown> }[];
  edges: EdgeIR[];
}

export interface EdgeIR {
  from: { node: string; port: string };
  to: { node: string; port: string };
}

export interface WorkflowDoc {
  $schema: string;
  version: number;
  three_version: string;
  title: string;
  slug: string;
  graph: GraphIR;
  metadata?: Record<string, unknown>;
}

export interface GraphValidation {
  errors: string[];
  warnings: string[];
  valid: boolean;
}

export function validateGraph(graph: GraphIR, getNodeDef: (type: string) => NodeDefinition | undefined): GraphValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const node of graph.nodes) {
    if (!getNodeDef(node.type)) {
      errors.push(`Node type "${node.type}" is unknown.`);
    }
  }

  return { errors, warnings, valid: errors.length === 0 };
}

export function serialize(doc: WorkflowDoc): string {
  return JSON.stringify(doc, null, 2);
}
