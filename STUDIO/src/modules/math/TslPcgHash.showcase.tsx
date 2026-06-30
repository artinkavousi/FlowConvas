// @ts-nocheck
/**
 * TslPcgHashShowcase — bridge-driven live showcase.
 * Colors an integer grid by hash2to2(cellX, cellY) on a fullscreen quad — a stable, tile-free
 * white-noise field with zero grass/domain context, proving the hash primitive standalone.
 */

import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { uv, vec3, vec4, float, int, floor, uniform } from 'three/tsl';
import { hash2to1, hash2to2 } from './TslPcgHash';

const BRIDGE_ID = 'tsl-pcg-hash';

export default function TslPcgHashShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uniformsRef = useRef<{ cells: { value: number }; mono: { value: number } } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);
  const cells = (values?.cells as number) ?? 48;
  const mono = (values?.mono as boolean) ?? false;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const cellsU = uniform(cells);
    const monoU = uniform(mono ? 1 : 0);
    uniformsRef.current = { cells: cellsU, mono: monoU };

    const material = new THREE.MeshBasicNodeMaterial();
    const uvN = uv();
    const cellX = int(floor(uvN.x.mul(cellsU)));
    const cellY = int(floor(uvN.y.mul(cellsU)));
    const h2 = hash2to2(cellX, cellY);
    const h1 = hash2to1(cellX, cellY);
    const colored = vec3(h2.x, h2.y, h1);
    const grey = vec3(h1);
    material.colorNode = vec4(monoU.greaterThan(float(0.5)).select(grey, colored), 1);

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
      uniformsRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.cells.value = cells;
  }, [cells]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.mono.value = mono ? 1 : 0;
  }, [mono]);

  return (
    <div className="h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
