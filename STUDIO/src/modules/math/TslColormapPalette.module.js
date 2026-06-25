// TslColormapPalette.module.js
// Universal colormap/gradient library: 18 named multi-stop gradients (Fire, Ice, Viridis, Aurora,
// Rainbow, Plasma, Temperature, ...) with both a CPU sampler (sampleGradient) and a GPU TSL sampler
// builder (createGradientSamplerTSL). Map any 0..1 scalar field — density, speed, temperature, audio
// energy — to color, on CPU or GPU.
//
// Ported faithfully from ref/AURORA/src/PARTICLESYSTEM/visuals/colorpalette.ts. TypeScript
// interfaces/annotations removed (untyped .module.js); gradient data + logic verbatim. Already
// method-chained TSL — no operator rewrite.

import { Fn, vec4, float, If, mix, clamp } from 'three/tsl';

/**
 * Preset color gradients. Each: { name, stops:[{position,color:[r,g,b],alpha}], mode, cyclic }.
 */
export const COLOR_GRADIENTS = {
  // === ELEMENTAL ===
  FIRE: {
    name: 'Fire',
    stops: [
      { position: 0.0, color: [0.1, 0.0, 0.0], alpha: 1.0 },
      { position: 0.3, color: [1.0, 0.0, 0.0], alpha: 1.0 },
      { position: 0.6, color: [1.0, 0.5, 0.0], alpha: 1.0 },
      { position: 1.0, color: [1.0, 1.0, 0.8], alpha: 0.9 },
    ],
    mode: 'RGB',
    cyclic: false,
  },
  ICE: {
    name: 'Ice',
    stops: [
      { position: 0.0, color: [0.0, 0.1, 0.3], alpha: 1.0 },
      { position: 0.5, color: [0.2, 0.5, 0.9], alpha: 1.0 },
      { position: 1.0, color: [0.8, 0.95, 1.0], alpha: 0.9 },
    ],
    mode: 'RGB',
    cyclic: false,
  },
  POISON: {
    name: 'Poison',
    stops: [
      { position: 0.0, color: [0.1, 0.2, 0.0], alpha: 1.0 },
      { position: 0.5, color: [0.3, 1.0, 0.2], alpha: 1.0 },
      { position: 1.0, color: [0.8, 1.0, 0.4], alpha: 0.8 },
    ],
    mode: 'RGB',
    cyclic: false,
  },
  ELECTRIC: {
    name: 'Electric',
    stops: [
      { position: 0.0, color: [0.0, 0.0, 0.2], alpha: 1.0 },
      { position: 0.4, color: [0.0, 0.5, 1.0], alpha: 1.0 },
      { position: 0.7, color: [0.5, 0.8, 1.0], alpha: 1.0 },
      { position: 1.0, color: [1.0, 1.0, 1.0], alpha: 0.9 },
    ],
    mode: 'RGB',
    cyclic: false,
  },
  // === NATURAL ===
  SUNSET: {
    name: 'Sunset',
    stops: [
      { position: 0.0, color: [0.1, 0.0, 0.2], alpha: 1.0 },
      { position: 0.3, color: [1.0, 0.2, 0.3], alpha: 1.0 },
      { position: 0.6, color: [1.0, 0.5, 0.0], alpha: 1.0 },
      { position: 1.0, color: [1.0, 0.9, 0.2], alpha: 1.0 },
    ],
    mode: 'RGB',
    cyclic: false,
  },
  OCEAN: {
    name: 'Ocean',
    stops: [
      { position: 0.0, color: [0.0, 0.1, 0.2], alpha: 1.0 },
      { position: 0.5, color: [0.0, 0.3, 0.6], alpha: 1.0 },
      { position: 1.0, color: [0.3, 0.7, 0.9], alpha: 0.85 },
    ],
    mode: 'RGB',
    cyclic: false,
  },
  LAVA: {
    name: 'Lava',
    stops: [
      { position: 0.0, color: [0.2, 0.0, 0.0], alpha: 1.0 },
      { position: 0.4, color: [1.0, 0.1, 0.0], alpha: 1.0 },
      { position: 0.7, color: [1.0, 0.5, 0.0], alpha: 1.0 },
      { position: 1.0, color: [1.0, 1.0, 0.5], alpha: 1.0 },
    ],
    mode: 'RGB',
    cyclic: false,
  },
  FOREST: {
    name: 'Forest',
    stops: [
      { position: 0.0, color: [0.05, 0.15, 0.05], alpha: 1.0 },
      { position: 0.4, color: [0.2, 0.5, 0.1], alpha: 1.0 },
      { position: 0.7, color: [0.4, 0.8, 0.2], alpha: 1.0 },
      { position: 1.0, color: [0.8, 1.0, 0.4], alpha: 1.0 },
    ],
    mode: 'RGB',
    cyclic: false,
  },
  // === SPECTRUM ===
  RAINBOW: {
    name: 'Rainbow',
    stops: [
      { position: 0.0, color: [1.0, 0.0, 0.0], alpha: 1.0 },
      { position: 0.17, color: [1.0, 0.5, 0.0], alpha: 1.0 },
      { position: 0.33, color: [1.0, 1.0, 0.0], alpha: 1.0 },
      { position: 0.5, color: [0.0, 1.0, 0.0], alpha: 1.0 },
      { position: 0.67, color: [0.0, 0.0, 1.0], alpha: 1.0 },
      { position: 0.83, color: [0.3, 0.0, 0.5], alpha: 1.0 },
      { position: 1.0, color: [0.5, 0.0, 1.0], alpha: 1.0 },
    ],
    mode: 'HSV',
    cyclic: true,
  },
  COOL_WARM: {
    name: 'Cool to Warm',
    stops: [
      { position: 0.0, color: [0.0, 0.2, 0.5], alpha: 1.0 },
      { position: 0.5, color: [0.5, 0.5, 0.5], alpha: 1.0 },
      { position: 1.0, color: [1.0, 0.3, 0.0], alpha: 1.0 },
    ],
    mode: 'RGB',
    cyclic: false,
  },
  // === MONOCHROME ===
  MONOCHROME: {
    name: 'Monochrome',
    stops: [
      { position: 0.0, color: [0.0, 0.0, 0.0], alpha: 1.0 },
      { position: 1.0, color: [1.0, 1.0, 1.0], alpha: 1.0 },
    ],
    mode: 'RGB',
    cyclic: false,
  },
  GRAYSCALE: {
    name: 'Grayscale',
    stops: [
      { position: 0.0, color: [0.1, 0.1, 0.1], alpha: 1.0 },
      { position: 0.3, color: [0.3, 0.3, 0.3], alpha: 1.0 },
      { position: 0.6, color: [0.6, 0.6, 0.6], alpha: 1.0 },
      { position: 1.0, color: [0.9, 0.9, 0.9], alpha: 1.0 },
    ],
    mode: 'RGB',
    cyclic: false,
  },
  // === SPECIAL ===
  NEON: {
    name: 'Neon',
    stops: [
      { position: 0.0, color: [1.0, 0.0, 1.0], alpha: 1.0 },
      { position: 0.5, color: [0.0, 1.0, 1.0], alpha: 1.0 },
      { position: 1.0, color: [1.0, 1.0, 0.0], alpha: 1.0 },
    ],
    mode: 'RGB',
    cyclic: true,
  },
  PLASMA: {
    name: 'Plasma',
    stops: [
      { position: 0.0, color: [0.05, 0.03, 0.53], alpha: 1.0 },
      { position: 0.3, color: [0.6, 0.0, 0.7], alpha: 1.0 },
      { position: 0.6, color: [1.0, 0.3, 0.3], alpha: 1.0 },
      { position: 1.0, color: [1.0, 0.9, 0.0], alpha: 1.0 },
    ],
    mode: 'RGB',
    cyclic: false,
  },
  AURORA: {
    name: 'Aurora',
    stops: [
      { position: 0.0, color: [0.0, 0.2, 0.3], alpha: 0.7 },
      { position: 0.3, color: [0.0, 0.8, 0.6], alpha: 0.9 },
      { position: 0.6, color: [0.3, 1.0, 0.3], alpha: 1.0 },
      { position: 0.8, color: [0.6, 0.3, 1.0], alpha: 0.9 },
      { position: 1.0, color: [1.0, 0.3, 0.8], alpha: 0.8 },
    ],
    mode: 'RGB',
    cyclic: false,
  },
  // === HEATMAP ===
  TEMPERATURE: {
    name: 'Temperature',
    stops: [
      { position: 0.0, color: [0.0, 0.0, 0.5], alpha: 1.0 },
      { position: 0.25, color: [0.0, 0.5, 1.0], alpha: 1.0 },
      { position: 0.5, color: [0.0, 1.0, 0.0], alpha: 1.0 },
      { position: 0.75, color: [1.0, 1.0, 0.0], alpha: 1.0 },
      { position: 1.0, color: [1.0, 0.0, 0.0], alpha: 1.0 },
    ],
    mode: 'RGB',
    cyclic: false,
  },
  VIRIDIS: {
    name: 'Viridis',
    stops: [
      { position: 0.0, color: [0.27, 0.0, 0.33], alpha: 1.0 },
      { position: 0.25, color: [0.23, 0.32, 0.55], alpha: 1.0 },
      { position: 0.5, color: [0.13, 0.57, 0.55], alpha: 1.0 },
      { position: 0.75, color: [0.37, 0.79, 0.38], alpha: 1.0 },
      { position: 1.0, color: [0.99, 0.91, 0.15], alpha: 1.0 },
    ],
    mode: 'RGB',
    cyclic: false,
  },
};

