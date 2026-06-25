// Source tuning for the TSL Fluid Lab — the exact constants from the CodePen
// (pashafd/OPVGJav), including its mobile/desktop split for grid size + Jacobi iterations.
// See REF/tsl-fluid/script.js.

const isMobile =
  typeof navigator !== 'undefined' && /Mobile/i.test(navigator.userAgent);

export const TSL_FLUID_DEFAULTS = {
  // Source: GRID_SIZE = isMobile ? 64 : 512; jacobiIterations = isMobile ? 10 : 20
  gridSize: isMobile ? 64 : 512,
  jacobiIterations: isMobile ? 10 : 20,
  dt: 0.026,
  viscosity: 0.0001,
  vorticity: 0.8,
  dissipation: 0.995,
  velocityDissipationOffset: 0.005,
  forceRadius: 0.02,
  forceStrength: 2.0,
  colorStrength: 0.5,
  colorCycleSpeed: 0.3,
  bloomStrength: 0.5,
  bloomRadius: 0.1,
  bloomThreshold: 0.1,
  paused: false,
} as const;

export type TslFluidConfig = typeof TSL_FLUID_DEFAULTS;
