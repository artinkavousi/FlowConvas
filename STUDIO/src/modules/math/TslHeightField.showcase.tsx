// @ts-nocheck
/**
 * TslHeightFieldShowcase — bridge-driven live showcase.
 * Samples the FBM height field over UV space and shades it by its finite-difference normal with a
 * fixed light — a standalone terrain preview with no grass/domain context.
 */

import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { uv, vec2, vec3, vec4, float, uniform, normalize, dot, max, mix } from 'three/tsl';
import { getTerrainHeight, getTerrainNormal } from './TslHeightField';

const BRIDGE_ID = 'tsl-height-field';

export default function TslHeightFieldShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uniformsRef = useRef<{
    amp: { value: number };
    freq: { value: number };
    seed: { value: number };
    scale: { value: number };
  } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);
  const amp = (values?.amp as number) ?? 1.5;
  const freq = (values?.freq as number) ?? 0.05;
  const seed = (values?.seed as number) ?? 0;
  const scale = (values?.scale as number) ?? 40;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const ampU = uniform(amp);
    const freqU = uniform(freq);
    const seedU = uniform(seed);
    const scaleU = uniform(scale);
    uniformsRef.current = { amp: ampU, freq: freqU, seed: seedU, scale: scaleU };

    const material = new THREE.MeshBasicNodeMaterial();
    const uvN = uv();
    const xz = uvN.sub(0.5).mul(scaleU);
    const hFn = getTerrainHeight(ampU, freqU, seedU);
    const nFn = getTerrainNormal(hFn);
    const h = hFn(xz);
    const n = nFn(xz);
    const lightDir = normalize(vec3(0.4, 0.9, 0.3));
    const shade = max(dot(n, lightDir), float(0.15));
    const low = vec3(0.06, 0.12, 0.16);
    const high = vec3(0.24, 0.55, 0.35);
    const hNorm = h.div(ampU.add(0.0001)).mul(0.5).add(0.5);
    material.colorNode = vec4(mix(low, high, hNorm).mul(shade), 1);

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
    if (uniformsRef.current) uniformsRef.current.amp.value = amp;
  }, [amp]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.freq.value = freq;
  }, [freq]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.seed.value = seed;
  }, [seed]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.scale.value = scale;
  }, [scale]);

  return (
    <div className="h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
