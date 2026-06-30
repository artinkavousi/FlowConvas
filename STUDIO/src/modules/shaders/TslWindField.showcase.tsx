// @ts-nocheck
/**
 * TslWindFieldShowcase — bridge-driven live showcase.
 * Visualizes calculateWindStrength as an animated, directional gusting field over world XZ — a
 * standalone wind field with no grass geometry, proving the field primitive.
 */

import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { uv, vec3, vec4, float, uniform, time, mix, clamp } from 'three/tsl';
import { calculateWindStrength } from './TslWindField';

const BRIDGE_ID = 'tsl-wind-field';

export default function TslWindFieldShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uniformsRef = useRef<{
    dir: { value: THREE.Vector2 };
    scale: { value: number };
    speed: { value: number };
    strength: { value: number };
    view: { value: number };
  } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);
  const dirX = (values?.dirX as number) ?? 1;
  const dirY = (values?.dirY as number) ?? -0.8;
  const scale = (values?.scale as number) ?? 0.1;
  const speed = (values?.speed as number) ?? 0.35;
  const strength = (values?.strength as number) ?? 4.5;
  const view = (values?.view as number) ?? 60;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const dirU = uniform(new THREE.Vector2(dirX, dirY));
    const scaleU = uniform(scale);
    const speedU = uniform(speed);
    const strengthU = uniform(strength);
    const viewU = uniform(view);
    uniformsRef.current = { dir: dirU, scale: scaleU, speed: speedU, strength: strengthU, view: viewU };

    const material = new THREE.MeshBasicNodeMaterial();
    const uvN = uv();
    const worldXZ = uvN.sub(0.5).mul(viewU);
    const w = calculateWindStrength(worldXZ, dirU, scaleU, time, speedU, strengthU);
    const w01 = clamp(w.div(strengthU.add(0.0001)), float(0), float(1));
    const calm = vec3(0.05, 0.12, 0.1);
    const gust = vec3(0.55, 0.85, 0.45);
    material.colorNode = vec4(mix(calm, gust, w01), 1);

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
    if (uniformsRef.current) uniformsRef.current.dir.value.set(dirX, dirY);
  }, [dirX, dirY]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.scale.value = scale;
  }, [scale]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.speed.value = speed;
  }, [speed]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.strength.value = strength;
  }, [strength]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.view.value = view;
  }, [view]);

  return (
    <div className="h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
