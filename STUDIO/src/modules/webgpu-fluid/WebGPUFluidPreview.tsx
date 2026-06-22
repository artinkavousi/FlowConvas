/**
 * WebGPUFluidPreview — live preview for the webgpu-fluid module.
 * Reads control values from the PANELFLOW bridge and feeds them to the module.
 */

import { useBridgeStore } from '@artinos/panelflow';
import { WebGPUFluidModule } from './WebGPUFluidModule';

export default function WebGPUFluidPreview() {
  const v = useBridgeStore((s) => s.componentValues['webgpu-fluid']);
  return (
    <WebGPUFluidModule
      curl={v?.curl as number | undefined}
      splatRadius={v?.splatRadius as number | undefined}
      velocityDissipation={v?.velocityDissipation as number | undefined}
      densityDissipation={v?.densityDissipation as number | undefined}
      bloom={v?.bloom as boolean | undefined}
      bloomIntensity={v?.bloomIntensity as number | undefined}
      particles={v?.particles as boolean | undefined}
      className="w-full h-full"
    />
  );
}
