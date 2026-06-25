/**
 * TslHsvShowcase — bridge-driven live showcase.
 * Maps UV.x → hue through hsvtorgb on a fullscreen quad, with sliderable saturation/value and an
 * animated hue offset — proving the GPU color conversion standalone.
 */

import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { uv, vec3, vec4, uniform, time } from 'three/tsl';
import { hsvtorgb } from './TslHsv.module';

const BRIDGE_ID = 'tsl-hsv';

export default function TslHsvShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uniformsRef = useRef<{ sat: { value: number }; val: { value: number }; spin: { value: number } } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);
  const saturation = (values?.saturation as number) ?? 0.9;
  const value = (values?.value as number) ?? 1;
  const hueSpeed = (values?.hueSpeed as number) ?? 0.1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const satU = uniform(saturation);
    const valU = uniform(value);
    const spinU = uniform(hueSpeed);
    uniformsRef.current = { sat: satU, val: valU, spin: spinU };

    const material = new THREE.MeshBasicNodeMaterial();
    const uvN = uv();
    const hue = uvN.x.add(time.mul(spinU)).add(uvN.y.mul(0.15));
    material.colorNode = vec4(hsvtorgb(vec3(hue, satU, valU)), 1);

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
    if (uniformsRef.current) uniformsRef.current.sat.value = saturation;
  }, [saturation]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.val.value = value;
  }, [value]);
  useEffect(() => {
    if (uniformsRef.current) uniformsRef.current.spin.value = hueSpeed;
  }, [hueSpeed]);

  return (
    <div className="h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
