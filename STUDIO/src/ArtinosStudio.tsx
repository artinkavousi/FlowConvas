/**
 * ArtinosStudio — the ARTINOS Studio shell.
 *
 * Mounts the PANELFLOW workspace (live viewport + editor dock + command palette)
 * and owns the viewport content. The dock is the control surface: selecting a
 * module loads it into the viewport. The ARTINOS Inspector panel renders the
 * active module's PANELFLOW/Frost controls and information from the shared bridge.
 */

import { useEffect, useRef } from 'react';
import { Layers } from 'lucide-react';
import {
  PanelFlowProvider,
  Workspace,
  registerComponentInstance,
  unregisterComponentInstance,
  initializeBridgeDefaults,
  registerPanel,
  usePanelOSStore,
} from '@artinos/panelflow';
import { StudioViewport } from './shell/StudioViewport';
import { useStudioStore } from './studio-store';
import { getModule } from './registry/registry';
import { LibraryPanel } from './panels/library.panel';
import { ArtinosInspectorPanel } from './panels/inspector.panel';
import { ConsolePanel } from './panels/console.panel';
import { AgentPanel } from './panels/agent.panel';

// Register the Studio's own dock panels into the PANELFLOW registry once.
registerPanel(ArtinosInspectorPanel);
registerPanel(LibraryPanel);
registerPanel(ConsolePanel);
registerPanel(AgentPanel);

/**
 * Loads the active module: registers its control schema, seeds bridge defaults,
 * and focuses the consolidated Inspector in the dock.
 */
function useActiveModule() {
  const activeModuleId = useStudioStore((s) => s.activeModuleId);
  const prevId = useRef<string | null>(null);

  useEffect(() => {
    const panelOS = usePanelOSStore.getState();
    const prev = prevId.current;

    if (prev && prev !== activeModuleId) {
      panelOS.closePanel(`auto-${prev}`);
      unregisterComponentInstance(prev);
    }

    if (activeModuleId) {
      const module = getModule(activeModuleId);
      if (module) {
        registerComponentInstance(module.schema, {
          instanceId: module.id,
          name: module.name,
          scopeId: 'studio-active-module',
        });     // PanelFlowProvider generates `auto-<id>`
        initializeBridgeDefaults(module.schema);
        panelOS.openPanel('inspector');
      }
    }

    prevId.current = activeModuleId;
  }, [activeModuleId]);
}

function StudioInner() {
  useActiveModule();

  // On first load, show the Library instead of PANELFLOW's default Inspector.
  useEffect(() => {
    const panelOS = usePanelOSStore.getState();
    panelOS.openPanel('scene-settings');
    panelOS.openPanel('inspector');
    panelOS.openPanel('library');
    panelOS.openPanel('console');
  }, []);

  return (
    <Workspace
      viewport={<StudioViewport />}
      brand={{ name: 'ARTINOS', mark: <Layers size={10} className="text-teal-400" /> }}
    />
  );
}

export default function ArtinosStudio() {
  return (
    <PanelFlowProvider theme="dark">
      <StudioInner />
    </PanelFlowProvider>
  );
}
