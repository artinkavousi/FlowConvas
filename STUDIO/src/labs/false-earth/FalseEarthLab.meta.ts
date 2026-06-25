import type { ArtinosModule } from '../../registry/types';
import FalseEarthLab from './FalseEarthLab';
import { falseEarthLabPresets } from './createFalseEarthLab';

const falseEarthLabMeta: ArtinosModule = {
  id: 'false-earth',
  name: 'False Earth',
  category: 'lab',
  description:
    'Mode B False Earth Lab capsule composed from canonical source-derived WebGPU/TSL modules: grass terrain, VAT rose lifecycle, cosmic beams/waves, and character navigation, with the False Earth post stack registered as a reusable companion module.',
  tags: ['lab', 'false-earth', 'webgpu', 'tsl', 'grass', 'terrain', 'vegetation', 'roses', 'cosmic', 'character', 'composition'],
  schema: {
    id: 'false-earth',
    name: 'False Earth',
    category: 'lab',
    parameters: [
      {
        key: 'preset',
        label: 'Preset',
        type: 'enum',
        default: 'source-world',
        options: [
          { label: 'Source World', value: 'source-world' },
          { label: 'Cinematic Meadow', value: 'cinematic-meadow' },
          { label: 'Storm Field', value: 'storm-field' },
        ],
        group: 'Preset',
      },
      { key: 'cosmicEnabled', label: 'Cosmic Beams', type: 'boolean', default: true, group: 'Layers' },
      { key: 'rosesEnabled', label: 'VAT Roses', type: 'boolean', default: true, group: 'Layers' },
      { key: 'characterEnabled', label: 'Character', type: 'boolean', default: true, group: 'Layers' },
      { key: 'characterRun', label: 'Run Loop', type: 'boolean', default: true, group: 'Character' },
      {
        key: 'cameraMode',
        label: 'Camera Mode',
        type: 'enum',
        default: 'follow',
        options: [
          { label: 'Follow', value: 'follow' },
          { label: 'FPV', value: 'fpv' },
          { label: 'Detached', value: 'detached' },
        ],
        group: 'Character',
      },
      { key: 'audioEnabled', label: 'Audio', type: 'boolean', default: false, group: 'Audio' },
      { key: 'audioVolume', label: 'Volume', type: 'number', default: 0.85, min: 0, max: 1.5, step: 0.01, group: 'Audio' },
      { key: 'starsEnabled', label: 'Stars', type: 'boolean', default: true, group: 'Sky' },
      { key: 'starIntensity', label: 'Star Intensity', type: 'number', default: 1, min: 0, max: 2, step: 0.01, group: 'Sky' },
      { key: 'bladesPerAxis', label: 'Blades Axis', type: 'number', default: 192, min: 48, max: 320, step: 8, group: 'Field' },
      { key: 'areaSize', label: 'Area Size', type: 'number', default: 30, min: 10, max: 56, step: 1, group: 'Field' },
      { key: 'amplitude', label: 'Terrain Amp', type: 'number', default: 1.35, min: 0, max: 4, step: 0.05, group: 'Terrain' },
      { key: 'frequency', label: 'Terrain Freq', type: 'number', default: 0.075, min: 0.01, max: 0.2, step: 0.005, group: 'Terrain' },
      { key: 'bladeHeightMax', label: 'Height Max', type: 'number', default: 1.45, min: 0.2, max: 3.5, step: 0.01, group: 'Blade' },
      { key: 'bendAmount', label: 'Bend', type: 'number', default: 0.34, min: 0, max: 1.2, step: 0.01, group: 'Blade' },
      { key: 'windStrength', label: 'Wind Strength', type: 'number', default: 0.55, min: 0, max: 2, step: 0.05, group: 'Wind' },
      { key: 'windSpeed', label: 'Wind Speed', type: 'number', default: 1.15, min: 0, max: 4, step: 0.05, group: 'Wind' },
      { key: 'windScale', label: 'Wind Scale', type: 'number', default: 0.18, min: 0.01, max: 0.5, step: 0.01, group: 'Wind' },
      { key: 'baseColor', label: 'Base Color', type: 'color', default: '#071511', group: 'Color' },
      { key: 'tipColor', label: 'Tip Color', type: 'color', default: '#4fbf7c', group: 'Color' },
      { key: 'rimColor', label: 'Rim Color', type: 'color', default: '#20e0c5', group: 'Color' },
      { key: 'roseCount', label: 'Rose Count', type: 'number', default: 380, min: 64, max: 900, step: 16, group: 'Roses' },
      { key: 'roseRadius', label: 'Rose Radius', type: 'number', default: 12, min: 4, max: 24, step: 0.5, group: 'Roses' },
      { key: 'characterScale', label: 'Character Scale', type: 'number', default: 0.95, min: 0.2, max: 2.5, step: 0.05, group: 'Character' },
      { key: 'cameraHeight', label: 'Camera Height', type: 'number', default: 10.5, min: 3, max: 22, step: 0.25, group: 'Camera' },
      { key: 'cameraDistance', label: 'Camera Distance', type: 'number', default: 19, min: 7, max: 42, step: 0.5, group: 'Camera' },
      { key: 'pixelRatio', label: 'Pixel Ratio', type: 'number', default: 1.5, min: 0.75, max: 2, step: 0.05, group: 'Render' },
    ],
  },
  preview: FalseEarthLab,
  sourcePath: 'STUDIO/src/labs/false-earth/createFalseEarthLab.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { createFalseEarthLab } from './labs/false-earth/createFalseEarthLab.js';\n\nconst lab = await createFalseEarthLab({ grass, roses, cosmic, character }, { preset: 'source-world' });\nlab.update({ windStrength: 0.8 });\nlab.resize();\nlab.dispose();",
  presets: falseEarthLabPresets as unknown as Record<string, Record<string, unknown>>,
  related: [
    'tsl-vegetation-math',
    'tsl-infinite-terrain-field',
    'tsl-indirect-draw-lod-router',
    'tsl-gpu-grass-field',
    'tsl-vat-lifecycle-instances',
    'tsl-cosmic-beam-waves',
    'third-person-character-navigation',
    'false-earth-post-stack',
  ],
  agentNotes:
    'Mode B Lab for https://github.com/momentchan/false-earth at commit 74cc91c. Runs from snapshot modules under labs/false-earth/modules for portability, sourced from canonical reusable modules for grass terrain, rose VAT lifecycle, cosmic beams/waves, astronaut navigation, vegetation math, structured buffers, indirect LOD, and post stack. Local code adds source-style star shell and audio ports for ambient grass/noise loops, footsteps, and beam-hit one-shots driven by the cosmic module event surface. The Lab uses layered WebGPU canvases so each snapshot keeps its renderer lifecycle; raw VAT mesh rendering is disabled in the Lab via renderVatMesh=false while the verified source-derived lifecycle proxy remains active. The original R3F/Rapier/global store shell is intentionally not copied into STUDIO. Bridge id is "false-earth".',
  reuseNotes:
    'Use this Lab as the runnable copy-pasteable composition capsule. Reuse the individual canonical modules from STUDIO/src/modules when a host needs one layer without the full world; refresh labs/false-earth/modules snapshots when canonical sources change.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-25',
};

export default falseEarthLabMeta;
