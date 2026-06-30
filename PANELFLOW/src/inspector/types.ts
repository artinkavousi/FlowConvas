/**
 * Inspector engine — shared data types.
 *
 * These describe the *normalized* shape the headless `ArtinosInspector` publishes
 * to `useInspectorStore`. They are deliberately framework-free (no three types in
 * the public surface) so panels stay decoupled from the engine internals.
 */

export type PassKind = 'render' | 'compute';

/** One node in the per-frame CPU/GPU timing tree (a render or compute pass). */
export interface PassNode {
  cid: string;
  name: string;
  kind: PassKind;
  /** Averaged CPU time for this pass (ms). */
  cpu: number;
  /** Averaged GPU time for this pass (ms); 0 when unavailable. */
  gpu: number;
  /** cpu + gpu including descendants. */
  total: number;
  /** False on WebGL or when timestamp queries are unavailable. */
  gpuAvailable: boolean;
  children: PassNode[];
}

/** A throttled snapshot of the most-recent resolved frame. */
export interface FrameSnapshot {
  fps: number;
  cpu: number;
  gpu: number;
  total: number;
  miscellaneous: number;
  /** Draw calls this frame (renderer.info.render.calls). */
  calls: number;
  /** Triangles this frame (renderer.info.render.triangles). */
  triangles: number;
  /** Whether GPU timestamp queries produced real numbers this frame. */
  gpuTimestamps: boolean;
  passes: PassNode[];
}

/** One row of `renderer.info.memory`. `size === null` means "N/A". */
export interface MemoryRow {
  key: string;
  label: string;
  count: number;
  size: number | null;
}

export interface MemoryStats {
  /** Total tracked GPU objects (renderer.info.memory.total). */
  total: number;
  rows: MemoryRow[];
}

export type ConsoleLevel = 'info' | 'warn' | 'error';

export interface ConsoleMessage {
  id: number;
  level: ConsoleLevel;
  text: string;
  /** Coalesced repeat count for identical consecutive messages. */
  count: number;
  time: number;
}

/** Inspector render-mode settings (the parts of the vanilla Settings tab we keep). */
export interface InspectorSettings {
  /** Additive shaded-fragment count render mode. */
  overdraw: boolean;
  /** Capture node stack traces (heavier; surfaces in Console). */
  captureStackTrace: boolean;
}

/** A single recorded frame in the Timeline. */
export interface TimelineFrame {
  frameId: number;
  time: number;
  fps: number;
  cpu: number;
  gpu: number;
  total: number;
  calls: number;
  triangles: number;
  passes: PassNode[];
}

/** An inspectable node/texture surfaced in the Viewer. */
export interface ViewerNode {
  id: string;
  name: string;
  kind: 'node' | 'texture' | 'renderTarget';
  width: number;
  height: number;
}

export type Backend = 'WebGPU' | 'WebGL2';
