// @ts-nocheck
/**
 * TslVoronoiClumpShowcase — bridge-driven live showcase.
 * Colors a grid by its nearest Voronoi cell id (via tsl-pcg-hash) and darkens cell borders by the
 * center factor — a standalone cellular pattern with no grass/domain context.
 */

import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { uv, vec3, vec4, float, int, floor, uniform, mix } from 'three/tsl';
import { createVoronoiClump } from './TslVoronoiClump';
import { hash2to1, hash2to2 } from './TslPcgHash';

const BRIDGE_ID = 'tsl-voronoi-clump';

export default function TslVoronoiClumpShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uniformsRef = useRef<{
    grid: { value: number };
    cellSize: { value: number };
    smoothness: { value: number };
  } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);
  const grid = (values?.grid as number) ?? 64;
  const cellSize = (values?.cellSize as number) ?? 8;
  const smoothness = (values?.smoothness as number) ?? 0.2;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const gridU = uniform(grid);
    const cellSizeU = uniform(cellSize);
    const smoothnessU = uniform(smoothness);
    uniformsRef.current = { grid: gridU, cellSize: cellSizeU, smoothness: smoothnessU };

    const material = new THREE.MeshBasicNodeMaterial();
    const uvN = uv();
    const gx = int(floor(uvN.x.mul(gridU)));
    const gz = int(floor(uvN.y.mul(gridU)));
    const clump = createVoronoiClump(hash2to2, cellSizeU, smoothnessU, float(1.0));
    const info = clump(gx, gz);
    const cellColor = vec3(
      hash2to1(int(info.bestID.x), int(info.bestID.y)),
      hash2to1(int(info.bestID.x).add(13), int(info.bestID.y).add(7)),
      hash2to1(int(info.bestID.x).add(91), int(info.bestID.y).add(31)),
    );
    // Darken cell borders (low centerFactor) to reveal the cellular structure
    const shaded = mix(cellColor.mul(0.15), cellColor, info.centerFactor);
    material.colorNode = vec4(shaded, 1);

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
    if (uniformsRef.current) uniformsRef.current.grid.value = grid;
  }, [grid]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.cellSize.value = cellSize;
  }, [cellSize]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.smoothness.value = smoothness;
  }, [smoothness]);

  return (
    <div className="h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
