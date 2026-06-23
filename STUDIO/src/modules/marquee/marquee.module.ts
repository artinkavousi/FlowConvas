import type { ArtinosModule } from '../../registry/types';
import MarqueePreview from './MarqueePreview';

const marqueeModule: ArtinosModule = {
  id: 'marquee',
  name: 'Infinite Marquee',
  category: 'ui',
  description:
    'A seamless, GPU-friendly infinite marquee with edge fade, adjustable speed, direction, and gap. Use for logo strips, ticker tapes, and scrolling headlines.',
  tags: ['marquee', 'ticker', 'scroll', 'loop', 'infinite', 'animation', 'css'],
  schema: {
    id: 'marquee',
    name: 'Infinite Marquee',
    category: 'ui',
    parameters: [
      { key: 'speed', label: 'Loop Seconds', type: 'number', default: 18, min: 4, max: 60, step: 1, group: 'Motion' },
      { key: 'reverse', label: 'Reverse', type: 'boolean', default: false, group: 'Motion' },
      { key: 'gap', label: 'Gap', type: 'number', default: 48, min: 16, max: 120, step: 4, group: 'Layout' },
      { key: 'fontSize', label: 'Font Size', type: 'number', default: 40, min: 16, max: 80, step: 2, group: 'Layout' },
      { key: 'accent', label: 'Accent', type: 'color', default: '#2dd4bf', group: 'Appearance' },
    ],
  },
  preview: MarqueePreview,
  sourcePath: 'STUDIO/src/modules/marquee/MarqueePreview.tsx',
  dependencies: ['react'],
  usage:
    "// Pure CSS animation — duplicate the track and translateX(-50%) for a seamless loop.\n// Edge fade via mask-image linear-gradient.\n<Marquee speed={18} reverse={false} gap={48} accent=\"#2dd4bf\" />",
  presets: {
    Calm: { speed: 30, reverse: false, gap: 64, fontSize: 36, accent: '#60a5fa' },
    Fast: { speed: 8, reverse: false, gap: 40, fontSize: 44, accent: '#2dd4bf' },
    Reverse: { speed: 18, reverse: true, gap: 48, fontSize: 40, accent: '#e879f9' },
  },
  related: ['magnetic-dock'],
  agentNotes:
    'Pure CSS/React, no deps beyond react. Seamless loop = render the track twice and animate translateX 0 → -50%. Speed is seconds-per-loop (lower = faster); `reverse` flips animation-direction. Swap WORDS for logos/nodes. No 3D/WebGPU. Bridge id is "marquee".',
  reuseNotes: 'Logo walls, marketing tickers, and "trusted by" strips.',
  version: '0.1.0',
  updatedAt: '2026-06-23',
};

export default marqueeModule;
