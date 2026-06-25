import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createWebgpuBloomRenderer } from '../rendering/postfx/WebgpuBloomComposer.module';
import { createSingularityBlackHole, singularityBlackHoleDefaults } from './SingularityBlackHoleMaterial.module';
import noiseUrl from './assets/singularity-noise-deep.png?url';
import nebulaUrl from '../rendering/environments/assets/singularity-nebula.png?url';

const BRIDGE_ID = 'singularity-black-hole-material';

export default function SingularityBlackHoleMaterialShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<{ update(p: unknown): void; resize(): void; dispose(): void } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const bloom = createWebgpuBloomRenderer(canvas, {
      toneMappingExposure: 1.2,
      bloomStrength: 0.217,
      bloomRadius: 0,
      bloomThreshold: 0,
    });
    const { renderer } = bloom;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
    camera.position.set(1, 0.5, 3);
    camera.lookAt(0, 0, 0);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);
    const blackHole = createSingularityBlackHole(scene, {
      ...singularityBlackHoleDefaults,
      noiseUrl,
      nebulaUrl,
    });

    const resize = () => {
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      bloom.resize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    renderer.setAnimationLoop(() => {
      controls.update();
      bloom.render(scene, camera);
    });

    engineRef.current = {
      update: (params) => blackHole.update(params as Record<string, unknown>),
      resize,
      dispose: () => {
        ro.disconnect();
        renderer.setAnimationLoop(null);
        controls.dispose();
        blackHole.dispose();
        bloom.dispose();
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
