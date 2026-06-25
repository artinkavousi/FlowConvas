// Project-specific presets for the TSL Fluid Lab. `codepen-original` is the faithful
// default (source settings). The rest are additive ARTINOS looks built on the same engine.

export const TSL_FLUID_PRESETS: Record<string, Record<string, unknown>> = {
  'codepen-original': {},
  'thick-ink': { colorStrength: 1.0, dissipation: 0.999, forceStrength: 2.5 },
  'wispy-smoke': { forceStrength: 1.0, dissipation: 0.985, bloomStrength: 0.35 },
  'high-vorticity': { vorticity: 3.0, colorStrength: 0.7 },
  performance: { gridSize: 128, jacobiIterations: 10 },
};

export function resolveTslFluidPreset(id: string): Record<string, unknown> {
  return TSL_FLUID_PRESETS[id] ?? {};
}
