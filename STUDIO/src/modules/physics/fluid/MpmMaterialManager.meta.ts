import type { ArtinosModule } from '../../../registry/types';
import MpmMaterialManagerShowcase from './MpmMaterialManager.showcase';

const MATERIAL_OPTIONS = [
  'WATER', 'OIL', 'HONEY', 'SAND', 'SNOW', 'RUBBER', 'JELLY', 'FOAM', 'LAVA', 'PLASMA', 'METAL',
].map((v) => ({ label: v, value: v }));

const mpmMaterialManagerMeta: ArtinosModule = {
  id: 'mpm-material-manager',
  name: 'MPM Material Manager',
  category: 'physics/fluid',
  description:
    'Multi-material model for MPM / particle fluids: 8 material types and 11 named presets (Water, Honey, Lava, Metal, …) with physical/thermal/visual properties, plus GPU (TSL) lookups for per-material stiffness, viscosity, constitutive stress tensor, and base color. Makes particles materially distinct in any MPM solver.',
  tags: ['physics', 'fluid', 'mpm', 'material', 'tsl', 'webgpu', 'three', 'constitutive'],
  schema: {
    id: 'mpm-material-manager',
    name: 'MPM Material Manager',
    category: 'physics/fluid',
    parameters: [
      { key: 'material', label: 'Material', type: 'enum', default: 'WATER', options: MATERIAL_OPTIONS, group: 'Material' },
    ],
  },
  preview: MpmMaterialManagerShowcase,
  sourcePath: 'STUDIO/src/modules/physics/fluid/MpmMaterialManager.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { MaterialType, getMaterialColor, calculateMaterialStress, getMaterialStiffness } from './modules/physics/fluid/MpmMaterialManager.module';\n\n// in an MPM g2p/p2g kernel:\nconst stress = calculateMaterialStress(materialType, pressure, strain, density, restDensity);\nconst color = getMaterialColor(materialType); // vec3\n// CPU: new MaterialManager().getMaterial('LAVA')",
  presets: {
    Water: { material: 'WATER' },
    Lava: { material: 'LAVA' },
    Honey: { material: 'HONEY' },
    Metal: { material: 'METAL' },
    Plasma: { material: 'PLASMA' },
  },
  related: ['mls-mpm-solver', 'tsl-structured-array', 'particle-renderer-system'],
  agentNotes:
    "Ported faithfully from ref/AURORA/src/PARTICLESYSTEM/physic/materials.ts (TS enum→frozen object MaterialType; interfaces dropped; logic+presets verbatim; method-chained TSL, no operator rewrite). Exports: MaterialType {FLUID..PLASMA = 0..7}; MATERIAL_PRESETS (11 presets, each with density/stiffness/viscosity/friction/cohesion/elasticity/plasticity/compressibility/surfaceTension/thermal/baseColor/metalness/roughness/emissive); TSL Fns getMaterialStiffness(int)->float, getMaterialViscosity(int)->float, calculateMaterialStress(materialType:int, pressure:float, strain:mat3, density:float, restDensity:float)->mat3 (per-material constitutive model; SAND clamps tension, FOAM weakens), getMaterialColor(int)->vec3; class MaterialManager (CPU registry + getMaterialPropertiesArray() packing 8 floats/material by type index). The MLS-MPM solver imports MaterialType + getMaterialColor + calculateMaterialStress. Bridge id 'mpm-material-manager'.",
  reuseNotes:
    'Reuse in any MPM/particle solver needing material variety. The CPU MaterialManager + MATERIAL_PRESETS also feed UI/material pickers. Pairs with mls-mpm-solver (its primary consumer).',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-24',
};

export default mpmMaterialManagerMeta;
