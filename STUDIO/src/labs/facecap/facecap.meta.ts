import type { ArtinosModule } from '../../registry/types';
import FacecapLab from './FacecapLab';

const meta: ArtinosModule = {
  id: 'facecap',
  name: 'Face Tracking Lab',
  category: 'lab',
  description: 'Faithful replica of Mr.doob\'s WebGPU Face Tracking demo. Combines the generic MediaPipe face tracker module with SSGI/TRAA post-processing and a dynamic adaptive Cornell box.',
  tags: ['lab', 'face-tracking', 'mediapipe', 'webgpu', 'ssgi', 'traa'],
  version: '0.1.0',
  updatedAt: new Date().toISOString(),
  dependencies: ['react', 'three'],
  sourcePath: 'STUDIO/src/labs/facecap/FacecapLab.tsx',
  preview: FacecapLab,
  schema: {
    id: 'facecap',
    name: 'Face Tracking Lab',
    category: 'lab',
    parameters: [
      { key: 'enabled', label: 'Enabled', type: 'boolean', default: true }
    ],
  },
  usage: `// This is a full Lab composition.
import FacecapLab from '@/labs/facecap/FacecapLab';

function App() {
  return <FacecapLab />;
}`,
  agentNotes: 'This Lab serves as a composition demonstrating the generic `mediapipe-face-tracker` module driving a GLTF morph target mesh (`facecap.glb`). It uses local snapshots of `AdaptiveOpenFrontBoxRoom` and `WebgpuSsgiRoomRenderer` for its visual environment.',
};

export default meta;
