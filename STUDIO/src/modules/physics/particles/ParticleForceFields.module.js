// ParticleForceFields.module.js
// Dynamic force-field system for particle sims: 8 field types (attractor, repeller, vortex,
// turbulence, directional/wind, vortex-tube/tornado, spherical, curl-noise) with 4 falloff modes,
// 7 named presets (Gravity Well, Black Hole, Tornado, …), a GPU (TSL) per-field force evaluator, and
// a CPU manager that packs up to N fields into uniforms. Add steerable forces to any particle solver.
//
// Ported faithfully from ref/AURORA/src/PARTICLESYSTEM/physic/forcefields.ts. Changes: TS
// enums/interfaces removed (types are frozen objects); imports triNoise3Dvec from the ported
// math/TslNoise module; already method-chained TSL — no operator rewrite. Logic + presets verbatim.

import * as THREE from 'three/webgpu';
import { Fn, vec3, float, int, If, uniform, length, normalize, cross, dot, sin, time } from 'three/tsl';
import { triNoise3Dvec } from '../../math/TslNoise.module';

/** Force field types. */
export const ForceFieldType = Object.freeze({
  ATTRACTOR: 0, // Point-based gravitational attraction
  REPELLER: 1, // Point-based repulsion
  VORTEX: 2, // Rotational force around axis
  TURBULENCE: 3, // Noise-based chaotic forces
  DIRECTIONAL: 4, // Constant direction (wind)
  VORTEX_TUBE: 5, // Tube-shaped vortex (tornado)
  SPHERICAL: 6, // Radial force from sphere
  CURL_NOISE: 7, // Curl noise (divergence-free)
});

/** Force field falloff modes. */
export const ForceFalloff = Object.freeze({
  CONSTANT: 0,
  LINEAR: 1,
  QUADRATIC: 2,
  SMOOTH: 3,
});

/** Default force field configuration. */
export const DEFAULT_FORCE_FIELD = {
  type: ForceFieldType.ATTRACTOR,
  enabled: true,
  position: new THREE.Vector3(0, 0, 0),
  direction: new THREE.Vector3(0, 1, 0),
  rotation: new THREE.Euler(0, 0, 0),
  strength: 10.0,
  radius: 20.0,
  falloff: ForceFalloff.QUADRATIC,
  vortexAxis: new THREE.Vector3(0, 1, 0),
  turbulenceScale: 1.0,
  turbulenceOctaves: 2,
  noiseSpeed: 1.0,
  animated: false,
  animationSpeed: 1.0,
  animationAmplitude: 0.0,
};

/** Force field presets. */
export const FORCE_FIELD_PRESETS = {
  GRAVITY_WELL: { type: ForceFieldType.ATTRACTOR, strength: 50.0, radius: 30.0, falloff: ForceFalloff.QUADRATIC },
  BLACK_HOLE: { type: ForceFieldType.ATTRACTOR, strength: 200.0, radius: 15.0, falloff: ForceFalloff.QUADRATIC },
  EXPLOSION: { type: ForceFieldType.REPELLER, strength: 100.0, radius: 25.0, falloff: ForceFalloff.LINEAR, animated: true, animationSpeed: 2.0 },
  TORNADO: { type: ForceFieldType.VORTEX_TUBE, strength: 30.0, radius: 10.0, vortexAxis: new THREE.Vector3(0, 1, 0), falloff: ForceFalloff.SMOOTH },
  WIND: { type: ForceFieldType.DIRECTIONAL, strength: 5.0, direction: new THREE.Vector3(1, 0, 0), radius: 100.0, falloff: ForceFalloff.CONSTANT },
  TURBULENCE: { type: ForceFieldType.TURBULENCE, strength: 15.0, radius: 30.0, turbulenceScale: 2.0, turbulenceOctaves: 3, noiseSpeed: 1.0 },
  GALAXY_SPIRAL: { type: ForceFieldType.VORTEX, strength: 20.0, radius: 40.0, vortexAxis: new THREE.Vector3(0, 0, 1), falloff: ForceFalloff.SMOOTH },
};

/** GPU falloff multiplier from distance + falloff type. */
export const calculateFalloff = /*#__PURE__*/ Fn(([dist, radius, falloffType]) => {
  const result = float(1.0).toVar();
  const t = dist.div(radius).clamp(0, 1).toVar();

  If(falloffType.equal(int(ForceFalloff.CONSTANT)), () => {
    result.assign(1.0);
  })
    .ElseIf(falloffType.equal(int(ForceFalloff.LINEAR)), () => {
      result.assign(t.oneMinus());
    })
    .ElseIf(falloffType.equal(int(ForceFalloff.QUADRATIC)), () => {
      const invDist = t.oneMinus();
      result.assign(invDist.mul(invDist));
    })
    .ElseIf(falloffType.equal(int(ForceFalloff.SMOOTH)), () => {
      const smoothT = t.mul(t).mul(float(3).sub(t.mul(2)));
      result.assign(smoothT.oneMinus());
    });

  return result;
}).setLayout({
  name: 'calculateFalloff',
  type: 'float',
  inputs: [
    { name: 'dist', type: 'float' },
    { name: 'radius', type: 'float' },
    { name: 'falloffType', type: 'int' },
  ],
});

