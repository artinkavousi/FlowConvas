/**
 * TslStructuredArrayShowcase — bridge-driven live showcase.
 * Uses StructuredArray as the compute store for a grid of { position: vec3, color: vec3 } instances:
 * an init kernel fills the struct, an update kernel animates it (struct write + read in compute — the
 * substrate's primary job), then a copy kernel reads the struct into plain render buffers that GPU
 * points draw. A NON-MPM use, proving the substrate is reusable for any structured GPGPU sim.
 */

import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { Fn, instanceIndex, float, vec3, vec4, sin, uniform, time, instancedArray } from 'three/tsl';
import { StructuredArray } from './TslStructuredArray.module';

const BRIDGE_ID = 'tsl-structured-array';
const GRID = 64;
const COUNT = GRID * GRID;

export default function TslStructuredArrayShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<{ amp: { value: number }; speed: { value: number }; setSize(px: number): void } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);
  const amplitude = (values?.amplitude as number) ?? 0.25;
  const speed = (values?.speed as number) ?? 1;
  const pointSize = (values?.pointSize as number) ?? 5;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
    camera.position.z = 1;

    // Compute store: the structured buffer (this module under test).
    const particles = new StructuredArray({ position: 'vec3', color: 'vec3' }, COUNT, 'demo-particles');
    // Plain render buffers (proven render path for this three version).
    const renderPos = instancedArray(COUNT, 'vec3');
    const renderCol = instancedArray(COUNT, 'vec3');

    const amp = uniform(amplitude);
    const speedU = uniform(speed);

    // init: fill the struct on a centered grid, color by grid coords.
    const initKernel = Fn(() => {
      const gx = instanceIndex.mod(GRID);
      const gy = instanceIndex.div(GRID);
      const x = float(gx).div(GRID - 1).sub(0.5).mul(1.85);
      const y = float(gy).div(GRID - 1).sub(0.5).mul(1.85);
      particles.get(instanceIndex, 'position').assign(vec3(x, y, 0));
      particles.get(instanceIndex, 'color').assign(vec3(float(gx).div(GRID), float(gy).div(GRID), 0.7));
    })().compute(COUNT);

    // update: animate the struct's z by a radial wave (struct read + write in compute).
    const updateKernel = Fn(() => {
      const gx = instanceIndex.mod(GRID);
      const gy = instanceIndex.div(GRID);
      const x = float(gx).div(GRID - 1).sub(0.5).mul(1.85);
      const y = float(gy).div(GRID - 1).sub(0.5).mul(1.85);
      const r = x.mul(x).add(y.mul(y)).sqrt();
      const wave = sin(r.mul(8).sub(time.mul(speedU))).mul(amp);
      particles.get(instanceIndex, 'position').assign(vec3(x, y, wave));
    })().compute(COUNT);

    // copy: read the struct back out into the plain render buffers.
    const copyKernel = Fn(() => {
      renderPos.element(instanceIndex).assign(particles.get(instanceIndex, 'position'));
      renderCol.element(instanceIndex).assign(particles.get(instanceIndex, 'color'));
    })().compute(COUNT);

    const geometry = new THREE.InstancedBufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3, false));
    geometry.instanceCount = COUNT;

    const material = new THREE.PointsNodeMaterial({ transparent: true });
    material.size = pointSize;
    material.positionNode = Fn(() => renderPos.element(instanceIndex))();
    material.colorNode = Fn(() => vec4(renderCol.element(instanceIndex), 1))();
    apiRef.current = { amp, speed: speedU, setSize: (px) => { material.size = px; material.needsUpdate = true; } };

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);

    const resize = () => renderer.setSize(canvas.clientWidth || 1, canvas.clientHeight || 1, false);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let disposed = false;
    renderer.init().then(async () => {
      if (disposed) return;
      await renderer.computeAsync(initKernel);
      renderer.setAnimationLoop(async () => {
        await renderer.computeAsync(updateKernel);
        await renderer.computeAsync(copyKernel);
        await renderer.renderAsync(scene, camera);
      });
    });

    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      ro.disconnect();
      geometry.dispose();
      (material as THREE.Material).dispose();
      particles.buffer?.dispose?.();
      renderer.dispose();
      apiRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (apiRef.current) apiRef.current.amp.value = amplitude;
  }, [amplitude]);
  useEffect(() => {
    if (apiRef.current) apiRef.current.speed.value = speed;
  }, [speed]);
  useEffect(() => {
    apiRef.current?.setSize(pointSize);
  }, [pointSize]);

  return (
    <div className="h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
