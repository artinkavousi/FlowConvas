import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { createEquirectangularNodeEnvironment } from './EquirectangularNodeEnvironment.module';
import nebulaUrl from './assets/singularity-nebula.png?url';

const BRIDGE_ID = 'equirectangular-node-environment';

export default function EquirectangularNodeEnvironmentShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<{ update(p: unknown): void; resize(): void; dispose(): void } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 3);
    const environment = createEquirectangularNodeEnvironment(scene, nebulaUrl, {});
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.8, 3),
      new THREE.MeshStandardMaterial({ color: 0x11151f, roughness: 0.35, metalness: 0.1 }),
    );
    scene.add(mesh);
    const light = new THREE.PointLight(0xffd7a0, 3);
    light.position.set(2, 2, 3);
    scene.add(light);

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
      mesh.rotation.y += 0.004;
      renderer.render(scene, camera);
    });

    engineRef.current = {
      update: (params) => environment.update(params as Record<string, unknown>),
      resize,
      dispose: () => {
        ro.disconnect();
        renderer.setAnimationLoop(null);
        environment.dispose();
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
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
