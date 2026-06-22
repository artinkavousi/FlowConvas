import type { CSSProperties, ReactNode } from 'react';

/**
 * ViewportSlot — A container slot where the host project renders its content.
 * PANELFLOW does not own the rendering viewport; the host project provides it.
 * This component provides the correct positioning and styling for the viewport area.
 */
export interface ViewportSlotProps {
  /** Host rendering content (Three.js canvas, web components, etc.) */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const slotStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
};

export function ViewportSlot({ children, className, style }: ViewportSlotProps) {
  return (
    <div className={className} style={{ ...slotStyle, ...style }}>
      {children}
    </div>
  );
}
