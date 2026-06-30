// MlsMpmSolver.module.js
// 3D MLS-MPM (Moving Least Squares Material Point Method) particle-fluid solver — the heart of AURORA.
// GPU compute kernels (clearGrid -> p2g1 -> p2g2 -> updateGrid -> [calculateVorticity] -> g2p) with
// FLIP/PIC blend, vorticity confinement, surface tension, sparse grid, adaptive-CFL timestep, a pointer
// ray force, 21 audio-reactive force modes, and velocity/density/material color modes. Reusable as a
// standalone 3D fluid/particle solver in any WebGPU scene.
//
// Ported faithfully from ref/AURORA/src/PARTICLESYSTEM/physic/mls-mpm.ts (transpiled with esbuild: types
// stripped, kernel math + order VERBATIM). Changes: imports rewired to the ported ARTINOS modules
// (TslNoise/TslHsv/TslStructuredArray/MpmMaterialManager); dead source imports (calculateForceFieldForce,
// calculateMaterialStress) were already unused and dropped; class exported as both MlsMpmSimulator and
// MlsMpmSolver. Already method-chained TSL — no operator rewrite. Optional boundary collision fires only
// when setBoundaries() is called (g2p guards `if (this.boundaries)`). Struct labels are WGSL-safe.
import * as THREE from "three/webgpu";
import {
  array,
  Fn,
  If,
  instancedArray,
  instanceIndex,
  Return,
  uniform,
  int,
  float,
  Loop,
  vec3,
  vec4,
  atomicAdd,
  uint,
  max,
  pow,
  mat3,
  time,
  cross,
  mix,
  ivec3,
  sin,
  cos,
  length,
  smoothstep,
  normalize,
  floor,
  atan
} from "three/tsl";
import { triNoise3Dvec, triNoise3D } from "../../math/TslNoise.module";
import { hsvtorgb } from "../../math/TslHsv.module";
import { StructuredArray } from "../../webgpu/TslStructuredArray.module";
import { MaterialType, getMaterialColor } from "./MpmMaterialManager.module";
var TransferMode = /* @__PURE__ */ ((TransferMode2) => {
  TransferMode2[TransferMode2["PIC"] = 0] = "PIC";
  TransferMode2[TransferMode2["FLIP"] = 1] = "FLIP";
  TransferMode2[TransferMode2["HYBRID"] = 2] = "HYBRID";
  return TransferMode2;
})(TransferMode || {});
class MlsMpmSimulator {
  particleBuffer;
  gridSize;
  renderer;
  cellBuffer;
  cellBufferF;
  vorticityBuffer;
  // Vorticity field (curl of velocity)
  neighborDensityBuffer;
  // Neighbor density for surface detection
  activeCellBuffer;
  // Sparse grid: marks active cells (1=active, 0=empty)
  uniforms = {};
  kernels = {};
  fixedPointMultiplier;
  cellCount;
  maxParticles;
  mousePos = new THREE.Vector3();
  mousePosArray = [];
  numParticles = 0;
  boundaries = null;
  constructor(renderer, config) {
    this.renderer = renderer;
    this.gridSize = config.gridSize || new THREE.Vector3(64, 64, 64);
    this.fixedPointMultiplier = config.fixedPointMultiplier || 1e7;
    this.cellCount = this.gridSize.x * this.gridSize.y * this.gridSize.z;
    this.maxParticles = config.maxParticles;
    const particleStruct = {
      position: { type: "vec3" },
      density: { type: "float" },
      velocity: { type: "vec3" },
      mass: { type: "float" },
      C: { type: "mat3" },
      direction: { type: "vec3" },
      color: { type: "vec3" },
      materialType: { type: "int" },
      age: { type: "float" },
      lifetime: { type: "float" }
    };
    this.particleBuffer = new StructuredArray(particleStruct, config.maxParticles, "particleData");
    const vec = new THREE.Vector3();
    for (let i = 0; i < config.maxParticles; i++) {
      let dist = 2;
      while (dist > 1) {
        vec.set(Math.random(), Math.random(), Math.random()).multiplyScalar(2).subScalar(1);
        dist = vec.length();
      }
      vec.multiplyScalar(0.8).addScalar(1).divideScalar(2).multiply(this.gridSize);
      const mass = 1 - Math.random() * 2e-3;
      this.particleBuffer.set(i, "position", vec);
      this.particleBuffer.set(i, "mass", mass);
      this.particleBuffer.set(i, "materialType", MaterialType.FLUID);
      this.particleBuffer.set(i, "age", 0);
      this.particleBuffer.set(i, "lifetime", 999999);
    }
    const cellStruct = {
      x: { type: "int", atomic: true },
      y: { type: "int", atomic: true },
      z: { type: "int", atomic: true },
      mass: { type: "int", atomic: true }
    };
    this.cellBuffer = new StructuredArray(cellStruct, this.cellCount, "cellData");
    this.cellBufferF = instancedArray(this.cellCount, "vec4").label("cellDataF");
    this.vorticityBuffer = instancedArray(this.cellCount, "vec3").label("vorticityData");
    this.neighborDensityBuffer = instancedArray(this.maxParticles, "vec4").label("neighborDensity");
    this.activeCellBuffer = instancedArray(this.cellCount, "int").label("activeCells");
    this.initUniforms();
  }
  initUniforms() {
    this.uniforms.gravityType = uniform(0, "uint");
    this.uniforms.gravity = uniform(new THREE.Vector3());
    this.uniforms.stiffness = uniform(0);
    this.uniforms.restDensity = uniform(0);
    this.uniforms.dynamicViscosity = uniform(0);
    this.uniforms.noise = uniform(0);
    this.uniforms.gridSize = uniform(this.gridSize, "ivec3");
    this.uniforms.dt = uniform(0.1);
    this.uniforms.numParticles = uniform(0, "uint");
    this.uniforms.mouseRayDirection = uniform(new THREE.Vector3());
    this.uniforms.mouseRayOrigin = uniform(new THREE.Vector3());
    this.uniforms.mouseForce = uniform(new THREE.Vector3());
    this.uniforms.transferMode = uniform(2 /* HYBRID */, "int");
    this.uniforms.flipRatio = uniform(0.95);
    this.uniforms.vorticityEnabled = uniform(0, "int");
    this.uniforms.vorticityEpsilon = uniform(0);
    this.uniforms.surfaceTensionEnabled = uniform(0, "int");
    this.uniforms.surfaceTensionCoeff = uniform(0.5);
    this.uniforms.sparseGrid = uniform(1, "int");
    this.uniforms.fieldCount = uniform(0, "int");
    this.uniforms.fieldTypes = uniform(new Int32Array(8));
    this.uniforms.fieldPositions = uniform(new Float32Array(8 * 3));
    this.uniforms.fieldDirections = uniform(new Float32Array(8 * 3));
    this.uniforms.fieldAxes = uniform(new Float32Array(8 * 3));
    this.uniforms.fieldStrengths = uniform(new Float32Array(8));
    this.uniforms.fieldRadii = uniform(new Float32Array(8));
    this.uniforms.fieldFalloffs = uniform(new Int32Array(8));
    this.uniforms.fieldTurbScales = uniform(new Float32Array(8));
    this.uniforms.fieldNoiseSpeeds = uniform(new Float32Array(8));
    this.uniforms.audioEnabled = uniform(0, "int");
    this.uniforms.audioMode = uniform(0, "int");
    this.uniforms.audioSmoothBass = uniform(0);
    this.uniforms.audioSmoothMid = uniform(0);
    this.uniforms.audioSmoothTreble = uniform(0);
    this.uniforms.audioSmoothOverall = uniform(0);
    this.uniforms.audioBeatIntensity = uniform(0);
    this.uniforms.audioTempoPhase = uniform(0);
    this.uniforms.audioTempo = uniform(120);
    this.uniforms.audioPeakFrequency = uniform(0);
    this.uniforms.audioHarmonicEnergy = uniform(0);
    this.uniforms.audioRhythmConfidence = uniform(0);
    this.uniforms.audioBassInfluence = uniform(1);
    this.uniforms.audioMidInfluence = uniform(0.8);
    this.uniforms.audioTrebleInfluence = uniform(0.6);
    this.uniforms.audioResponsiveness = uniform(0.7);
    this.uniforms.audioBeatImpulse = uniform(50);
    this.uniforms.colorMode = uniform(0, "int");
    this.uniforms.boundaryEnabled = uniform(0, "int");
    this.uniforms.boundaryShape = uniform(0, "int");
    this.uniforms.boundaryWallMin = uniform(new THREE.Vector3(3, 3, 3));
    this.uniforms.boundaryWallMax = uniform(this.gridSize.clone().subScalar(3));
    this.uniforms.boundaryWallStiffness = uniform(0.3);
    this.uniforms.boundaryCenter = uniform(this.gridSize.clone().multiplyScalar(0.5));
    this.uniforms.boundaryRadius = uniform(Math.min(this.gridSize.x, this.gridSize.y, this.gridSize.z) / 2 - 3);
    this.uniforms.boundaryViewportPulse = uniform(0);
    this.uniforms.distributionMode = uniform(0, "int");
    this.uniforms.surfaceDistance = uniform(1);
    this.uniforms.flowSpeed = uniform(0.5);
  }
  /**
   * Initialize compute kernels
   */
  async init() {
    const encodeFixedPoint = (f32) => int(f32.mul(this.fixedPointMultiplier));
    const decodeFixedPoint = (i32) => float(i32).div(this.fixedPointMultiplier);
    const getCellPtr = (ipos) => {
      const gridSize = this.uniforms.gridSize;
      return int(ipos.x).mul(gridSize.y).mul(gridSize.z).add(int(ipos.y).mul(gridSize.z)).add(int(ipos.z)).toConst();
    };
    const getCell = (ipos) => this.cellBuffer.element(getCellPtr(ipos));
    this.kernels.clearGrid = Fn(() => {
      this.cellBuffer.setAtomic("x", false);
      this.cellBuffer.setAtomic("y", false);
      this.cellBuffer.setAtomic("z", false);
      this.cellBuffer.setAtomic("mass", false);
      If(instanceIndex.greaterThanEqual(uint(this.cellCount)), () => {
        Return();
      });
      this.cellBuffer.element(instanceIndex).get("x").assign(0);
      this.cellBuffer.element(instanceIndex).get("y").assign(0);
      this.cellBuffer.element(instanceIndex).get("z").assign(0);
      this.cellBuffer.element(instanceIndex).get("mass").assign(0);
      this.cellBufferF.element(instanceIndex).assign(0);
      this.activeCellBuffer.element(instanceIndex).assign(int(0));
    })().compute(this.cellCount);
    this.kernels.p2g1 = Fn(() => {
      this.cellBuffer.setAtomic("x", true);
      this.cellBuffer.setAtomic("y", true);
      this.cellBuffer.setAtomic("z", true);
      this.cellBuffer.setAtomic("mass", true);
      If(instanceIndex.greaterThanEqual(uint(this.uniforms.numParticles)), () => {
        Return();
      });
      const particlePosition = this.particleBuffer.element(instanceIndex).get("position").xyz.toConst("particlePosition");
      const particleVelocity = this.particleBuffer.element(instanceIndex).get("velocity").xyz.toConst("particleVelocity");
      const cellIndex = ivec3(particlePosition).sub(1).toConst("cellIndex");
      const cellDiff = particlePosition.fract().sub(0.5).toConst("cellDiff");
      const w0 = float(0.5).mul(float(0.5).sub(cellDiff)).mul(float(0.5).sub(cellDiff));
      const w1 = float(0.75).sub(cellDiff.mul(cellDiff));
      const w2 = float(0.5).mul(float(0.5).add(cellDiff)).mul(float(0.5).add(cellDiff));
      const weights = array([w0, w1, w2]).toConst("weights");
      const C = this.particleBuffer.element(instanceIndex).get("C").toConst();
      Loop({ start: 0, end: 3, type: "int", name: "gx", condition: "<" }, ({ gx }) => {
        Loop({ start: 0, end: 3, type: "int", name: "gy", condition: "<" }, ({ gy }) => {
          Loop({ start: 0, end: 3, type: "int", name: "gz", condition: "<" }, ({ gz }) => {
            const weight = weights.element(gx).x.mul(weights.element(gy).y).mul(weights.element(gz).z);
            const cellX = cellIndex.add(ivec3(gx, gy, gz)).toConst();
            const cellDist = vec3(cellX).add(0.5).sub(particlePosition).toConst("cellDist");
            const Q = C.mul(cellDist);
            const massContrib = weight;
            const velContrib = massContrib.mul(particleVelocity.add(Q)).toConst("velContrib");
            const cell = getCell(cellX);
            atomicAdd(cell.get("x"), encodeFixedPoint(velContrib.x));
            atomicAdd(cell.get("y"), encodeFixedPoint(velContrib.y));
            atomicAdd(cell.get("z"), encodeFixedPoint(velContrib.z));
            atomicAdd(cell.get("mass"), encodeFixedPoint(massContrib));
            this.activeCellBuffer.element(getCellPtr(cellX)).assign(int(1));
          });
        });
      });
    })().compute(1);
    this.kernels.p2g2 = Fn(() => {
      this.cellBuffer.setAtomic("x", true);
      this.cellBuffer.setAtomic("y", true);
      this.cellBuffer.setAtomic("z", true);
      this.cellBuffer.setAtomic("mass", false);
      If(instanceIndex.greaterThanEqual(uint(this.uniforms.numParticles)), () => {
        Return();
      });
      const particlePosition = this.particleBuffer.element(instanceIndex).get("position").xyz.toConst("particlePosition");
      const cellIndex = ivec3(particlePosition).sub(1).toConst("cellIndex");
      const cellDiff = particlePosition.fract().sub(0.5).toConst("cellDiff");
      const w0 = float(0.5).mul(float(0.5).sub(cellDiff)).mul(float(0.5).sub(cellDiff));
      const w1 = float(0.75).sub(cellDiff.mul(cellDiff));
      const w2 = float(0.5).mul(float(0.5).add(cellDiff)).mul(float(0.5).add(cellDiff));
      const weights = array([w0, w1, w2]).toConst("weights");
      const density = float(0).toVar("density");
      Loop({ start: 0, end: 3, type: "int", name: "gx", condition: "<" }, ({ gx }) => {
        Loop({ start: 0, end: 3, type: "int", name: "gy", condition: "<" }, ({ gy }) => {
          Loop({ start: 0, end: 3, type: "int", name: "gz", condition: "<" }, ({ gz }) => {
            const weight = weights.element(gx).x.mul(weights.element(gy).y).mul(weights.element(gz).z);
            const cellX = cellIndex.add(ivec3(gx, gy, gz)).toConst();
            const cell = getCell(cellX);
            density.addAssign(decodeFixedPoint(cell.get("mass")).mul(weight));
          });
        });
      });
      const densityStore = this.particleBuffer.element(instanceIndex).get("density");
      densityStore.assign(mix(densityStore, density, 0.05));
      const volume = float(1).div(density);
      const pressure = max(0, pow(density.div(this.uniforms.restDensity), 5).sub(1).mul(this.uniforms.stiffness)).toConst("pressure");
      const stress = mat3(pressure.negate(), 0, 0, 0, pressure.negate(), 0, 0, 0, pressure.negate()).toVar("stress");
      const dudv = this.particleBuffer.element(instanceIndex).get("C").toConst("C");
      const strain = dudv.add(dudv.transpose());
      stress.addAssign(strain.mul(this.uniforms.dynamicViscosity));
      const eq16Term0 = volume.mul(-4).mul(stress).mul(this.uniforms.dt);
      Loop({ start: 0, end: 3, type: "int", name: "gx", condition: "<" }, ({ gx }) => {
        Loop({ start: 0, end: 3, type: "int", name: "gy", condition: "<" }, ({ gy }) => {
          Loop({ start: 0, end: 3, type: "int", name: "gz", condition: "<" }, ({ gz }) => {
            const weight = weights.element(gx).x.mul(weights.element(gy).y).mul(weights.element(gz).z);
            const cellX = cellIndex.add(ivec3(gx, gy, gz)).toConst();
            const cellDist = vec3(cellX).add(0.5).sub(particlePosition).toConst("cellDist");
            const cell = getCell(cellX);
            const momentum = eq16Term0.mul(weight).mul(cellDist).toConst("momentum");
            atomicAdd(cell.get("x"), encodeFixedPoint(momentum.x));
            atomicAdd(cell.get("y"), encodeFixedPoint(momentum.y));
            atomicAdd(cell.get("z"), encodeFixedPoint(momentum.z));
          });
        });
      });
    })().compute(1);
    this.kernels.updateGrid = Fn(() => {
      this.cellBuffer.setAtomic("x", false);
      this.cellBuffer.setAtomic("y", false);
      this.cellBuffer.setAtomic("z", false);
      this.cellBuffer.setAtomic("mass", false);
      If(instanceIndex.greaterThanEqual(uint(this.cellCount)), () => {
        Return();
      });
      If(this.uniforms.sparseGrid.equal(int(1)), () => {
        const isActive = this.activeCellBuffer.element(instanceIndex).toConst("isActive");
        If(isActive.equal(int(0)), () => {
          Return();
        });
      });
      const cell = this.cellBuffer.element(instanceIndex).toConst("cell");
      const mass = decodeFixedPoint(cell.get("mass")).toConst();
      If(mass.lessThanEqual(0), () => {
        Return();
      });
      const vx = decodeFixedPoint(cell.get("x")).div(mass).toVar();
      const vy = decodeFixedPoint(cell.get("y")).div(mass).toVar();
      const vz = decodeFixedPoint(cell.get("z")).div(mass).toVar();
      this.cellBufferF.element(instanceIndex).assign(vec4(vx, vy, vz, mass));
    })().compute(this.cellCount);
    this.kernels.calculateVorticity = Fn(() => {
      If(instanceIndex.greaterThanEqual(uint(this.cellCount)), () => {
        Return();
      });
      const gz = instanceIndex.mod(this.uniforms.gridSize.z).toConst();
      const gy = instanceIndex.div(this.uniforms.gridSize.z).mod(this.uniforms.gridSize.y).toConst();
      const gx = instanceIndex.div(this.uniforms.gridSize.z).div(this.uniforms.gridSize.y).toConst();
      const cellPos = ivec3(gx, gy, gz).toConst("cellPos");
      If(
        cellPos.x.lessThanEqual(0).or(cellPos.x.greaterThanEqual(this.uniforms.gridSize.x.sub(1))).or(cellPos.y.lessThanEqual(0).or(cellPos.y.greaterThanEqual(this.uniforms.gridSize.y.sub(1)))).or(cellPos.z.lessThanEqual(0).or(cellPos.z.greaterThanEqual(this.uniforms.gridSize.z.sub(1)))),
        () => {
          this.vorticityBuffer.element(instanceIndex).assign(vec3(0));
          Return();
        }
      );
      const vC = this.cellBufferF.element(getCellPtr(cellPos)).xyz.toConst("vC");
      const vXP = this.cellBufferF.element(getCellPtr(cellPos.add(ivec3(1, 0, 0)))).xyz.toConst("vXP");
      const vXM = this.cellBufferF.element(getCellPtr(cellPos.sub(ivec3(1, 0, 0)))).xyz.toConst("vXM");
      const vYP = this.cellBufferF.element(getCellPtr(cellPos.add(ivec3(0, 1, 0)))).xyz.toConst("vYP");
      const vYM = this.cellBufferF.element(getCellPtr(cellPos.sub(ivec3(0, 1, 0)))).xyz.toConst("vYM");
      const vZP = this.cellBufferF.element(getCellPtr(cellPos.add(ivec3(0, 0, 1)))).xyz.toConst("vZP");
      const vZM = this.cellBufferF.element(getCellPtr(cellPos.sub(ivec3(0, 0, 1)))).xyz.toConst("vZM");
      const dv_dx = vXP.sub(vXM).mul(0.5).toConst("dv_dx");
      const dv_dy = vYP.sub(vYM).mul(0.5).toConst("dv_dy");
      const dv_dz = vZP.sub(vZM).mul(0.5).toConst("dv_dz");
      const curl = vec3(
        dv_dz.y.sub(dv_dy.z),
        // ∂v_z/∂y - ∂v_y/∂z
        dv_dx.z.sub(dv_dz.x),
        // ∂v_x/∂z - ∂v_z/∂x
        dv_dy.x.sub(dv_dx.y)
        // ∂v_y/∂x - ∂v_x/∂y
      ).toConst("curl");
      this.vorticityBuffer.element(instanceIndex).assign(curl);
    })().compute(this.cellCount);
    this.kernels.g2p = Fn(() => {
      If(instanceIndex.greaterThanEqual(uint(this.uniforms.numParticles)), () => {
        Return();
      });
      const particleMass = this.particleBuffer.element(instanceIndex).get("mass").toConst("particleMass");
      const particleDensity = this.particleBuffer.element(instanceIndex).get("density").toConst("particleDensity");
      const particlePosition = this.particleBuffer.element(instanceIndex).get("position").xyz.toVar("particlePosition");
      const oldVelocity = this.particleBuffer.element(instanceIndex).get("velocity").xyz.toConst("oldVelocity");
      const forceAccumulator = vec3(0).toVar("forceAccumulator");
      If(this.uniforms.gravityType.equal(uint(2)), () => {
        const pn = particlePosition.div(vec3(this.uniforms.gridSize.sub(1))).sub(0.5).normalize().toConst();
        forceAccumulator.subAssign(pn.mul(0.3).mul(this.uniforms.dt));
      }).Else(() => {
        forceAccumulator.addAssign(this.uniforms.gravity.mul(this.uniforms.dt));
      });
      const noise = triNoise3Dvec(particlePosition.mul(0.015), time, 0.11).sub(0.285).normalize().mul(0.28).toVar();
      forceAccumulator.subAssign(noise.mul(this.uniforms.noise).mul(this.uniforms.dt));
      If(this.uniforms.audioEnabled.equal(int(1)), () => {
        const center = vec3(this.uniforms.gridSize).mul(0.5).toConst("audioCenter");
        const normPos = particlePosition.div(vec3(this.uniforms.gridSize)).toConst("normPos");
        If(this.uniforms.audioMode.equal(int(0)), () => {
          const resp = this.uniforms.audioResponsiveness;
          const bassWave = sin(time.mul(this.uniforms.audioSmoothBass.mul(2)).add(normPos.x.mul(6).add(normPos.z.mul(3)))).mul(this.uniforms.audioSmoothBass).mul(this.uniforms.audioBassInfluence).mul(3).mul(resp);
          forceAccumulator.y.addAssign(bassWave.mul(this.uniforms.dt));
          const dist2 = length(normPos.xz.sub(0.5));
          const angle = time.mul(this.uniforms.audioSmoothMid.mul(3)).add(dist2.mul(8));
          const midSwirl = vec3(
            cos(angle).mul(normPos.z.sub(0.5)),
            sin(dist2.mul(10).sub(time.mul(2))).mul(0.5),
            sin(angle).mul(normPos.x.sub(0.5)).negate()
          ).mul(this.uniforms.audioSmoothMid).mul(this.uniforms.audioMidInfluence).mul(2).mul(resp);
          forceAccumulator.addAssign(midSwirl.mul(this.uniforms.dt));
          const trebleRipple = sin(time.mul(5).add(normPos.x.mul(15)).add(normPos.y.mul(15))).mul(this.uniforms.audioSmoothTreble).mul(this.uniforms.audioTrebleInfluence).mul(1.5).mul(resp);
          forceAccumulator.addAssign(vec3(trebleRipple, trebleRipple.mul(0.5), trebleRipple).mul(this.uniforms.dt));
          forceAccumulator.y.addAssign(this.uniforms.audioBeatIntensity.mul(this.uniforms.audioBeatImpulse).mul(0.02).mul(this.uniforms.dt));
        });
        If(this.uniforms.audioMode.equal(int(4)), () => {
          const numBands = float(16);
          const bandIndex = normPos.x.mul(numBands).floor().toConst("bandIndex");
          const bandCenter = bandIndex.add(0.5).div(numBands).toConst("bandCenter");
          const bandFreqNorm = bandIndex.div(numBands).toConst("bandFreqNorm");
          const bassContrib = smoothstep(0.5, 0, bandFreqNorm).mul(this.uniforms.audioSmoothBass).toConst("bassContrib");
          const midContrib = smoothstep(0.2, 0.5, bandFreqNorm).mul(smoothstep(0.8, 0.5, bandFreqNorm)).mul(this.uniforms.audioSmoothMid).toConst("midContrib");
          const trebleContrib = smoothstep(0.5, 1, bandFreqNorm).mul(this.uniforms.audioSmoothTreble).toConst("trebleContrib");
          const amplitude = bassContrib.add(midContrib).add(trebleContrib).toConst("amplitude");
          const targetHeight = amplitude.mul(this.uniforms.gridSize.y).mul(0.8).toConst("targetHeight");
          forceAccumulator.y.addAssign(targetHeight.sub(particlePosition.y).mul(0.1).mul(this.uniforms.dt).mul(15));
          const horizontalDir = bandCenter.mul(this.uniforms.gridSize.x).sub(particlePosition.x).toConst("horizontalDir");
          forceAccumulator.x.addAssign(horizontalDir.mul(0.2).mul(this.uniforms.dt).mul(10));
        });
        If(this.uniforms.audioMode.equal(int(8)), () => {
          const sway = vec3(
            sin(time.mul(2).add(particlePosition.z.mul(0.1))),
            cos(time.mul(1.5).add(particlePosition.x.mul(0.1))),
            sin(time.mul(1.8).add(particlePosition.y.mul(0.1)))
          ).mul(this.uniforms.audioSmoothBass.add(this.uniforms.audioSmoothMid).add(this.uniforms.audioSmoothTreble).div(3)).mul(2).toConst("sway");
          forceAccumulator.addAssign(sway.mul(this.uniforms.dt));
          const bounce = this.uniforms.audioBeatIntensity.mul(sin(time.mul(12))).mul(5).toConst("bounce");
          forceAccumulator.y.addAssign(bounce.mul(this.uniforms.dt));
        });
        If(this.uniforms.audioMode.equal(int(12)), () => {
          const center2 = vec3(this.uniforms.gridSize).mul(0.5).toConst("center");
          const toCenter = center2.sub(particlePosition).toConst("toCenter");
          const distFromCenter = length(toCenter).toConst("distFromCenter");
          const dirToCenter = normalize(toCenter).toConst("dirToCenter");
          const sphereRadius = this.uniforms.gridSize.x.mul(0.25).toConst("sphereRadius");
          const sphereForce = dirToCenter.mul(distFromCenter.sub(sphereRadius).mul(0.2)).mul(this.uniforms.audioSmoothBass).mul(8).toConst("sphereForce");
          forceAccumulator.addAssign(sphereForce.mul(this.uniforms.dt));
          const torusRadius = this.uniforms.gridSize.x.mul(0.3).toConst("torusRadius");
          const horizontalDist = length(particlePosition.xz.sub(center2.xz)).toConst("horizontalDist");
          const torusForce = vec3(
            dirToCenter.x,
            particlePosition.y.sub(center2.y).negate().mul(0.3),
            dirToCenter.z
          ).mul(horizontalDist.sub(torusRadius).mul(0.15)).mul(this.uniforms.audioSmoothMid).mul(8).toConst("torusForce");
          forceAccumulator.addAssign(torusForce.mul(this.uniforms.dt));
        });
        If(this.uniforms.audioMode.equal(int(15)), () => {
          const center2 = vec3(this.uniforms.gridSize).mul(0.5).toConst("center");
          const radialDir = normalize(vec3(particlePosition.x.sub(center2.x), 0, particlePosition.z.sub(center2.z))).toConst("radialDir");
          const tangent = vec3(radialDir.z.negate(), 0, radialDir.x).toConst("tangent");
          const orbitalSpeed = this.uniforms.audioSmoothBass.add(this.uniforms.audioSmoothMid).add(this.uniforms.audioSmoothTreble).div(3).mul(2).add(1).toConst("orbitalSpeed");
          forceAccumulator.addAssign(tangent.mul(orbitalSpeed).mul(12).mul(this.uniforms.dt));
          const radiusXZ = length(particlePosition.xz.sub(center2.xz)).toConst("radiusXZ");
          const spiralAngle = time.mul(orbitalSpeed).add(radiusXZ.mul(0.3)).toConst("spiralAngle");
          const spiralInward = radialDir.negate().mul(sin(spiralAngle)).mul(this.uniforms.audioSmoothBass).mul(3.6).toConst("spiralInward");
          forceAccumulator.addAssign(spiralInward.mul(this.uniforms.dt));
        });
        If(this.uniforms.audioMode.equal(int(18)), () => {
          const bassFlow = vec3(
            sin(normPos.z.mul(3).add(time.mul(0.5))),
            0,
            cos(normPos.x.mul(3).add(time.mul(0.5)))
          ).mul(this.uniforms.audioSmoothBass).mul(10).toConst("bassFlow");
          forceAccumulator.addAssign(bassFlow.mul(this.uniforms.dt));
          const center2 = vec3(0.5).toConst("center");
          const toCenter = normPos.sub(center2).toConst("toCenter");
          const midSwirl = vec3(toCenter.z.negate(), 0, toCenter.x).mul(this.uniforms.audioSmoothMid).mul(8).toConst("midSwirl");
          forceAccumulator.addAssign(midSwirl.mul(this.uniforms.dt));
          const trebleTurbulence = triNoise3Dvec(
            particlePosition.mul(0.05),
            time.mul(this.uniforms.audioSmoothTreble.add(0.1)),
            0.15
          ).sub(0.5).mul(2).mul(this.uniforms.audioSmoothTreble).mul(5).toConst("trebleTurbulence");
          forceAccumulator.addAssign(trebleTurbulence.mul(this.uniforms.dt));
        });
        If(this.uniforms.audioMode.equal(int(1)), () => {
          const resp = this.uniforms.audioResponsiveness;
          const center2 = vec3(this.uniforms.gridSize).mul(0.5);
          const turbulence = triNoise3Dvec(
            normPos.mul(3),
            time.mul(this.uniforms.audioSmoothBass.mul(2).add(0.5)),
            0.3
          ).sub(0.5).mul(2).mul(this.uniforms.audioSmoothBass).mul(4).mul(resp);
          forceAccumulator.addAssign(turbulence.mul(this.uniforms.dt));
          const beatForce = vec3(
            sin(time.mul(10).add(normPos.x.mul(20))),
            cos(time.mul(12).add(normPos.y.mul(15))),
            sin(time.mul(8).add(normPos.z.mul(18)))
          ).mul(this.uniforms.audioBeatIntensity).mul(6);
          forceAccumulator.addAssign(beatForce.mul(this.uniforms.dt));
        });
        If(this.uniforms.audioMode.equal(int(2)), () => {
          const resp = this.uniforms.audioResponsiveness;
          const phase = time.mul(this.uniforms.audioSmoothMid.mul(2).add(1));
          const clusterForce = sin(phase).mul(this.uniforms.audioBeatIntensity).mul(0.5).add(0.5);
          const center2 = vec3(this.uniforms.gridSize).mul(0.5);
          const toCenter = center2.sub(particlePosition);
          const dist2 = length(toCenter);
          const dir = normalize(toCenter);
          const force2 = dir.mul(clusterForce.sub(0.5)).mul(10).mul(resp);
          forceAccumulator.addAssign(force2.mul(this.uniforms.dt));
          const wobble = vec3(
            sin(normPos.y.mul(10).add(time.mul(3))),
            cos(normPos.z.mul(10).add(time.mul(2.5))),
            sin(normPos.x.mul(10).add(time.mul(3.5)))
          ).mul(this.uniforms.audioSmoothMid).mul(2);
          forceAccumulator.addAssign(wobble.mul(this.uniforms.dt));
        });
        If(this.uniforms.audioMode.equal(int(3)), () => {
          const resp = this.uniforms.audioResponsiveness;
          const wavePhase = time.mul(this.uniforms.audioSmoothBass.add(0.3)).add(normPos.x.mul(2));
          const waveHeight = sin(wavePhase).mul(this.uniforms.audioSmoothBass).mul(this.uniforms.audioBassInfluence).mul(6);
          forceAccumulator.y.addAssign(waveHeight.mul(resp).mul(this.uniforms.dt));
          const undertow = vec3(
            cos(wavePhase.add(3.14)),
            0,
            sin(normPos.z.mul(1.5).add(time))
          ).mul(this.uniforms.audioSmoothBass).mul(2);
          forceAccumulator.addAssign(undertow.mul(this.uniforms.dt));
          forceAccumulator.y.addAssign(this.uniforms.audioBeatIntensity.mul(this.uniforms.audioBeatImpulse).mul(0.03).mul(this.uniforms.dt));
        });
        If(this.uniforms.audioMode.equal(int(5)), () => {
          const resp = this.uniforms.audioResponsiveness;
          const explosionCenter1 = vec3(this.uniforms.gridSize).mul(vec3(0.3, 0.5, 0.3));
          const explosionCenter2 = vec3(this.uniforms.gridSize).mul(vec3(0.7, 0.5, 0.7));
          const explosionCenter3 = vec3(this.uniforms.gridSize).mul(vec3(0.5, 0.7, 0.5));
          const toCenter1 = particlePosition.sub(explosionCenter1);
          const toCenter2 = particlePosition.sub(explosionCenter2);
          const toCenter3 = particlePosition.sub(explosionCenter3);
          const dist1 = length(toCenter1);
          const dist2 = length(toCenter2);
          const dist3 = length(toCenter3);
          const force1 = normalize(toCenter1).mul(this.uniforms.audioBeatIntensity).mul(8).div(dist1.add(1));
          const force2 = normalize(toCenter2).mul(this.uniforms.audioBeatIntensity).mul(8).div(dist2.add(1));
          const force3 = normalize(toCenter3).mul(this.uniforms.audioSmoothBass).mul(6).div(dist3.add(1));
          forceAccumulator.addAssign(force1.add(force2).add(force3).mul(resp).mul(this.uniforms.dt));
        });
        If(this.uniforms.audioMode.equal(int(6)), () => {
          const resp = this.uniforms.audioResponsiveness;
          const strikeDir = vec3(
            sin(time.mul(0.3).add(this.uniforms.audioBeatIntensity.mul(10))),
            1,
            cos(time.mul(0.3).add(this.uniforms.audioBeatIntensity.mul(10)))
          ).normalize();
          const boltForce = strikeDir.mul(this.uniforms.audioBeatIntensity).mul(this.uniforms.audioBeatImpulse).mul(0.1).mul(resp);
          forceAccumulator.addAssign(boltForce.mul(this.uniforms.dt));
          const jitter = vec3(
            sin(time.mul(20).add(normPos.x.mul(50))),
            cos(time.mul(25).add(normPos.y.mul(50))),
            sin(time.mul(22).add(normPos.z.mul(50)))
          ).mul(this.uniforms.audioSmoothTreble).mul(3);
          forceAccumulator.addAssign(jitter.mul(this.uniforms.dt));
        });
        If(this.uniforms.audioMode.equal(int(7)), () => {
          const resp = this.uniforms.audioResponsiveness;
          const launchForce = vec3(0, 1, 0).mul(this.uniforms.audioBeatIntensity).mul(this.uniforms.audioBeatImpulse).mul(0.08);
          forceAccumulator.addAssign(launchForce.mul(resp).mul(this.uniforms.dt));
          const center2 = vec3(this.uniforms.gridSize).mul(vec3(0.5, 0.8, 0.5));
          const toParticle = particlePosition.sub(center2);
          const distFromPeak = length(toParticle);
          const burstForce = normalize(toParticle).mul(this.uniforms.audioSmoothMid).mul(4).div(distFromPeak.add(1));
          forceAccumulator.addAssign(burstForce.mul(this.uniforms.dt));
          forceAccumulator.y.subAssign(this.uniforms.audioSmoothOverall.mul(2).mul(this.uniforms.dt));
        });
        If(this.uniforms.audioMode.equal(int(9)), () => {
          const resp = this.uniforms.audioResponsiveness;
          const swingPhase = time.mul(this.uniforms.audioSmoothBass.add(0.5));
          const swingX = sin(swingPhase).mul(this.uniforms.audioBassInfluence).mul(4);
          const swingZ = cos(swingPhase.mul(1.2)).mul(this.uniforms.audioBassInfluence).mul(3);
          forceAccumulator.x.addAssign(swingX.mul(resp).mul(this.uniforms.dt));
          forceAccumulator.z.addAssign(swingZ.mul(resp).mul(this.uniforms.dt));
          const bob = sin(swingPhase.mul(2)).mul(this.uniforms.audioSmoothMid).mul(2);
          forceAccumulator.y.addAssign(bob.mul(this.uniforms.dt));
        });
        If(this.uniforms.audioMode.equal(int(10)), () => {
          const resp = this.uniforms.audioResponsiveness;
          const center2 = vec3(this.uniforms.gridSize).mul(0.5);
          const toCenter = particlePosition.sub(center2);
          const radius = length(toCenter.xz);
          const angle = atan(toCenter.z, toCenter.x);
          const rotSpeed = this.uniforms.audioSmoothMid.mul(2).add(0.5);
          const newAngle = angle.add(rotSpeed.mul(this.uniforms.dt));
          const targetX = center2.x.add(cos(newAngle).mul(radius));
          const targetZ = center2.z.add(sin(newAngle).mul(radius));
          forceAccumulator.x.addAssign(targetX.sub(particlePosition.x).mul(5).mul(resp).mul(this.uniforms.dt));
          forceAccumulator.z.addAssign(targetZ.sub(particlePosition.z).mul(5).mul(resp).mul(this.uniforms.dt));
          const step2 = floor(this.uniforms.audioBeatIntensity.mul(4)).mul(0.5);
          forceAccumulator.y.addAssign(step2.mul(this.uniforms.dt));
        });
        If(this.uniforms.audioMode.equal(int(11)), () => {
          const resp = this.uniforms.audioResponsiveness;
          const gridSize = float(8);
          const cellSize = this.uniforms.gridSize.x.div(gridSize);
          const targetX = floor(normPos.x.mul(gridSize)).div(gridSize).mul(this.uniforms.gridSize.x).add(cellSize.mul(0.5));
          const targetZ = floor(normPos.z.mul(gridSize)).div(gridSize).mul(this.uniforms.gridSize.z).add(cellSize.mul(0.5));
          const snapStrength = this.uniforms.audioBeatIntensity.mul(10);
          forceAccumulator.x.addAssign(targetX.sub(particlePosition.x).mul(snapStrength).mul(resp).mul(this.uniforms.dt));
          forceAccumulator.z.addAssign(targetZ.sub(particlePosition.z).mul(snapStrength).mul(resp).mul(this.uniforms.dt));
          const targetY = this.uniforms.audioSmoothBass.mul(this.uniforms.gridSize.y).mul(0.3).add(this.uniforms.gridSize.y.mul(0.3));
          forceAccumulator.y.addAssign(targetY.sub(particlePosition.y).mul(3).mul(this.uniforms.dt));
        });
        If(this.uniforms.audioMode.equal(int(13)), () => {
          const resp = this.uniforms.audioResponsiveness;
          const waveX = sin(normPos.z.mul(2).add(time.mul(0.5))).mul(this.uniforms.audioSmoothMid).mul(2);
          const waveY = sin(normPos.x.mul(1.5).add(time.mul(0.3))).mul(this.uniforms.audioSmoothMid).mul(1.5);
          const waveZ = cos(normPos.y.mul(1.8).add(time.mul(0.4))).mul(this.uniforms.audioSmoothMid).mul(1.8);
          forceAccumulator.addAssign(vec3(waveX, waveY, waveZ).mul(resp).mul(this.uniforms.dt));
          const shimmer = triNoise3Dvec(
            normPos.mul(5),
            time.mul(0.5),
            0.2
          ).sub(0.5).mul(this.uniforms.audioSmoothTreble).mul(1.5);
          forceAccumulator.addAssign(shimmer.mul(this.uniforms.dt));
        });
        If(this.uniforms.audioMode.equal(int(14)), () => {
          const resp = this.uniforms.audioResponsiveness;
          const center2 = vec3(this.uniforms.gridSize).mul(0.5);
          const toCenter = particlePosition.sub(center2);
          const dist2 = length(toCenter);
          const targetRadius = this.uniforms.gridSize.x.mul(0.35).mul(this.uniforms.audioSmoothBass.add(0.5));
          const radialForce = normalize(toCenter).mul(targetRadius.sub(dist2)).mul(0.5).mul(resp);
          forceAccumulator.addAssign(radialForce.mul(this.uniforms.dt));
          const connectionNoise = triNoise3D(normPos.mul(10), time.mul(0.2));
          const connectionForce = vec3(
            sin(connectionNoise.mul(6.28)),
            cos(connectionNoise.mul(6.28)),
            sin(connectionNoise.mul(6.28).add(1.57))
          ).mul(this.uniforms.audioSmoothMid).mul(1);
          forceAccumulator.addAssign(connectionForce.mul(this.uniforms.dt));
          const twinkle = sin(time.mul(10).add(normPos.x.mul(50))).mul(this.uniforms.audioSmoothTreble).mul(0.8);
          forceAccumulator.y.addAssign(twinkle.mul(this.uniforms.dt));
        });
        If(this.uniforms.audioMode.equal(int(16)), () => {
          const resp = this.uniforms.audioResponsiveness;
          const center2 = vec3(this.uniforms.gridSize).mul(0.5);
          const toCenter = particlePosition.sub(center2);
          const radius = length(toCenter.xz);
          const angle = atan(toCenter.z, toCenter.x);
          const symmetryOrder = float(6);
          const symmetricAngle = floor(angle.div(6.28).mul(symmetryOrder)).div(symmetryOrder).mul(6.28);
          const targetX = center2.x.add(cos(symmetricAngle).mul(radius));
          const targetZ = center2.z.add(sin(symmetricAngle).mul(radius));
          forceAccumulator.x.addAssign(targetX.sub(particlePosition.x).mul(this.uniforms.audioSmoothMid).mul(3).mul(resp).mul(this.uniforms.dt));
          forceAccumulator.z.addAssign(targetZ.sub(particlePosition.z).mul(this.uniforms.audioSmoothMid).mul(3).mul(resp).mul(this.uniforms.dt));
          const petalMod = sin(angle.mul(symmetryOrder)).mul(this.uniforms.audioSmoothBass).mul(2);
          const petalForce = normalize(toCenter.xzy).mul(petalMod);
          forceAccumulator.addAssign(petalForce.mul(this.uniforms.dt));
          const tangent = vec3(toCenter.z.negate(), 0, toCenter.x).normalize();
          forceAccumulator.addAssign(tangent.mul(this.uniforms.audioSmoothMid).mul(2).mul(this.uniforms.dt));
        });
        If(this.uniforms.audioMode.equal(int(17)), () => {
          const resp = this.uniforms.audioResponsiveness;
          const center2 = vec3(this.uniforms.gridSize.x.mul(0.5), this.uniforms.gridSize.y.mul(0.5), this.uniforms.gridSize.z);
          const toCenter = vec3(center2.x, center2.y, particlePosition.z).sub(particlePosition.xyz);
          const radialDist = length(toCenter.xy);
          const targetRadius = this.uniforms.gridSize.x.mul(0.2).mul(normPos.z.add(0.5));
          const tunnelForce = normalize(toCenter).mul(targetRadius.sub(radialDist)).mul(5).mul(resp);
          forceAccumulator.xy.addAssign(tunnelForce.xy.mul(this.uniforms.dt));
          const forwardSpeed = this.uniforms.audioSmoothBass.mul(8).add(2);
          forceAccumulator.z.addAssign(forwardSpeed.mul(this.uniforms.dt));
          const angle = atan(toCenter.y, toCenter.x);
          const spiralSpeed = this.uniforms.audioSmoothMid.mul(3);
          const tangent = vec3(sin(angle), cos(angle).negate(), 0);
          forceAccumulator.addAssign(tangent.mul(spiralSpeed).mul(this.uniforms.dt));
        });
        If(this.uniforms.audioMode.equal(int(19)), () => {
          const resp = this.uniforms.audioResponsiveness;
          const jitterScale = this.uniforms.audioSmoothOverall.mul(30).add(10);
          const jitter = triNoise3Dvec(
            normPos.mul(20),
            time.mul(10),
            0.3
          ).sub(0.5).mul(2).mul(jitterScale).mul(resp);
          forceAccumulator.addAssign(jitter.mul(this.uniforms.dt));
          const tunnel = vec3(
            triNoise3D(normPos.mul(5), time),
            triNoise3D(normPos.yzx.mul(5), time.add(100)),
            triNoise3D(normPos.zxy.mul(5), time.add(200))
          ).sub(0.5).mul(2).mul(this.uniforms.audioBeatIntensity).mul(20);
          forceAccumulator.addAssign(tunnel.mul(this.uniforms.dt));
        });
        If(this.uniforms.audioMode.equal(int(20)), () => {
          const resp = this.uniforms.audioResponsiveness;
          const scale1 = triNoise3Dvec(normPos.mul(2), time.mul(0.5), 0.3);
          const scale2 = triNoise3Dvec(normPos.mul(5), time.mul(1), 0.2);
          const scale3 = triNoise3Dvec(normPos.mul(10), time.mul(2), 0.1);
          const fractalForce = scale1.mul(this.uniforms.audioSmoothBass).mul(3).add(scale2.mul(this.uniforms.audioSmoothMid).mul(2)).add(scale3.mul(this.uniforms.audioSmoothTreble).mul(1)).sub(0.5).mul(2).mul(resp);
          forceAccumulator.addAssign(fractalForce.mul(this.uniforms.dt));
          const center2 = vec3(this.uniforms.gridSize).mul(0.5);
          const toCenter = center2.sub(particlePosition);
          const centerForce = toCenter.mul(0.01).mul(this.uniforms.audioSmoothBass).mul(this.uniforms.audioBassInfluence);
          forceAccumulator.addAssign(centerForce.mul(this.uniforms.dt));
        });
      });
      const cellIndex = ivec3(particlePosition).sub(1).toConst("cellIndex");
      const cellDiff = particlePosition.fract().sub(0.5).toConst("cellDiff");
      const w0 = float(0.5).mul(float(0.5).sub(cellDiff)).mul(float(0.5).sub(cellDiff));
      const w1 = float(0.75).sub(cellDiff.mul(cellDiff));
      const w2 = float(0.5).mul(float(0.5).add(cellDiff)).mul(float(0.5).add(cellDiff));
      const weights = array([w0, w1, w2]).toConst("weights");
      const gridVelocity = vec3(0).toVar("gridVelocity");
      const B = mat3(0).toVar("B");
      Loop({ start: 0, end: 3, type: "int", name: "gx", condition: "<" }, ({ gx }) => {
        Loop({ start: 0, end: 3, type: "int", name: "gy", condition: "<" }, ({ gy }) => {
          Loop({ start: 0, end: 3, type: "int", name: "gz", condition: "<" }, ({ gz }) => {
            const weight = weights.element(gx).x.mul(weights.element(gy).y).mul(weights.element(gz).z);
            const cellX = cellIndex.add(ivec3(gx, gy, gz)).toConst();
            const cellDist = vec3(cellX).add(0.5).sub(particlePosition).toConst("cellDist");
            const cellPtr = getCellPtr(cellX);
            const weightedVelocity = this.cellBufferF.element(cellPtr).xyz.mul(weight).toConst("weightedVelocity");
            const term = mat3(
              weightedVelocity.mul(cellDist.x),
              weightedVelocity.mul(cellDist.y),
              weightedVelocity.mul(cellDist.z)
            );
            B.addAssign(term);
            gridVelocity.addAssign(weightedVelocity);
          });
        });
      });
      const particleVelocity = vec3(0).toVar("particleVelocity");
      If(this.uniforms.transferMode.equal(int(0)), () => {
        particleVelocity.assign(gridVelocity);
      }).ElseIf(this.uniforms.transferMode.equal(int(1)), () => {
        const velocityDelta = gridVelocity.sub(oldVelocity).toConst("velocityDelta");
        particleVelocity.assign(oldVelocity.add(velocityDelta));
      }).Else(() => {
        const velocityDelta = gridVelocity.sub(oldVelocity).toConst("velocityDelta");
        const flipComponent = oldVelocity.add(velocityDelta).toConst("flipComponent");
        const picComponent = gridVelocity.toConst("picComponent");
        particleVelocity.assign(
          flipComponent.mul(this.uniforms.flipRatio).add(
            picComponent.mul(float(1).sub(this.uniforms.flipRatio))
          )
        );
      });
      particleVelocity.addAssign(forceAccumulator);
      If(this.uniforms.vorticityEnabled.equal(int(1)), () => {
        const vorticityAtParticle = vec3(0).toVar("vorticityAtParticle");
        Loop({ start: 0, end: 3, type: "int", name: "gx", condition: "<" }, ({ gx }) => {
          Loop({ start: 0, end: 3, type: "int", name: "gy", condition: "<" }, ({ gy }) => {
            Loop({ start: 0, end: 3, type: "int", name: "gz", condition: "<" }, ({ gz }) => {
              const weight = weights.element(gx).x.mul(weights.element(gy).y).mul(weights.element(gz).z);
              const cellX = cellIndex.add(ivec3(gx, gy, gz)).toConst();
              const cellPtr = getCellPtr(cellX);
              const vorticity = this.vorticityBuffer.element(cellPtr).toConst("vorticity");
              vorticityAtParticle.addAssign(vorticity.mul(weight));
            });
          });
        });
        const omega = vorticityAtParticle.toConst("omega");
        const omegaMag = omega.length().add(1e-6).toConst("omegaMag");
        const gradOmegaMag = vec3(0).toVar("gradOmegaMag");
        const cellPos = ivec3(particlePosition).toConst();
        If(cellPos.x.greaterThan(0).and(cellPos.x.lessThan(this.uniforms.gridSize.x.sub(1))), () => {
          const omegaXP = this.vorticityBuffer.element(getCellPtr(cellPos.add(ivec3(1, 0, 0)))).length();
          const omegaXM = this.vorticityBuffer.element(getCellPtr(cellPos.sub(ivec3(1, 0, 0)))).length();
          gradOmegaMag.x.assign(omegaXP.sub(omegaXM).mul(0.5));
        });
        If(cellPos.y.greaterThan(0).and(cellPos.y.lessThan(this.uniforms.gridSize.y.sub(1))), () => {
          const omegaYP = this.vorticityBuffer.element(getCellPtr(cellPos.add(ivec3(0, 1, 0)))).length();
          const omegaYM = this.vorticityBuffer.element(getCellPtr(cellPos.sub(ivec3(0, 1, 0)))).length();
          gradOmegaMag.y.assign(omegaYP.sub(omegaYM).mul(0.5));
        });
        If(cellPos.z.greaterThan(0).and(cellPos.z.lessThan(this.uniforms.gridSize.z.sub(1))), () => {
          const omegaZP = this.vorticityBuffer.element(getCellPtr(cellPos.add(ivec3(0, 0, 1)))).length();
          const omegaZM = this.vorticityBuffer.element(getCellPtr(cellPos.sub(ivec3(0, 0, 1)))).length();
          gradOmegaMag.z.assign(omegaZP.sub(omegaZM).mul(0.5));
        });
        const gradMag = gradOmegaMag.length().add(1e-6);
        const N = gradOmegaMag.div(gradMag).toConst("N");
        const vorticityForce = cross(N, omega).mul(this.uniforms.vorticityEpsilon).toConst("vorticityForce");
        particleVelocity.addAssign(vorticityForce.mul(this.uniforms.dt));
      });
      const dist = cross(this.uniforms.mouseRayDirection, particlePosition.mul(vec3(1, 1, 0.4)).sub(this.uniforms.mouseRayOrigin)).length();
      const force = dist.mul(0.1).oneMinus().max(0).pow(2);
      particleVelocity.addAssign(this.uniforms.mouseForce.mul(1).mul(force));
      particleVelocity.mulAssign(particleMass);
      this.particleBuffer.element(instanceIndex).get("C").assign(B.mul(4));
      particlePosition.addAssign(particleVelocity.mul(this.uniforms.dt));
      if (this.boundaries) {
        this.boundaries.generateCollisionTSL(particlePosition, particleVelocity, {
          dt: this.uniforms.dt,
          shapeType: this.uniforms.boundaryShape,
          shapeMin: this.uniforms.boundaryWallMin,
          shapeMax: this.uniforms.boundaryWallMax,
          shapeCenter: this.uniforms.boundaryCenter,
          shapeRadius: this.uniforms.boundaryRadius,
          restitution: this.uniforms.boundaryWallStiffness,
          damping: uniform(0.98),
          enabled: this.uniforms.boundaryEnabled
          // NEW: Pass enabled state
        });
      }
      this.particleBuffer.element(instanceIndex).get("position").assign(particlePosition);
      this.particleBuffer.element(instanceIndex).get("velocity").assign(particleVelocity);
      const direction = this.particleBuffer.element(instanceIndex).get("direction");
      direction.assign(mix(direction, particleVelocity, 0.1));
      const particleMaterialType = this.particleBuffer.element(instanceIndex).get("materialType");
      const color = vec3(1, 1, 1).toVar();
      If(this.uniforms.colorMode.equal(int(3)), () => {
        color.assign(getMaterialColor(particleMaterialType));
      }).ElseIf(this.uniforms.colorMode.equal(int(1)), () => {
        const densityHue = particleDensity.div(this.uniforms.restDensity).mul(0.5).clamp(0, 1);
        color.assign(hsvtorgb(vec3(densityHue, 0.8, 1)));
      }).Else(() => {
        color.assign(hsvtorgb(
          vec3(
            particleDensity.div(this.uniforms.restDensity).mul(0.25).add(time.mul(0.05)),
            particleVelocity.length().mul(0.5).clamp(0, 1).mul(0.3).add(0.7),
            force.mul(0.3).add(0.7)
          )
        ));
      });
      this.particleBuffer.element(instanceIndex).get("color").assign(color);
    })().compute(1);
  }
  /**
   * Set mouse ray for interaction
   */
  setMouseRay(origin, direction, pos) {
    origin.multiplyScalar(64);
    pos.multiplyScalar(64);
    origin.add(new THREE.Vector3(32, 0, 0));
    this.uniforms.mouseRayDirection.value.copy(direction.normalize());
    this.uniforms.mouseRayOrigin.value.copy(origin);
    this.mousePos.copy(pos);
  }
  /**
   * Update audio uniforms from AudioManager
   */
  updateAudioUniforms(audioUniforms) {
    if (!audioUniforms) return;
    this.uniforms.audioSmoothBass.value = audioUniforms.smoothBass.value;
    this.uniforms.audioSmoothMid.value = audioUniforms.smoothMid.value;
    this.uniforms.audioSmoothTreble.value = audioUniforms.smoothTreble.value;
    this.uniforms.audioSmoothOverall.value = audioUniforms.smoothOverall.value;
    this.uniforms.audioBeatIntensity.value = audioUniforms.beatIntensity.value;
    this.uniforms.audioTempoPhase.value = audioUniforms.tempoPhase.value;
    this.uniforms.audioTempo.value = audioUniforms.tempo.value;
    this.uniforms.audioPeakFrequency.value = audioUniforms.peakFrequency.value;
    this.uniforms.audioHarmonicEnergy.value = audioUniforms.harmonicEnergy.value;
    this.uniforms.audioRhythmConfidence.value = audioUniforms.rhythmConfidence.value;
    this.uniforms.audioBassInfluence.value = audioUniforms.bassInfluence.value;
    this.uniforms.audioMidInfluence.value = audioUniforms.midInfluence.value;
    this.uniforms.audioTrebleInfluence.value = audioUniforms.trebleInfluence.value;
    this.uniforms.audioResponsiveness.value = audioUniforms.responsiveness.value;
    this.uniforms.audioBeatImpulse.value = audioUniforms.beatImpulse.value;
  }
  /**
   * Set audio mode (0-5)
   */
  setAudioMode(mode) {
    this.uniforms.audioMode.value = mode;
  }
  /**
   * Enable/disable audio reactivity
   */
  setAudioEnabled(enabled) {
    this.uniforms.audioEnabled.value = enabled ? 1 : 0;
  }
  /**
   * Estimate max velocity by sampling particles (for adaptive timestep)
   */
  estimateMaxVelocity() {
    const sampleInterval = 64;
    const sampleCount = Math.ceil(this.numParticles / sampleInterval);
    let maxVelSq = 0;
    const velocityOffset = 4;
    const structSize = this.particleBuffer.structSize;
    for (let i = 0; i < sampleCount && i * sampleInterval < this.numParticles; i++) {
      const idx = i * sampleInterval;
      const baseIdx = idx * structSize + velocityOffset;
      const vx = this.particleBuffer.floatArray[baseIdx];
      const vy = this.particleBuffer.floatArray[baseIdx + 1];
      const vz = this.particleBuffer.floatArray[baseIdx + 2];
      const velSq = vx * vx + vy * vy + vz * vz;
      maxVelSq = Math.max(maxVelSq, velSq);
    }
    return Math.sqrt(maxVelSq);
  }
  /**
   * Update simulation (with audio reactivity)
   */
  async update(params, deltaTime, elapsed, audioData) {
    this.uniforms.noise.value = params.noise;
    this.uniforms.stiffness.value = params.stiffness;
    this.uniforms.gravityType.value = params.gravityType;
    this.uniforms.gravity.value.copy(params.gravity);
    this.uniforms.dynamicViscosity.value = params.dynamicViscosity;
    this.uniforms.restDensity.value = params.restDensity;
    this.uniforms.transferMode.value = params.transferMode;
    this.uniforms.flipRatio.value = params.flipRatio;
    this.uniforms.vorticityEnabled.value = params.vorticityEnabled ? 1 : 0;
    this.uniforms.vorticityEpsilon.value = params.vorticityEpsilon;
    this.uniforms.surfaceTensionEnabled.value = params.surfaceTensionEnabled ? 1 : 0;
    this.uniforms.surfaceTensionCoeff.value = params.surfaceTensionCoeff;
    this.uniforms.sparseGrid.value = params.sparseGrid ? 1 : 0;
    const interval = Math.min(deltaTime, 1 / 60);
    const baseDt = interval * 6 * params.dt;
    let dt = baseDt;
    if (params.adaptiveTimestep && this.numParticles > 0) {
      const maxVelocity = this.estimateMaxVelocity();
      const gridSpacing = 1;
      const cflTarget = params.cflTarget;
      if (maxVelocity > 0.1) {
        const dtSafe = cflTarget * gridSpacing / maxVelocity;
        dt = Math.min(baseDt, dtSafe);
      }
      dt = Math.max(1e-4, Math.min(0.1, dt));
    }
    this.uniforms.dt.value = dt;
    if (params.numParticles !== this.numParticles) {
      this.numParticles = params.numParticles;
      this.uniforms.numParticles.value = params.numParticles;
      this.kernels.p2g1.count = params.numParticles;
      this.kernels.p2g1.updateDispatchCount();
      this.kernels.p2g2.count = params.numParticles;
      this.kernels.p2g2.updateDispatchCount();
      this.kernels.g2p.count = params.numParticles;
      this.kernels.g2p.updateDispatchCount();
    }
    this.mousePosArray.push(this.mousePos.clone());
    if (this.mousePosArray.length > 3) this.mousePosArray.shift();
    if (this.mousePosArray.length > 1) {
      this.uniforms.mouseForce.value.copy(this.mousePosArray[this.mousePosArray.length - 1]).sub(this.mousePosArray[0]).divideScalar(this.mousePosArray.length);
    }
    const kernels = [
      this.kernels.clearGrid,
      this.kernels.p2g1,
      this.kernels.p2g2,
      this.kernels.updateGrid
    ];
    if (params.vorticityEnabled) {
      kernels.push(this.kernels.calculateVorticity);
    }
    kernels.push(this.kernels.g2p);
    await this.renderer.computeAsync(kernels);
  }
  /**
   * Update force fields from manager
   */
  updateForceFields(forceFieldManager) {
    forceFieldManager.updateUniforms();
    this.uniforms.fieldCount.value = forceFieldManager.fieldCountUniform.value;
    this.uniforms.fieldTypes.value = forceFieldManager.fieldTypesUniform.value;
    this.uniforms.fieldPositions.value = forceFieldManager.fieldPositionsUniform.value;
    this.uniforms.fieldDirections.value = forceFieldManager.fieldDirectionsUniform.value;
    this.uniforms.fieldAxes.value = forceFieldManager.fieldAxesUniform.value;
    this.uniforms.fieldStrengths.value = forceFieldManager.fieldStrengthsUniform.value;
    this.uniforms.fieldRadii.value = forceFieldManager.fieldRadiiUniform.value;
    this.uniforms.fieldFalloffs.value = forceFieldManager.fieldFalloffsUniform.value;
    this.uniforms.fieldTurbScales.value = forceFieldManager.fieldTurbScalesUniform.value;
    this.uniforms.fieldNoiseSpeeds.value = forceFieldManager.fieldNoiseSpeedsUniform.value;
  }
  /**
   * Set color mode
   */
  setColorMode(mode) {
    this.uniforms.colorMode.value = mode;
  }
  /**
   * Set audio visualization mode (0-8)
   */
  setAudioVisualizationMode(mode) {
    this.uniforms.audioVisualizationMode.value = mode;
  }
  /**
   * Set particle material type
   */
  setParticleMaterial(index, materialType) {
    if (index >= 0 && index < this.particleBuffer.length) {
      this.particleBuffer.set(index, "materialType", materialType);
    }
  }
  /**
   * Set boundaries module for collision detection
   */
  setBoundaries(boundaries) {
    this.boundaries = boundaries;
    this.updateBoundaryUniforms();
  }
  /**
   * Get boundaries
   */
  getBoundaries() {
    return this.boundaries;
  }
  /**
   * Update boundary uniforms from ParticleBoundaries
   * Shape mapping:
   * - NONE = 0: Free-floating with soft containment
   * - BOX = 1: Box container
   * - SPHERE = 2: Spherical container
   * - CYLINDER = 3: Cylindrical container
   * - DODECAHEDRON = 4: Dodecahedron container
   */
  updateBoundaryUniforms() {
    if (!this.boundaries) {
      console.log("\u{1F534} updateBoundaryUniforms: No boundaries set!");
      return;
    }
    const boundaryData = this.boundaries.getBoundaryUniforms();
    console.log("\u{1F537} GPU SYNC: updateBoundaryUniforms called:");
    console.log(`  enabled: ${boundaryData.enabled}, shape: ${boundaryData.shapeInt}`);
    console.log(`  min: [${boundaryData.wallMin.toArray()}], max: [${boundaryData.wallMax.toArray()}]`);
    console.log(`  center: [${boundaryData.gridCenter.toArray()}], radius: ${boundaryData.boundaryRadius}`);
    console.log(`  distribution: ${boundaryData.distributionMode}, surfaceDist: ${boundaryData.surfaceDistance}, flowSpeed: ${boundaryData.flowSpeed}`);
    this.uniforms.boundaryEnabled.value = boundaryData.enabled ? 1 : 0;
    this.uniforms.boundaryShape.value = boundaryData.shapeInt;
    this.uniforms.boundaryWallMin.value.copy(boundaryData.wallMin);
    this.uniforms.boundaryWallMax.value.copy(boundaryData.wallMax);
    this.uniforms.boundaryWallStiffness.value = boundaryData.wallStiffness;
    this.uniforms.boundaryCenter.value.copy(boundaryData.gridCenter);
    this.uniforms.boundaryRadius.value = boundaryData.boundaryRadius;
    this.uniforms.boundaryViewportPulse.value = boundaryData.viewportPulse;
    this.uniforms.distributionMode.value = boundaryData.distributionMode;
    this.uniforms.surfaceDistance.value = boundaryData.surfaceDistance;
    this.uniforms.flowSpeed.value = boundaryData.flowSpeed;
    console.log("\u{1F537} GPU uniforms synced \u2705");
  }
}
export {
  MlsMpmSimulator,
  TransferMode
};

// ARTINOS export alias (plan rename: MlsMpmSimulator -> MlsMpmSolver).
export { MlsMpmSimulator as MlsMpmSolver };
