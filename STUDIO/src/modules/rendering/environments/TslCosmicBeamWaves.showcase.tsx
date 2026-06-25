import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import { createTslCosmicBeamWaves, tslCosmicBeamWavesDefaults } from './TslCosmicBeamWaves.module';

const BRIDGE_ID = 'tsl-cosmic-beam-waves';

type CosmicApi = ReturnType<typeof createTslCosmicBeamWaves>;

export default function TslCosmicBeamWavesShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<CosmicApi | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  const options = {
    radiusMin: (values?.radiusMin as number) ?? tslCosmicBeamWavesDefaults.radiusMin,
    radiusMax: (values?.radiusMax as number) ?? tslCosmicBeamWavesDefaults.radiusMax,
    lifetimeMin: (values?.lifetimeMin as number) ?? tslCosmicBeamWavesDefaults.lifetimeMin,
    lifetimeMax: (values?.lifetimeMax as number) ?? tslCosmicBeamWavesDefaults.lifetimeMax,
    donutMinRadius: (values?.donutMinRadius as number) ?? tslCosmicBeamWavesDefaults.donutMinRadius,
    donutMaxRadius: (values?.donutMaxRadius as number) ?? tslCosmicBeamWavesDefaults.donutMaxRadius,
    minSpawnInterval: (values?.minSpawnInterval as number) ?? tslCosmicBeamWavesDefaults.minSpawnInterval,
    maxSpawnInterval: (values?.maxSpawnInterval as number) ?? tslCosmicBeamWavesDefaults.maxSpawnInterval,
    autoSpawn: (values?.autoSpawn as boolean) ?? tslCosmicBeamWavesDefaults.autoSpawn,
    beamCoreColor: (values?.beamCoreColor as string) ?? tslCosmicBeamWavesDefaults.beamCoreColor,
    beamGlowColor: (values?.beamGlowColor as string) ?? tslCosmicBeamWavesDefaults.beamGlowColor,
    waveColor: (values?.waveColor as string) ?? tslCosmicBeamWavesDefaults.waveColor,
    hueShift: (values?.hueShift as number) ?? tslCosmicBeamWavesDefaults.hueShift,
    cameraHeight: (values?.cameraHeight as number) ?? tslCosmicBeamWavesDefaults.cameraHeight,
    cameraDistance: (values?.cameraDistance as number) ?? tslCosmicBeamWavesDefaults.cameraDistance,
    pixelRatio: (values?.pixelRatio as number) ?? tslCosmicBeamWavesDefaults.pixelRatio,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const api = createTslCosmicBeamWaves(canvas, options);
    apiRef.current = api;
    const ro = new ResizeObserver(() => api.resize());
    ro.observe(canvas);
    api.resize();
    return () => {
      ro.disconnect();
      api.dispose();
      apiRef.current = null;
    };
  }, []);

  useEffect(() => {
    apiRef.current?.update(options);
  }, [
    options.autoSpawn,
    options.beamCoreColor,
    options.beamGlowColor,
    options.cameraDistance,
    options.cameraHeight,
    options.donutMaxRadius,
    options.donutMinRadius,
    options.hueShift,
    options.lifetimeMax,
    options.lifetimeMin,
    options.maxSpawnInterval,
    options.minSpawnInterval,
    options.pixelRatio,
    options.radiusMax,
    options.radiusMin,
    options.waveColor,
  ]);

  return (
    <div className="h-full w-full bg-black">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
