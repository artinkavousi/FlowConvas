import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import { createThirdPersonCharacterNavigation, thirdPersonCharacterDefaults } from './ThirdPersonCharacterNavigation.module';

const BRIDGE_ID = 'third-person-character-navigation';

type CharacterApi = Awaited<ReturnType<typeof createThirdPersonCharacterNavigation>>;

export default function ThirdPersonCharacterNavigationShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<CharacterApi | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  const options = {
    walkSpeed: (values?.walkSpeed as number) ?? thirdPersonCharacterDefaults.walkSpeed,
    runSpeed: (values?.runSpeed as number) ?? thirdPersonCharacterDefaults.runSpeed,
    rotateSpeed: (values?.rotateSpeed as number) ?? thirdPersonCharacterDefaults.rotateSpeed,
    speedLerpFactor: (values?.speedLerpFactor as number) ?? thirdPersonCharacterDefaults.speedLerpFactor,
    rotationLerpFactor: (values?.rotationLerpFactor as number) ?? thirdPersonCharacterDefaults.rotationLerpFactor,
    animBlendLerpFactor: (values?.animBlendLerpFactor as number) ?? thirdPersonCharacterDefaults.animBlendLerpFactor,
    autoMove: (values?.autoMove as boolean) ?? thirdPersonCharacterDefaults.autoMove,
    run: (values?.run as boolean) ?? thirdPersonCharacterDefaults.run,
    orbitRadius: (values?.orbitRadius as number) ?? thirdPersonCharacterDefaults.orbitRadius,
    cameraHeight: (values?.cameraHeight as number) ?? thirdPersonCharacterDefaults.cameraHeight,
    cameraDistance: (values?.cameraDistance as number) ?? thirdPersonCharacterDefaults.cameraDistance,
    modelScale: (values?.modelScale as number) ?? thirdPersonCharacterDefaults.modelScale,
    pixelRatio: (values?.pixelRatio as number) ?? thirdPersonCharacterDefaults.pixelRatio,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let ro: ResizeObserver | null = null;

    createThirdPersonCharacterNavigation(canvas, options).then((api) => {
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
    options.animBlendLerpFactor,
    options.autoMove,
    options.cameraDistance,
    options.cameraHeight,
    options.modelScale,
    options.orbitRadius,
    options.pixelRatio,
    options.rotateSpeed,
    options.rotationLerpFactor,
    options.run,
    options.runSpeed,
    options.speedLerpFactor,
    options.walkSpeed,
  ]);

  return (
    <div className="h-full w-full bg-black">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
