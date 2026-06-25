import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import * as THREE from 'three/webgpu';
import { createFalseEarthPostStack, falseEarthPostStackDefaults } from './FalseEarthPostStack.module';

const BRIDGE_ID = 'false-earth-post-stack';

type PostStackApi = Awaited<ReturnType<typeof createFalseEarthPostStack>>;

export default function FalseEarthPostStackShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<PostStackApi | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  const options = {
    highQuality: (values?.highQuality as boolean) ?? falseEarthPostStackDefaults.highQuality,
    bloomEnabled: (values?.bloomEnabled as boolean) ?? falseEarthPostStackDefaults.bloomEnabled,
    bloomThreshold: (values?.bloomThreshold as number) ?? falseEarthPostStackDefaults.bloomThreshold,
    bloomStrength: (values?.bloomStrength as number) ?? falseEarthPostStackDefaults.bloomStrength,
    bloomRadius: (values?.bloomRadius as number) ?? falseEarthPostStackDefaults.bloomRadius,
    dofEnabled: (values?.dofEnabled as boolean) ?? falseEarthPostStackDefaults.dofEnabled,
    focusDistance: (values?.focusDistance as number) ?? falseEarthPostStackDefaults.focusDistance,
    focalLength: (values?.focalLength as number) ?? falseEarthPostStackDefaults.focalLength,
    bokehScale: (values?.bokehScale as number) ?? falseEarthPostStackDefaults.bokehScale,
    helmetStrength: (values?.helmetStrength as number) ?? falseEarthPostStackDefaults.helmetStrength,
    toneMappingEnabled: (values?.toneMappingEnabled as boolean) ?? falseEarthPostStackDefaults.toneMappingEnabled,
    exposure: (values?.exposure as number) ?? falseEarthPostStackDefaults.exposure,
    smaaEnabled: (values?.smaaEnabled as boolean) ?? falseEarthPostStackDefaults.smaaEnabled,
    pixelRatio: (values?.pixelRatio as number) ?? falseEarthPostStackDefaults.pixelRatio,
  };

  useEffect(() => {
    let disposed = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020403);
    const beamScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
    camera.position.set(0, 7.5, 18);
    camera.lookAt(0, 1, 0);

    const terrain = new THREE.Mesh(
      new THREE.CircleGeometry(16, 128),
      new THREE.MeshStandardMaterial({ color: 0x0c2118, roughness: 0.75, metalness: 0.05 }),
    );
    terrain.rotation.x = -Math.PI / 2;
    scene.add(terrain);

    const marker = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35, 1.25, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xcfe9e7, roughness: 0.45, metalness: 0.08 }),
    );
    marker.position.set(0, 0.9, 0);
    scene.add(marker);
    scene.add(new THREE.HemisphereLight(0xcafff0, 0x06120f, 1.8));
    const key = new THREE.DirectionalLight(0xffffff, 3);
    key.position.set(-4, 9, 5);
    scene.add(key);

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.7, 18, 40, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x57fff1, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    beam.position.set(-2.8, 9, 4.5);
    beamScene.add(beam);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.5, 1.65, 96),
      new THREE.MeshBasicMaterial({ color: 0x57fff1, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(-2.8, 0.03, 4.5);
    beamScene.add(ring);

    let api: PostStackApi | null = null;
    createFalseEarthPostStack(canvas, { ...options, scene, beamScene, camera }).then((created) => {
      if (disposed) {
        created.dispose();
        return;
      }
      api = created;
      apiRef.current = api;
      const resize = () => {
        const w = canvas.clientWidth || 1;
        const h = canvas.clientHeight || 1;
        api?.resize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      resize();
      api.renderer.setAnimationLoop(() => {
        const t = performance.now() * 0.001;
        marker.rotation.y += 0.01;
        beam.scale.setScalar(1 + Math.sin(t * 2) * 0.08);
        ring.scale.setScalar(1.2 + (t % 1.4) * 1.5);
        ring.material.opacity = 0.55 * (1 - ((t % 1.4) / 1.4));
        api?.render({ focusTarget: marker });
      });
      apiRef.current = {
        ...api,
        dispose: () => {
          ro.disconnect();
          api?.dispose();
        },
      };
    });

    return () => {
      disposed = true;
      apiRef.current?.dispose();
      terrain.geometry.dispose();
      (terrain.material as THREE.Material).dispose();
      marker.geometry.dispose();
      (marker.material as THREE.Material).dispose();
      beam.geometry.dispose();
      (beam.material as THREE.Material).dispose();
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
      apiRef.current = null;
    };
  }, []);

  useEffect(() => {
    apiRef.current?.update(options);
  }, [
    options.highQuality,
    options.bloomEnabled,
    options.bloomThreshold,
    options.bloomStrength,
    options.bloomRadius,
    options.dofEnabled,
    options.focusDistance,
    options.focalLength,
    options.bokehScale,
    options.helmetStrength,
    options.toneMappingEnabled,
    options.exposure,
    options.smaaEnabled,
    options.pixelRatio,
  ]);

  return (
    <div className="h-full w-full bg-black">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
