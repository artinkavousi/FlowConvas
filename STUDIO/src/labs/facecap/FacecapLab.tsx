import React, { useEffect, useRef, useState } from 'react';
import { createFacecapEngine } from './engine';
import { useMediaPipeFaceTracker } from './modules/input/MediapipeFaceTracker';

export default function FacecapLab() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  // Initialize the universal face tracker primitive
  const { ready: trackerReady, resultRef } = useMediaPipeFaceTracker();

  useEffect(() => {
    let active = true;
    let frameId: number;

    async function init() {
      if (!canvasRef.current) return;
      try {
        const engine = await createFacecapEngine(canvasRef.current);
        if (!active) {
          engine.dispose();
          return;
        }
        engineRef.current = engine;
        engine.start();
        setLoading(false);

        // We use a high-performance rAF loop to poll the face tracker resultRef
        // and feed it to the 3D engine, avoiding React render lag.
        function loop() {
          if (!active) return;
          if (resultRef.current && engineRef.current) {
            engineRef.current.applyFaceTracking(resultRef.current);
          }
          frameId = requestAnimationFrame(loop);
        }
        loop();

      } catch (err) {
        console.error("Failed to initialize Facecap engine:", err);
      }
    }

    init();

    return () => {
      active = false;
      if (frameId) cancelAnimationFrame(frameId);
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, [resultRef]);

  useEffect(() => {
    if (!containerRef.current || !engineRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        engineRef.current.resize(width, height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [loading]);

  function handlePointerMove(e: React.PointerEvent) {
    if (!engineRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    engineRef.current.pointerMove(x, y, rect.width, rect.height);
  }

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full bg-black overflow-hidden"
      onPointerMove={handlePointerMove}
    >
      <canvas 
        ref={canvasRef} 
        className="block w-full h-full focus:outline-none" 
        style={{ touchAction: 'none' }}
      />
      
      {/* Loading Overlay */}
      {(loading || !trackerReady) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-teal-400 font-mono text-sm tracking-widest">
              {!trackerReady ? 'INITIALIZING WEBCAM & AI...' : 'LOADING FACECAP MODEL...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
