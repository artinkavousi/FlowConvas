import type { ArtinosModule } from '../../../registry/types';
import MlsMpmSolverShowcase from './MlsMpmSolver.showcase';

const mlsMpmSolverMeta: ArtinosModule = {
  id: 'mls-mpm-solver',
  name: 'MLS-MPM Solver',
  category: 'physics/fluid',
  description:
    'The 3D MLS-MPM (Moving Least Squares Material Point Method) particle-fluid solver from AURORA — the heart of the sim. GPU compute kernels (clearGrid → p2g1 → p2g2 → updateGrid → [vorticity] → g2p) with FLIP/PIC blend, vorticity confinement, surface tension, sparse grid, adaptive-CFL timestep, pointer-ray force, 21 audio-reactive force modes, and velocity/density/material color. Reusable as a standalone 3D fluid/particle solver.',
  tags: ['physics', 'fluid', 'mls-mpm', 'mpm', 'particles', 'simulation', 'webgpu', 'tsl', 'three', 'gpgpu'],
  schema: {
    id: 'mls-mpm-solver',
    name: 'MLS-MPM Solver',
    category: 'physics/fluid',
    parameters: [
      { key: 'particleCount', label: 'Particles', type: 'number', default: 12000, min: 2000, max: 16384, step: 1000, group: 'Simulation' },
      { key: 'speed', label: 'Speed (dt)', type: 'number', default: 1.5, min: 0.1, max: 4, step: 0.1, group: 'Simulation' },
      { key: 'noise', label: 'Noise', type: 'number', default: 1.0, min: 0, max: 4, step: 0.1, group: 'Simulation' },
      { key: 'stiffness', label: 'Stiffness', type: 'number', default: 3.0, min: 0.5, max: 12, step: 0.1, group: 'Simulation' },
      { key: 'gravityType', label: 'Gravity (0 back/1 down/2 center)', type: 'number', default: 2, min: 0, max: 2, step: 1, group: 'Simulation' },
    ],
  },
  preview: MlsMpmSolverShowcase,
  sourcePath: 'STUDIO/src/modules/physics/fluid/MlsMpmSolver.module.js',
  dependencies: ['three', 'webgpu', 'react'],
  usage:
    "import { MlsMpmSolver } from './modules/physics/fluid/MlsMpmSolver.module';\n\nconst solver = new MlsMpmSolver(renderer, { maxParticles: 16384, gridSize: new THREE.Vector3(64,64,64) });\nawait solver.init();\n// optional: solver.setBoundaries(boundaries); solver.setMouseRay(o,d,hit);\n// per frame:\nawait solver.update(params, deltaTime, elapsed, audioData?);\n// render solver.particleBuffer.element(i).get('position') as instanced points (see particle-renderer-system).",
  presets: {
    'Anadol Center': { particleCount: 12000, speed: 1.5, noise: 1.0, stiffness: 3.0, gravityType: 2 },
    Splashy: { particleCount: 14000, speed: 2.5, noise: 2.0, stiffness: 2.0, gravityType: 1 },
    Viscous: { particleCount: 10000, speed: 1.0, noise: 0.4, stiffness: 6.0, gravityType: 2 },
  },
  related: ['tsl-structured-array', 'mpm-material-manager', 'particle-force-fields', 'particle-boundaries', 'particle-renderer-system'],
  agentNotes:
    "Ported faithfully from ref/AURORA/src/PARTICLESYSTEM/physic/mls-mpm.ts (transpiled with esbuild — types stripped, kernel math + ORDER verbatim). class MlsMpmSolver (alias of MlsMpmSimulator) + TransferMode {PIC:0,FLIP:1,HYBRID:2}. ctor(renderer, { maxParticles, gridSize=Vector3(64), fixedPointMultiplier=1e7 }); await init() builds kernels; update(params, dt, elapsed, audioData?) dispatches clearGrid→p2g1→p2g2→updateGrid→[calculateVorticity if params.vorticityEnabled]→g2p via renderer.computeAsync, sets numParticles + kernel dispatch counts on change, and clamps dt by CFL when params.adaptiveTimestep. params = { numParticles, dt, noise, stiffness, restDensity, dynamicViscosity, gravityType(0 back/1 down/2 center/3 device), gravity:Vector3, mouseRay{Origin,Direction,Force}:Vector3, transferMode, flipRatio, vorticity{Enabled,Epsilon}, surfaceTension{Enabled,Coeff}, sparseGrid, adaptiveTimestep, cflTarget }. restDensity = 0.25*max(count/8192,1)*density. Color modes via setColorMode(0 vel/1 density/3 material). Audio via setAudioEnabled/setAudioMode(0-20)/updateAudioUniforms. Boundary collision in g2p fires ONLY if setBoundaries(b) was called (guard) — so it runs standalone. Particles live in gridSize space (0..64); render scaled by 1/64 with x offset -0.5 (see showcase / AURORA pointrenderer). StructuredArray labels are WGSL-safe (r0.185 ADR-A10). Needs particle-renderer-system to be seen in full; the showcase ships a minimal point render. Bridge id 'mls-mpm-solver'. WebGPU-only, heavy — one instance.",
  reuseNotes:
    'The reusable 3D MLS-MPM core. Compose with particle-boundaries (containers), particle-force-fields (steering), mpm-material-manager (material color/stress), particle-renderer-system (mesh/point/sprite/trail), pointer-raycast-force (mouse), and the audio modules — exactly how the AURORA Lab wires it.',
  validation: { build: true, preview: true, console: true },
  version: '0.1.0',
  updatedAt: '2026-06-29',
};

export default mlsMpmSolverMeta;
