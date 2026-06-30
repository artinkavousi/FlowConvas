/**
 * ArtinosInspector — the headless inspector engine.
 *
 * Extends three r185's `RendererInspector` (the DOM-free data base) and ports the
 * pure stats math from the addon's `Inspector.js` (`getStatsData`, `resolveStats`,
 * `getAverageDeltaTime`, `resolveFrame`) — but instead of writing to a Profiler
 * DOM, it publishes normalized snapshots to `useInspectorStore` (throttled) and
 * pushes graph series to ring buffers (drawn on canvas by the panels).
 *
 * The renderer drives this object every frame via the inspector hooks
 * (`begin/finish/beginRender/...`); we only override the resolution + publish.
 */

import { RendererInspector } from 'three/addons/inspector/RendererInspector.js';
import { Node } from 'three/webgpu';

import { useInspectorStore } from '../inspector-store';
import type { Backend, FrameSnapshot } from '../types';
import { buildMemoryStats, buildPassTree } from './frame-normalizer';
import { installConsole, uninstallConsole } from './console-bridge';
import { SeriesRegistry } from './ring-buffer';

const GRAPH_CAPACITY = 240;
const PAUSE_AFTER_MS = 600;

interface DisplayCycle {
  needsUpdate: boolean;
  duration: number;
  time: number;
}

export class ArtinosInspector extends RendererInspector {
  // Members the JS base provides but @types/three does not surface:
  declare frames: any[];
  declare maxFrames: number;
  declare overdraw: boolean;
  declare fps: number;
  declare currentNodes: any[] | null;
  declare getFrameById: (frameId: number) => any;

  /** Inspected nodes captured this frame (modules call `renderer.inspector.inspect(node)`). */
  private pendingViewerNodes: any[] = [];

  /** Per-call-id rolling stats, keyed by `cid` (ported from Inspector.js). */
  readonly statsData = new Map<string, any>();
  /** Named graph series (fps / cpu / gpu / memTotal), read by `LiveGraph`. */
  readonly series = new SeriesRegistry(GRAPH_CAPACITY);

  private readonly displayCycle: { text: DisplayCycle; graph: DisplayCycle } = {
    text: { needsUpdate: false, duration: 0.25, time: 0 },
    graph: { needsUpdate: false, duration: 0.02, time: 0 },
  };

  /** Timestamp of the last rendered frame (set in finish), used for pause detection. */
  private lastAlive = 0;
  private paused = false;
  private watchdog: ReturnType<typeof setInterval> | null = null;

  // Fallback path: modules that drive their own rAF (not setAnimationLoop) never
  // trigger begin()/finish(), so the per-pass tree stays empty. We still count
  // top-level renders so Memory + FPS work for them. `getFrame() === null` is true
  // only on that own-rAF path (setAnimationLoop sets currentFrame in begin()).
  private renderTicks = 0;
  private lastRenderTicks = 0;
  private lastWatch = 0;

  beginRender(uid: string, scene: any, camera: any, renderTarget: any): void {
    if (this.getFrame() === null) this.renderTicks++;
    super.beginRender(uid, scene, camera, renderTarget);
  }

  declare getFrame: () => any;

  setRenderer(renderer: any): this {
    super.setRenderer(renderer);

    if (renderer !== null && renderer !== undefined) {
      installConsole((level, text) => useInspectorStore.getState().pushConsole(level, text));

      // `backend` exists at renderer construction, so enabling timestamp queries
      // here is safe and avoids re-entering `renderer.init()` (which the auto-
      // attach hook has patched). GPU timing applies once the backend reports it.
      if (renderer.backend) renderer.backend.trackTimestamp = true;

      const backend: Backend = renderer.backend?.isWebGLBackend ? 'WebGL2' : 'WebGPU';
      useInspectorStore.getState().setAttached(true, backend);
      this.startWatchdog();
    }

    return this;
  }

