import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { uniform, float, instancedArray } from 'three/tsl';
import { createTslFieldColorDisplay } from './TslFieldColorDisplay.module';

const BRIDGE_ID = 'tsl-field-color-display';
const SIZE = 128;

// Demonstrates the display on an ARBITRARY (non-fluid) field: a static RGB gradient.
export default function TslFieldColorDisplayShowcase() {
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

    const dataR = new Float32Array(SIZE * SIZE);
    const dataG = new Float32Array(SIZE * SIZE);
    const dataB = new Float32Array(SIZE * SIZE);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const i = y * SIZE + x;
        dataR[i] = x / SIZE;
        dataG[i] = y / SIZE;
        dataB[i] = 1 - x / SIZE;
      }
    }
    const fieldR = instancedArray(dataR, 'float');
    const fieldG = instancedArray(dataG, 'float');
    const fieldB = instancedArray(dataB, 'float');
    const gridSize = uniform(float(SIZE));
    const exposure = uniform(float(1));

    const display = createTslFieldColorDisplay({ gridSize, fieldR, fieldG, fieldB });
    display.material.colorNode = display.colorNode().mul(exposure);
    display.addTo(scene);

    const resize = () => renderer.setSize(canvas.clientWidth || 1, canvas.clientHeight || 1, false);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    renderer.setAnimationLoop(() => renderer.render(scene, camera));

    engineRef.current = {
      update: (params) => {
        const v = (params ?? {}) as Record<string, unknown>;
        if (v.exposure !== undefined) exposure.value = Number(v.exposure);
      },
      dispose: () => {
        ro.disconnect();
        renderer.setAnimationLoop(null);
        display.dispose();
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
