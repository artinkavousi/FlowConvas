import type { ArtinosModule } from '../../registry/types';
import SingularityTrianglePreloaderShowcase from './SingularityTrianglePreloader.showcase';

const singularityTrianglePreloaderMeta: ArtinosModule = {
  id: 'singularity-triangle-preloader',
  name: 'Singularity Triangle Preloader',
  category: 'ui',
  description:
    'React-owned canvas port of the Singularity preloader: animated starfield plus recursively tiled triangular glyph, adapted from the original global preloader into a reusable loading overlay.',
  tags: ['ui', 'canvas', 'preloader', 'loading', 'singularity', 'triangle', 'starfield'],
  schema: {
    id: 'singularity-triangle-preloader',
    name: 'Singularity Triangle Preloader',
    category: 'ui',
    parameters: [
      { key: 'active', label: 'Active', type: 'boolean', default: true, group: 'State' },
      { key: 'starCount', label: 'Stars', type: 'number', default: 100, min: 0, max: 240, step: 1, group: 'Stars' },
      { key: 'triangleCells', label: 'Triangle Cells', type: 'number', default: 9, min: 3, max: 16, step: 1, group: 'Glyph' },
      { key: 'accent', label: 'Accent', type: 'color', default: '#ffffff', group: 'Color' },
      { key: 'background', label: 'Background', type: 'color', default: '#000000', group: 'Color' },
      { key: 'speed', label: 'Speed', type: 'number', default: 1, min: 0.1, max: 3, step: 0.05, group: 'Motion' },
    ],
  },
  preview: SingularityTrianglePreloaderShowcase,
  sourcePath: 'STUDIO/src/modules/ui/SingularityTrianglePreloader.tsx',
  dependencies: ['react'],
  usage:
    "import { SingularityTrianglePreloader } from './modules/ui/SingularityTrianglePreloader';\n\n<SingularityTrianglePreloader active starCount={100} triangleCells={9} />",
  presets: {
    Source: { active: true, starCount: 100, triangleCells: 9, accent: '#ffffff', background: '#000000', speed: 1 },
    Dense: { active: true, starCount: 180, triangleCells: 11, accent: '#dbeafe', background: '#000000', speed: 1.2 },
  },
  related: ['singularity'],
  agentNotes:
    'Ported from MisterPrada/singularity `src/preloader.js`. The original used `window.preloader` and a full-screen canvas; this module keeps the starfield and triangle animation but is React-owned, canvas-scoped, and cleanup-safe. Bridge id is "singularity-triangle-preloader".',
  reuseNotes:
    'Use as a premium loading overlay for dark visual modules or Labs; it has no Three/WebGPU dependency.',
  validation: { build: false, preview: false, console: false },
  version: '0.1.0',
  updatedAt: '2026-06-25',
};

export default singularityTrianglePreloaderMeta;
