import { useEffect, useRef, useState } from 'react';

export type FaceBlendshape = { categoryName: string; score: number };

export type FaceTrackingResult = {
  blendshapes: FaceBlendshape[];
  transformMatrix: number[]; // 16-element array for 4x4 matrix
};

/**
 * Universal core for webcam face tracking using MediaPipe FaceLandmarker.
 * Reusable anywhere a face transform or blendshapes are needed.
 */
export function useMediaPipeFaceTracker() {
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<FaceTrackingResult | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Keep a ref for high-performance direct polling from 3D render loops
  // without waiting for React state updates.
  const resultRef = useRef<FaceTrackingResult | null>(null); 

  useEffect(() => {
    let faceLandmarker: any = null;
    let animationFrameId: number;
    let active = true;

    async function init() {
      try {
        // Dynamically import from CDN to avoid bloating the local bundle
        /* @vite-ignore */
        const { FaceLandmarker, FilesetResolver } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/+esm');
        
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
          runningMode: "VIDEO",
          numFaces: 1
        });

        if (!active) {
          faceLandmarker.close();
          return;
        }

        const video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        videoRef.current = video;

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        
        video.addEventListener('loadeddata', () => {
          if (!active) return;
          setReady(true);
          
          let lastVideoTime = -1;
          function predict() {
            if (!active) return;
            if (video.currentTime !== lastVideoTime) {
              lastVideoTime = video.currentTime;
              const results = faceLandmarker.detectForVideo(video, performance.now());
              if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                const newResult = {
                  blendshapes: results.faceBlendshapes[0].categories,
                  transformMatrix: results.facialTransformationMatrixes[0].data
                };
                resultRef.current = newResult;
                setResult(newResult);
              }
            }
            animationFrameId = requestAnimationFrame(predict);
          }
          predict();
        });
      } catch (err) {
        console.error("MediaPipe Face Tracker error:", err);
      }
    }

    init();

    return () => {
      active = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
      if (faceLandmarker) faceLandmarker.close();
    };
  }, []);

  return { ready, result, resultRef, video: videoRef.current };
}

// A simple visualizer component for the module showcase
export function MediapipeFaceTrackerVisualizer() {
  const { ready, result } = useMediaPipeFaceTracker();
  
  if (!ready) return <div className="p-4 text-teal-400">Loading Camera & Face Tracker...</div>;
  
  return (
    <div className="p-4 flex flex-col gap-2 overflow-y-auto max-h-full font-mono text-[10px]">
      <div className="text-teal-400 font-bold mb-2 text-sm">Face Tracker Active</div>
      {result ? (
        <div className="grid grid-cols-2 gap-2">
          {result.blendshapes.slice(0, 16).map((b) => (
            <div key={b.categoryName} className="flex justify-between bg-white/5 p-1 rounded">
              <span className="text-white/50">{b.categoryName}</span>
              <span className="text-teal-400">{b.score.toFixed(2)}</span>
            </div>
          ))}
          <div className="col-span-2 text-white/50 mt-2">...and {result.blendshapes.length - 16} more blendshapes.</div>
        </div>
      ) : (
        <div className="text-white/50">No face detected</div>
      )}
    </div>
  );
}
