import { useEffect, useRef } from 'react';
import { useBridgeStore } from '@artinos/panelflow';
import { createTslWebgpuSwarmParticles, tslWebgpuSwarmDefaults } from './TslWebgpuSwarmParticles.module';

const BRIDGE_ID = 'tsl-webgpu-swarm-particles';

export default function TslWebgpuSwarmParticlesShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<{ update(p: Record<string, unknown>): void; resize(): void; dispose(): void } | null>(null);
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = createTslWebgpuSwarmParticles(canvas, {
      ...tslWebgpuSwarmDefaults,
      gpgpuSize: 128,
      cameraZ: 160,
      ...(values ?? {}),
    });
    const resize = () => engine.resize(canvas.clientWidth || 1, canvas.clientHeight || 1);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    engineRef.current = {
      update: (params) => engine.update(params),
      resize,
      dispose: () => {
        ro.disconnect();
        engine.dispose();
      },
    };
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.update((values ?? {}) as Record<string, unknown>);
  }, [values]);

  return (
    <div className="h-full w-full bg-black">
      <canvas ref={canvasRef} className="block h-full w-full touch-none" />
    </div>
  );
}
