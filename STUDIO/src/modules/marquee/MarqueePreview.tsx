/**
 * MarqueePreview — an infinite, seamless scrolling marquee.
 * Duplicates its track so the loop has no visible seam; bridge-driven speed/direction.
 */

import { useBridgeStore } from '@artinos/panelflow';

const BRIDGE_ID = 'marquee';
const WORDS = ['DESIGN', 'BUILD', 'REUSE', 'SHIP', 'COMPOUND', 'ARTINOS'];

export default function MarqueePreview() {
  const v = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);
  const speed = (v?.speed as number) ?? 18; // seconds per loop
  const reverse = (v?.reverse as boolean) ?? false;
  const accent = (v?.accent as string) ?? '#2dd4bf';
  const gap = (v?.gap as number) ?? 48;
  const fontSize = (v?.fontSize as number) ?? 40;

  const track = (
    <div className="flex shrink-0 items-center" style={{ gap, paddingRight: gap }}>
      {WORDS.map((w, i) => (
        <span key={i} className="flex items-center" style={{ gap }}>
          <span style={{ fontSize, fontWeight: 800, color: i % 2 ? accent : 'rgba(255,255,255,0.85)', letterSpacing: '-0.02em' }}>
            {w}
          </span>
          <span style={{ color: accent, fontSize: fontSize * 0.5 }}>✦</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="w-full h-full flex items-center overflow-hidden"
      style={{ maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)' }}>
      <div
        className="flex"
        style={{ animation: `artinos-marquee ${speed}s linear infinite`, animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        {track}
        {track}
      </div>
      <style>{`@keyframes artinos-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}
