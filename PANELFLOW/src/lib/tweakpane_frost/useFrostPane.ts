/**
 * useFrostPane — React hook for mounting a FrostTweakpane instance.
 * 
 * Bridges the imperative Tweakpane API with React lifecycle.
 * Handles mount, binding, change propagation, and dispose.
 */

import { useRef, useEffect, useCallback, type RefObject } from 'react';
import './frost-tweakpane.css';

interface FrostPaneBinding {
  key: string;
  label?: string;
  value: any;
  min?: number;
  max?: number;
  step?: number;
  options?: Record<string, any>;
  onChange?: (value: any) => void;
}

interface UseFrostPaneOptions {
  /** Ref to the container element where Tweakpane will mount. */
  containerRef: RefObject<HTMLDivElement | null>;
  /** Parameter bindings to create in the pane. */
  bindings: FrostPaneBinding[];
  /** Called when any binding value changes. */
  onAnyChange?: (key: string, value: any) => void;
  /** Pane title. */
  title?: string;
  /** Whether the pane should be initially expanded. */
  expanded?: boolean;
}

export function useFrostPane({
  containerRef,
  bindings,
  onAnyChange,
  title,
  expanded = true,
}: UseFrostPaneOptions) {
  const paneRef = useRef<any>(null);
  const paramsRef = useRef<Record<string, any>>({});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let pane: any = null;

    const init = async () => {
      try {
        // Dynamic import to avoid bundling Tweakpane for consumers who don't use it
        const { Pane } = await import('./tweakpane.js');

        // Build params object from bindings
        const params: Record<string, any> = {};
        for (const binding of bindings) {
          params[binding.key] = binding.value;
        }
        paramsRef.current = params;

        // Create pane
        container.classList.add('frost-tweakpane');
        pane = new Pane({
          container,
          title: title || undefined,
          expanded,
        });
        paneRef.current = pane;

        // Try to register plugins
        try {
          const plugins = await import('./tweakpane-plugins.js');
          if (plugins.EssentialsPlugin) pane.registerPlugin(plugins.EssentialsPlugin);
          if (plugins.CamerakitPlugin) pane.registerPlugin(plugins.CamerakitPlugin);
        } catch {
          // Plugins optional
        }

        // Create bindings
        for (const binding of bindings) {
          const opts: any = { label: binding.label || binding.key };
          if (binding.min !== undefined) opts.min = binding.min;
          if (binding.max !== undefined) opts.max = binding.max;
          if (binding.step !== undefined) opts.step = binding.step;
          if (binding.options) opts.options = binding.options;

          const b = pane.addBinding(params, binding.key, opts);
          b.on('change', (ev: any) => {
            binding.onChange?.(ev.value);
            onAnyChange?.(binding.key, ev.value);
          });
        }
      } catch (e) {
        console.warn('[useFrostPane] Failed to initialize:', e);
      }
    };

    init();

    return () => {
      if (pane) {
        try { pane.dispose(); } catch { /* ignore */ }
        paneRef.current = null;
      }
      container.classList.remove('frost-tweakpane');
      container.innerHTML = '';
    };
  }, [containerRef, title, expanded]); // Note: bindings intentionally excluded to avoid re-init on every render

  /** Imperatively update a parameter value without re-initializing. */
  const setValue = useCallback((key: string, value: any) => {
    if (paramsRef.current && key in paramsRef.current) {
      paramsRef.current[key] = value;
      paneRef.current?.refresh();
    }
  }, []);

  return { paneRef, setValue };
}
