import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import {
  adaptiveOpenFrontBoxRoomDefaults,
  createAdaptiveOpenFrontBoxRoom,
} from './AdaptiveOpenFrontBoxRoom.module';

const BRIDGE_ID = 'adaptive-open-front-box-room';

export default function AdaptiveOpenFrontBoxRoomShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<{ update(p: unknown): void; resize(): void; dispose(): void } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.55;
    renderer.shadowMap.enabled = true;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    const room = createAdaptiveOpenFrontBoxRoom(scene, adaptiveOpenFrontBoxRoomDefaults);
    const light = new THREE.PointLight(0xffffff, 55);
    light.position.set(0, 4, 2.5);
    light.castShadow = true;
    scene.add(light);

    const resize = () => {
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      renderer.setSize(w, h, false);
      room.rebuild(w, h);
      room.fitCamera(camera, w, h);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    renderer.setAnimationLoop(() => renderer.render(scene, camera));

    engineRef.current = {
      update: (params) => {
        room.update(params as Record<string, unknown>);
        resize();
      },
      resize,
      dispose: () => {
        ro.disconnect();
        renderer.setAnimationLoop(null);
        room.dispose();
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
