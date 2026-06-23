/**
 * params.ts — the controllable parameter surface for the WebGPU fluid sim.
 *
 * Single source of truth shared by `webgpu-fluid.module.ts` (which builds the
 * PANELFLOW schema from it) and `WebGPUFluidModule.tsx` (which applies bridge
 * values onto the live `config` singleton). Every entry maps a bridge param
 * `key` to a `config` key, with the type/range/options the auto-panel needs.
 *
 * Curated from the source project's GUI (REF/.../src/ui/gui.js) and config.js —
 * the meaningful knobs across every domain (dynamics, emitters, colour,
 * material, bloom, render mode, post-FX), exposed through the bridge instead of
 * the original Tweakpane GUI.
 */

export type FluidParamType = 'number' | 'boolean' | 'color' | 'enum';

export interface FluidParam {
  /** Bridge param key (camelCase, what the panel/preset uses). */
  key: string;
  label: string;
  type: FluidParamType;
  /** Config singleton key this drives (UPPER_SNAKE). */
  configKey: string;
  default: unknown;
  min?: number;
  max?: number;
  step?: number;
  group: string;
  options?: { label: string; value: string }[];
}

// ── Colour helpers — PANELFLOW colour params are hex strings; the fluid
//    config stores { r, g, b } in 0..255. Convert at the boundary. ──────────

export function rgbToHex(c: { r: number; g: number; b: number }): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

const RENDER_MODES = [
  { label: 'Fluid', value: 'fluid' },
  { label: 'Ocean', value: 'ocean' },
  { label: 'Velocity', value: 'velocity' },
  { label: 'Curl', value: 'curl' },
  { label: 'Divergence', value: 'divergence' },
  { label: 'Pressure', value: 'pressure' },
  { label: 'Temperature', value: 'temperature' },
  { label: 'Foam', value: 'foam' },
  { label: 'Density', value: 'density' },
];

const DISPLAY_STYLES = [
  { label: 'Classic', value: 'classic' },
  { label: 'Gradient', value: 'gradient' },
  { label: 'Material', value: 'material' },
  { label: 'Distortion', value: 'distortion' },
  { label: 'Metallic', value: 'metallic' },
  { label: 'Neon', value: 'neon' },
  { label: 'Thermal', value: 'thermal' },
  { label: 'Watercolor', value: 'watercolor' },
  { label: 'Glass', value: 'glass' },
];

const COLOR_MODES = [
  { label: 'Single', value: 'single' },
  { label: 'Dual', value: 'dual' },
  { label: 'Gradient', value: 'gradient' },
  { label: 'Multi-stop', value: 'multiStop' },
  { label: 'Rainbow', value: 'rainbow' },
  { label: 'Velocity', value: 'velocity' },
  { label: 'Temperature', value: 'temperature' },
  { label: 'Age', value: 'age' },
];

const ADVECTION_METHODS = [
  { label: 'Linear', value: 'linear' },
  { label: 'MacCormack', value: 'maccormack' },
  { label: 'BFECC', value: 'bfecc' },
  { label: 'RK4', value: 'rk4' },
];

const PRESSURE_SOLVERS = [
  { label: 'Jacobi', value: 'jacobi' },
  { label: 'Red-black GS', value: 'redblack' },
  { label: 'Multigrid', value: 'multigrid' },
];

const TONE_MAPPINGS = [
  { label: 'None', value: 'none' },
  { label: 'Reinhard', value: 'reinhard' },
  { label: 'ACES', value: 'aces' },
  { label: 'Uncharted2', value: 'uncharted2' },
  { label: 'AgX', value: 'agx' },
];