/**
 * Sample gradient at position t [0..1] on the CPU. Returns [r, g, b, a].
 */
export function sampleGradient(gradient, t) {
  let sampleT = gradient.cyclic ? t % 1.0 : Math.max(0, Math.min(1, t));
  if (sampleT < 0) sampleT += 1.0;

  let stop1 = gradient.stops[0];
  let stop2 = gradient.stops[gradient.stops.length - 1];

  for (let i = 0; i < gradient.stops.length - 1; i++) {
    if (sampleT >= gradient.stops[i].position && sampleT <= gradient.stops[i + 1].position) {
      stop1 = gradient.stops[i];
      stop2 = gradient.stops[i + 1];
      break;
    }
  }

  const range = stop2.position - stop1.position;
  const localT = range > 0 ? (sampleT - stop1.position) / range : 0;

  const r = stop1.color[0] + (stop2.color[0] - stop1.color[0]) * localT;
  const g = stop1.color[1] + (stop2.color[1] - stop1.color[1]) * localT;
  const b = stop1.color[2] + (stop2.color[2] - stop1.color[2]) * localT;
  const a = stop1.alpha + (stop2.alpha - stop1.alpha) * localT;

  return [r, g, b, a];
}

/**
 * Build a TSL Fn that samples `gradient` on the GPU: (t:float) -> vec4 (rgba).
 */
