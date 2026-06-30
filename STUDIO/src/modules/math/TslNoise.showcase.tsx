// @ts-nocheck
/**
 * TslNoiseShowcase — bridge-driven live showcase.
 * Samples the fractal triNoise3Dvec over UV space on a fullscreen quad, animated by the global
 * time node — proving the noise primitive renders standalone (no particle sim).
 */

import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { uv, vec3, vec4, float, uniform, time } from 'three/tsl';
import { triNoise3Dvec } from './TslNoise.module';

const BRIDGE_ID = 'tsl-noise';

export default function TslNoiseShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uniformsRef = useRef<{ scale: { value: number }; speed: { value: number }; gain: { value: number } } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);
  const scale = (values?.scale as number) ?? 3;
  const speed = (values?.speed as number) ?? 1;
  const gain = (values?.gain as number) ?? 1.5;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const scaleU = uniform(scale);
    const speedU = uniform(speed);
    const gainU = uniform(gain);
    uniformsRef.current = { scale: scaleU, speed: speedU, gain: gainU };

    const material = new THREE.MeshBasicNodeMaterial();
    const uvN = uv();
    const p = vec3(uvN.x, uvN.y, float(0)).mul(scaleU);
    const n = triNoise3Dvec(p, speedU, time);
    material.colorNode = vec4(n.mul(gainU).add(0.2), 1);

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
    if (uniformsRef.current) uniformsRef.current.scale.value = scale;
  }, [scale]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.speed.value = speed;
  }, [speed]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.gain.value = gain;
  }, [gain]);

  return (
    <div className="h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
