// WebGPUCapabilities.ts — detection, init contract, and fallback-honest classification.
// Framework-free (no React/three import). Seeded from BLOCKY runtime-webgpu + STUDIO core/gpu;
// Phase 2 folds in adapter feature probing + the NGS DeviceRecovery path.

export type Backend = 'webgpu' | 'webgl2' | 'none';

/** Per-module backend requirement — never silently degrade (AGENT.md rendering rules). */
export type BackendClass = 'webgpu-required' | 'webgpu-preferred' | 'webgl-compatible';

export interface Capabilities {
  webgpu: boolean;
  webgl2: boolean;
  backend: Backend;
  /** Filled after init() resolves; empty until then (the hasFeature-before-init failure card). */
  features: ReadonlySet<string>;
  adapterInfo?: any;
}

/** Cheap, synchronous-ish capability sniff. Does NOT init a device. */
export async function detect(): Promise<Capabilities> {
  const webgpu = typeof navigator !== 'undefined' && 'gpu' in navigator && !!(navigator as any).gpu;
  const webgl2 = canMakeWebGL2();
  const backend: Backend = webgpu ? 'webgpu' : webgl2 ? 'webgl2' : 'none';
  return { webgpu, webgl2, backend, features: new Set() };
}

/**
 * Resolve a real adapter and return the device features it exposes.
 * MUST be awaited before any feature query (see knowledge/failures/hasfeature-before-init).
 */
export async function probeWebGPU(): Promise<Capabilities> {
  const base = await detect();
  if (!base.webgpu || !(navigator as any).gpu) return base;
  const adapter = await (navigator as any).gpu.requestAdapter();
  if (!adapter) return { ...base, webgpu: false, backend: base.webgl2 ? 'webgl2' : 'none' };
  const features = new Set<string>(Array.from(adapter.features as Set<string>));
  // `.info` exists at runtime; read through a narrow shape to stay type-portable.
  const adapterInfo = (adapter as { info?: any }).info;
  return { ...base, features, adapterInfo };
}

/** Decide whether a module classified `cls` can run given current `caps`. */
export function canRun(cls: BackendClass, caps: Capabilities): boolean {
  switch (cls) {
    case 'webgpu-required':
      return caps.webgpu;
    case 'webgpu-preferred':
      return caps.webgpu || caps.webgl2;
    case 'webgl-compatible':
      return caps.webgl2 || caps.webgpu;
  }
}

function canMakeWebGL2(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}