export function createGradientSamplerTSL(gradient) {
  const stopCount = gradient.stops.length;
  const positions = new Float32Array(stopCount);
  const colors = new Float32Array(stopCount * 4);

  gradient.stops.forEach((stop, i) => {
    positions[i] = stop.position;
    colors[i * 4 + 0] = stop.color[0];
    colors[i * 4 + 1] = stop.color[1];
    colors[i * 4 + 2] = stop.color[2];
    colors[i * 4 + 3] = stop.alpha;
  });

  return Fn(([t_input]) => {
    const t = float(t_input).toVar('t');

    if (gradient.cyclic) {
      t.assign(t.mod(1.0));
    } else {
      t.assign(clamp(t, 0, 1));
    }

    const result = vec4(0, 0, 0, 1).toVar('result');

    if (stopCount === 2) {
      const color1 = vec4(colors[0], colors[1], colors[2], colors[3]);
      const color2 = vec4(colors[4], colors[5], colors[6], colors[7]);
      result.assign(mix(color1, color2, t));
    } else {
      for (let i = 0; i < stopCount - 1; i++) {
        const pos1 = positions[i];
        const pos2 = positions[i + 1];
        const color1 = vec4(
          colors[i * 4 + 0],
          colors[i * 4 + 1],
          colors[i * 4 + 2],
          colors[i * 4 + 3],
        );
        const color2 = vec4(
          colors[(i + 1) * 4 + 0],
          colors[(i + 1) * 4 + 1],
          colors[(i + 1) * 4 + 2],
          colors[(i + 1) * 4 + 3],
        );

        If(t.greaterThanEqual(pos1).and(t.lessThanEqual(pos2)), () => {
          const localT = t.sub(pos1).div(pos2 - pos1);
          result.assign(mix(color1, color2, localT));
        });
      }
    }

    return result;
  }).setLayout({
    name: 'sampleGradient',
    type: 'vec4',
    inputs: [{ name: 't', type: 'float' }],
  });
}

/** Get list of all gradient keys. */
export function getGradientNames() {
  return Object.keys(COLOR_GRADIENTS);
}

/** Get gradient by key. */
export function getGradient(name) {
  return COLOR_GRADIENTS[name];
}

/** Create a custom gradient (stops auto-sorted by position). */
export function createCustomGradient(name, stops, mode = 'RGB', cyclic = false) {
  const sortedStops = [...stops].sort((a, b) => a.position - b.position);
  return { name, stops: sortedStops, mode, cyclic };
}
