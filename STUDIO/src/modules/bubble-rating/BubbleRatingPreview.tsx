/**
 * BubbleRatingPreview — live preview for the bubble-rating module.
 * Color comes from the PANELFLOW bridge; value is local interactive state.
 */

import { useState } from 'react';
import { BubbleRatingSlider, useBridgeStore } from '@artinos/panelflow';

export default function BubbleRatingPreview() {
  const values = useBridgeStore((s) => s.componentValues['bubble-rating']);
  const [value, setValue] = useState(50);
  const color = (values?.color as string) ?? '#F59E0B';

  return (
    <div className="w-full h-full flex items-center justify-center p-10">
      <div className="w-full max-w-md">
        <BubbleRatingSlider value={value} onChange={setValue} color={color} />
      </div>
    </div>
  );
}
