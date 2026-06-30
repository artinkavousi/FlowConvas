/**
 * console-bridge — routes three's internal console output into the inspector.
 *
 * `setConsoleFunction` must come from the SAME `three/webgpu` bundle the renderer
 * uses (it's a module-singleton; the `three` core copy is a different instance and
 * would not intercept renderer messages). The webgpu build re-exports it at
 * runtime but `@types/three` doesn't surface it on `three/webgpu`, so we reach it
 * through a namespace import.
 */

import * as ThreeWebGPU from 'three/webgpu';
import type { ConsoleLevel } from '../types';

type ThreeConsoleType = 'log' | 'warn' | 'error';
type ConsoleFn = (type: ThreeConsoleType, message: string, ...rest: unknown[]) => void;

const setConsoleFunction = (ThreeWebGPU as { setConsoleFunction?: (fn: ConsoleFn | null) => void })
  .setConsoleFunction;

const LEVEL: Record<ThreeConsoleType, ConsoleLevel> = { log: 'info', warn: 'warn', error: 'error' };

export function installConsole(push: (level: ConsoleLevel, text: string) => void): void {
  if (!setConsoleFunction) return;
  setConsoleFunction((type, message) => {
    push(LEVEL[type] ?? 'info', String(message));
    // Still echo to the real devtools console so nothing is swallowed.
    if (type === 'warn') console.warn(message);
    else if (type === 'error') console.error(message);
    else console.log(message);
  });
}

export function uninstallConsole(): void {
  if (!setConsoleFunction) return;
  try {
    setConsoleFunction(null);
  } catch {
    /* three restores its default native routing */
  }
}
