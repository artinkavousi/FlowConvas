import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { createAdaptiveOpenFrontBoxRoom } from '../environments/AdaptiveOpenFrontBoxRoom.module';
import {
  createWebgpuSsgiRoomRenderer,
  webgpuSsgiRoomRendererDefaults,
} from './WebgpuSsgiRoomRenderer.module';

const BRIDGE_ID = 'webgpu-ssgi-room-renderer';

export default function WebgpuSsgiRoomRendererShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<{ update(p: unknown): void; resize(): void; dispose(): void } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    const render = createWebgpuSsgiRoomRenderer(canvas, webgpuSsgiRoomRendererDefaults);
    const room = createAdaptiveOpenFrontBoxRoom(scene, {});

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 48, 24),
      new THREE.MeshPhysicalMaterial({ color: 0x2dd4bf, roughness: 0.28, metalness: 0.15 }),
    );
    sphere.position.set(0, 2.2, 0.8);
    sphere.castShadow = true;
    scene.add(sphere);

    const light = new THREE.PointLight(0xffffff, 70);
    light.position.set(0, 4, 2);
    light.castShadow = true;
    scene.add(light);

    const resize = () => {
      render.resize();
      room.fitCamera(camera, canvas.clientWidth || 1, canvas.clientHeight || 1);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    render.renderer.setAnimationLoop(() => {
      sphere.rotation.y += 0.01;
      render.render(scene, camera);
    });

    engineRef.current = {
      update: (params) => render.update(params as Record<string, unknown>),
      resize,
      dispose: () => {
        ro.disconnect();
        render.dispose();
        room.dispose();
        sphere.geometry.dispose();
        (sphere.material as THREE.Material).dispose();
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
