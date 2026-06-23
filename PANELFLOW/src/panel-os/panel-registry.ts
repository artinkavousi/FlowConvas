import type { PanelDefinition } from '@/panel-os/panel-types';
import { ScenePanel } from '@/panels/scene.panel';
import { InspectorPanel } from '@/panels/inspector.panel';
import { GraphPanel } from '@/panels/graph.panel';
import { usePanelOSStore } from '@/panel-os/panel-store';

/** Panel id -> definition. The single source of panel truth. */
export const PANEL_REGISTRY: Record<string, PanelDefinition> = {
  [ScenePanel.id]: ScenePanel,
  [GraphPanel.id]: GraphPanel,
  [InspectorPanel.id]: InspectorPanel,
};

export const PANEL_DEFINITIONS = (): PanelDefinition[] => Object.values(PANEL_REGISTRY);

export function getPanelDefinition(id: string): PanelDefinition | undefined {
  return PANEL_REGISTRY[id];
}

/** Dynamically register a panel at runtime (used by control engine for auto-generated panels). */
export function registerPanel(def: PanelDefinition): void {
  PANEL_REGISTRY[def.id] = def;
  usePanelOSStore.getState().bumpRegistry();
}

/** Dynamically unregister a panel. */
export function unregisterPanel(id: string): void {
  delete PANEL_REGISTRY[id];
  usePanelOSStore.getState().bumpRegistry();
}
