/**
 * attach.ts — connect the headless inspector to live renderers.
 *
 * Two mechanisms:
 *   1. `inspectRenderer(renderer)` — direct attach where the shell owns the
 *      renderer (e.g. `ThreeRuntime.createRendererHost`, PanelFlow demo).
 *   2. `installInspectorHook()` — patches `WebGPURenderer.prototype.init` so
 *      renderers created by *modules* (which the shell never sees) auto-attach.
 *      Mirrors the prototype-patch pattern the vanilla `Settings.js` uses for
 *      `forceWebGL`.
 *
 * A single shared `ArtinosInspector` instance is reused across renderers; the
 * "active" renderer is the most-recently attached one.
 */

import { InspectorBase, WebGPURenderer } from 'three/webgpu';
import { ArtinosInspector } from './core/ArtinosInspector';
import { useInspectorStore } from './inspector-store';

let inspector: ArtinosInspector | null = null;
let enabled = true;
let activeRenderer: any = null;

export function getInspector(): ArtinosInspector {
  if (!inspector) inspector = new ArtinosInspector();
  return inspector;
}

export function isInspectionEnabled(): boolean {
  return enabled;
}

export function setInspectionEnabled(value: boolean): void {
  enabled = value;
}

export function getActiveRenderer(): any {
  return activeRenderer;
}

export function setInspectorActiveRenderer(renderer: any): void {
  activeRenderer = renderer;
}

/** Directly attach the shared inspector to a renderer. Returns a detach fn. */
export function inspectRenderer(renderer: any): () => void {
  if (!renderer) return () => {};
  const insp = getInspector();
  // Reset stale per-cid stats / series when moving to a new renderer.
  if (activeRenderer && activeRenderer !== renderer) {
    insp.dispose();
    useInspectorStore.getState().reset();
  }
  renderer.inspector = insp;
  insp.setRenderer(renderer);
  activeRenderer = renderer;
  return () => detachInspector(renderer);
}

/** Detach the inspector from a renderer and reset the store. */
export function detachInspector(renderer: any): void {
  if (renderer && inspector && renderer.inspector === inspector) {
    try {
      renderer.inspector = new InspectorBase();
    } catch {
      /* renderer already disposed */
    }
  }
  inspector?.dispose();
  if (activeRenderer === renderer) activeRenderer = null;
  useInspectorStore.getState().reset();
}

let restoreInit: (() => void) | null = null;

/**
 * Patch `WebGPURenderer.prototype.init` once so any renderer created while
 * inspection is enabled auto-attaches the shared inspector. Idempotent; returns
 * an uninstaller that restores the original `init`.
 */
export function installInspectorHook(): () => void {
  if (restoreInit) return restoreInit;

  const proto = WebGPURenderer.prototype as any;
  const originalInit = proto.init;

  proto.init = function patchedInit(this: any, ...args: any[]) {
    try {
      if (enabled && !(this.inspector && this.inspector.isRendererInspector)) {
        const insp = getInspector();
        if (activeRenderer && activeRenderer !== this) {
          insp.dispose();
          useInspectorStore.getState().reset();
        }
        this.inspector = insp;
        insp.setRenderer(this);
        activeRenderer = this;
      }
    } catch {
      /* never let inspection break a renderer's init */
    }
    return originalInit.apply(this, args);
  };

  restoreInit = () => {
    proto.init = originalInit;
    restoreInit = null;
  };
  return restoreInit;
}
