import { useEffect, useMemo, useRef, useState } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { Fn, float, int, instanceIndex, select, uniform, uint, vec2, vec3, vec4, length, round } from 'three/tsl';
import {
  DEFAULT_FALSE_EARTH_LODS,
  createDistanceLodRouter,
  createFalseEarthLodConfigs,
  createLodRouterBuffers,
  createResetDrawBufferCompute,
  estimateLodCounts,
} from './TslIndirectDrawLodRouter.module';
import { hash2to1 } from '../math/TslVegetationMath.module';

const BRIDGE_ID = 'tsl-indirect-draw-lod-router';
const GRID_SIZE = 128;
const COUNT = GRID_SIZE * GRID_SIZE;
const SPACING = 0.18;

type RouterApi = {
  focus: THREE.Vector2;
  group: THREE.Vector3;
  jitter: { value: number };
  noise: { value: number };
  setPointSize(size: number): void;
};

export default function TslIndirectDrawLodRouterShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<RouterApi | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  const focusX = (values?.focusX as number) ?? 1.5;
  const focusZ = (values?.focusZ as number) ?? -1.25;
  const groupX = (values?.groupX as number) ?? 0;
  const groupZ = (values?.groupZ as number) ?? 0;
  const jitter = (values?.jitter as number) ?? 0.85;
  const lodNoiseScale = (values?.lodNoiseScale as number) ?? 0.55;
  const pointSize = (values?.pointSize as number) ?? 3.2;
  const areaRadius = (values?.areaRadius as number) ?? 11.5;

  const estimatedCounts = useMemo(
    () =>
      estimateLodCounts({
        gridSize: GRID_SIZE,
        spacing: SPACING,
        focusX,
        focusZ,
        groupX,
        groupZ,
        jitter,
        lodNoiseScale,
        areaRadius,
      }),
    [areaRadius, focusX, focusZ, groupX, groupZ, jitter, lodNoiseScale],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030607);

    const camera = new THREE.OrthographicCamera(-13.5, 13.5, 8.2, -8.2, 0.1, 20);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);

    const uniforms = {
      uFocusXZ: uniform(new THREE.Vector2(focusX, focusZ)),
      uGroupOffset: uniform(new THREE.Vector3(groupX, 0, groupZ)),
      uGridIndex: uniform(new THREE.Vector2(0, 0)),
      uJitter: uniform(jitter),
      uLodNoiseScale: uniform(lodNoiseScale),
    };

    const buffers = createLodRouterBuffers(COUNT);
    const lodConfigs = createFalseEarthLodConfigs(COUNT, DEFAULT_FALSE_EARTH_LODS);
    const resetKernel = createResetDrawBufferCompute(lodConfigs).setName('FalseEarthLodReset');
    const routeKernel = createDistanceLodRouter({
      instanceCount: COUNT,
      gridSize: GRID_SIZE,
      spacing: SPACING,
      areaRadius,
      lodConfigs,
      uniforms,
      outputPosition: buffers.positions,
      outputColor: buffers.colors,
      outputLod: buffers.lods,
    }).setName('FalseEarthLodRoute');

    const geometry = new THREE.InstancedBufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3, false));
    geometry.instanceCount = COUNT;

    const material = new THREE.PointsNodeMaterial({ transparent: true });
    material.size = pointSize;
    material.depthWrite = false;

    const visiblePointNode = Fn(() => {
      const gridSizeNode = uint(GRID_SIZE);
      const gridX = instanceIndex.mod(gridSizeNode);
      const gridZ = instanceIndex.div(gridSizeNode);
      const halfGrid = float(GRID_SIZE - 1).mul(0.5);
      const spacingNode = float(SPACING);
      const snapX = round(uniforms.uGridIndex.x);
      const snapZ = round(uniforms.uGridIndex.y);
      const globalGridX = int(gridX).add(int(snapX));
      const globalGridZ = int(gridZ).add(int(snapZ));
      const jitterX = hash2to1(globalGridX, globalGridZ).sub(0.5).mul(spacingNode).mul(uniforms.uJitter);
      const jitterZ = hash2to1(globalGridX.add(113), globalGridZ.add(71)).sub(0.5).mul(spacingNode).mul(uniforms.uJitter);
      const x = float(gridX).sub(halfGrid).mul(spacingNode).add(jitterX).add(uniforms.uGroupOffset.x);
      const z = float(gridZ).sub(halfGrid).mul(spacingNode).add(jitterZ).add(uniforms.uGroupOffset.z);
      return vec2(x, z);
    });

    material.positionNode = Fn(() => {
      const point = visiblePointNode();
      return vec3(point.x, point.y, 0);
    })();
    material.colorNode = Fn(() => {
      const point = visiblePointNode();
      const dist = length(point.sub(uniforms.uFocusXZ));
      const noiseSeed = hash2to1(int(instanceIndex), int(instanceIndex).add(19)).mul(2).sub(1);
      const noisyDist = dist.add(noiseSeed.mul(uniforms.uLodNoiseScale));
      const inCircle = length(point.sub(vec2(uniforms.uGroupOffset.x, uniforms.uGroupOffset.z))).lessThan(float(areaRadius));
      const nearColor = vec3(1, 0.08, 0.02);
      const midColor = vec3(0.1, 0.95, 0.25);
      const farColor = vec3(0.1, 0.35, 1);
      const color = select(noisyDist.lessThan(5), nearColor, select(noisyDist.lessThan(20), midColor, farColor));
      return vec4(select(inCircle, color, vec3(0.035, 0.04, 0.045)), select(inCircle, float(0.94), float(0.24)));
    })();

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);

    const focusGeometry = new THREE.RingGeometry(0.18, 0.35, 48);
    const focusMaterial = new THREE.MeshBasicMaterial({ color: 0xf2e9bd, transparent: true, opacity: 0.9 });
    const focusMarker = new THREE.Mesh(focusGeometry, focusMaterial);
    focusMarker.position.set(focusX, focusZ, 0.05);
    scene.add(focusMarker);

    apiRef.current = {
      focus: uniforms.uFocusXZ.value,
      group: uniforms.uGroupOffset.value,
      jitter: uniforms.uJitter,
      noise: uniforms.uLodNoiseScale,
      setPointSize(size) {
        material.size = size;
        material.needsUpdate = true;
      },
    };

    const resize = () => {
      const width = canvas.clientWidth || 1;
      const height = canvas.clientHeight || 1;
      const aspect = width / height;
      camera.left = -9 * aspect;
      camera.right = 9 * aspect;
      camera.top = 9;
      camera.bottom = -9;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let disposed = false;
    renderer.init().then(async () => {
      if (disposed) return;
      renderer.setAnimationLoop(async () => {
        await renderer.computeAsync(resetKernel);
        await renderer.computeAsync(routeKernel);
        focusMarker.position.set(uniforms.uFocusXZ.value.x, uniforms.uFocusXZ.value.y, 0.05);
        await renderer.renderAsync(scene, camera);
      });
    });

    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      focusGeometry.dispose();
      focusMaterial.dispose();
      lodConfigs.forEach((lod) => {
        lod.drawBuffer?.dispose?.();
        lod.indices?.dispose?.();
      });
      buffers.positions?.dispose?.();
      buffers.colors?.dispose?.();
      buffers.lods?.dispose?.();
      renderer.dispose();
      apiRef.current = null;
    };
  }, [areaRadius]);

  useEffect(() => {
    if (!apiRef.current) return;
    apiRef.current.focus.set(focusX, focusZ);
    apiRef.current.group.set(groupX, 0, groupZ);
  }, [focusX, focusZ, groupX, groupZ]);

  useEffect(() => {
    if (apiRef.current) apiRef.current.jitter.value = jitter;
  }, [jitter]);

  useEffect(() => {
    if (apiRef.current) apiRef.current.noise.value = lodNoiseScale;
  }, [lodNoiseScale]);

  useEffect(() => {
    apiRef.current?.setPointSize(pointSize);
  }, [pointSize]);

  const total = estimatedCounts.reduce((sum, count) => sum + count, 0);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#030607]">
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div className="pointer-events-none absolute bottom-4 left-4 w-[min(360px,calc(100%-2rem))] rounded border border-white/12 bg-black/45 p-3 text-[11px] text-slate-200 shadow-2xl backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-medium uppercase tracking-[0.18em] text-slate-300">GPU route bands</span>
          <span className="tabular-nums text-slate-400">{total.toLocaleString()} visible</span>
        </div>
        <div className="space-y-1.5">
          {DEFAULT_FALSE_EARTH_LODS.map((lod, index) => {
            const count = estimatedCounts[index] ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            const color = `rgb(${Math.round(lod.debugColor[0] * 255)}, ${Math.round(lod.debugColor[1] * 255)}, ${Math.round(lod.debugColor[2] * 255)})`;
            return (
              <div key={`${lod.segments}-${lod.minDistance}`} className="grid grid-cols-[48px_1fr_64px] items-center gap-2">
                <span className="tabular-nums text-slate-400">LOD {index}</span>
                <span className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <span className="block h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                </span>
                <span className="text-right tabular-nums text-slate-300">{count.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
