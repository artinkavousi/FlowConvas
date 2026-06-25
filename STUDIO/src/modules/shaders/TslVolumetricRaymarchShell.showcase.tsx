import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { createTslVolumetricRaymarchShellMaterial } from './TslVolumetricRaymarchShell.module';

const BRIDGE_ID = 'tsl-volumetric-raymarch-shell';

export default function TslVolumetricRaymarchShellShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<{ update(p: unknown): void; resize(): void; dispose(): void } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x010101);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 3);
    const shell = createTslVolumetricRaymarchShellMaterial({});
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), shell.material);
    scene.add(mesh);

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
    renderer.setAnimationLoop(() => {
      mesh.rotation.y += 0.002;
      renderer.render(scene, camera);
    });

    engineRef.current = {
      update: (params) => shell.update(params as Record<string, unknown>),
      resize,
      dispose: () => {
        ro.disconnect();
        renderer.setAnimationLoop(null);
        mesh.geometry.dispose();
        shell.dispose();
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
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
