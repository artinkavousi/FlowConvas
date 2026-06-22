import { WebGPURenderer } from 'three/webgpu';

export class DisposeScope {
  items: any[] = [];
  track<T>(item: T): T {
    this.items.push(item);
    return item;
  }
  dispose() {
    for (const item of this.items) {
      if (item && typeof item.dispose === 'function') {
        item.dispose();
      }
    }
    this.items = [];
  }
}

export async function createRendererHost(canvas: HTMLCanvasElement, options: { antialias?: boolean, forceWebGL?: boolean }) {
  const renderer = new WebGPURenderer({
    canvas,
    antialias: options.antialias ?? true,
    powerPreference: 'high-performance',
    alpha: true,
    forceWebGL: options.forceWebGL || false,
  });
  
  await renderer.init();

  return {
    rawRenderer: renderer,
    backend: (renderer.backend as any).isWebGLBackend ? 'WebGL2' : 'WebGPU',
    setSize(w: number, h: number) {
      renderer.setSize(w, h, false);
    },
    setAnimationLoop(callback: (() => void) | null) {
      renderer.setAnimationLoop(callback);
    },
    render(scene: any, camera: any) {
      renderer.render(scene, camera);
    },
    get info() {
      return (renderer as any).info;
    },
    dispose() {
      renderer.dispose();
    }
  };
}
