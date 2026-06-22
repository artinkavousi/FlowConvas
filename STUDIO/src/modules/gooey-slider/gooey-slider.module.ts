import type { ArtinosModule } from '../../registry/types';
import GooeySliderPreview from './GooeySliderPreview';

const gooeySliderModule: ArtinosModule = {
  id: 'gooey-slider',
  name: 'Gooey Slider',
  category: 'ui',
  description:
    'An SVG gooey-filter slider with a sticky, liquid blob that elastically trails the thumb. Use for playful, tactile range inputs.',
  tags: ['slider', 'range', 'input', 'svg', 'gooey', 'liquid', 'animation'],
  schema: {
    id: 'gooey-slider',
    name: 'Gooey Slider',
    category: 'ui',
    parameters: [
      { key: 'color', label: 'Blob Color', type: 'color', default: '#2dd4bf', group: 'Appearance' },
      { key: 'textColor', label: 'Text Color', type: 'color', default: '#0c0c0c', group: 'Appearance' },
      { key: 'max', label: 'Max', type: 'number', default: 100, min: 10, max: 1000, step: 10, group: 'Range' },
      { key: 'step', label: 'Step', type: 'number', default: 1, min: 1, max: 50, step: 1, group: 'Range' },
    ],
  },
  preview: GooeySliderPreview,
  sourcePath: 'PANELFLOW/src/components/GooeySlider.tsx',
  dependencies: ['@artinos/panelflow', 'framer-motion'],
  usage:
    "import { GooeySlider } from '@artinos/panelflow';\n\n<GooeySlider value={value} onChange={setValue} min={0} max={100} color=\"#2dd4bf\" />",
  presets: {
    Teal: { color: '#2dd4bf', textColor: '#0c0c0c', max: 100, step: 1 },
    Magenta: { color: '#e879f9', textColor: '#0c0c0c', max: 100, step: 1 },
    Coarse: { color: '#2dd4bf', textColor: '#0c0c0c', max: 1000, step: 50 },
  },
  related: ['bubble-rating', 'elastic-menu'],
  agentNotes:
    'Controlled component: pass `value` + `onChange`. Visual/config props: `color`, `textColor`, `min`, `max`, `step`. Self-contained (SVG gooey filter + framer-motion spring) — to reuse, copy GooeySlider.tsx and the `cn` util. No 3D/WebGPU. Bridge id is "gooey-slider".',
  reuseNotes: 'Good for settings panels, volume/audio controls, and any tactile range input.',
  version: '0.1.0',
  updatedAt: '2026-06-22',
};

export default gooeySliderModule;
