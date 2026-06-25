import type { ArtinosModule } from '../../registry/types';
import TslColormapPaletteShowcase from './TslColormapPalette.showcase';

const PALETTE_OPTIONS = [
  'FIRE', 'ICE', 'POISON', 'ELECTRIC', 'SUNSET', 'OCEAN', 'LAVA', 'FOREST',
  'RAINBOW', 'COOL_WARM', 'MONOCHROME', 'GRAYSCALE', 'NEON', 'PLASMA', 'AURORA',
  'TEMPERATURE', 'VIRIDIS',
].map((v) => ({ label: v, value: v }));

const tslColormapPaletteMeta: ArtinosModule = {
  id: 'tsl-colormap-palette',
  name: 'TSL Colormap Palette',
  category: 'math',
  description:
    'Colormap/gradient library: 17 named multi-stop gradients (Fire, Ice, Viridis, Aurora, Rainbow, Plasma, Temperature, …) with a CPU sampler (sampleGradient) and a GPU TSL sampler builder (createGradientSamplerTSL). Map any 0..1 scalar field — density, speed, temperature, audio energy — to color.',
  tags: ['math', 'color', 'gradient', 'colormap', 'palette', 'tsl', 'webgpu', 'three'],
  schema: {
    id: 'tsl-colormap-palette',
    name: 'TSL Colormap Palette',
    category: 'math',
    parameters: [
      { key: 'palette', label: 'Palette', type: 'enum', default: 'AURORA', options: PALETTE_OPTIONS, group: 'Colormap' },
    ],
  },
  preview: TslColormapPaletteShowcase,
  sourcePath: 'STUDIO/src/modules/math/TslColormapPalette.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createGradientSamplerTSL, getGradient, sampleGradient } from './modules/math/TslColormapPalette.module';\nimport { uv } from 'three/tsl';\n\n// GPU: color a 0..1 field\nconst sampler = createGradientSamplerTSL(getGradient('VIRIDIS'));\nmaterial.colorNode = sampler(myScalarField); // -> vec4 rgba\n// CPU: const [r,g,b,a] = sampleGradient(getGradient('FIRE'), 0.7);",
  presets: {
    Aurora: { palette: 'AURORA' },
    Viridis: { palette: 'VIRIDIS' },
    Fire: { palette: 'FIRE' },
    Temperature: { palette: 'TEMPERATURE' },
  },
  related: ['tsl-hsv', 'particle-renderer-system'],
  agentNotes:
    "Ported faithfully from ref/AURORA/src/PARTICLESYSTEM/visuals/colorpalette.ts (TS interfaces removed; gradient data + logic verbatim; already method-chained TSL). COLOR_GRADIENTS holds 17 gradients keyed by name; each gradient = { name, stops:[{position,color:[r,g,b],alpha}], mode:'RGB'|'HSV'|'LAB', cyclic }. createGradientSamplerTSL(gradient) returns a TSL Fn (t:float)->vec4 that linearly interpolates stops (2-stop fast path + unrolled multi-stop If chain; cyclic wraps t via mod, else clamps). sampleGradient(gradient, t) is the CPU equivalent ([r,g,b,a]). getGradientNames()/getGradient(name)/createCustomGradient(name, stops, mode, cyclic). NOTE: interpolation is always linear RGB even when mode==='HSV' (the source never implemented HSV-space interp) — preserved as-is. Bridge id 'tsl-colormap-palette'.",
  reuseNotes:
    'Reuse for any field→color mapping (particle density/speed, heatmaps, audio spectra). The CPU sampler is handy for building gradient textures or UI swatches. Pairs with tsl-hsv.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default tslColormapPaletteMeta;
