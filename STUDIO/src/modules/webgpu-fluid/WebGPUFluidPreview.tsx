/**
 * WebGPUFluidPreview — live preview for the webgpu-fluid module.
 * Passes the full PANELFLOW bridge value record to the module, drives preset
 * switching, and re-syncs the control panel after a preset is applied.
 */

import { useCallback } from 'react';
import { useBridgeStore, usePerformanceTelemetry } from '@artinos/panelflow';
import { WebGPUFluidModule, type FluidStats } from './WebGPUFluidModule';

const BRIDGE_ID = 'webgpu-fluid';

export default function WebGPUFluidPreview() {
  const v = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);
  const publishStats = usePerformanceTelemetry(BRIDGE_ID);

  // After a preset applies, write the resulting config back into the bridge so
  // the auto-generated panel widgets reflect the new look.
  const onPresetApplied = useCallback((values: Record<string, unknown>) => {
    const store = useBridgeStore.getState();
    const current = store.getParams(BRIDGE_ID);
    store.setAllParams(BRIDGE_ID, { ...current, ...values });
  }, []);

  const onStats = useCallback((stats: FluidStats) => {
    publishStats(stats);
  }, [publishStats]);

  return (
    <WebGPUFluidModule
      values={v}
      preset={v?.preset as string | undefined}
      onPresetApplied={onPresetApplied}
      onStats={onStats}
      className="w-full h-full"
    />
  );
}
