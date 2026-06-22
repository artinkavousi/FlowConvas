/**
 * WebGPUFluidModule — reusable React wrapper around the ported WebGPU fluid sim.
 *
 * Copy-paste portable: drop this file + the `sim/` folder into any React app with
 * `three` installed. Drag the canvas to inject dye/velocity. Props mutate the sim's
 * shared `config` singleton live (read each frame by the simulation).
 */

import { useEffect, useRef } from 'react';
import { createFluid, config } from './sim/createFluid.js';

export interface WebGPUFluidProps {
  /** Vorticity / swirliness (config.CURL). */
  curl?: number;
  /** Pointer influence size (config.SPLAT_RADIUS). */
  splatRadius?: number;
  /** How fast motion fades (config.VELOCITY_DISSIPATION). */
  velocityDissipation?: number;
  /** How fast dye fades (config.DENSITY_DISSIPATION). */
  densityDissipation?: number;
  /** Bloom post-FX on/off (config.BLOOM). */
  bloom?: boolean;
  /** Bloom strength (config.BLOOM_INTENSITY). */
  bloomIntensity?: number;
  /** Particle filament layer (config.PARTICLES_ENABLED). */
  particles?: boolean;
  className?: string;
}

export function WebGPUFluidModule({
  curl,
  splatRadius,
  velocityDissipation,
  densityDissipation,
  bloom,
  bloomIntensity,
  particles,
  className,
}: WebGPUFluidProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mount the simulation once; dispose on unmount.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let handle: { dispose: () => void } | null = null;
    let disposed = false;
    createFluid(canvas)
      .then((h: { dispose: () => void }) => {
        if (disposed) h.dispose();
        else handle = h;
      })
      .catch((e: unknown) => console.error('[webgpu-fluid] init failed', e));
    return () => {
      disposed = true;
      handle?.dispose();
    };
  }, []);

  // Apply controllable knobs live to the shared config singleton.
  useEffect(() => {
    if (curl !== undefined) config.CURL = curl;
    if (splatRadius !== undefined) config.SPLAT_RADIUS = splatRadius;
    if (velocityDissipation !== undefined) config.VELOCITY_DISSIPATION = velocityDissipation;
    if (densityDissipation !== undefined) config.DENSITY_DISSIPATION = densityDissipation;
    if (bloom !== undefined) config.BLOOM = bloom;
    if (bloomIntensity !== undefined) config.BLOOM_INTENSITY = bloomIntensity;
    if (particles !== undefined) config.PARTICLES_ENABLED = particles;
  }, [curl, splatRadius, velocityDissipation, densityDissipation, bloom, bloomIntensity, particles]);

  return <canvas ref={canvasRef} className={className} style={{ width: '100%', height: '100%', display: 'block' }} />;
}