  finish(): void {
    // `currentNodes` is nulled inside super.finish(); snapshot inspected nodes first.
    const nodes = Array.isArray(this.currentNodes) ? this.currentNodes.slice() : [];
    super.finish();
    this.pendingViewerNodes = nodes;

    // Liveness is tied to actual rendered frames — NOT to the publish step, which
    // lags behind async GPU-timestamp resolution and would falsely read "paused".
    this.lastAlive = performance.now();
    if (this.paused) {
      this.paused = false;
      useInspectorStore.getState().setPaused(false);
    }
  }

  // ── stats math (ported from three addon Inspector.js, DOM stripped) ─────────

  getStatsData(cid: string): any {
    let data = this.statsData.get(cid);
    if (data === undefined) {
      data = {};
      this.statsData.set(cid, data);
    }
    return data;
  }

  private getAverageDeltaTime(statsData: any, property: 'cpu' | 'gpu', frames = this.fps): number {
    const arr: any[] = statsData.stats;
    let sum = 0;
    let count = 0;
    for (let i = arr.length - 1; i >= 0 && count < frames; i--) {
      const value = arr[i][property];
      if (value > 0) {
        sum += value;
        count++;
      }
    }
    return count > 0 ? sum / count : 0;
  }

  private resolveStats(stats: any): void {
    const data = this.getStatsData(stats.cid);

    if (data.initialized !== true) {
      data.cpu = stats.cpu;
      data.gpu = stats.gpu;
      data.stats = [];
      data.initialized = true;
    }

    if (data.stats.length > this.maxFrames) data.stats.shift();
    data.stats.push(stats);

    data.cpu = this.getAverageDeltaTime(data, 'cpu');
    data.gpu = this.getAverageDeltaTime(data, 'gpu');
    data.total = data.cpu + data.gpu;

    for (const child of stats.children) {
      this.resolveStats(child);
      const childData = this.getStatsData(child.cid);
      data.cpu += childData.cpu;
      data.gpu += childData.gpu;
      data.total += childData.total;
    }
  }

  /** Called by `RendererInspector.resolveTimestamp` once a frame's timings land. */
  resolveFrame(frame: any): void {
    const nextFrame = this.getFrameById(frame.frameId + 1);
    if (!nextFrame) return;

    frame.cpu = 0;
    frame.gpu = 0;
    frame.total = 0;

    for (const stats of frame.children) {
      this.resolveStats(stats);
      const data = this.getStatsData(stats.cid);
      frame.cpu += data.cpu;
      frame.gpu += data.gpu;
      frame.total += data.total;
    }

    frame.deltaTime = nextFrame.startTime - frame.startTime;
    frame.miscellaneous = frame.deltaTime - frame.total;
    if (frame.miscellaneous < 0) frame.miscellaneous = 0;

    this.updateCycle(this.displayCycle.text);
    this.updateCycle(this.displayCycle.graph);

    const renderer = this.getRenderer() as any;
    const gpuTimestamps = renderer?.backend?.hasTimestamp === true;

    if (this.displayCycle.graph.needsUpdate) {
      this.series.get('fps').push(this.fps);
      this.series.get('cpu').push(frame.cpu);
      this.series.get('gpu').push(frame.gpu);
      this.series.get('memTotal').push(renderer?.info?.memory?.total ?? 0);
      this.displayCycle.graph.needsUpdate = false;
    }

    if (this.displayCycle.text.needsUpdate) {
      const passes = frame.children.map((s: any) => buildPassTree(this, s));
      const render = renderer?.info?.render;
      const snapshot: FrameSnapshot = {
        fps: this.fps,
        cpu: frame.cpu,
        gpu: frame.gpu,
        total: frame.total,
        miscellaneous: frame.miscellaneous,
        calls: render?.drawCalls ?? render?.calls ?? 0,
        triangles: render?.triangles ?? 0,
        gpuTimestamps,
        passes,
      };

      const store = useInspectorStore.getState();
      store.publishFrame(snapshot);
      store.publishMemory(buildMemoryStats(renderer?.info?.memory));
      store.setViewerNodes(
        this.pendingViewerNodes.map((node: any, i: number) => ({
          id: node?.uuid ?? `node-${i}`,
          name: node?.name || node?.type || `Node ${i}`,
          kind: node?.isTextureNode ? 'texture' : node?.isRenderTarget ? 'renderTarget' : 'node',
          width: node?.value?.width ?? 0,
          height: node?.value?.height ?? 0,
        })),
      );

      if (store.timeline.recording) {
        const info = renderer?.info;
        store.pushTimelineFrame({
          frameId: frame.frameId,
          time: performance.now(),
          fps: this.fps,
          cpu: frame.cpu,
          gpu: frame.gpu,
          total: frame.total,
          calls: info?.render?.drawCalls ?? info?.render?.calls ?? 0,
          triangles: info?.render?.triangles ?? 0,
          passes,
        });
      }

      this.displayCycle.text.needsUpdate = false;
    }
  }

