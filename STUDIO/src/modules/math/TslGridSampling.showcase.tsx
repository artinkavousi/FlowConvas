import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { Fn, uv, vec3, vec4, uniform, float, instancedArray } from 'three/tsl';
import { createGridSampling } from './TslGridSampling.module';

const BRIDGE_ID = 'tsl-grid-sampling';
const LOW = 24;

// Demonstrates bilinear sampling: a tiny low-res random field shown smoothly upscaled.
export default function TslGridSamplingShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<{ update(p: unknown): void; dispose(): void } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const data = new Float32Array(LOW * LOW);
    for (let i = 0; i < data.length; i++) data[i] = Math.random();
    const fieldA = instancedArray(data, 'float');
    const gridSize = uniform(float(LOW));
    const scale = uniform(float(1));

    const { bilinearSample } = createGridSampling(gridSize);

    const material = new THREE.MeshBasicNodeMaterial();
    material.colorNode = Fn(() => {
      const p = uv().mul(gridSize).mul(scale);
      const v = bilinearSample(fieldA, p.x.sub(0.5), p.y.sub(0.5));
      return vec4(vec3(v), 1.0);
    })();
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const resize = () => renderer.setSize(canvas.clientWidth || 1, canvas.clientHeight || 1, false);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    renderer.setAnimationLoop(() => renderer.render(scene, camera));

    engineRef.current = {
      update: (params) => {
        const v = (params ?? {}) as Record<string, unknown>;
        if (v.scale !== undefined) scale.value = Number(v.scale);
      },
      dispose: () => {
        ro.disconnect();
        renderer.setAnimationLoop(null);
        mesh.geometry.dispose();
        material.dispose();
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
