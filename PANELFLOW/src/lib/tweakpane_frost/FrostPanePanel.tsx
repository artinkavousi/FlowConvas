/**
 * FrostPanePanel — A React component that mounts a Tweakpane Frost instance
 * inside a PanelShell, driven by a ComponentSchema.
 * 
 * This is used for complex parameter types (vec2, vec3, camera controls, bezier)
 * where Tweakpane's native widgets are superior to basic HTML inputs.
 */

import { useRef, useMemo, useCallback } from 'react';
import { PanelShell } from '@/panel-os/panel-shell';
import { useFrostPane } from './useFrostPane';
import type { ComponentSchema, ParameterDef } from '@/control-engine';
import { useBridgeStore, initializeBridgeDefaults } from '@/control-engine';
import { useEffect } from 'react';

function paramToFrostBinding(param: ParameterDef, value: any, onChange: (v: any) => void) {
  const binding: any = {
    key: param.key,
    label: param.label,
    value: value ?? param.default,
    onChange,
  };
  if (param.min !== undefined) binding.min = param.min;
  if (param.max !== undefined) binding.max = param.max;
  if (param.step !== undefined) binding.step = param.step;
  if (param.options) {
    binding.options = Object.fromEntries(param.options.map(o => [o.label, o.value]));
  }
  return binding;
}

export interface FrostPanePanelProps {
  schema: ComponentSchema;
}

export function FrostPanePanel({ schema }: FrostPanePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const values = useBridgeStore((s) => s.componentValues[schema.id] || {});
  const setParam = useBridgeStore((s) => s.setParam);

  useEffect(() => {
    initializeBridgeDefaults(schema);
  }, [schema.id]);

  const handleChange = useCallback(
    (key: string, value: any) => {
      setParam(schema.id, key, value);
    },
    [schema.id, setParam],
  );

  const bindings = useMemo(
    () =>
      schema.parameters.map((param) =>
        paramToFrostBinding(param, values[param.key], (v) => handleChange(param.key, v)),
      ),
    [schema.parameters, values, handleChange],
  );

  useFrostPane({
    containerRef,
    bindings,
    onAnyChange: handleChange,
    title: schema.name,
    expanded: true,
  });

  return (
    <PanelShell noPadding>
      <div
        ref={containerRef}
        className="frost-tweakpane w-full h-full overflow-y-auto custom-scrollbar"
        style={{ minHeight: 200 }}
      />
    </PanelShell>
  );
}
