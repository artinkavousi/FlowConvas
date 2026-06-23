import { create } from 'zustand';

export type DockMode = 'left' | 'right' | 'bottom' | 'float' | 'min';

export interface DockFloatRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PanelOSStore {
  /** Panels currently open in the dock (tab order). */
  openPanelIds: string[];
  /** The focused panel rendered in the dock body. */
  activePanelId: string | null;
  /** Per-panel dock sizes in pixels. */
  panelSizes: Record<string, number>;
  /** Open a panel (adds it to the tab strip if needed) and focus it. */
  openPanel: (id: string) => void;
  /** Open a panel at a dock position, or move it there if already open. */
  openPanelAt: (id: string, index: number) => void;
  /** Move an already-open panel to a dock position. */
  movePanel: (id: string, index: number) => void;
  /** Replace the open dock layout with an ordered panel list. */
  setPanelLayout: (ids: string[], activeId?: string) => void;
  /** Close a panel; refocuses the next available one. */
  closePanel: (id: string) => void;
  /** Focus an already-open panel. */
  focusPanel: (id: string) => void;
  /** Resize a panel inside the dock host. */
  setPanelSize: (id: string, size: number) => void;
  /** @deprecated kept for graph os-panel nodes — delegates to openPanel/close. */
  dockedPanelId: string | null;
  setDockedPanelId: (id: string | null) => void;
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

export const usePanelOSStore = create<PanelOSStore>((set, get) => ({
  openPanelIds: ['inspector', 'scene-settings'],
  activePanelId: 'inspector',
  panelSizes: {},
  dockedPanelId: 'inspector',

  openPanel: (id) => set((s) => {
    if (s.openPanelIds.includes(id)) {
      return { activePanelId: id, dockedPanelId: id };
    }
    if (s.openPanelIds.length === 0) {
      return { openPanelIds: [id], activePanelId: id, dockedPanelId: id };
    }
    if (s.openPanelIds.length === 1) {
      return { openPanelIds: [s.openPanelIds[0], id], activePanelId: id, dockedPanelId: id };
    }

    const primaryPanelId = s.openPanelIds[0];
    return {
      openPanelIds: [primaryPanelId, id],
      activePanelId: id,
      dockedPanelId: id,
    };
  }),

  openPanelAt: (id, index) => set((s) => {
    const from = s.openPanelIds.indexOf(id);
    const next = s.openPanelIds.filter((panelId) => panelId !== id);
    const targetIndex = from >= 0 && from < index ? index - 1 : index;
    const target = Math.max(0, Math.min(targetIndex, next.length));
    next.splice(target, 0, id);
    return { openPanelIds: next, activePanelId: id, dockedPanelId: id };
  }),

  movePanel: (id, index) => set((s) => {
    const from = s.openPanelIds.indexOf(id);
    if (from === -1) return {};
    const next = s.openPanelIds.filter((panelId) => panelId !== id);
    const targetIndex = from < index ? index - 1 : index;
    const target = Math.max(0, Math.min(targetIndex, next.length));
    next.splice(target, 0, id);
    return { openPanelIds: next, activePanelId: id, dockedPanelId: id };
  }),

  setPanelLayout: (ids, activeId) => set(() => {
    const openPanelIds = Array.from(new Set(ids));
    const activePanelId = activeId && openPanelIds.includes(activeId)
      ? activeId
      : openPanelIds[openPanelIds.length - 1] ?? null;
    return { openPanelIds, activePanelId, dockedPanelId: activePanelId };
  }),

  closePanel: (id) => set((s) => {
    const openPanelIds = s.openPanelIds.filter((p) => p !== id);
    const active = s.activePanelId === id ? (openPanelIds[openPanelIds.length - 1] ?? null) : s.activePanelId;
    return { openPanelIds, activePanelId: active, dockedPanelId: active };
  }),

  focusPanel: (id) => set({ activePanelId: id, dockedPanelId: id }),

  setPanelSize: (id, size) => set((s) => ({
    panelSizes: {
      ...s.panelSizes,
      [id]: size,
    },
  })),

  setActivePanel: (id) => set({ activePanelId: id, dockedPanelId: id }),
  setDockedPanelId: (id) => {
    if (id) get().openPanel(id);
    else set((s) => ({ dockedPanelId: null, activePanelId: s.activePanelId }));
  },

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
