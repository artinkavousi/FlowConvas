// @ts-nocheck
import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { color, float, Fn, mx_hsvtorgb, uv, vec3, vec4 } from 'three/tsl';
import { colorRamp3BSpline, colorRamp3Linear, srgbToLinear } from './TslSplineColorRamp.module';

const BRIDGE_ID = 'tsl-spline-color-ramp';

export default function TslSplineColorRampShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<{ update(p: Record<string, unknown>): void; resize(): void; dispose(): void } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const material = new THREE.MeshBasicNodeMaterial();
    const rampMode = { value: 'bspline' };

    material.colorNode = Fn(() => {
      const t = uv().x;
      const a = vec4(color(0.95, 0.71, 0.44), float(0.05));
      const b = vec4(color(0.14, 0.05, 0.03), float(0.425));
      const c = vec4(color(0.0, 0.0, 0.0), float(1.0));
      const spline = colorRamp3BSpline(t, a, b, c);
      const linear = colorRamp3Linear(t, a, b, c);
      const rainbow = mx_hsvtorgb(vec3(t, 0.75, 1.0));
      if (rampMode.value === 'linear') return srgbToLinear(linear);
      if (rampMode.value === 'rainbow') return srgbToLinear(rainbow);
      return srgbToLinear(spline);
    })();

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const resize = () => renderer.setSize(canvas.clientWidth || 1, canvas.clientHeight || 1, false);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    renderer.setAnimationLoop(() => renderer.render(scene, camera));

    engineRef.current = {
      update: (params) => {
        rampMode.value = String(params.mode ?? 'bspline');
        material.needsUpdate = true;
      },
      resize,
      dispose: () => {
        ro.disconnect();
        renderer.setAnimationLoop(null);
        mesh.geometry.dispose();
        material.dispose();
        renderer.dispose();
      },
    };

    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.update(values ?? {});
  }, [values]);

  return (
    <div className="h-full w-full bg-black">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
