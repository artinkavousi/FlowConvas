/**
 * MagneticDockPreview — a macOS-style magnetic dock.
 * Icons scale and lift based on cursor proximity (Gaussian falloff), bridge-driven.
 */

import { useRef, useState, type PointerEvent } from 'react';
import { useBridgeStore } from '@artinos/panelflow';

const BRIDGE_ID = 'magnetic-dock';
const ICONS = ['◐', '◇', '✦', '❍', '▲', '✕', '❖', '◈'];

export default function MagneticDockPreview() {
  const v = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);
  const itemCount = Math.max(3, Math.min(8, Math.round((v?.items as number) ?? 6)));
  const magnify = (v?.magnify as number) ?? 1.8;
  const radius = (v?.radius as number) ?? 120;
  const accent = (v?.accent as string) ?? '#2dd4bf';
  const base = (v?.baseSize as number) ?? 46;

  const dockRef = useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);

  const onMove = (e: PointerEvent) => {
    const r = dockRef.current?.getBoundingClientRect();
    if (r) setMouseX(e.clientX - r.left);
  };

  const items = ICONS.slice(0, itemCount);
  // Pre-compute centers for falloff.
  const gap = 14;
  const centers = items.map((_, i) => i * (base + gap) + base / 2);

  return (
    <div className="w-full h-full flex items-end justify-center pb-16"
      style={{ background: 'radial-gradient(120% 120% at 50% 0%, rgba(45,212,191,0.06), transparent 60%)' }}>
      <div
        ref={dockRef}
        onPointerMove={onMove}
        onPointerLeave={() => setMouseX(null)}
        className="flex items-end gap-[14px] rounded-3xl px-5 py-3 backdrop-blur-xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}
      >
        {items.map((icon, i) => {
          let scale = 1;
          if (mouseX !== null) {
            const d = Math.abs(mouseX - centers[i]);
            scale = 1 + (magnify - 1) * Math.exp(-(d * d) / (2 * (radius / 2) ** 2));
          }
          const size = base * scale;
          return (
            <div
              key={i}
              className="grid place-items-center rounded-2xl transition-transform"
              style={{
                width: size,
                height: size,
                transform: `translateY(${-(size - base)}px)`,
                background: `linear-gradient(160deg, ${accent}33, ${accent}11)`,
                border: `1px solid ${accent}44`,
                color: accent,
                fontSize: size * 0.42,
                transition: 'width 90ms ease-out, height 90ms ease-out, transform 90ms ease-out',
              }}
            >
              {icon}
            </div>
          );
        })}
      </div>
    </div>
  );
}