/** Built-in presets from the source PresetManager registry (config + emitters). */
export const FLUID_PRESETS: { label: string; value: string }[] = [
  { label: 'Aurora', value: 'aurora' },
  { label: 'Aurora Borealis (slow)', value: 'aurora-borealis-slow' },
  { label: 'Lava Flow', value: 'lava-flow' },
  { label: 'Lava Crater', value: 'lava-crater' },
  { label: 'Volcanic Plume', value: 'volcanic-plume' },
  { label: 'Underwater Currents', value: 'underwater-currents' },
  { label: 'Sunset Over Water', value: 'sunset-over-water' },
  { label: 'Forest Mist', value: 'forest-mist' },
  { label: 'Smoke Plume', value: 'smoke-plume' },
  { label: 'Oil Painting', value: 'oil-painting' },
  { label: 'Plasma Field', value: 'plasma-field' },
  { label: 'Solar Wind', value: 'solar-wind' },
  { label: 'Holo Pulse', value: 'holo-pulse' },
  { label: 'Liquid Metal Mirror', value: 'liquid-metal-mirror' },
  { label: 'Particle Storm', value: 'particle-storm' },
  { label: 'Voxel Storm', value: 'voxel-storm' },
  { label: 'Bokeh Garden', value: 'bokeh-garden' },
  { label: 'Slow Drift', value: 'slow-drift' },
];

export const DEFAULT_PRESET = 'aurora';

