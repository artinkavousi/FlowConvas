import { useBridgeStore } from '@artinos/panelflow';
import { SingularityTrianglePreloader, singularityTrianglePreloaderDefaults } from './SingularityTrianglePreloader';

const BRIDGE_ID = 'singularity-triangle-preloader';

export default function SingularityTrianglePreloaderShowcase() {
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);
  return (
    <div className="h-full w-full bg-black">
      <SingularityTrianglePreloader
        active={(values?.active as boolean | undefined) ?? singularityTrianglePreloaderDefaults.active}
        starCount={(values?.starCount as number | undefined) ?? singularityTrianglePreloaderDefaults.starCount}
        triangleCells={(values?.triangleCells as number | undefined) ?? singularityTrianglePreloaderDefaults.triangleCells}
        accent={(values?.accent as string | undefined) ?? singularityTrianglePreloaderDefaults.accent}
        background={(values?.background as string | undefined) ?? singularityTrianglePreloaderDefaults.background}
        speed={(values?.speed as number | undefined) ?? singularityTrianglePreloaderDefaults.speed}
      />
    </div>
  );
}
