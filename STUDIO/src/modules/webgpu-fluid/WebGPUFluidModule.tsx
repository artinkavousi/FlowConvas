/**
 * WebGPUFluidModule — reusable React wrapper around the ported WebGPU fluid sim.
 *
 * Copy-paste portable: drop this file + the `sim/` folder into any React app with
 * `three` installed. Drag the canvas to inject dye/velocity; emitters keep the
 * field self-animating. `values` (keyed by the params in sim/params.ts) mutate
 * the sim's shared `config` singleton live; `preset` applies a full built-in
 * look (config + emitter layout) from the source PresetManager.
 */

import { useEffect, useRef } from 'react';
import { createFluid, config } from './sim/createFluid.js';
import { applyFluidParam, readConfigToValues, DEFAULT_PRESET } from './sim/params';

type FluidValues = Record<string, unknown>;

interface FluidHandle {
  applyPreset: (id: string) => void;
  dispose: () => void;
}

type CreateFluid = (
  canvas: HTMLCanvasElement,
  options: { preset?: string; onStats?: (stats: FluidStats) => void },
) => Promise<FluidHandle>;

export interface FluidStats {
  fps: number;
  computeTime: number;
  memory: number;
  triangles: number;
  calls: number;
  renderer: string;
}

export interface WebGPUFluidProps {
  /** Bridge values keyed by sim/params.ts param keys (curl, renderMode, …). */
  values?: FluidValues;
  /** Built-in preset id (config + emitter layout). Default: 'aurora'. */
  preset?: string;
  /** Called after a preset is applied with the resulting flat config values,
   *  so a host control panel can re-sync its widgets to the preset. */
  onPresetApplied?: (values: FluidValues) => void;
  /** Optional render-loop telemetry hook for host chrome such as PANELFLOW. */
  onStats?: (stats: FluidStats) => void;
  className?: string;
}

export function WebGPUFluidModule({ values, preset, onPresetApplied, onStats, className }: WebGPUFluidProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<FluidHandle | null>(null);
  const initialPreset = useRef(preset ?? DEFAULT_PRESET);
  const onPresetAppliedRef = useRef(onPresetApplied);
  const onStatsRef = useRef(onStats);
  onPresetAppliedRef.current = onPresetApplied;
  onStatsRef.current = onStats;

  // Mount the simulation once; dispose on unmount.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    (createFluid as CreateFluid)(canvas, {
      preset: initialPreset.current,
      onStats: (stats: FluidStats) => onStatsRef.current?.(stats),
    })
      .then((h: FluidHandle) => {
        if (disposed) h.dispose();
        else handleRef.current = h;
      })
      .catch((e: unknown) => console.error('[webgpu-fluid] init failed', e));
    return () => {
      disposed = true;
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, []);

  // Apply controllable knobs live onto the shared config singleton.
  useEffect(() => {
    if (!values) return;
    for (const key of Object.keys(values)) {
      applyFluidParam(config as unknown as Record<string, unknown>, key, values[key]);
    }
  }, [values]);

  // Apply a built-in preset when it changes, then report the resulting config so
  // the host panel can re-sync. Skip the very first render (createFluid already
  // applied the initial preset on mount).
  const lastPreset = useRef(initialPreset.current);
  useEffect(() => {
    const next = preset ?? DEFAULT_PRESET;
    if (next === lastPreset.current) return;
    lastPreset.current = next;
    const handle = handleRef.current;
    if (!handle) return;
    handle.applyPreset(next);
    onPresetAppliedRef.current?.(readConfigToValues(config as unknown as Record<string, unknown>));
  }, [preset]);

  return <canvas ref={canvasRef} className={className} style={{ width: '100%', height: '100%', display: 'block' }} />;
}
