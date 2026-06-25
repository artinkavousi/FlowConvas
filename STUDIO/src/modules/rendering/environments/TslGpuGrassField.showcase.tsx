import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import { createTslGpuGrassField, tslGpuGrassFieldDefaults } from './TslGpuGrassField.module';

const BRIDGE_ID = 'tsl-gpu-grass-field';

type GrassApi = ReturnType<typeof createTslGpuGrassField>;

export default function TslGpuGrassFieldShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<GrassApi | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  const options = {
    bladesPerAxis: (values?.bladesPerAxis as number) ?? tslGpuGrassFieldDefaults.bladesPerAxis,
    areaSize: (values?.areaSize as number) ?? tslGpuGrassFieldDefaults.areaSize,
    segments: (values?.segments as number) ?? tslGpuGrassFieldDefaults.segments,
    amplitude: (values?.amplitude as number) ?? tslGpuGrassFieldDefaults.amplitude,
    frequency: (values?.frequency as number) ?? tslGpuGrassFieldDefaults.frequency,
    seed: (values?.seed as number) ?? tslGpuGrassFieldDefaults.seed,
    bladeHeightMin: (values?.bladeHeightMin as number) ?? tslGpuGrassFieldDefaults.bladeHeightMin,
    bladeHeightMax: (values?.bladeHeightMax as number) ?? tslGpuGrassFieldDefaults.bladeHeightMax,
    bladeWidthMin: (values?.bladeWidthMin as number) ?? tslGpuGrassFieldDefaults.bladeWidthMin,
    bladeWidthMax: (values?.bladeWidthMax as number) ?? tslGpuGrassFieldDefaults.bladeWidthMax,
    bendAmount: (values?.bendAmount as number) ?? tslGpuGrassFieldDefaults.bendAmount,
    yawRandomness: (values?.yawRandomness as number) ?? tslGpuGrassFieldDefaults.yawRandomness,
    jitter: (values?.jitter as number) ?? tslGpuGrassFieldDefaults.jitter,
    windStrength: (values?.windStrength as number) ?? tslGpuGrassFieldDefaults.windStrength,
    windSpeed: (values?.windSpeed as number) ?? tslGpuGrassFieldDefaults.windSpeed,
    windScale: (values?.windScale as number) ?? tslGpuGrassFieldDefaults.windScale,
    windDirX: (values?.windDirX as number) ?? tslGpuGrassFieldDefaults.windDirX,
    windDirZ: (values?.windDirZ as number) ?? tslGpuGrassFieldDefaults.windDirZ,
    baseColor: (values?.baseColor as string) ?? tslGpuGrassFieldDefaults.baseColor,
    tipColor: (values?.tipColor as string) ?? tslGpuGrassFieldDefaults.tipColor,
    rimColor: (values?.rimColor as string) ?? tslGpuGrassFieldDefaults.rimColor,
    hueShift: (values?.hueShift as number) ?? tslGpuGrassFieldDefaults.hueShift,
    cameraHeight: (values?.cameraHeight as number) ?? tslGpuGrassFieldDefaults.cameraHeight,
    cameraDistance: (values?.cameraDistance as number) ?? tslGpuGrassFieldDefaults.cameraDistance,
    pixelRatio: (values?.pixelRatio as number) ?? tslGpuGrassFieldDefaults.pixelRatio,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const api = createTslGpuGrassField(canvas, options);
    apiRef.current = api;

    const resize = () => api.resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    return () => {
      ro.disconnect();
      api.dispose();
      apiRef.current = null;
    };
  }, []);

  useEffect(() => {
    apiRef.current?.update(options);
  }, [
    options.amplitude,
    options.areaSize,
    options.baseColor,
    options.bendAmount,
    options.bladeHeightMax,
    options.bladeHeightMin,
    options.bladeWidthMax,
    options.bladeWidthMin,
    options.bladesPerAxis,
    options.cameraDistance,
    options.cameraHeight,
    options.frequency,
    options.hueShift,
    options.jitter,
    options.pixelRatio,
    options.rimColor,
    options.seed,
    options.segments,
    options.tipColor,
    options.windDirX,
    options.windDirZ,
    options.windScale,
    options.windSpeed,
    options.windStrength,
    options.yawRandomness,
  ]);

  return (
    <div className="h-full w-full bg-black">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
