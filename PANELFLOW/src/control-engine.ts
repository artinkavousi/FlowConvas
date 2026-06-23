/**
 * control-engine.ts — The intelligent core of PANELFLOW.
 * 
 * Components register their parameter schemas here.
 * PANELFLOW auto-generates control panels from those schemas.
 * A bi-directional ControlBridge keeps panels and components in sync.
 */

import type { ComponentType } from 'react';

// ── Schema Types ───────────────────────────────────────────────────────────

/** A single controllable parameter on a component. */
export interface ParameterDef {
  key: string;
  label: string;
  type: 'number' | 'color' | 'boolean' | 'string' | 'vec2' | 'vec3' | 'enum' | 'range';
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
  /** Section grouping inside the control panel. */
  group?: string;
  /** UI hint — which widget to prefer. */
  ui?: 'slider' | 'knob' | 'toggle' | 'dropdown' | 'color-picker' | 'tweakpane';
}

/** A modifier stack entry (e.g., a post-processing effect, a geometry modifier). */
export interface ModifierDef {
  id: string;
  name: string;
  enabled: boolean;
  parameters: ParameterDef[];
}

/** Full schema for a controllable component. */
export interface ComponentSchema {
  id: string;
  name: string;
  description?: string;
  category: string;
  icon?: ComponentType;
  parameters: ParameterDef[];
  modifiers?: ModifierDef[];
}

/** A mounted controllable component. Multiple instances may share one schema. */
export interface ComponentInstance {
  instanceId: string;
  schemaId: string;
  name?: string;
  scopeId?: string;
  metadata?: Record<string, any>;
}

export interface RegisterComponentInstanceOptions {
  instanceId: string;
  name?: string;
  scopeId?: string;
  initialValues?: Record<string, any>;
  metadata?: Record<string, any>;
}

// ── Control Bridge ─────────────────────────────────────────────────────────

/** Bi-directional state sync interface between panels and host components. */
export interface ControlBridge {
  /** Called when a parameter changes in the control panel. */
  onParameterChange: (componentId: string, key: string, value: any) => void;
  /** Push current parameter values from host component to the panel. */
  setParameterValues: (componentId: string, values: Record<string, any>) => void;
  /** Notify PANELFLOW that the component tree has changed. */
  notifyComponentTreeChange: (components: ComponentSchema[]) => void;
  /** Get the current panel layout state for persistence. */
  getLayoutState: () => any;
  /** Restore a previously saved layout. */
  restoreLayout: (state: any) => void;
}

// ── Component Registry ─────────────────────────────────────────────────────

const componentRegistry = new Map<string, ComponentSchema>();
const componentInstances = new Map<string, ComponentInstance>();
const listeners = new Set<() => void>();

/** Register a component schema. PANELFLOW will auto-generate a control panel for it. */
export function registerComponent(schema: ComponentSchema): void {
  componentRegistry.set(schema.id, schema);
  notifyListeners();
}

/** Unregister a component. Its auto-generated panel will be removed. */
export function unregisterComponent(id: string): void {
  componentRegistry.delete(id);
  for (const [instanceId, instance] of componentInstances) {
    if (instance.schemaId === id) {
      componentInstances.delete(instanceId);
      useBridgeStore.getState().removeParams(instanceId);
    }
  }
  useBridgeStore.getState().removeParams(id);
  notifyListeners();
}

/** Register one mounted instance of a component schema. */
export function registerComponentInstance(
  schema: ComponentSchema,
  options: RegisterComponentInstanceOptions,
): ComponentInstance {
  componentRegistry.set(schema.id, schema);
  const instance: ComponentInstance = {
    instanceId: options.instanceId,
    schemaId: schema.id,
    name: options.name,
    scopeId: options.scopeId,
    metadata: options.metadata,
  };
  componentInstances.set(options.instanceId, instance);

  if (options.initialValues) {
    useBridgeStore.getState().setAllParams(options.instanceId, options.initialValues);
  } else {
    initializeBridgeDefaults(schema, options.instanceId);
  }

  notifyListeners();
  return instance;
}

