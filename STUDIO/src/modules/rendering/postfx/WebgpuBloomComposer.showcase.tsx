import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { createWebgpuBloomRenderer } from './WebgpuBloomComposer.module';

const BRIDGE_ID = 'webgpu-bloom-composer';

export default function WebgpuBloomComposerShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<{ update(p: unknown): void; resize(): void; dispose(): void } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const bloomRenderer = createWebgpuBloomRenderer(canvas, {});
    const { renderer } = bloomRenderer;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020204);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 4);
    const mesh = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.7, 0.18, 160, 24),
      new THREE.MeshStandardMaterial({ color: 0xffb36b, emissive: 0xff8a1f, emissiveIntensity: 2.5, roughness: 0.25 }),
    );
    scene.add(mesh);
    const light = new THREE.PointLight(0xffd7a0, 6);
    light.position.set(2, 2, 3);
    scene.add(light);

    const resize = () => {
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      bloomRenderer.resize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    renderer.setAnimationLoop(() => {
      mesh.rotation.x += 0.003;
      mesh.rotation.y += 0.006;
      bloomRenderer.render(scene, camera);
    });

    engineRef.current = {
      update: (params) => bloomRenderer.update(params as Record<string, unknown>),
      resize,
      dispose: () => {
        ro.disconnect();
        renderer.setAnimationLoop(null);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        bloomRenderer.dispose();
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
