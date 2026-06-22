/**
 * ArtinosStudio — the ARTINOS Studio shell.
 *
 * Mounts the PANELFLOW workspace (editor dock + command palette) and owns the
 * viewport content. The real StudioViewport (gallery + showcase) lands in T-7;
 * for now the viewport is a stub so the shell can be verified end-to-end.
 */

import { PanelFlowProvider, Workspace } from '@artinos/panelflow';
import { StudioViewport } from './shell/StudioViewport';

export default function ArtinosStudio() {
  return (
    <PanelFlowProvider theme="dark">
      <Workspace viewport={<StudioViewport />} />
    </PanelFlowProvider>
  );
}
