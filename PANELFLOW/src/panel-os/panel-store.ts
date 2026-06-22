import { create } from 'zustand';

export type DockMode = 'left' | 'right' | 'bottom' | 'float' | 'min';

export interface DockFloatRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PanelOSStore {
  dockedPanelId: string | null;
  setDockedPanelId: (id: string | null) => void;
  activePanelId: string | null;
  setActivePanel: (id: string | null) => void;
  dockMode: DockMode;
  setDockMode: (mode: DockMode) => void;
  dockFloatRect: DockFloatRect;
  setDockFloatRect: (rect: DockFloatRect) => void;
  floatMemory: Record<string, { position: { x: number, y: number }; viewport: { x: number, y: number, zoom: number } }>;
  setFloatMemory: (id: string, memory: { position: { x: number, y: number }; viewport: { x: number, y: number, zoom: number } }) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  theme: 'dark' | 'light' | 'system';
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  /** Bumped whenever the panel registry changes (e.g. auto-generated panels added). */
  registryVersion: number;
  bumpRegistry: () => void;
}

export const usePanelOSStore = create<PanelOSStore>((set) => ({
  dockedPanelId: 'inspector',
  setDockedPanelId: (id) => set({ dockedPanelId: id, activePanelId: id }),
  activePanelId: 'inspector',
  setActivePanel: (id) => set({ activePanelId: id, dockedPanelId: id }),
  dockMode: 'bottom',
  setDockMode: (mode) => set({ dockMode: mode }),
  dockFloatRect: { x: 100, y: 100, w: 400, h: 600 },
  setDockFloatRect: (rect) => set({ dockFloatRect: rect }),
  floatMemory: {},
  setFloatMemory: (id, memory) => set((s) => ({ floatMemory: { ...s.floatMemory, [id]: memory } })),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
  registryVersion: 0,
  bumpRegistry: () => set((s) => ({ registryVersion: s.registryVersion + 1 })),
}));
