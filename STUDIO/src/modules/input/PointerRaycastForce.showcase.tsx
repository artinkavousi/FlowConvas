/**
 * PointerRaycastForceShowcase — bridge-driven live showcase.
 * A perspective scene with an interaction plane; a sphere tracks the pointer's ray↔plane
 * intersection and a ring scales with the per-move force — proving the model works standalone
 * (no MLS-MPM needed). Move the pointer over the canvas.
 */

import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three';
import { createPointerRaycastForce } from './PointerRaycastForce.module';

const BRIDGE_ID = 'pointer-raycast-force';

export default function PointerRaycastForceShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ setPlane(d: number): void; setForceScale(s: number): void } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);
  const planeDepth = (values?.planeDepth as number) ?? 0.2;
  const forceScale = (values?.forceScale as number) ?? 30;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
    camera.position.set(0, 0, 3);
    camera.lookAt(0, 0, 0);

    const grid = new THREE.GridHelper(4, 16, 0x2dd4bf, 0x334155);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = 0.2;
    scene.add(grid);

    const follower = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0x2dd4bf }),
    );
    scene.add(follower);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.12, 0.16, 32),
      new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
    );
    scene.add(ring);

    const pointer = createPointerRaycastForce(canvas, camera, {
      planeNormal: [0, 0, -1],
      planeConstant: planeDepth,
      forceScale,
    });
    stateRef.current = {
      setPlane: (d) => pointer.setPlane([0, 0, -1], d),
      setForceScale: (s) => pointer.setForceScale(s),
    };

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

    let raf = 0;
    const tick = () => {
      const { point, force, active } = pointer.read();
      follower.position.copy(point);
      ring.position.copy(point);
      const mag = Math.min(force.length(), 2);
      const s = 1 + mag * 2;
      ring.scale.setScalar(s);
      (ring.material as THREE.MeshBasicMaterial).opacity = active ? 0.25 + Math.min(mag, 1) * 0.7 : 0.1;
      follower.visible = active;
      pointer.tick();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      pointer.dispose();
      follower.geometry.dispose();
      (follower.material as THREE.Material).dispose();
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
      renderer.dispose();
      stateRef.current = null;
    };
  }, []);

  useEffect(() => {
    stateRef.current?.setPlane(planeDepth);
  }, [planeDepth]);
  useEffect(() => {
    stateRef.current?.setForceScale(forceScale);
  }, [forceScale]);

  return (
    <div className="h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
