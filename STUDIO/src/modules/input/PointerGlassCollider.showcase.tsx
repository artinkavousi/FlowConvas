import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { createAdaptiveOpenFrontBoxRoom } from '../rendering/environments/AdaptiveOpenFrontBoxRoom.module';
import { createBounceRigidSphereAdapter } from '../physics/particles/BounceRigidSphereAdapter.module';
import { createUniversalPhysicsParticles } from '../physics/particles/UniversalPhysicsParticleSystem.module';
import { createPointerGlassCollider } from './PointerGlassCollider.module';

const BRIDGE_ID = 'pointer-glass-collider';

export default function PointerGlassColliderShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<{ update(p: unknown): void; resize(): void; dispose(): void } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    renderer.shadowMap.enabled = true;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    const adapter = createBounceRigidSphereAdapter();
    const room = createAdaptiveOpenFrontBoxRoom(scene, {});
    let particles = createUniversalPhysicsParticles(scene, adapter, { particleRadius: 0.45, particleCount: 36 });
    const collider = createPointerGlassCollider(canvas, camera, adapter, scene, {});

    let last = performance.now();
    const resize = () => {
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      renderer.setSize(w, h, false);
      adapter.clearStaticColliders();
      const bounds = room.rebuild(w, h, { createCollisionWall: (wall) => adapter.createBoxCollider(wall) });
      room.fitCamera(camera, w, h);
      particles.rebuild(bounds);
      collider.resize(bounds);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    renderer.setAnimationLoop(() => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      collider.update(dt, particles.particles);
      adapter.step(1 / 60, dt);
      particles.sync();
      renderer.render(scene, camera);
    });

    engineRef.current = {
      update: (params) => collider.setOptions(params as Record<string, unknown>),
      resize,
      dispose: () => {
        ro.disconnect();
        renderer.setAnimationLoop(null);
        collider.dispose();
        particles.dispose();
        room.dispose();
        adapter.dispose();
        renderer.dispose();
      },
    };
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.update(values ?? {});
  }, [values]);

  return (
    <div className="h-full w-full bg-black">
      <canvas ref={canvasRef} className="block h-full w-full touch-none" />
    </div>
  );
}
