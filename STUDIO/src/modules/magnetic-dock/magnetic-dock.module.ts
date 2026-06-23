import type { ArtinosModule } from '../../registry/types';
import MagneticDockPreview from './MagneticDockPreview';

const magneticDockModule: ArtinosModule = {
  id: 'magnetic-dock',
  name: 'Magnetic Dock',
  category: 'ui',
  description:
    'A macOS-style dock whose icons magnify and lift with a smooth Gaussian falloff as the cursor approaches. Use for app launchers, toolbars, or playful navigation.',
  tags: ['dock', 'magnetic', 'hover', 'navigation', 'macos', 'cursor', 'animation'],
  schema: {
    id: 'magnetic-dock',
    name: 'Magnetic Dock',
    category: 'ui',
    parameters: [
      { key: 'items', label: 'Items', type: 'number', default: 6, min: 3, max: 8, step: 1, group: 'Layout' },
      { key: 'baseSize', label: 'Base Size', type: 'number', default: 46, min: 32, max: 72, step: 2, group: 'Layout' },
      { key: 'magnify', label: 'Magnify', type: 'number', default: 1.8, min: 1, max: 2.6, step: 0.1, group: 'Magnetism' },
      { key: 'radius', label: 'Falloff Radius', type: 'number', default: 120, min: 40, max: 240, step: 10, group: 'Magnetism' },
      { key: 'accent', label: 'Accent', type: 'color', default: '#2dd4bf', group: 'Appearance' },
    ],
  },
  preview: MagneticDockPreview,
  sourcePath: 'STUDIO/src/modules/magnetic-dock/MagneticDockPreview.tsx',
  dependencies: ['react'],
  usage:
    "// Self-contained. Copy MagneticDockPreview.tsx and wire your own icons.\n// Falloff: scale = 1 + (magnify-1) * exp(-d^2 / (2*(radius/2)^2))\n<MagneticDock items={6} magnify={1.8} radius={120} accent=\"#2dd4bf\" />",
  presets: {
    Teal: { items: 6, baseSize: 46, magnify: 1.8, radius: 120, accent: '#2dd4bf' },
    Punchy: { items: 8, baseSize: 40, magnify: 2.4, radius: 90, accent: '#e879f9' },
    Subtle: { items: 5, baseSize: 52, magnify: 1.35, radius: 180, accent: '#60a5fa' },
  },
  related: ['elastic-menu', 'marquee'],
  agentNotes:
    'Pure React + pointer math, no deps beyond react. Icon scale uses a Gaussian of cursor distance to each icon center; tune via `magnify` (peak scale) and `radius` (falloff width). Replace the ICONS array with real icon nodes. No 3D/WebGPU. Bridge id is "magnetic-dock".',
  reuseNotes: 'Great for hero navs, app docks, and tool palettes where hover delight matters.',
  version: '0.1.0',
  updatedAt: '2026-06-23',
};

export default magneticDockModule;
