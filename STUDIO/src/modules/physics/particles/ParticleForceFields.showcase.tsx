// @ts-nocheck
/**
 * ParticleForceFieldsShowcase — bridge-driven live showcase.
 * A standalone GPU point cloud (plain instancedArray, NO MLS-MPM) integrated under a single force
 * field whose type/strength/radius/falloff come from the bridge — proving calculateForceFieldForce
 * is reusable on any particle system. Switch between attractor / vortex / turbulence / tornado / etc.
 */

import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { Fn, instanceIndex, instancedArray, vec3, vec4, float, uint, uniform, hash, length, clamp } from 'three/tsl';
import { calculateForceFieldForce, ForceFieldType, ForceFalloff } from './ParticleForceFields.module';

const BRIDGE_ID = 'particle-force-fields';
const COUNT = 10000;
const BOX = 64;

const TYPE_MAP: Record<string, number> = {
  ATTRACTOR: ForceFieldType.ATTRACTOR,
  REPELLER: ForceFieldType.REPELLER,
  VORTEX: ForceFieldType.VORTEX,
  TURBULENCE: ForceFieldType.TURBULENCE,
  DIRECTIONAL: ForceFieldType.DIRECTIONAL,
  VORTEX_TUBE: ForceFieldType.VORTEX_TUBE,
  SPHERICAL: ForceFieldType.SPHERICAL,
  CURL_NOISE: ForceFieldType.CURL_NOISE,
};

export default function ParticleForceFieldsShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<{ type: any; strength: any; radius: any } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);
  const fieldType = (values?.fieldType as string) ?? 'VORTEX';
  const strength = (values?.strength as number) ?? 30;
  const radius = (values?.radius as number) ?? 40;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.set(0, 12, 95);
    camera.lookAt(0, 0, 0);

    const pos = instancedArray(COUNT, 'vec3');
    const vel = instancedArray(COUNT, 'vec3');

    const typeU = uniform(TYPE_MAP[fieldType] ?? ForceFieldType.VORTEX, 'int');
    const strengthU = uniform(strength);
    const radiusU = uniform(radius);
    const center = uniform(new THREE.Vector3(0, 0, 0));
    const dir = uniform(new THREE.Vector3(1, 0, 0));
    const axis = uniform(new THREE.Vector3(0, 1, 0));
    const falloffU = uniform(ForceFalloff.QUADRATIC, 'int');
    api.current = { type: typeU, strength: strengthU, radius: radiusU };

    const initKernel = Fn(() => {
      const h = hash(instanceIndex);
      const h2 = hash(instanceIndex.add(uint(101)));
      const h3 = hash(instanceIndex.add(uint(307)));
      pos.element(instanceIndex).assign(
        vec3(h.sub(0.5), h2.sub(0.5), h3.sub(0.5)).mul(BOX),
      );
      vel.element(instanceIndex).assign(vec3(0));
    })().compute(COUNT);

    const dt = float(0.016);
    const updateKernel = Fn(() => {
      const p = pos.element(instanceIndex).toVar();
      const v = vel.element(instanceIndex).toVar();
      const f = calculateForceFieldForce(
        p, typeU, center, dir, axis, strengthU, radiusU, falloffU, float(2.0), float(1.0),
      );
      v.addAssign(f.mul(dt));
      v.mulAssign(0.96); // damping so it stays bounded
      p.addAssign(v.mul(dt));
      // soft-wrap inside the box so the cloud persists
      const half = float(BOX * 0.5);
      p.assign(clamp(p, vec3(half.negate()), vec3(half)));
      pos.element(instanceIndex).assign(p);
      vel.element(instanceIndex).assign(v);
    })().compute(COUNT);

    const geometry = new THREE.InstancedBufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3, false));
    geometry.instanceCount = COUNT;
    const material = new THREE.PointsNodeMaterial({ transparent: true, depthWrite: false });
    material.positionNode = Fn(() => pos.element(instanceIndex))();
    material.colorNode = Fn(() => {
      const speed = length(vel.element(instanceIndex));
      const t = clamp(speed.mul(0.15), 0, 1);
      return vec4(vec3(0.2, 0.6, 1.0).add(vec3(0.8, 0.0, -0.4).mul(t)), 0.85);
    })();
    material.sizeNode = Fn(() => float(2.0))();
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);

    const resize = () => {
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let disposed = false;
    let theta = 0;
    renderer.init().then(async () => {
      if (disposed) return;
      await renderer.computeAsync(initKernel);
      renderer.setAnimationLoop(async () => {
        theta += 0.0015;
        camera.position.set(Math.sin(theta) * 95, 12, Math.cos(theta) * 95);
        camera.lookAt(0, 0, 0);
        await renderer.computeAsync(updateKernel);
        await renderer.renderAsync(scene, camera);
      });
    });

    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      pos.dispose?.();
      vel.dispose?.();
      renderer.dispose();
      api.current = null;
    };
  }, []);

  useEffect(() => {
    if (api.current) api.current.type.value = TYPE_MAP[fieldType] ?? ForceFieldType.VORTEX;
  }, [fieldType]);
  useEffect(() => {
    if (api.current) api.current.strength.value = strength;
  }, [strength]);
  useEffect(() => {
    if (api.current) api.current.radius.value = radius;
  }, [radius]);

  return (
    <div className="h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
