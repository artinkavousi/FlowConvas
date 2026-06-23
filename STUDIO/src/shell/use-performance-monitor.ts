/**
 * use-performance-monitor.ts — a generic, always-on performance monitor for the
 * ACTIVE module, so the dock HUD + pipeline/mode indicator adapt to whatever is
 * loaded (not just modules that publish their own telemetry).
 *
 * - Measures real FPS + frame time from a rAF loop, and JS heap memory when available.
 * - Derives the render pipeline (WebGPU / WebGL / DOM) and 3d/2d view mode from the
 *   module so the shell's renderer pill + scene toggle reflect the component type.
 * - Yields to a module that publishes its own richer stats (e.g. the fluid's GPU
 *   triangles/calls): if another source published in the last 500ms, we don't clobber it.
 */

import { useEffect } from 'react';
import { publishPerformanceStats, resetPerformanceStats, useGraphStore } from '@artinos/panelflow';
import type { ArtinosModule } from '../registry/types';

const SOURCE = 'studio-perf';

export function modulePipeline(m: ArtinosModule): 'WebGPU' | 'WebGL' | 'DOM' {
  if (m.dependencies.includes('webgpu')) return 'WebGPU';
  if (m.dependencies.includes('three')) return 'WebGL';
  return 'DOM';
}

const THREE_D = new Set(['3d', 'shader', 'particles', 'postfx', 'material', 'effect']);

export function useStudioPerformanceMonitor(module: ArtinosModule | undefined) {
  useEffect(() => {
    if (!module) {
      resetPerformanceStats(SOURCE);
      return;
    }

    const pipeline = modulePipeline(module);
    // Adapt the shell's 3d/2d mode to the component type.
    useGraphStore.getState().updateScene({ viewMode: THREE_D.has(module.category) ? '3d' : '2d' });

    let raf = 0;
    let frames = 0;
    let windowStart = performance.now();
    let lastFrame = windowStart;
    let frameMsAccum = 0;
    let running = true;

    const perfMem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;

    const tick = () => {
      if (!running) return;
      const now = performance.now();
      frameMsAccum += now - lastFrame;
      lastFrame = now;
      frames++;

      const elapsed = now - windowStart;
      if (elapsed >= 350) {
        // Yield to a module publishing its own richer stats.
        const cur = useGraphStore.getState().stats;
        const otherLive = cur.source && cur.source !== SOURCE && now - (cur.updatedAt ?? 0) < 500;
        if (!otherLive) {
          publishPerformanceStats({
            source: SOURCE,
            fps: (frames * 1000) / elapsed,
            computeTime: frameMsAccum / frames,
            memory: perfMem ? Math.round(perfMem.usedJSHeapSize / 1048576) : 0,
            renderer: pipeline,
            triangles: 0,
            calls: 0,
          });
        }
        frames = 0;
        frameMsAccum = 0;
        windowStart = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      resetPerformanceStats(SOURCE);
    };
  }, [module]);
}
