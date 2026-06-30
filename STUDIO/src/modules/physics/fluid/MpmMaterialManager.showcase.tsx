// @ts-nocheck
/**
 * MpmMaterialManagerShowcase — bridge-driven live showcase.
 * Renders the material preset library as swatches (CPU baseColor + key physical properties) and
 * highlights the selected material — proving the material model is usable standalone (the GPU TSL
 * lookups feed an MPM solver; here we show the data/registry side that drives them).
 */

import { useBridgeStore } from '@artinos/panelflow';
import { MATERIAL_PRESETS, MaterialManager } from './MpmMaterialManager.module';

const BRIDGE_ID = 'mpm-material-manager';
const manager = new MaterialManager();

export default function MpmMaterialManagerShowcase() {
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);
  const selected = (values?.material as string) ?? 'WATER';

  const entries = Object.entries(MATERIAL_PRESETS);

  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-auto p-6 text-zinc-200">
      <div className="text-xs uppercase tracking-wide text-zinc-400">
        MPM Material Manager — {manager.getMaterialNames().length} presets
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {entries.map(([key, m]) => {
          const [r, g, b] = m.baseColor;
          const css = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
          const active = key === selected;
          return (
            <div
              key={key}
              className="flex items-center gap-3 rounded-lg p-2"
              style={{
                background: active ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.03)',
                outline: active ? `2px solid ${css}` : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="h-10 w-10 shrink-0 rounded-md"
                style={{ background: css, boxShadow: m.emissive > 0 ? `0 0 12px ${css}` : 'none' }}
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{m.name}</div>
                <div className="truncate text-[10px] text-zinc-400">
                  ρ{m.density} · η{m.viscosity} · k{m.stiffness}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1 text-[11px] text-zinc-500">
        Selected <span className="text-zinc-300">{selected}</span> — GPU lookups (getMaterialColor /
        Stiffness / Viscosity / calculateMaterialStress) drive an MPM solver per particle.
      </div>
    </div>
  );
}
