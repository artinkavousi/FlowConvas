/**
 * capsule-preview.ts — Demo-only preview store.
 *
 * Mirrors the active graph's "preview target" (a component capsule) so the demo
 * viewport can render a live preview of the selected node's parameters. This is
 * a demo concern; the core package does not depend on it.
 */

import { create } from 'zustand';

interface PreviewState {
  name: string;
  params: Record<string, any>;
  setPreview: (target: any) => void;
  showGraph: () => void;
  setParam: (key: string, value: any) => void;
}

export const usePreview = create<PreviewState>((set) => ({
  name: '',
  params: {},
  setPreview: (target: any) => set({ name: target.name, params: target.params }),
  showGraph: () => set({ name: '', params: {} }),
  setParam: (key: string, value: any) => set((state) => ({ params: { ...state.params, [key]: value } })),
}));
