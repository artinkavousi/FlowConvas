// @ts-nocheck
/**
 * MlsMpmSolverShowcase — bridge-driven live showcase.
 * Runs the 3D MLS-MPM solver standalone (no boundaries / postfx / audio) and renders its particle
 * buffer as GPU points using the AURORA PointRenderer pattern (THREE.Points + InstancedBufferGeometry
 * + PointsNodeMaterial reading the struct buffer). Center gravity pulls particles into a churning
 * Anadol-style blob. Controls drive particle count / speed / noise / gravity / stiffness live.
 */

import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { Fn, instanceIndex, vec3, vec4, float, uniform } from 'three/tsl';
import { MlsMpmSolver } from './MlsMpmSolver.module';

const BRIDGE_ID = 'mls-mpm-solver';
const MAX_PARTICLES = 8192 * 2; // 16384 — VM-friendly cap

function restDensityFor(count: number) {
  const level = Math.max(count / 8192, 1);
  return 0.25 * level * 1.0; // updateParticleParams: 0.25 * level * density(=1)
}

export default function MlsMpmSolverShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef<any>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);
  const particleCount = Math.min(Math.round((values?.particleCount as number) ?? 12000), MAX_PARTICLES);
  const speed = (values?.speed as number) ?? 1.5;
  const noise = (values?.noise as number) ?? 1.0;
  const stiffness = (values?.stiffness as number) ?? 3.0;
  const gravityType = Math.round((values?.gravityType as number) ?? 2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 50);
    camera.position.set(0, 0.6, -0.9);
    camera.lookAt(0, 0.5, 0.15);

    const solver = new MlsMpmSolver(renderer, {
      maxParticles: MAX_PARTICLES,
      gridSize: new THREE.Vector3(64, 64, 64),
    });

    const sizeU = uniform(2.5);

    // Live params object (mutated by the control effects below).
    const params = {
      numParticles: 12000,
      dt: 1.5,
      noise: 1.0,
      stiffness: 3.0,
      restDensity: restDensityFor(12000),
      dynamicViscosity: 0.1,
      gravityType: 2,
      gravity: new THREE.Vector3(0, 0, 0),
      mouseRayOrigin: new THREE.Vector3(),
      mouseRayDirection: new THREE.Vector3(),
      mouseForce: new THREE.Vector3(),
      transferMode: 2,
      flipRatio: 0.95,
      vorticityEnabled: false,
      vorticityEpsilon: 0.0,
      surfaceTensionEnabled: false,
      surfaceTensionCoeff: 0.5,
      sparseGrid: true,
      adaptiveTimestep: true,
      cflTarget: 0.7,
    };
    paramsRef.current = { params, setSize: (v: number) => { sizeU.value = v; } };

    // Render the particle buffer as billboarded sprites (mesh-based — renders reliably here). The
    // struct position (gridSize 0..64 space) is mapped to a centered unit cube inside the node.
    const sc = 1 / 64;
    const material = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false });
    material.positionNode = Fn(() => {
      const p = solver.particleBuffer.element(instanceIndex).get('position');
      return p.mul(vec3(sc, sc, sc * 0.4)).sub(vec3(0.5, 0, 0));
    })();
    material.scaleNode = Fn(() => sizeU.mul(0.001))();
    material.colorNode = Fn(() => vec4(solver.particleBuffer.element(instanceIndex).get('color'), 1))();
    const points = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), material, MAX_PARTICLES);
    points.frustumCulled = false;
    points.count = params.numParticles;
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
    const clock = new THREE.Clock();
    solver.init().then(() => {
      if (disposed) return;
      renderer.setAnimationLoop(async () => {
        const dt = clock.getDelta();
        const t = clock.getElapsedTime();
        points.count = params.numParticles;
        await solver.update(params, dt, t);
        await renderer.renderAsync(scene, camera);
      });
    });

    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      ro.disconnect();
      points.geometry.dispose();
      material.dispose();
      renderer.dispose();
      paramsRef.current = null;
    };
  }, []);

  // Drive live params from the bridge.
  useEffect(() => {
    const p = paramsRef.current?.params;
    if (!p) return;
    p.numParticles = particleCount;
    p.restDensity = restDensityFor(particleCount);
  }, [particleCount]);
  useEffect(() => { if (paramsRef.current) paramsRef.current.params.dt = speed; }, [speed]);
  useEffect(() => { if (paramsRef.current) paramsRef.current.params.noise = noise; }, [noise]);
  useEffect(() => { if (paramsRef.current) paramsRef.current.params.stiffness = stiffness; }, [stiffness]);
  useEffect(() => { if (paramsRef.current) paramsRef.current.params.gravityType = gravityType; }, [gravityType]);

  return (
    <div className="h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
