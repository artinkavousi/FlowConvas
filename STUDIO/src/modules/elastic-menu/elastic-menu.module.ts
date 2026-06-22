import type { ArtinosModule } from '../../registry/types';
import ElasticMenuPreview from './ElasticMenuPreview';

const elasticMenuModule: ArtinosModule = {
  id: 'elastic-menu',
  name: 'Elastic Menu',
  category: 'ui',
  description:
    'A physics-driven liquid radial menu of emoji icons that swell and snap as you drag across them. Use for expressive pickers and reaction bars.',
  tags: ['menu', 'radial', 'liquid', 'elastic', 'emoji', 'gooey', 'physics', 'animation'],
  schema: {
    id: 'elastic-menu',
    name: 'Elastic Menu',
    category: 'ui',
    parameters: [
      { key: 'uiColor', label: 'UI Color', type: 'color', default: '#FF5EAE', group: 'Appearance' },
    ],
  },
  preview: ElasticMenuPreview,
  sourcePath: 'PANELFLOW/src/components/ElasticMenu.tsx',
  dependencies: ['@artinos/panelflow', 'framer-motion'],
  usage: "import { ElasticMenu } from '@artinos/panelflow';\n\n<ElasticMenu uiColor=\"#FF5EAE\" />",
  presets: {
    Pink: { uiColor: '#FF5EAE' },
    Teal: { uiColor: '#2dd4bf' },
    Violet: { uiColor: '#a78bfa' },
  },
  related: ['gooey-slider', 'bubble-rating'],
  agentNotes:
    'Self-contained physics radial menu. Style via `uiColor`. Drag across the dots to swell/snap the emoji icons (selection is internal — no value prop). framer-motion springs; no 3D/WebGPU. Bridge id is "elastic-menu".',
  reuseNotes: 'Use for reaction bars, emoji/mood pickers, and expressive tool menus.',
  version: '0.1.0',
  updatedAt: '2026-06-22',
};

export default elasticMenuModule;
