/**
 * PanelFlowProvider — Top-level provider for PANELFLOW.
 * 
 * Responsibilities:
 * - Injects design system tokens (CSS variables)
 * - Watches the component registry for new schemas
 * - Auto-generates panels for registered components
 * - Syncs theme to the DOM
 */

import { useEffect, type ReactNode } from 'react';
import { injectTheme } from '@/studio-theme';
import {
  onRegistryChange,
  getRegisteredComponents,
  getRegisteredComponentInstances,
  getComponentSchema,
  generatePanelFromSchema,
} from '@/control-engine';
import { PANEL_REGISTRY, registerPanel, unregisterPanel } from '@/panel-os/panel-registry';
import { usePanelOSStore } from '@/panel-os/panel-store';

export interface PanelFlowProviderProps {
  children: ReactNode;
  /** Theme mode. Defaults to 'dark'. */
  theme?: 'dark' | 'light' | 'system';
  /** Whether to inject design tokens into the DOM. Defaults to true. */
  injectStyles?: boolean;
}

export function PanelFlowProvider({
  children,
  theme = 'dark',
  injectStyles = true,
}: PanelFlowProviderProps) {
  const setTheme = usePanelOSStore((s) => s.setTheme);

  // Inject design tokens
  useEffect(() => {
    if (injectStyles) injectTheme();
  }, [injectStyles]);

  // Sync theme prop
  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  // Watch for component registrations and auto-generate panels
  useEffect(() => {
    const syncPanels = () => {
      const schemas = getRegisteredComponents();
      const instances = getRegisteredComponentInstances();
      const instancedSchemaIds = new Set(instances.map((instance) => instance.schemaId));
      const liveAutoIds = new Set([
        ...schemas.filter((schema) => !instancedSchemaIds.has(schema.id)).map((schema) => `auto-${schema.id}`),
        ...instances.map((instance) => `auto-${instance.instanceId}`),
      ]);

      // Add panels for newly registered schema-only components.
      for (const schema of schemas) {
        if (instancedSchemaIds.has(schema.id)) continue;
        const panelId = `auto-${schema.id}`;
        if (!PANEL_REGISTRY[panelId]) {
          try {
            registerPanel(generatePanelFromSchema(schema));
          } catch (e) {
            console.warn(`[PanelFlow] Failed to generate panel for ${schema.id}:`, e);
          }
        }
      }

      // Add panels for concrete mounted instances.
      for (const instance of instances) {
        const schema = getComponentSchema(instance.schemaId);
        if (!schema) continue;
        const panelId = `auto-${instance.instanceId}`;
        if (!PANEL_REGISTRY[panelId]) {
          try {
            registerPanel(generatePanelFromSchema(schema, instance));
          } catch (e) {
            console.warn(`[PanelFlow] Failed to generate panel for ${instance.instanceId}:`, e);
          }
        }
      }

      // Remove auto-panels whose component was unregistered.
      for (const id of Object.keys(PANEL_REGISTRY)) {
        if (id.startsWith('auto-') && !liveAutoIds.has(id)) {
          unregisterPanel(id);
        }
      }
    };

    // Initial sync
    syncPanels();

    // Watch for future registrations
    return onRegistryChange(syncPanels);
  }, []);

  return <>{children}</>;
}
