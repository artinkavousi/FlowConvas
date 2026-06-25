import type { ArtinosModule } from '../../registry/types';
import MediapipeFaceTrackerShowcase from './MediapipeFaceTracker.showcase';

const meta: ArtinosModule = {
  id: 'mediapipe-face-tracker',
  name: 'MediaPipe Face Tracker',
  category: 'input',
  description: 'A universal core for webcam face tracking using MediaPipe FaceLandmarker. Outputs blendshapes and 4x4 transform matrices for driving 3D avatars or interactions.',
  tags: ['input', 'webcam', 'face-tracking', 'mediapipe', 'blendshapes', 'AR'],
  version: '0.1.0',
  updatedAt: new Date().toISOString(),
  dependencies: ['react'],
  sourcePath: 'STUDIO/src/modules/input/MediapipeFaceTracker.tsx',
  preview: MediapipeFaceTrackerShowcase,
  schema: {
    id: 'mediapipe-face-tracker',
    name: 'MediaPipe Face Tracker',
    category: 'input',
    parameters: [
      { key: 'enabled', label: 'Enabled', type: 'boolean', default: true }
    ],
  },
  usage: `import { useMediaPipeFaceTracker } from '@/modules/input/MediapipeFaceTracker.module';

function MyAvatar() {
  const { ready, resultRef } = useMediaPipeFaceTracker();

  useFrame(() => {
    if (resultRef.current) {
      const { blendshapes, transformMatrix } = resultRef.current;
      // Apply blendshapes to your model...
    }
  });

  return null;
}`,
  agentNotes: 'This module dynamically imports @mediapipe/tasks-vision from cdn.jsdelivr.net to avoid bloating the repository. Use `resultRef.current` inside a rAF or useFrame loop for zero-latency polling without triggering React renders. Make sure to check `ready` before rendering anything that depends on it.',
};

export default meta;
