import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { Fn, instanceIndex, uniform, float, time, sin, length, vec2 } from 'three/tsl';
import { createTslComputeField2D } from './TslComputeField2D.module';
import { cellCoord } from '../math/TslGridSampling.module';
import { createTslFieldColorDisplay } from '../rendering/screenspace/TslFieldColorDisplay.module';

const BRIDGE_ID = 'tsl-compute-field-2d';
const SIZE = 128;

// Demonstrates the GPGPU substrate on a NON-fluid kernel: animated radial ripples in a
// storage field, dispatched each frame and shown via the field-color display.
export default function TslComputeField2DShowcase() {
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

    const field = createTslComputeField2D({ width: SIZE, height: SIZE });
    const val = field.make('val');
    const gridSize = uniform(float(SIZE));
    const frequency = uniform(float(40));
    const speed = uniform(float(2));

    const kernel = Fn(() => {
      const i = instanceIndex;
      const c = cellCoord(i, gridSize);
      const p = vec2(c.x, c.y).div(gridSize).sub(0.5);
      const d = length(p);
      val.element(i).assign(sin(d.mul(frequency).sub(time.mul(speed))).mul(0.5).add(0.5));
    })().compute(SIZE * SIZE);

    const display = createTslFieldColorDisplay({ gridSize, fieldR: val });
    display.addTo(scene);

    const resize = () => renderer.setSize(canvas.clientWidth || 1, canvas.clientHeight || 1, false);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    renderer.setAnimationLoop(async () => {
      await field.dispatch(renderer, kernel);
      renderer.render(scene, camera);
    });

    engineRef.current = {
      update: (params) => {
        const v = (params ?? {}) as Record<string, unknown>;
        if (v.frequency !== undefined) frequency.value = Number(v.frequency);
        if (v.speed !== undefined) speed.value = Number(v.speed);
      },
      dispose: () => {
        ro.disconnect();
        renderer.setAnimationLoop(null);
        display.dispose();
        field.dispose();
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
