// @ts-nocheck
/**
 * ParticleBoundariesShowcase — bridge-driven live showcase.
 * A standalone GPU point cloud (plain instancedArray, NO MLS-MPM) falls under gravity and is contained
 * by the boundary's generateCollisionTSL response — switch BOX / SPHERE / CYLINDER and watch the cloud
 * settle into that shape. Proves the boundary collision is reusable on any particle system.
 */

import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { Fn, instanceIndex, instancedArray, vec3, vec4, float, uint, uniform, hash, length } from 'three/tsl';
import { ParticleBoundaries, BoundaryShape } from './ParticleBoundaries.module';

const BRIDGE_ID = 'particle-boundaries';
const COUNT = 4000;
const GRID = 64;

const SHAPE_MAP: Record<string, number> = {
  BOX: BoundaryShape.BOX,
  SPHERE: BoundaryShape.SPHERE,
  CYLINDER: BoundaryShape.CYLINDER,
};

export default function ParticleBoundariesShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<any>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);
  const shape = (values?.shape as string) ?? 'BOX';
  const gravity = (values?.gravity as number) ?? 12;
  const restitution = (values?.restitution as number) ?? 0.3;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.01, 50);
    camera.position.set(0, 0, 1.7);
    camera.lookAt(0, 0, 0);

    const boundaries = new ParticleBoundaries({
      gridSize: new THREE.Vector3(GRID, GRID, GRID),
      wallThickness: 2,
      wallStiffness: 0.3,
      restitution: 0.2,
      friction: 0.15,
      visualize: false, // viz mesh skipped — containment shape is visible from the particle cloud
      audioReactive: false,
      useViewportTracking: false,
    });

    const pos = instancedArray(COUNT, 'vec3');
    const vel = instancedArray(COUNT, 'vec3');

    // collision uniforms (mirror how the MLS-MPM solver calls generateCollisionTSL)
    const dtU = uniform(0.0);
    const shapeTypeU = uniform(BoundaryShape.BOX, 'int');
    const shapeMinU = uniform(new THREE.Vector3(3, 3, 3));
    const shapeMaxU = uniform(new THREE.Vector3(GRID - 3, GRID - 3, GRID - 3));
    const shapeCenterU = uniform(new THREE.Vector3(GRID / 2, GRID / 2, GRID / 2));
    const shapeRadiusU = uniform(GRID / 2 - 3);
    const restitutionU = uniform(0.3);
    const dampingU = uniform(0.985);
    const enabledU = uniform(1, 'int');
    const gravityU = uniform(12);

    function syncFromBoundaries() {
      const b = boundaries.getBoundaryUniforms();
      shapeTypeU.value = b.shapeInt;
      shapeMinU.value.copy(b.wallMin);
      shapeMaxU.value.copy(b.wallMax);
      shapeCenterU.value.copy(b.gridCenter);
      shapeRadiusU.value = b.boundaryRadius;
      enabledU.value = b.enabled ? 1 : 0;
    }
    api.current = {
      gravity: gravityU,
      restitution: restitutionU,
      setShape: async (s: number) => { await boundaries.setShape(s); boundaries.setEnabled(true); syncFromBoundaries(); },
    };

    const initKernel = Fn(() => {
      const h = hash(instanceIndex);
      const h2 = hash(instanceIndex.add(uint(131)));
      const h3 = hash(instanceIndex.add(uint(977)));
      // spawn in an upper-central cube so they fall and fill the container
      pos.element(instanceIndex).assign(
        vec3(h.mul(40).add(12), h2.mul(20).add(40), h3.mul(40).add(12)),
      );
      vel.element(instanceIndex).assign(vec3(0));
    })().compute(COUNT);

    const updateKernel = Fn(() => {
      const p = pos.element(instanceIndex).toVar();
      const v = vel.element(instanceIndex).toVar();
      v.y.subAssign(gravityU.mul(dtU)); // gravity down
      boundaries.generateCollisionTSL(p, v, {
        dt: dtU,
        shapeType: shapeTypeU,
        shapeMin: shapeMinU,
        shapeMax: shapeMaxU,
        shapeCenter: shapeCenterU,
        shapeRadius: shapeRadiusU,
        restitution: restitutionU,
        damping: dampingU,
        enabled: enabledU,
      });
      v.mulAssign(0.992); // mild damping for settling
      p.addAssign(v.mul(dtU));
      pos.element(instanceIndex).assign(p);
      vel.element(instanceIndex).assign(v);
    })().compute(COUNT);

    // sprite render (mesh-based — renders here; map gridSize 0..64 → centered unit cube)
    const sc = 1 / GRID;
    const material = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false });
    material.positionNode = Fn(() => pos.element(instanceIndex).mul(sc).sub(vec3(0.5, 0.5, 0.5)))();
    material.scaleNode = Fn(() => float(0.008))();
    material.colorNode = Fn(() => {
      const speed = length(vel.element(instanceIndex));
      const t = speed.mul(0.05).clamp(0, 1);
      return vec4(vec3(0.25, 0.7, 1.0).add(vec3(0.7, -0.2, -0.5).mul(t)), 0.9);
    })();
    const sprites = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), material, COUNT);
    sprites.count = COUNT;
    sprites.frustumCulled = false;
    scene.add(sprites);

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
    const clock = new THREE.Clock();
    (async () => {
      await renderer.init();
      await boundaries.init();
      await boundaries.setShape(SHAPE_MAP[shape] ?? BoundaryShape.BOX);
      boundaries.setEnabled(true);
      syncFromBoundaries();
      restitutionU.value = restitution;
      gravityU.value = gravity;
      await renderer.computeAsync(initKernel);
      if (disposed) return;
      renderer.setAnimationLoop(async () => {
        const dt = Math.min(clock.getDelta(), 1 / 60);
        dtU.value = dt * 6; // match AURORA's dt scaling
        theta += 0.002;
        camera.position.set(Math.sin(theta) * 1.7, 0.15, Math.cos(theta) * 1.7);
        camera.lookAt(0, -0.05, 0);
        await renderer.computeAsync(updateKernel);
        await renderer.renderAsync(scene, camera);
      });
    })();

    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      ro.disconnect();
      sprites.geometry.dispose();
      material.dispose();
      boundaries.dispose?.();
      renderer.dispose();
      api.current = null;
    };
  }, []);

  useEffect(() => { api.current?.setShape(SHAPE_MAP[shape] ?? BoundaryShape.BOX); }, [shape]);
  useEffect(() => { if (api.current) api.current.gravity.value = gravity; }, [gravity]);
  useEffect(() => { if (api.current) api.current.restitution.value = restitution; }, [restitution]);

  return (
    <div className="h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
