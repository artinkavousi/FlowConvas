import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import { createTslVatLifecycleInstances, tslVatLifecycleDefaults } from './TslVatLifecycleInstances.module';

const BRIDGE_ID = 'tsl-vat-lifecycle-instances';

type VatApi = Awaited<ReturnType<typeof createTslVatLifecycleInstances>>;

export default function TslVatLifecycleInstancesShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<VatApi | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  const options = {
    count: (values?.count as number) ?? tslVatLifecycleDefaults.count,
    radius: (values?.radius as number) ?? tslVatLifecycleDefaults.radius,
    scaleMin: (values?.scaleMin as number) ?? tslVatLifecycleDefaults.scaleMin,
    scaleMax: (values?.scaleMax as number) ?? tslVatLifecycleDefaults.scaleMax,
    growMin: (values?.growMin as number) ?? tslVatLifecycleDefaults.growMin,
    growMax: (values?.growMax as number) ?? tslVatLifecycleDefaults.growMax,
    keepMin: (values?.keepMin as number) ?? tslVatLifecycleDefaults.keepMin,
    keepMax: (values?.keepMax as number) ?? tslVatLifecycleDefaults.keepMax,
    dieMin: (values?.dieMin as number) ?? tslVatLifecycleDefaults.dieMin,
    dieMax: (values?.dieMax as number) ?? tslVatLifecycleDefaults.dieMax,
    amplitude: (values?.amplitude as number) ?? tslVatLifecycleDefaults.amplitude,
    frequency: (values?.frequency as number) ?? tslVatLifecycleDefaults.frequency,
    windStrength: (values?.windStrength as number) ?? tslVatLifecycleDefaults.windStrength,
    windSpeed: (values?.windSpeed as number) ?? tslVatLifecycleDefaults.windSpeed,
    petalHueShift: (values?.petalHueShift as number) ?? tslVatLifecycleDefaults.petalHueShift,
    hueRandomness: (values?.hueRandomness as number) ?? tslVatLifecycleDefaults.hueRandomness,
    emissiveIntensity: (values?.emissiveIntensity as number) ?? tslVatLifecycleDefaults.emissiveIntensity,
    fresnelIntensity: (values?.fresnelIntensity as number) ?? tslVatLifecycleDefaults.fresnelIntensity,
    cameraHeight: (values?.cameraHeight as number) ?? tslVatLifecycleDefaults.cameraHeight,
    cameraDistance: (values?.cameraDistance as number) ?? tslVatLifecycleDefaults.cameraDistance,
    pixelRatio: (values?.pixelRatio as number) ?? tslVatLifecycleDefaults.pixelRatio,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let ro: ResizeObserver | null = null;

    createTslVatLifecycleInstances(canvas, options).then((api) => {
      if (cancelled) {
        api.dispose();
        return;
      }
      apiRef.current = api;
      ro = new ResizeObserver(() => api.resize());
      ro.observe(canvas);
      api.resize();
    });

    return () => {
      cancelled = true;
      ro?.disconnect();
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, []);

  useEffect(() => {
    apiRef.current?.update(options);
  }, [
    options.amplitude,
    options.cameraDistance,
    options.cameraHeight,
    options.count,
    options.dieMax,
    options.dieMin,
    options.emissiveIntensity,
    options.frequency,
    options.fresnelIntensity,
    options.growMax,
    options.growMin,
    options.hueRandomness,
    options.keepMax,
    options.keepMin,
    options.petalHueShift,
    options.pixelRatio,
    options.radius,
    options.scaleMax,
    options.scaleMin,
    options.windSpeed,
    options.windStrength,
  ]);

  return (
    <div className="h-full w-full bg-black">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
