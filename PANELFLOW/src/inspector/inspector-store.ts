/**
 * useInspectorStore — throttled, normalized inspector state for PanelFlow panels.
 *
 * The headless `ArtinosInspector` writes here at the engine's text cadence
 * (~4 Hz), NOT per frame. High-frequency graph series live in the engine's
 * `SeriesRegistry` (ring buffers drawn on canvas), so panels subscribed to this
 * store re-render only a few times per second.
 */

import { create } from 'zustand';
import type {
  Backend,
  ConsoleLevel,
  ConsoleMessage,
  FrameSnapshot,
  InspectorSettings,
  MemoryStats,
  PassNode,
  TimelineFrame,
  ViewerNode,
} from './types';

const MAX_CONSOLE = 400;

export interface InspectorState {
  attached: boolean;
  backend: Backend | null;
  /** No frames received recently (e.g. preview tab hidden → rAF paused). */
  paused: boolean;
  gpuTimestamps: boolean;

  fps: number;
  frame: { cpu: number; gpu: number; total: number; miscellaneous: number; calls: number; triangles: number };
  passes: PassNode[];

  memory: MemoryStats | null;

  console: ConsoleMessage[];
  unread: { warn: number; error: number };

  settings: InspectorSettings;

  timeline: {
    recording: boolean;
    frames: TimelineFrame[];
    selected: number | null;
  };

  viewer: { nodes: ViewerNode[] };

  // ── engine → store ────────────────────────────────────────────────────────
  setAttached: (attached: boolean, backend: Backend | null) => void;
  setPaused: (paused: boolean) => void;
  publishFrame: (snapshot: FrameSnapshot) => void;
  publishMemory: (memory: MemoryStats) => void;
  pushConsole: (level: ConsoleLevel, text: string) => void;
  clearConsole: () => void;
  markConsoleRead: () => void;
  setSettings: (patch: Partial<InspectorSettings>) => void;

  // ── timeline ──────────────────────────────────────────────────────────────
  setRecording: (recording: boolean) => void;
  pushTimelineFrame: (frame: TimelineFrame) => void;
  selectTimelineFrame: (index: number | null) => void;
  clearTimeline: () => void;

  // ── viewer ──────────────────────────────────────────────────────────────
  setViewerNodes: (nodes: ViewerNode[]) => void;

  reset: () => void;
}

const EMPTY_FRAME = { cpu: 0, gpu: 0, total: 0, miscellaneous: 0, calls: 0, triangles: 0 };

let consoleId = 0;

export const useInspectorStore = create<InspectorState>((set, get) => ({
  attached: false,
  backend: null,
  paused: false,
  gpuTimestamps: false,

  fps: 0,
  frame: { ...EMPTY_FRAME },
  passes: [],

  memory: null,

  console: [],
  unread: { warn: 0, error: 0 },

  settings: { overdraw: false, captureStackTrace: false },

  timeline: { recording: false, frames: [], selected: null },

  viewer: { nodes: [] },

  setAttached: (attached, backend) =>
    set(attached ? { attached, backend, paused: false } : { attached, backend }),

  setPaused: (paused) => {
    if (get().paused !== paused) set({ paused });
  },

  publishFrame: (s) =>
    set({
      fps: s.fps,
      frame: { cpu: s.cpu, gpu: s.gpu, total: s.total, miscellaneous: s.miscellaneous, calls: s.calls, triangles: s.triangles },
      passes: s.passes,
      gpuTimestamps: s.gpuTimestamps,
      paused: false,
    }),

  publishMemory: (memory) => set({ memory }),

  pushConsole: (level, text) =>
    set((state) => {
      const log = state.console;
      const last = log[log.length - 1];
      // Coalesce identical consecutive messages (matches vanilla "(xN)" behavior).
      if (last && last.level === level && last.text === text) {
        const next = log.slice(0, -1);
        next.push({ ...last, count: last.count + 1, time: Date.now() });
        return {
          console: next,
          unread:
            level === 'error'
              ? { ...state.unread, error: state.unread.error + 1 }
              : level === 'warn'
                ? { ...state.unread, warn: state.unread.warn + 1 }
                : state.unread,
        };
      }
      const message: ConsoleMessage = { id: consoleId++, level, text, count: 1, time: Date.now() };
      const next = log.length >= MAX_CONSOLE ? [...log.slice(log.length - MAX_CONSOLE + 1), message] : [...log, message];
      return {
        console: next,
        unread:
          level === 'error'
            ? { ...state.unread, error: state.unread.error + 1 }
            : level === 'warn'
              ? { ...state.unread, warn: state.unread.warn + 1 }
              : state.unread,
      };
    }),

  clearConsole: () => set({ console: [], unread: { warn: 0, error: 0 } }),
  markConsoleRead: () => set({ unread: { warn: 0, error: 0 } }),

  setSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),

  setRecording: (recording) =>
    set((state) => ({
      timeline: { ...state.timeline, recording, ...(recording ? { frames: [], selected: null } : {}) },
    })),

  pushTimelineFrame: (frame) =>
    set((state) => {
      if (!state.timeline.recording) return {};
      const frames = state.timeline.frames.length >= 600 ? [...state.timeline.frames.slice(1), frame] : [...state.timeline.frames, frame];
      return { timeline: { ...state.timeline, frames } };
    }),

  selectTimelineFrame: (selected) => set((state) => ({ timeline: { ...state.timeline, selected } })),
  clearTimeline: () => set((state) => ({ timeline: { ...state.timeline, frames: [], selected: null } })),

  setViewerNodes: (nodes) => set({ viewer: { nodes } }),

  reset: () =>
    set({
      attached: false,
      backend: null,
      paused: false,
      gpuTimestamps: false,
      fps: 0,
      frame: { ...EMPTY_FRAME },
      passes: [],
      memory: null,
      console: [],
      unread: { warn: 0, error: 0 },
      timeline: { recording: false, frames: [], selected: null },
      viewer: { nodes: [] },
    }),
}));
