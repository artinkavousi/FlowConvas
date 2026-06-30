/**
 * @artinos/panelflow — Inspector subsystem barrel.
 *
 * Headless renderer telemetry engine (extends three r185's RendererInspector)
 * plus the Zustand store the PanelFlow inspector panels read from.
 */

export { ArtinosInspector } from './core/ArtinosInspector';
export {
  getInspector,
  inspectRenderer,
  detachInspector,
  installInspectorHook,
  isInspectionEnabled,
  setInspectionEnabled,
  getActiveRenderer,
  setInspectorActiveRenderer,
} from './attach';
export { useInspectorStore, type InspectorState } from './inspector-store';
export { formatBytes } from './core/frame-normalizer';
export { RingBuffer, SeriesRegistry } from './core/ring-buffer';
export type {
  Backend,
  ConsoleLevel,
  ConsoleMessage,
  FrameSnapshot,
  InspectorSettings,
  MemoryRow,
  MemoryStats,
  PassKind,
  PassNode,
  TimelineFrame,
  ViewerNode,
} from './types';
