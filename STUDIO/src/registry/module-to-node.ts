/**
 * module-to-node.ts — generated adapter: ArtinosModule → PANELFLOW NodeDefinition
 * (plan-completion D-A). Modules stay graph-agnostic; this is the only place that
 * knows the graph exists. `registerModuleNodes()` exposes every registry module as
 * a node on the PANELFLOW graph canvas (spotlight search / makeNode).
 */

import { registerRuntimeNode, type NodeDefinition, type NodeDomain, type PortType, type Param, type ComponentSchema } from '@artinos/panelflow';
import type { ArtinosModule } from './types';

type SchemaParam = ComponentSchema['parameters'][number];

const CATEGORY_DOMAIN: Record<string, NodeDomain> = {
  ui: 'ui',
  '3d': 'scene',
  shader: 'tsl',
  particles: 'particles',
  postfx: 'postfx',
  material: 'materials',
};

function paramType(p: SchemaParam): { type: PortType; ui: Param['ui'] } {
  switch (p.type) {
    case 'color':
      return { type: 'color_srgb', ui: 'color' };
    case 'boolean':
      return { type: 'bool', ui: 'toggle' };
    case 'number':
      return { type: 'f32', ui: 'slider' };
    default:
      return { type: 'f32', ui: 'drag' };
  }
}

export function moduleToNode(m: ArtinosModule): NodeDefinition {
  const domain = CATEGORY_DOMAIN[m.category] ?? 'core';
  const params: Record<string, Param> = {};
  for (const p of m.schema.parameters) {
    const { type, ui } = paramType(p);
    params[p.key] = {
      type,
      default: p.default,
      range: typeof p.min === 'number' && typeof p.max === 'number' ? [p.min, p.max] : undefined,
      step: p.step,
      ui,
      doc: p.label,
    };
  }

  return {
    type: `module/${m.id}`,
    version: m.version,
    domain,
    behavior: 'generator',
    backendClass: m.dependencies.includes('webgpu') ? 'webgpu-required' : 'webgl-compatible',
    requires: m.dependencies,
    meta: {
      title: m.name,
      subtitle: m.category,
      category: m.category,
      tags: m.tags,
      color: '#2dd4bf',
    },
    ports: {
      inputs: [],
      outputs: [{ key: 'component', label: m.name, type: 'component' }],
    },
    params,
  };
}

/** Register every module as a graph node. Idempotent (registerRuntimeNode guards dupes). */
export function registerModuleNodes(modules: ArtinosModule[]): void {
  for (const m of modules) {
    try {
      registerRuntimeNode(moduleToNode(m));
    } catch (err) {
      console.warn(`[ARTINOS] failed to expose module "${m.id}" as a node`, err);
    }
  }
}
