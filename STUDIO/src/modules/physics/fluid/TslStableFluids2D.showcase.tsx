import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { createTslStableFluids2D } from './TslStableFluids2D.module';
import { createTslFieldColorDisplay } from '../../rendering/screenspace/TslFieldColorDisplay.module';
import { createPointerVelocitySplat } from '../../input/PointerVelocitySplat.module';

const BRIDGE_ID = 'tsl-stable-fluids-2d';

export default function TslStableFluids2DShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<{ update(p: unknown): void; dispose(): void } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const rendererReady = renderer.init();
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const solver = createTslStableFluids2D({ gridSize: 256 });
    const display = createTslFieldColorDisplay({
      gridSize: solver.gridSize,
      fieldR: solver.fields.densityR,
      fieldG: solver.fields.densityG,
      fieldB: solver.fields.densityB,
    });
    display.addTo(scene);

    const postprocessing = new THREE.RenderPipeline(renderer);
    const scenePass = pass(scene, camera);
    const sceneColor = scenePass.getTextureNode('output');
    const bloomNode = bloom(sceneColor, 0.5, 0.1, 0.1);
    postprocessing.outputNode = sceneColor.add(bloomNode);

    const pointer = createPointerVelocitySplat(canvas, { velocityScale: 1 });
    let paused = false;

    const resize = () => renderer.setSize(canvas.clientWidth || 1, canvas.clientHeight || 1, false);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    renderer.setAnimationLoop(async () => {
      await rendererReady;
      const p = pointer.read();
      solver.setPointer(p.x, p.y, p.vx, p.vy);
      if (!paused) await solver.step(renderer);
      postprocessing.render();
      pointer.tick();
    });

    engineRef.current = {
      update: (params) => {
        const v = (params ?? {}) as Record<string, unknown>;
        if (v.paused !== undefined) paused = Boolean(v.paused);
        if (v.bloomStrength !== undefined) bloomNode.strength.value = Number(v.bloomStrength);
        solver.setParams(v);
      },
      dispose: () => {
        ro.disconnect();
        renderer.setAnimationLoop(null);
        pointer.dispose();
        display.dispose();
        solver.dispose();
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
