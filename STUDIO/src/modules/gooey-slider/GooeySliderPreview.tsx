/**
 * GooeySliderPreview — live preview for the gooey-slider module.
 *
 * Appearance/config come from the PANELFLOW bridge (keyed by the module id);
 * the slider's own value is local interactive state so it's draggable in the showcase.
 */

import { useState } from 'react';
import { GooeySlider, useBridgeStore } from '@artinos/panelflow';

export default function GooeySliderPreview() {
  // Select the raw slice (stable: undefined === undefined) and default OUTSIDE the
  // selector — returning `... || {}` inside the selector makes a fresh object every
  // render, which trips useSyncExternalStore's "getSnapshot should be cached" loop.
  const values = useBridgeStore((s) => s.componentValues['gooey-slider']);
  const [value, setValue] = useState(40);

  const color = (values?.color as string) ?? '#2dd4bf';
  const textColor = (values?.textColor as string) ?? '#0c0c0c';
  const max = Number(values?.max ?? 100);
  const step = Number(values?.step ?? 1);

  return (
    <div className="w-full h-full flex items-center justify-center p-10">
      <div className="w-full max-w-md">
        <GooeySlider
          value={value}
          onChange={setValue}
          min={0}
          max={max}
          step={step}
          color={color}
          textColor={textColor}
        />
      </div>
    </div>
  );
}
