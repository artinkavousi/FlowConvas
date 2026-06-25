import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { float, floor, int, time, uniform, uv, vec2, vec3, vec4 } from 'three/tsl';
import {
  calculateWindStrength,
  getTerrainHeight,
  hash2to1,
  shiftHSV,
} from './TslVegetationMath.module';

const BRIDGE_ID = 'tsl-vegetation-math';

export default function TslVegetationMathShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uniformsRef = useRef<{
    amp: { value: number };
    freq: { value: number };
    seed: { value: number };
    wind: { value: number };
    hue: { value: number };
  } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);
  const amplitude = (values?.amplitude as number) ?? 1.5;
  const frequency = (values?.frequency as number) ?? 0.05;
  const seed = (values?.seed as number) ?? 0;
  const windStrength = (values?.windStrength as number) ?? 4.5;
  const hueShift = (values?.hueShift as number) ?? 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;

    const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const ampU = uniform(amplitude);
    const freqU = uniform(frequency);
    const seedU = uniform(seed);
    const windU = uniform(windStrength);
    const hueU = uniform(hueShift);
    uniformsRef.current = { amp: ampU, freq: freqU, seed: seedU, wind: windU, hue: hueU };

    const material = new THREE.MeshBasicNodeMaterial();
    const terrainHeight = getTerrainHeight(ampU, freqU, seedU);
    const st = uv().sub(0.5).mul(80);
    const height = terrainHeight(st);
    const wind = calculateWindStrength(st, vec2(1.0, -0.8), 0.1, time, 0.35, windU);
    const cellX = int(floor(st.x.mul(2)));
    const cellY = int(floor(st.y.mul(2)));
    const seedNoise = hash2to1(cellX, cellY);
    const baseColor = vec3(0.02, 0.08, 0.1).add(vec3(0.1, 0.45, 0.42).mul(wind));
    const terrainGlow = vec3(0.2, 0.8, 0.75).mul(height.mul(0.3).add(seedNoise.mul(0.2)));
    material.colorNode = vec4(shiftHSV(baseColor.add(terrainGlow), vec3(hueU, float(0.0), float(0.0))), 1);

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const resize = () => renderer.setSize(canvas.clientWidth || 1, canvas.clientHeight || 1, false);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    renderer.init().then(() => {
      if (disposed) return;
      renderer.setAnimationLoop(() => renderer.render(scene, camera));
    });

    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      ro.disconnect();
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
      uniformsRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.amp.value = amplitude;
  }, [amplitude]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.freq.value = frequency;
  }, [frequency]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.seed.value = seed;
  }, [seed]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.wind.value = windStrength;
  }, [windStrength]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.hue.value = hueShift;
  }, [hueShift]);

  return (
    <div className="h-full w-full bg-black">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