/** Unregister one mounted component instance without removing the shared schema. */
export function unregisterComponentInstance(instanceId: string): void {
  componentInstances.delete(instanceId);
  useBridgeStore.getState().removeParams(instanceId);
  notifyListeners();
}

/** Get all currently registered component schemas. */
export function getRegisteredComponents(): ComponentSchema[] {
  return Array.from(componentRegistry.values());
}

export function getRegisteredComponentInstances(): ComponentInstance[] {
  return Array.from(componentInstances.values());
}

export function getComponentSchema(id: string): ComponentSchema | undefined {
  return componentRegistry.get(id);
}

/** Subscribe to registry changes (used by PanelFlowProvider to auto-generate panels). */
export function onRegistryChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function notifyListeners(): void {
  listeners.forEach(fn => fn());
}

// ── Bridge State Store ─────────────────────────────────────────────────────

import { create } from 'zustand';

interface BridgeState {
  /** Component ID → { paramKey → currentValue } */
  componentValues: Record<string, Record<string, any>>;
  /** Set a single parameter value. */
  setParam: (componentId: string, key: string, value: any) => void;
  /** Set all values for a component at once. */
  setAllParams: (componentId: string, values: Record<string, any>) => void;
  /** Get all current values for a component. */
  getParams: (componentId: string) => Record<string, any>;
  /** Remove a component or instance value bucket. */
  removeParams: (componentId: string) => void;
}

export const useBridgeStore = create<BridgeState>((set, get) => ({
  componentValues: {},

  setParam: (componentId, key, value) => set(state => ({
    componentValues: {
      ...state.componentValues,
      [componentId]: {
        ...(state.componentValues[componentId] || {}),
        [key]: value,
      },
    },
  })),

  setAllParams: (componentId, values) => set(state => ({
    componentValues: {
      ...state.componentValues,
      [componentId]: values,
    },
  })),

  getParams: (componentId) => get().componentValues[componentId] || {},

  removeParams: (componentId) => set(state => {
    const { [componentId]: _removed, ...componentValues } = state.componentValues;
    return { componentValues };
  }),
}));

// ── Auto-Panel Generation ──────────────────────────────────────────────────

import { createElement } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { definePanel } from '@/panel-os/define-panel';
import type { PanelDefinition } from '@/panel-os/panel-types';
import { FrostPanePanel } from '@/lib/tweakpane_frost/FrostPanePanel';

/**
 * Generate a PanelDefinition from a ComponentSchema.
 * The resulting panel renders controls with Tweakpane Frost (the studio's control
 * language). The plain-HTML `AutoGeneratedPanel` remains exported as a fallback.
 */
export function generatePanelFromSchema(schema: ComponentSchema, instance?: ComponentInstance): PanelDefinition {
  const targetId = instance?.instanceId ?? schema.id;
  return definePanel({
    id: `auto-${targetId}`,
    title: instance?.name || schema.name,
    description: schema.description || `Control panel for ${instance?.name || schema.name}`,
    icon: schema.icon || SlidersHorizontal,
    defaultPlacement: 'right',
    defaultSize: 320,
    minSize: 240,
    maxSize: 500,
    capabilities: { floatable: true, closable: true, resizable: true },
    // Render as a real React element so hooks inside the panel work.
    component: () => createElement(FrostPanePanel, { schema, targetId }),
    tags: ['auto', schema.category, instance?.scopeId].filter(Boolean) as string[],
  });
}

// ── Initialize Bridge with Defaults ────────────────────────────────────────

/** Initialize the bridge store with default values from a schema. */
export function initializeBridgeDefaults(schema: ComponentSchema, targetId = schema.id): void {
  const existing = useBridgeStore.getState().getParams(targetId);
  if (Object.keys(existing).length > 0) return; // Already initialized

  const defaults: Record<string, any> = {};
  for (const param of schema.parameters) {
    defaults[param.key] = param.default;
  }
  useBridgeStore.getState().setAllParams(targetId, defaults);
}
