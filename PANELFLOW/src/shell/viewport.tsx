// Viewport.tsx — THE engine↔React seam (AGENT.md §seams: "Engine ↔ React → the viewport panel only").
// Owns a WebGPURenderer canvas, renders a live TSL-material scene, and disposes deterministically.
// The engine cores (ThreeRuntime/GraphRuntime/...) stay React-free; React lives here, at the boundary.

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  Scene,
  PerspectiveCamera,
  OrthographicCamera,
  Mesh,
  TorusKnotGeometry,
  IcosahedronGeometry,
  BoxGeometry,
  SphereGeometry,
  PlaneGeometry,
  DirectionalLight,
  AmbientLight,
  MeshStandardNodeMaterial,
  Color,
  ACESFilmicToneMapping,
  LinearToneMapping,
  CineonToneMapping,
  AgXToneMapping,
  PCFSoftShadowMap,
  type BufferGeometry,
} from 'three/webgpu';
import { color, mix, sin, time, positionLocal } from 'three/tsl';
import { createRendererHost, DisposeScope } from './ThreeRuntime';
import { detect, canRun, type BackendClass } from '@/WebGPUCapabilities';
import { token } from '@/studio-theme';
import { useGraphStore } from '@/graph/graph-store';

export default function Viewport() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<'init' | 'running' | 'unsupported'>('init');
  const [backend, setBackend] = useState('');
  
  const sceneSettings = useGraphStore(s => s.scene);

  useEffect(() => {
    const mount = hostRef.current;
    if (!mount) return;
    let cancelled = false;
    let stop: (() => void) | null = null;

    (async () => {
      const caps = await detect();
      if (cancelled) return;
      if (!canRun('webgpu-preferred', caps)) {
        setStatus('unsupported');
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'width:100%;height:100%;display:block';
      mount.appendChild(canvas);

      // createRendererHost awaits renderer.init() before returning (ADR-002 init contract).
      const host = await createRendererHost(canvas, { 
        antialias: true,
        forceWebGL: sceneSettings.backend === 'webgl'
      });
      if (cancelled) {
        host.dispose();
        canvas.remove();
        return;
      }

      const rawRenderer = host.rawRenderer;
      if (sceneSettings.toneMapping === 'aces') rawRenderer.toneMapping = ACESFilmicToneMapping;
      else if (sceneSettings.toneMapping === 'cineon') rawRenderer.toneMapping = CineonToneMapping;
      else if (sceneSettings.toneMapping === 'agx') rawRenderer.toneMapping = AgXToneMapping;
      else rawRenderer.toneMapping = LinearToneMapping;

      if (sceneSettings.shadows) {
        rawRenderer.shadowMap.enabled = true;
        rawRenderer.shadowMap.type = PCFSoftShadowMap;
      } else {
        rawRenderer.shadowMap.enabled = false;
      }

      setBackend(host.backend);
      setStatus('running');

      const scope = new DisposeScope();
      const world = new Scene();
      
      const camera = sceneSettings.viewMode === '2d' 
          ? new OrthographicCamera(-2, 2, 2, -2, 0.1, 100) 
          : new PerspectiveCamera(50, 1, 0.1, 100);
      
      camera.position.set(0, 0, 4);

      // Environment setup based on sceneSettings.env
      let ambientColor = 0xffffff;
      let ambientIntensity = 0.6;
      let dirColor = 0xffffff;
      let dirIntensity = 2.2;

      switch (sceneSettings.env) {
        case 'none':
          world.background = null;
          ambientIntensity = 0.2;
          dirIntensity = 1.0;
          break;
        case 'studio':
          world.background = new Color(0x1a1a1a);
          ambientColor = 0xe0e0e0;
          ambientIntensity = 0.8;
          dirIntensity = 2.5;
          break;
        case 'city':
          world.background = new Color(0x0a1128);
          ambientColor = 0x8ab4f8;
          ambientIntensity = 0.5;
          dirColor = 0xfff0dd;
          dirIntensity = 2.0;
          break;
        case 'sunset':
          world.background = new Color(0x2a0c08);
          ambientColor = 0xff7b54;
          ambientIntensity = 0.6;
          dirColor = 0xffb26b;
          dirIntensity = 3.0;
          break;
        case 'night':
          world.background = new Color(0x02050f);
          ambientColor = 0x243b55;
          ambientIntensity = 0.2;
          dirColor = 0xaab8c2;
          dirIntensity = 0.8;
          break;
        case 'warehouse':
          world.background = new Color(0x1d1c1a);
          ambientColor = 0xdcd0c0;
          ambientIntensity = 0.7;
          dirColor = 0xfffcf0;
          dirIntensity = 2.2;
          break;
        default:
          world.background = null;
      }

      let geo: BufferGeometry;
      switch (sceneSettings.geometry) {
        case 'box': geo = scope.track(new BoxGeometry(1.5, 1.5, 1.5)); break;
        case 'plane': geo = scope.track(new PlaneGeometry(2, 2)); break;
        case 'torus': geo = scope.track(new TorusKnotGeometry(0.85, 0.28, 160, 32)); break;
        default: geo = scope.track(new SphereGeometry(1, 32, 32)); break;
      }

      if (sceneSettings.volumetrics && world.background) {
        const { FogExp2 } = await import('three/webgpu');
        world.fog = new FogExp2(world.background as Color, 0.05);
      }

      let mat: any;
      const { MeshPhysicalNodeMaterial, MeshBasicNodeMaterial, MeshToonNodeMaterial } = await import('three/webgpu');
      
      let tNode: any = null;

      switch (sceneSettings.material) {
        case 'physical':
          mat = scope.track(new MeshPhysicalNodeMaterial());
          mat.metalness = 0.8;
          mat.roughness = 0.1;
          mat.clearcoat = 1.0;
          mat.clearcoatRoughness = 0.1;
          mat.color = new Color(0x3b82f6);
          break;
        case 'transmission':
          mat = scope.track(new MeshPhysicalNodeMaterial());
          mat.metalness = 0.1;
          mat.roughness = 0.1;
          mat.transmission = 1.0;
          mat.ior = 1.5;
          mat.thickness = 1.0;
          mat.color = new Color(0xffffff);
          break;
        case 'subsurface':
          mat = scope.track(new MeshPhysicalNodeMaterial());
          mat.metalness = 0.0;
          mat.roughness = 0.5;
          mat.transmission = 0.2;
          mat.thickness = 2.0;
          // fake subsurface setup (real SSS needs custom nodes, but physical does a decent job with thickness)
          mat.color = new Color(0xffeedd);
          mat.emissive = new Color(0x221100);
          break;
        case 'standard':
          mat = scope.track(new MeshStandardNodeMaterial());
          mat.metalness = 0.6;
          mat.roughness = 0.4;
          mat.color = new Color(0xf43f5e);
          break;
        case 'toon':
          mat = scope.track(new MeshToonNodeMaterial());
          mat.color = new Color(0x10b981);
          break;
        case 'custom_tsl':
        default:
          mat = scope.track(new MeshStandardNodeMaterial());
          mat.metalness = 0.5;
          mat.roughness = 0.2;
          tNode = sin(time).mul(0.5).add(0.5);
          mat.colorNode = mix(color(0x2dd4bf), color(0x7c3aed), tNode.add(positionLocal.y.mul(0.15)));
          break;
      }
      
      mat.wireframe = sceneSettings.wireframe;
      
      if (sceneSettings.material === 'custom_tsl' && tNode) {
         // Keep custom TSL emissive without bloom checks
         mat.emissiveNode = mat.colorNode.mul(tNode.mul(2.0));
      }

      const mesh = new Mesh(geo, mat);
      mesh.castShadow = sceneSettings.shadows;
      mesh.receiveShadow = sceneSettings.shadows;
      world.add(mesh);
      world.add(new AmbientLight(ambientColor, ambientIntensity));
      
      const key = new DirectionalLight(dirColor, dirIntensity);
      key.position.set(2, 3, 4);
      if (sceneSettings.shadows) {
        key.castShadow = true;
        key.shadow.mapSize.width = 1024;
        key.shadow.mapSize.height = 1024;
      }
      world.add(key);

      if (sceneSettings.debugMode === 'normals') {
        const { MeshNormalMaterial } = await import('three/webgpu');
        world.overrideMaterial = new MeshNormalMaterial();
      } else if (sceneSettings.debugMode === 'depth') {
        const { MeshDepthMaterial } = await import('three/webgpu');
        world.overrideMaterial = new MeshDepthMaterial();
      } else if (sceneSettings.debugMode === 'uv') {
        // TSL UV Fake
        const uvMat = new MeshStandardNodeMaterial();
        const { uv, vec4 } = await import('three/tsl');
        uvMat.colorNode = vec4(uv(), 0.0, 1.0);
        world.overrideMaterial = uvMat;
      }

      const { OrbitControls } = await import('three-stdlib');
      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.autoRotate = sceneSettings.autoRotate;
      controls.autoRotateSpeed = 2.0;
      if (sceneSettings.viewMode === '2d') {
         controls.enableRotate = false;
      }

      let rafId = 0;
      const resize = () => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const w = mount.clientWidth || 1;
          const h = mount.clientHeight || 1;
          if (sceneSettings.viewMode === '2d') {
              const aspect = w / h;
              (camera as OrthographicCamera).left = -2 * aspect;
              (camera as OrthographicCamera).right = 2 * aspect;
              camera.updateProjectionMatrix();
          } else {
              (camera as PerspectiveCamera).aspect = w / h;
              camera.updateProjectionMatrix();
          }
          host.setSize(w, h);
        });
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(mount);

      let grid: any = null;
      if (sceneSettings.showGrid) {
        if (sceneSettings.viewMode === '3d') {
            const { GridHelper, Mesh, PlaneGeometry, MeshStandardNodeMaterial } = await import('three/webgpu');
            grid = new GridHelper(10, 10, 0x444444, 0x222222);
            grid.position.y = -1.5;
            world.add(grid);

            if (sceneSettings.shadows) {
              const floorGeo = new PlaneGeometry(20, 20);
              const floorMat = new MeshStandardNodeMaterial();
              floorMat.colorNode = color(0x1a1a1a);
              const floor = new Mesh(floorGeo, floorMat);
              floor.rotation.x = -Math.PI / 2;
              floor.position.y = -1.51;
              floor.receiveShadow = true;
              world.add(floor);
            }
        } else {
            const { GridHelper } = await import('three/webgpu');
            grid = new GridHelper(10, 10, 0x444444, 0x222222);
            grid.rotation.x = Math.PI / 2;
            world.add(grid);
        }
      }

      if (sceneSettings.showGizmos) {
        const { AxesHelper, CameraHelper } = await import('three/webgpu');
        const axes = new AxesHelper(3);
        world.add(axes);
      }

      let post: any = null;
      if (sceneSettings.backend === 'webgpu' && (sceneSettings.bloom || sceneSettings.ao || sceneSettings.dof || sceneSettings.ssr || sceneSettings.antialiasing !== 'none' || sceneSettings.ssgi)) {
          const { RenderPipeline } = await import('three/webgpu');
          const { pass, mrt, output, normalView, float } = await import('three/tsl');
          post = new RenderPipeline(host.rawRenderer);
          let scenePass = pass(world, camera);
          const needsMRT = sceneSettings.ao || sceneSettings.ssr || sceneSettings.ssgi || sceneSettings.dof;
          
          if (needsMRT) {
              scenePass.setMRT(mrt({
                  output,
                  normal: normalView
              }));
          }
          
          let outputNode: any = needsMRT ? scenePass.getTextureNode('output') : scenePass;
          let combinedNode: any = outputNode;

          if (sceneSettings.ao) {
              const { ao } = await import('three/examples/jsm/tsl/display/GTAONode.js');
              const { vec4, vec3 } = await import('three/tsl');
              const aoPass = ao(scenePass.getTextureNode('depth'), scenePass.getTextureNode('normal'), camera);
              combinedNode = vec4(combinedNode.rgb.mul(vec3(aoPass.getTextureNode().r)), combinedNode.a);
          }
          if (sceneSettings.ssgi) {
              const { ssgi } = await import('three/examples/jsm/tsl/display/SSGINode.js');
              const { vec4, vec3 } = await import('three/tsl');
              const ssgiPass = ssgi(combinedNode, scenePass.getTextureNode('depth'), scenePass.getTextureNode('normal'), camera as any);
              const ssgiTex = (ssgiPass as any).getTextureNode();
              combinedNode = vec4(combinedNode.rgb.mul(vec3(ssgiTex.a)).add(ssgiTex.rgb), combinedNode.a);
          }
          if (sceneSettings.ssr) {
              const { ssr } = await import('three/examples/jsm/tsl/display/SSRNode.js');
              const { vec4 } = await import('three/tsl');
              const ssrPass = ssr(combinedNode, scenePass.getTextureNode('depth'), scenePass.getTextureNode('normal'), float(1.0), float(0.5), camera);
              combinedNode = vec4(combinedNode.rgb.add((ssrPass as any).getTextureNode().rgb), combinedNode.a);
          }
          if (sceneSettings.bloom) {
              const { bloom } = await import('three/examples/jsm/tsl/display/BloomNode.js');
              const { vec4 } = await import('three/tsl');
              const bloomPass = bloom(combinedNode, 1.2, 0.5, 0.85);
              combinedNode = vec4(combinedNode.rgb.add((bloomPass as any).getTextureNode().rgb), combinedNode.a);
          }
          if (sceneSettings.dof) {
              const { dof } = await import('three/examples/jsm/tsl/display/DepthOfFieldNode.js');
              combinedNode = dof(combinedNode, scenePass.getViewZNode(), 4.0, 0.2, 5.0);
          }

          if (sceneSettings.antialiasing === 'smaa') {
              const { smaa } = await import('three/examples/jsm/tsl/display/SMAANode.js');
              combinedNode = smaa(combinedNode);
          } else if (sceneSettings.antialiasing === 'fxaa') {
              const { fxaa } = await import('three/examples/jsm/tsl/display/FXAANode.js');
              combinedNode = fxaa(combinedNode);
          }

          post.outputNode = combinedNode;
      }

      let lastUpdate = performance.now();
      let frames = 0;

      host.setAnimationLoop(() => {
        controls.update();
        if (sceneSettings.viewMode === '3d') {
          mesh.rotation.x += 0.006;
          mesh.rotation.y += 0.009;
        } else {
          mesh.rotation.set(0, 0, 0);
        }

        if (post) {
            post.render();
        } else {
            host.render(world, camera);
        }
        
        frames++;
        const now = performance.now();
        if (now - lastUpdate > 1000) {
          const fps = Math.round((frames * 1000) / (now - lastUpdate));
          
          let triangles = 0;
          let calls = 0;
          let memory = 0;
          let computeTime = 0;

          if (host.info) {
             triangles = host.info.render?.triangles || 0;
             calls = host.info.render?.calls || 0;
             const heap = (performance as Performance & { memory?: { usedJSHeapSize?: number } }).memory;
             memory = heap?.usedJSHeapSize ? Math.round(heap.usedJSHeapSize / (1024 * 1024)) : 0;
             computeTime = Number((1000 / (fps || 60)).toFixed(1));
          }

          useGraphStore.getState().setStats({
            fps,
            triangles,
            calls,
            memory,
            computeTime,
            renderer: host.backend,
          });
          frames = 0;
          lastUpdate = now;
        }
      });

      stop = () => {
        host.setAnimationLoop(null);
        ro.disconnect();
        controls.dispose();
        scope.dispose();
        host.dispose();
        canvas.remove();
      };
    })();

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [
    sceneSettings.viewMode,
    sceneSettings.geometry,
    sceneSettings.material,
    sceneSettings.showGrid,
    sceneSettings.env,
    sceneSettings.showGizmos,
    sceneSettings.backend,
    sceneSettings.toneMapping,
    sceneSettings.shadows,
    sceneSettings.volumetrics,
    sceneSettings.wireframe,
    sceneSettings.autoRotate,
    sceneSettings.bloom,
    sceneSettings.ao,
    sceneSettings.dof,
    sceneSettings.ssr,
    sceneSettings.ssgi,
    sceneSettings.antialiasing
  ]);

  return (
    <div ref={hostRef} style={hostStyle}>
      {status !== 'running' && (
        <div style={overlay}>
          {status === 'init' ? 'initializing renderer…' : 'WebGPU/WebGL2 unavailable in this browser'}
        </div>
      )}
    </div>
  );
}

const hostStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
};
const overlay: CSSProperties = { color: token('textSoft'), fontSize: 13, pointerEvents: 'none' };
