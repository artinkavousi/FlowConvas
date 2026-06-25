import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import { createFalseEarthLab, falseEarthLabDefaults } from './createFalseEarthLab';

const BRIDGE_ID = 'false-earth';

type FalseEarthEngine = ReturnType<typeof createFalseEarthLab>;

export default function FalseEarthLab() {
  const grassRef = useRef<HTMLCanvasElement>(null);
  const rosesRef = useRef<HTMLCanvasElement>(null);
  const cosmicRef = useRef<HTMLCanvasElement>(null);
  const characterRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Awaited<FalseEarthEngine> | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  const options = {
    preset: (values?.preset as string) ?? falseEarthLabDefaults.preset,
    cosmicEnabled: (values?.cosmicEnabled as boolean) ?? falseEarthLabDefaults.cosmicEnabled,
    rosesEnabled: (values?.rosesEnabled as boolean) ?? falseEarthLabDefaults.rosesEnabled,
    characterEnabled: (values?.characterEnabled as boolean) ?? falseEarthLabDefaults.characterEnabled,
    characterRun: (values?.characterRun as boolean) ?? falseEarthLabDefaults.characterRun,
    cameraMode: (values?.cameraMode as string) ?? falseEarthLabDefaults.cameraMode,
    audioEnabled: (values?.audioEnabled as boolean) ?? falseEarthLabDefaults.audioEnabled,
    audioVolume: (values?.audioVolume as number) ?? falseEarthLabDefaults.audioVolume,
    starsEnabled: (values?.starsEnabled as boolean) ?? falseEarthLabDefaults.starsEnabled,
    starIntensity: (values?.starIntensity as number) ?? falseEarthLabDefaults.starIntensity,
    bladesPerAxis: (values?.bladesPerAxis as number) ?? falseEarthLabDefaults.bladesPerAxis,
    areaSize: (values?.areaSize as number) ?? falseEarthLabDefaults.areaSize,
    amplitude: (values?.amplitude as number) ?? falseEarthLabDefaults.amplitude,
    frequency: (values?.frequency as number) ?? falseEarthLabDefaults.frequency,
    bladeHeightMax: (values?.bladeHeightMax as number) ?? falseEarthLabDefaults.bladeHeightMax,
    bendAmount: (values?.bendAmount as number) ?? falseEarthLabDefaults.bendAmount,
    windStrength: (values?.windStrength as number) ?? falseEarthLabDefaults.windStrength,
    windSpeed: (values?.windSpeed as number) ?? falseEarthLabDefaults.windSpeed,
    windScale: (values?.windScale as number) ?? falseEarthLabDefaults.windScale,
    baseColor: (values?.baseColor as string) ?? falseEarthLabDefaults.baseColor,
    tipColor: (values?.tipColor as string) ?? falseEarthLabDefaults.tipColor,
    rimColor: (values?.rimColor as string) ?? falseEarthLabDefaults.rimColor,
    roseCount: (values?.roseCount as number) ?? falseEarthLabDefaults.roseCount,
    roseRadius: (values?.roseRadius as number) ?? falseEarthLabDefaults.roseRadius,
    characterScale: (values?.characterScale as number) ?? falseEarthLabDefaults.characterScale,
    cameraHeight: (values?.cameraHeight as number) ?? falseEarthLabDefaults.cameraHeight,
    cameraDistance: (values?.cameraDistance as number) ?? falseEarthLabDefaults.cameraDistance,
    pixelRatio: (values?.pixelRatio as number) ?? falseEarthLabDefaults.pixelRatio,
  };

  useEffect(() => {
    const grass = grassRef.current;
    if (!grass) return;
    let disposed = false;
    const canvases = {
      grass,
      roses: rosesRef.current,
      cosmic: cosmicRef.current,
      character: characterRef.current,
    };
    const ro = new ResizeObserver(() => engineRef.current?.resize());
    [grassRef.current, rosesRef.current, cosmicRef.current, characterRef.current].filter(Boolean).forEach((canvas) => ro.observe(canvas as HTMLCanvasElement));
    createFalseEarthLab(canvases, options).then((engine) => {
      if (disposed) {
        engine.dispose();
        return;
      }
      engineRef.current = engine;
      engine.resize();
    });

    return () => {
      disposed = true;
      ro.disconnect();
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.update(options);
  }, [
    options.amplitude,
    options.areaSize,
    options.audioEnabled,
    options.audioVolume,
    options.baseColor,
    options.bendAmount,
    options.bladeHeightMax,
    options.bladesPerAxis,
    options.cameraDistance,
    options.cameraHeight,
    options.cameraMode,
    options.characterEnabled,
    options.characterRun,
    options.characterScale,
    options.cosmicEnabled,
    options.frequency,
    options.pixelRatio,
    options.preset,
    options.rimColor,
    options.roseCount,
    options.roseRadius,
    options.rosesEnabled,
    options.starsEnabled,
    options.starIntensity,
    options.tipColor,
    options.windScale,
    options.windSpeed,
    options.windStrength,
  ]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <canvas ref={grassRef} className="absolute inset-0 block h-full w-full" />
      {options.rosesEnabled && <canvas ref={rosesRef} className="absolute inset-0 block h-full w-full mix-blend-screen opacity-80" />}
      {options.cosmicEnabled && <canvas ref={cosmicRef} className="absolute inset-0 block h-full w-full mix-blend-screen opacity-85" />}
      {options.characterEnabled && <canvas ref={characterRef} className="absolute inset-0 block h-full w-full" />}
    </div>
  );
}
