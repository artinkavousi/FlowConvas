/**
 * studio-store.ts — minimal active-project state for the ARTINOS Studio.
 *
 * The viewport renders the active module's live preview; selecting a module loads
 * it (PANELFLOW auto-generates its control panel in the dock — see useActiveModule).
 * No router (ADR-10): just which module is active. `null` = empty stage.
 */

import { create } from 'zustand';

export interface StudioState {
  activeModuleId: string | null;
  setActiveModule: (id: string | null) => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  activeModuleId: null,
  setActiveModule: (id) => set({ activeModuleId: id }),
}));
