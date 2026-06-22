/**
 * studio-store.ts — minimal navigation state for the ARTINOS Studio.
 *
 * Intentionally tiny (no router — ADR-10): just which view is showing and which
 * module is active. The gallery/showcase UI reads this; modules never depend on it.
 */

import { create } from 'zustand';

export interface StudioState {
  view: 'gallery' | 'showcase';
  activeModuleId: string | null;
  openGallery: () => void;
  openShowcase: (id: string) => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  view: 'gallery',
  activeModuleId: null,
  openGallery: () => set({ view: 'gallery', activeModuleId: null }),
  openShowcase: (id) => set({ view: 'showcase', activeModuleId: id }),
}));
