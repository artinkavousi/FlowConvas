import type { ArtinosModule } from '../../registry/types';
import TslSplineColorRampShowcase from './TslSplineColorRamp.showcase';

const tslSplineColorRampMeta: ArtinosModule = {
  id: 'tsl-spline-color-ramp',
  name: 'TSL Spline Color Ramp',
  category: 'math',
  description:
    'Reusable TSL color-ramp primitives extracted from Singularity: Catmull-Rom/B-spline ramp interpolation, linear ramp fallback, sRGB conversion, white-noise jitter, smooth range remapping, and vector length helpers for volumetric shaders.',
  tags: ['math', 'tsl', 'color', 'ramp', 'bspline', 'webgpu', 'three', 'shader'],
  schema: {
    id: 'tsl-spline-color-ramp',
    name: 'TSL Spline Color Ramp',
    category: 'math',
    parameters: [
      {
        key: 'mode',
        label: 'Mode',
        type: 'enum',
        default: 'bspline',
        options: [
          { label: 'B-Spline', value: 'bspline' },
          { label: 'Linear', value: 'linear' },
          { label: 'Rainbow', value: 'rainbow' },
        ],
        group: 'Preview',
      },
    ],
  },
  preview: TslSplineColorRampShowcase,
  sourcePath: 'STUDIO/src/modules/math/TslSplineColorRamp.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { colorRamp3BSpline } from './modules/math/TslSplineColorRamp.module.js';\nimport { color, float, vec4 } from 'three/tsl';\n\nconst ramp = colorRamp3BSpline(t, vec4(color(1, 0.7, 0.4), float(0.05)), vec4(color(0.14, 0.05, 0.03), float(0.42)), vec4(color(0, 0, 0), float(1)));",
  presets: {
    'B-Spline': { mode: 'bspline' },
    Linear: { mode: 'linear' },
    Rainbow: { mode: 'rainbow' },
  },
  related: ['tsl-colormap-palette', 'tsl-hsv', 'singularity-black-hole-material'],
  agentNotes:
    'Ported from MisterPrada/singularity commit 51313b398583a84c9347470ce4b575e05739e302, source `src/Experience/Utils/TSL-utils.js`. Exports reusable TSL Fns used by the black-hole volume material: colorRamp3BSpline/colorRamp4BSpline, srgbToLinear/linearToSrgb, whiteNoise2D, lengthSqrt, smoothRange, rotateAxis. Bridge id is "tsl-spline-color-ramp"; showcase demonstrates the ramp outside the Singularity shader.',
  reuseNotes:
    'Use for volumetric/fire/nebula/cloud shaders that need non-linear artist-authored ramp colors without adopting the full Singularity material.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-25',
};

export default tslSplineColorRampMeta;
