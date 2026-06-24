/**
 * FluidSimPresets — project-specific curation for the fluid-sim Lab.
 *
 * The engine ships ~67 presets (engine/presets/PresetManager.js). This Lab
 * surfaces a curated subset in its control panel — the original's most
 * distinct, demo-worthy looks. Local to the Lab (not a canonical library
 * module); promote only if reused by another Lab.
 */

export const FLUID_SIM_LAB_PRESETS = [
  'aurora',
  'ember',
  'ink',
  'bassDrop',
  'zenGarden',
  'solarFlare',
  'deepSpace',
  'northernLights',
  'jazzSmoke',
  'crystalPrism',
  'moltenMetal',
  'frozenLake',
  'oceanStorm',
  'lava-flow',
  'underwater-currents',
  'smoke-plume',
  'liquid-metal-mirror',
  'sunset-over-water',
  'plasma-field',
  'vaporwave',
] as const;