/** GPU force from a single field acting on a particle. */
export const calculateForceFieldForce = /*#__PURE__*/ Fn((
  [particlePos, fieldType, fieldPos, fieldDir, fieldAxis, strength, radius, falloffType, turbScale, noiseSpeed],
) => {
  const force = vec3(0).toVar();
  const toField = fieldPos.sub(particlePos).toVar();
  const dist = length(toField).toVar();

  If(dist.greaterThan(radius), () => {
    return vec3(0);
  });

  const falloff = calculateFalloff(dist, radius, falloffType).toVar();
  const dirToField = normalize(toField).toVar();

  If(fieldType.equal(int(ForceFieldType.ATTRACTOR)), () => {
    force.assign(dirToField.mul(strength).mul(falloff));
  })
    .ElseIf(fieldType.equal(int(ForceFieldType.REPELLER)), () => {
      force.assign(dirToField.negate().mul(strength).mul(falloff));
    })
    .ElseIf(fieldType.equal(int(ForceFieldType.VORTEX)), () => {
      const axis = normalize(fieldAxis);
      const radial = toField.sub(axis.mul(dot(toField, axis))).toVar();
      const radialDist = length(radial);
      If(radialDist.greaterThan(0.001), () => {
        const radialDir = normalize(radial);
        const tangent = cross(axis, radialDir);
        const tangentForce = tangent.mul(strength).mul(falloff);
        const inwardForce = radialDir.negate().mul(strength.mul(0.3)).mul(falloff);
        const liftForce = axis.mul(strength.mul(0.2)).mul(falloff);
        force.assign(tangentForce.add(inwardForce).add(liftForce));
      });
    })
    .ElseIf(fieldType.equal(int(ForceFieldType.TURBULENCE)), () => {
      const noisePos = particlePos.mul(turbScale);
      const turbulence = triNoise3Dvec(noisePos, noiseSpeed, time).sub(0.5).mul(2.0);
      force.assign(turbulence.mul(strength).mul(falloff));
    })
    .ElseIf(fieldType.equal(int(ForceFieldType.DIRECTIONAL)), () => {
      const windDir = normalize(fieldDir);
      force.assign(windDir.mul(strength).mul(falloff));
    })
    .ElseIf(fieldType.equal(int(ForceFieldType.VORTEX_TUBE)), () => {
      const axis = normalize(fieldAxis);
      const axisProjection = dot(toField, axis);
      const radial = toField.sub(axis.mul(axisProjection)).toVar();
      const radialDist = length(radial);
      If(radialDist.greaterThan(0.001), () => {
        const radialDir = normalize(radial);
        const tangent = cross(axis, radialDir);
        const tangentForce = tangent.mul(strength.mul(2.0)).mul(falloff);
        const inwardForce = radialDir.negate().mul(strength.mul(0.8)).mul(falloff);
        const heightFactor = float(1).sub(axisProjection.abs().div(radius)).max(0);
        const liftForce = axis.mul(strength.mul(0.5)).mul(falloff).mul(heightFactor);
        force.assign(tangentForce.add(inwardForce).add(liftForce));
      });
    })
    .ElseIf(fieldType.equal(int(ForceFieldType.SPHERICAL)), () => {
      const pulseFactor = sin(time.mul(2.0)).mul(0.5).add(0.5);
      force.assign(dirToField.mul(strength).mul(falloff).mul(pulseFactor));
    })
    .ElseIf(fieldType.equal(int(ForceFieldType.CURL_NOISE)), () => {
      const eps = float(0.1);
      const noisePos = particlePos.mul(turbScale);
      const n1 = triNoise3Dvec(noisePos.add(vec3(eps, 0, 0)), noiseSpeed, time);
      const n2 = triNoise3Dvec(noisePos.sub(vec3(eps, 0, 0)), noiseSpeed, time);
      const dx = n1.sub(n2).div(eps.mul(2.0));
      const n3 = triNoise3Dvec(noisePos.add(vec3(0, eps, 0)), noiseSpeed, time);
      const n4 = triNoise3Dvec(noisePos.sub(vec3(0, eps, 0)), noiseSpeed, time);
      const dy = n3.sub(n4).div(eps.mul(2.0));
      const n5 = triNoise3Dvec(noisePos.add(vec3(0, 0, eps)), noiseSpeed, time);
      const n6 = triNoise3Dvec(noisePos.sub(vec3(0, 0, eps)), noiseSpeed, time);
      const dz = n5.sub(n6).div(eps.mul(2.0));
      const curl = vec3(dz.y.sub(dy.z), dx.z.sub(dz.x), dy.x.sub(dx.y));
      force.assign(curl.mul(strength).mul(falloff));
    });

  return force;
}).setLayout({
  name: 'calculateForceFieldForce',
  type: 'vec3',
  inputs: [
    { name: 'particlePos', type: 'vec3' },
    { name: 'fieldType', type: 'int' },
    { name: 'fieldPos', type: 'vec3' },
    { name: 'fieldDir', type: 'vec3' },
    { name: 'fieldAxis', type: 'vec3' },
    { name: 'strength', type: 'float' },
    { name: 'radius', type: 'float' },
    { name: 'falloffType', type: 'int' },
    { name: 'turbScale', type: 'float' },
    { name: 'noiseSpeed', type: 'float' },
  ],
});

