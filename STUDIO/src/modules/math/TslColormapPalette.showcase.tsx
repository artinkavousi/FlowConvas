/**
 * TslColormapPaletteShowcase — bridge-driven live showcase.
 * Maps UV.x → t through the selected gradient's GPU sampler on a fullscreen quad. Switching the
 * palette rebuilds the colorNode — proving the colormap library applies to any 0..1 field.
 */

import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { uv } from 'three/tsl';
import { createGradientSamplerTSL, getGradient } from './TslColormapPalette.module';

const BRIDGE_ID = 'tsl-colormap-palette';

export default function TslColormapPaletteShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<{ setPalette(name: string): void } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);
  const palette = (values?.palette as string) ?? 'AURORA';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const material = new THREE.MeshBasicNodeMaterial();
    const applyPalette = (name: string) => {
      const gradient = getGradient(name) ?? getGradient('AURORA');
      const sampler = createGradientSamplerTSL(gradient);
      material.colorNode = sampler(uv().x);
      material.needsUpdate = true;
    };
    applyPalette(palette);
    apiRef.current = { setPalette: applyPalette };

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const resize = () => renderer.setSize(canvas.clientWidth || 1, canvas.clientHeight || 1, false);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    renderer.setAnimationLoop(() => {
      renderer.renderAsync(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      ro.disconnect();
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      renderer.dispose();
      apiRef.current = null;
    };
  }, []);

  useEffect(() => {
    apiRef.current?.setPalette(palette);
  }, [palette]);

  return (
    <div className="h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