  private updateCycle(cycle: DisplayCycle): void {
    cycle.time += this.nodeFrame.deltaTime;
    if (cycle.time >= cycle.duration) {
      cycle.needsUpdate = true;
      cycle.time = 0;
    }
  }

  // ── settings ────────────────────────────────────────────────────────────────

  setOverdraw(value: boolean): void {
    this.overdraw = value;
    useInspectorStore.getState().setSettings({ overdraw: value });
  }

  setCaptureStackTrace(value: boolean): void {
    (Node as unknown as { captureStackTrace: boolean }).captureStackTrace = value;
    useInspectorStore.getState().setSettings({ captureStackTrace: value });
  }

  // ── lifecycle ────────────────────────────────────────────────────────────

  private startWatchdog(): void {
    this.stopWatchdog();
    this.lastWatch = performance.now();
    this.watchdog = setInterval(() => this.tickWatchdog(), 500);
  }

  private tickWatchdog(): void {
    const now = performance.now();
    const dt = this.lastWatch ? (now - this.lastWatch) / 1000 : 0.5;
    this.lastWatch = now;

    const renderDelta = this.renderTicks - this.lastRenderTicks;
    this.lastRenderTicks = this.renderTicks;

    const store = useInspectorStore.getState();
    const setPaused = (value: boolean) => {
      if (this.paused !== value) {
        this.paused = value;
        store.setPaused(value);
      }
    };

    // Full per-frame path is alive (setAnimationLoop) — it publishes on its own.
    if (this.lastAlive && now - this.lastAlive < PAUSE_AFTER_MS) {
      setPaused(false);
      return;
    }

    // Own-rAF fallback: synthesize FPS from render count, surface memory.
    if (renderDelta > 0 && dt > 0) {
      const renderer = this.getRenderer() as any;
      const render = renderer?.info?.render;
      store.publishFrame({
        fps: renderDelta / dt,
        cpu: 0,
        gpu: 0,
        total: 0,
        miscellaneous: 0,
        calls: render?.drawCalls ?? render?.calls ?? 0,
        triangles: render?.triangles ?? 0,
        gpuTimestamps: false,
        passes: [],
      });
      store.publishMemory(buildMemoryStats(renderer?.info?.memory));
      setPaused(false);
      return;
    }

    setPaused(true);
  }

  private stopWatchdog(): void {
    if (this.watchdog) {
      clearInterval(this.watchdog);
      this.watchdog = null;
    }
  }

  dispose(): void {
    this.stopWatchdog();
    uninstallConsole();
    this.statsData.clear();
    this.series.clearAll();
    this.lastAlive = 0;
    this.paused = false;
    this.renderTicks = 0;
    this.lastRenderTicks = 0;
    this.lastWatch = 0;
  }
}