export const FLUID_PARAMS: FluidParam[] = [
  // ── Dynamics ──────────────────────────────────────────────────────────
  { key: 'curl', label: 'Curl', type: 'number', configKey: 'CURL', default: 30, min: 0, max: 50, step: 1, group: 'Dynamics' },
  { key: 'splatRadius', label: 'Splat Radius', type: 'number', configKey: 'SPLAT_RADIUS', default: 0.25, min: 0.01, max: 1, step: 0.01, group: 'Dynamics' },
  { key: 'splatForce', label: 'Splat Force', type: 'number', configKey: 'SPLAT_FORCE', default: 6000, min: 1000, max: 12000, step: 100, group: 'Dynamics' },
  { key: 'velocityDissipation', label: 'Velocity Fade', type: 'number', configKey: 'VELOCITY_DISSIPATION', default: 0.2, min: 0, max: 4, step: 0.01, group: 'Dynamics' },
  { key: 'densityDissipation', label: 'Dye Fade', type: 'number', configKey: 'DENSITY_DISSIPATION', default: 1, min: 0, max: 4, step: 0.01, group: 'Dynamics' },
  { key: 'pressure', label: 'Pressure', type: 'number', configKey: 'PRESSURE', default: 0.8, min: 0, max: 1, step: 0.01, group: 'Dynamics' },
  { key: 'pressureIterations', label: 'Pressure Iters', type: 'number', configKey: 'PRESSURE_ITERATIONS', default: 20, min: 4, max: 80, step: 1, group: 'Dynamics' },
  { key: 'pressureSolver', label: 'Pressure Solver', type: 'enum', configKey: 'PRESSURE_SOLVER', default: 'jacobi', options: PRESSURE_SOLVERS, group: 'Dynamics' },
  { key: 'viscosity', label: 'Viscosity', type: 'number', configKey: 'VISCOSITY', default: 0, min: 0, max: 1, step: 0.01, group: 'Dynamics' },
  { key: 'advection', label: 'Advection', type: 'enum', configKey: 'ADVECTION_METHOD', default: 'linear', options: ADVECTION_METHODS, group: 'Dynamics' },
  { key: 'paused', label: 'Paused', type: 'boolean', configKey: 'PAUSED', default: false, group: 'Dynamics' },

  // ── Emitters ──────────────────────────────────────────────────────────
  { key: 'emittersEnabled', label: 'Emitters', type: 'boolean', configKey: 'EMITTERS_ENABLED', default: true, group: 'Emitters' },
  { key: 'emitterRate', label: 'Emitter Rate', type: 'number', configKey: 'EMITTER_RATE', default: 9, min: 0, max: 30, step: 0.5, group: 'Emitters' },
  { key: 'emitterIntensity', label: 'Emitter Intensity', type: 'number', configKey: 'EMITTER_INTENSITY', default: 0.48, min: 0, max: 2, step: 0.01, group: 'Emitters' },

  // ── Color ─────────────────────────────────────────────────────────────
  { key: 'colorMode', label: 'Color Mode', type: 'enum', configKey: 'COLOR_MODE', default: 'gradient', options: COLOR_MODES, group: 'Color' },
  { key: 'colorful', label: 'Colorful', type: 'boolean', configKey: 'COLORFUL', default: true, group: 'Color' },
  { key: 'colorUpdateSpeed', label: 'Color Speed', type: 'number', configKey: 'COLOR_UPDATE_SPEED', default: 10, min: 0, max: 30, step: 0.5, group: 'Color' },
  { key: 'hueShift', label: 'Hue Shift', type: 'number', configKey: 'HUE_SHIFT', default: 0, min: -360, max: 360, step: 1, group: 'Color' },
  { key: 'rainbowSpeed', label: 'Rainbow Speed', type: 'number', configKey: 'RAINBOW_SPEED', default: 0.12, min: 0, max: 1, step: 0.001, group: 'Color' },
  { key: 'paletteA', label: 'Palette A', type: 'color', configKey: 'PALETTE_A', default: '#081223', group: 'Color' },
  { key: 'paletteB', label: 'Palette B', type: 'color', configKey: 'PALETTE_B', default: '#1af5c6', group: 'Color' },
  { key: 'paletteC', label: 'Palette C', type: 'color', configKey: 'PALETTE_C', default: '#b452ff', group: 'Color' },
  { key: 'singleColor', label: 'Single Color', type: 'color', configKey: 'SINGLE_COLOR', default: '#46dcff', group: 'Color' },
  { key: 'backColor', label: 'Background', type: 'color', configKey: 'BACK_COLOR', default: '#000000', group: 'Color' },

  // ── Render mode & material ────────────────────────────────────────────
  { key: 'renderMode', label: 'Render Mode', type: 'enum', configKey: 'RENDER_MODE', default: 'fluid', options: RENDER_MODES, group: 'Render' },
  { key: 'displayStyle', label: 'Display Style', type: 'enum', configKey: 'DISPLAY_STYLE', default: 'classic', options: DISPLAY_STYLES, group: 'Render' },
  { key: 'shading', label: 'Shading', type: 'boolean', configKey: 'SHADING', default: true, group: 'Render' },
  { key: 'materialRoughness', label: 'Roughness', type: 'number', configKey: 'MATERIAL_ROUGHNESS', default: 0.62, min: 0.02, max: 1, step: 0.01, group: 'Render' },
  { key: 'materialSpecular', label: 'Specular', type: 'number', configKey: 'MATERIAL_SPECULAR', default: 0.18, min: 0, max: 2, step: 0.01, group: 'Render' },
  { key: 'materialEmissive', label: 'Emissive', type: 'number', configKey: 'MATERIAL_EMISSIVE', default: 0.35, min: 0, max: 2, step: 0.01, group: 'Render' },
  { key: 'materialExposure', label: 'Exposure', type: 'number', configKey: 'MATERIAL_EXPOSURE', default: 0.9, min: 0, max: 3, step: 0.01, group: 'Render' },
  { key: 'materialSaturation', label: 'Saturation', type: 'number', configKey: 'MATERIAL_SATURATION', default: 0.95, min: 0, max: 3, step: 0.01, group: 'Render' },

  // ── Bloom & glow ──────────────────────────────────────────────────────
  { key: 'bloom', label: 'Bloom', type: 'boolean', configKey: 'BLOOM', default: true, group: 'Bloom & Glow' },
  { key: 'bloomIntensity', label: 'Bloom Intensity', type: 'number', configKey: 'BLOOM_INTENSITY', default: 0.58, min: 0, max: 2, step: 0.01, group: 'Bloom & Glow' },
  { key: 'bloomThreshold', label: 'Bloom Threshold', type: 'number', configKey: 'BLOOM_THRESHOLD', default: 0.74, min: 0, max: 1, step: 0.01, group: 'Bloom & Glow' },
  { key: 'sunrays', label: 'Sunrays', type: 'boolean', configKey: 'SUNRAYS', default: true, group: 'Bloom & Glow' },
  { key: 'sunraysWeight', label: 'Sunrays Weight', type: 'number', configKey: 'SUNRAYS_WEIGHT', default: 0.68, min: 0, max: 2, step: 0.01, group: 'Bloom & Glow' },

  // ── Particles ─────────────────────────────────────────────────────────
  { key: 'particles', label: 'Particles', type: 'boolean', configKey: 'PARTICLES_ENABLED', default: false, group: 'Particles' },
  { key: 'particleBrightness', label: 'Particle Glow', type: 'number', configKey: 'PARTICLE_BRIGHTNESS', default: 1, min: 0, max: 4, step: 0.01, group: 'Particles' },
  { key: 'particleDensity', label: 'Particle Density', type: 'number', configKey: 'PARTICLE_DENSITY', default: 16, min: 1, max: 64, step: 1, group: 'Particles' },

  // ── Post-FX ───────────────────────────────────────────────────────────
  { key: 'toneMapping', label: 'Tone Mapping', type: 'enum', configKey: 'TONE_MAPPING', default: 'reinhard', options: TONE_MAPPINGS, group: 'Post-FX' },
  { key: 'outputGain', label: 'Output Gain', type: 'number', configKey: 'OUTPUT_GAIN', default: 1.05, min: 0.1, max: 2, step: 0.01, group: 'Post-FX' },
  { key: 'chromaticAberration', label: 'Chromatic Aberration', type: 'number', configKey: 'CHROMATIC_ABERRATION', default: 0, min: 0, max: 8, step: 0.01, group: 'Post-FX' },
  { key: 'lensDistortion', label: 'Lens Distortion', type: 'number', configKey: 'LENS_DISTORTION', default: 0, min: -0.8, max: 0.8, step: 0.001, group: 'Post-FX' },
  { key: 'filmGrain', label: 'Film Grain', type: 'number', configKey: 'FILM_GRAIN', default: 0, min: 0, max: 1, step: 0.01, group: 'Post-FX' },
  { key: 'vignette', label: 'Vignette', type: 'number', configKey: 'VIGNETTE', default: 0, min: 0, max: 1, step: 0.01, group: 'Post-FX' },
  { key: 'motionBlur', label: 'Motion Blur', type: 'number', configKey: 'MOTION_BLUR', default: 0, min: 0, max: 1, step: 0.01, group: 'Post-FX' },

  // ── Forces ────────────────────────────────────────────────────────────
  { key: 'gravityY', label: 'Gravity', type: 'number', configKey: 'GRAVITY_Y', default: 0, min: -80, max: 80, step: 1, group: 'Forces' },
  { key: 'windX', label: 'Wind X', type: 'number', configKey: 'WIND_X', default: 0, min: -80, max: 80, step: 1, group: 'Forces' },
  { key: 'windY', label: 'Wind Y', type: 'number', configKey: 'WIND_Y', default: 0, min: -80, max: 80, step: 1, group: 'Forces' },
  { key: 'temperature', label: 'Temperature', type: 'number', configKey: 'TEMPERATURE_AMOUNT', default: 0, min: 0, max: 4, step: 0.01, group: 'Forces' },
  { key: 'buoyancy', label: 'Buoyancy', type: 'number', configKey: 'BUOYANCY_STRENGTH', default: 12, min: 0, max: 40, step: 0.5, group: 'Forces' },
];

const PARAM_BY_KEY: Record<string, FluidParam> = Object.fromEntries(FLUID_PARAMS.map((p) => [p.key, p]));

/** Apply one bridge value onto the live config singleton, converting types. */
export function applyFluidParam(config: Record<string, unknown>, key: string, value: unknown): void {
  const param = PARAM_BY_KEY[key];
  if (!param || value === undefined || value === null) return;
  if (param.type === 'color') {
    config[param.configKey] = hexToRgb(String(value));
  } else {
    config[param.configKey] = value;
  }
}

/** Read the live config back into a flat bridge-value record (for preset sync). */
export function readConfigToValues(config: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const param of FLUID_PARAMS) {
    const raw = config[param.configKey];
    if (raw === undefined) continue;
    out[param.key] =
      param.type === 'color' && raw && typeof raw === 'object'
        ? rgbToHex(raw as { r: number; g: number; b: number })
        : raw;
  }
  return out;
}