/** CPU manager: holds up to maxFields fields and packs them into GPU uniforms. */
export class ForceFieldManager {
  constructor(maxFields = 8) {
    this.fields = [];
    this.maxFields = maxFields;
    this.initUniforms();
  }

  initUniforms() {
    this.fieldCountUniform = uniform(0, 'int');
    this.fieldTypesUniform = uniform(new Int32Array(this.maxFields));
    this.fieldPositionsUniform = uniform(new Float32Array(this.maxFields * 3));
    this.fieldDirectionsUniform = uniform(new Float32Array(this.maxFields * 3));
    this.fieldAxesUniform = uniform(new Float32Array(this.maxFields * 3));
    this.fieldStrengthsUniform = uniform(new Float32Array(this.maxFields));
    this.fieldRadiiUniform = uniform(new Float32Array(this.maxFields));
    this.fieldFalloffsUniform = uniform(new Int32Array(this.maxFields));
    this.fieldTurbScalesUniform = uniform(new Float32Array(this.maxFields));
    this.fieldNoiseSpeedsUniform = uniform(new Float32Array(this.maxFields));
  }

  addField(config = {}) {
    if (this.fields.length >= this.maxFields) {
      console.warn(`Maximum force fields (${this.maxFields}) reached`);
      return -1;
    }
    const field = { ...DEFAULT_FORCE_FIELD, ...config };
    this.fields.push(field);
    this.updateUniforms();
    return this.fields.length - 1;
  }

  removeField(index) {
    if (index >= 0 && index < this.fields.length) {
      this.fields.splice(index, 1);
      this.updateUniforms();
    }
  }

  getField(index) {
    return this.fields[index];
  }

  updateField(index, updates) {
    if (index >= 0 && index < this.fields.length) {
      Object.assign(this.fields[index], updates);
      this.updateUniforms();
    }
  }

  clearFields() {
    this.fields = [];
    this.updateUniforms();
  }

  addPreset(presetName) {
    return this.addField(FORCE_FIELD_PRESETS[presetName]);
  }

  updateUniforms() {
    const activeFields = this.fields.filter((f) => f.enabled);
    this.fieldCountUniform.value = activeFields.length;

    const types = new Int32Array(this.maxFields);
    const positions = new Float32Array(this.maxFields * 3);
    const directions = new Float32Array(this.maxFields * 3);
    const axes = new Float32Array(this.maxFields * 3);
    const strengths = new Float32Array(this.maxFields);
    const radii = new Float32Array(this.maxFields);
    const falloffs = new Int32Array(this.maxFields);
    const turbScales = new Float32Array(this.maxFields);
    const noiseSpeeds = new Float32Array(this.maxFields);

    activeFields.forEach((field, i) => {
      types[i] = field.type;
      positions[i * 3 + 0] = field.position.x;
      positions[i * 3 + 1] = field.position.y;
      positions[i * 3 + 2] = field.position.z;
      directions[i * 3 + 0] = field.direction.x;
      directions[i * 3 + 1] = field.direction.y;
      directions[i * 3 + 2] = field.direction.z;
      axes[i * 3 + 0] = field.vortexAxis.x;
      axes[i * 3 + 1] = field.vortexAxis.y;
      axes[i * 3 + 2] = field.vortexAxis.z;
      strengths[i] = field.strength;
      radii[i] = field.radius;
      falloffs[i] = field.falloff;
      turbScales[i] = field.turbulenceScale;
      noiseSpeeds[i] = field.noiseSpeed;
    });

    this.fieldTypesUniform.value = types;
    this.fieldPositionsUniform.value = positions;
    this.fieldDirectionsUniform.value = directions;
    this.fieldAxesUniform.value = axes;
    this.fieldStrengthsUniform.value = strengths;
    this.fieldRadiiUniform.value = radii;
    this.fieldFalloffsUniform.value = falloffs;
    this.fieldTurbScalesUniform.value = turbScales;
    this.fieldNoiseSpeedsUniform.value = noiseSpeeds;
  }

  getFields() {
    return [...this.fields];
  }

  getFieldCount() {
    return this.fields.filter((f) => f.enabled).length;
  }
}
