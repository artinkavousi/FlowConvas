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
  installInspectorHook,
} from '@artinos/panelflow';
import { StudioViewport } from './shell/StudioViewport';
import { useStudioStore } from './studio-store';
import { getModule } from './registry/registry';
import { LibraryPanel } from './panels/library.panel';
import { ArtinosInspectorPanel } from './panels/inspector.panel';
import { ConsolePanel } from './panels/console.panel';
import { AgentPanel } from './panels/agent.panel';
import { LabCapsulesPanel } from './panels/lab-capsules.panel';

// Register the Studio's own dock panels into the PANELFLOW registry once.
registerPanel(ArtinosInspectorPanel);
registerPanel(LibraryPanel);
registerPanel(ConsolePanel);
registerPanel(AgentPanel);
registerPanel(LabCapsulesPanel);

// Auto-attach the headless inspector to renderers that modules create themselves
// (each ARTINOS module owns its own WebGPURenderer), feeding the Telemetry panel.
installInspectorHook();

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

  // Keep the dock ordered by workflow: Inspector, Labs, Library, Scene.
  useEffect(() => {
    const panelOS = usePanelOSStore.getState();
    panelOS.setPanelLayout(['inspector', 'lab-capsules', 'library', 'scene-settings', 'telemetry'], 'lab-capsules');
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
