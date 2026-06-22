import type { ArtinosModule } from '../../registry/types';
import BubbleRatingPreview from './BubbleRatingPreview';

const bubbleRatingModule: ArtinosModule = {
  id: 'bubble-rating',
  name: 'Bubble Rating Slider',
  category: 'ui',
  description:
    'An emoticon satisfaction slider with a springy bubble that pops along the track. Use for feedback, ratings, and mood inputs.',
  tags: ['slider', 'rating', 'feedback', 'emoji', 'bubble', 'satisfaction', 'animation'],
  schema: {
    id: 'bubble-rating',
    name: 'Bubble Rating Slider',
    category: 'ui',
    parameters: [
      { key: 'color', label: 'Bubble Color', type: 'color', default: '#F59E0B', group: 'Appearance' },
    ],
  },
  preview: BubbleRatingPreview,
  sourcePath: 'PANELFLOW/src/components/BubbleRatingSlider.tsx',
  dependencies: ['@artinos/panelflow', 'framer-motion'],
  usage:
    "import { BubbleRatingSlider } from '@artinos/panelflow';\n\n<BubbleRatingSlider value={value} onChange={setValue} color=\"#F59E0B\" />",
  presets: {
    Amber: { color: '#F59E0B' },
    Teal: { color: '#2dd4bf' },
    Rose: { color: '#fb7185' },
  },
  related: ['gooey-slider', 'elastic-menu'],
  agentNotes:
    'Controlled component: pass `value` (0–100) + `onChange`. Style via `color`. Self-contained (framer-motion spring bubble + emoji track) — to reuse, copy BubbleRatingSlider.tsx and the `cn` util. No 3D/WebGPU. Bridge id is "bubble-rating".',
  reuseNotes: 'Use for CSAT/NPS-style feedback, mood pickers, and playful rating inputs.',
  version: '0.1.0',
  updatedAt: '2026-06-22',
};

export default bubbleRatingModule;
