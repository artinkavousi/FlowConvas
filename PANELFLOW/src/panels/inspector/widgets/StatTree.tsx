/**
 * StatTree — collapsible CPU/GPU/Total timing tree for render + compute passes.
 * Renders a normalized `PassNode[]` (no three coupling).
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Cpu, Layers } from 'lucide-react';
import type { PassNode } from '@/inspector/types';

function ms(value: number): string {
  return value > 0 ? value.toFixed(2) : '0';
}

function PassRow({ pass, depth }: { pass: PassNode; depth: number }) {
  const [open, setOpen] = useState(true);
  const hasChildren = pass.children.length > 0;

  return (
    <>
      <div
        className="grid items-center gap-2 border-b border-white/[0.04] py-1.5 text-[11px] hover:bg-white/[0.025]"
        style={{ gridTemplateColumns: 'minmax(0,1fr) 52px 52px 56px' }}
      >
        <button
          onClick={() => hasChildren && setOpen((o) => !o)}
          className="flex min-w-0 items-center gap-1.5 text-left"
          style={{ paddingLeft: depth * 12 }}
        >
          {hasChildren ? (
            open ? (
              <ChevronDown size={11} className="shrink-0 text-white/35" />
            ) : (
              <ChevronRight size={11} className="shrink-0 text-white/35" />
            )
          ) : (
            <span className="inline-block w-[11px] shrink-0" />
          )}
          {pass.kind === 'compute' ? (
            <Cpu size={11} className="shrink-0 text-violet-300/70" />
          ) : (
            <Layers size={11} className="shrink-0 text-teal-300/70" />
          )}
          <span className="truncate text-white/72">{pass.name}</span>
        </button>
        <span className="text-right font-mono text-amber-200/80">{ms(pass.cpu)}</span>
        <span className="text-right font-mono text-emerald-200/80">{pass.gpuAvailable ? ms(pass.gpu) : '-'}</span>
        <span className="text-right font-mono text-white/80">{ms(pass.total)}</span>
      </div>
      {open && pass.children.map((child) => <PassRow key={child.cid} pass={child} depth={depth + 1} />)}
    </>
  );
}

export function StatTree({ passes }: { passes: PassNode[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/7 bg-black/24">
      <div
        className="grid gap-2 border-b border-white/8 bg-white/[0.025] px-1 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/40"
        style={{ gridTemplateColumns: 'minmax(0,1fr) 52px 52px 56px' }}
      >
        <span className="pl-1">Pass</span>
        <span className="text-right">CPU</span>
        <span className="text-right">GPU</span>
        <span className="text-right">Total</span>
      </div>
      <div className="px-1">
        {passes.length === 0 ? (
          <div className="px-2 py-4 text-center text-[10px] uppercase tracking-[0.18em] text-white/28">No passes this frame</div>
        ) : (
          passes.map((pass) => <PassRow key={pass.cid} pass={pass} depth={0} />)
        )}
      </div>
    </div>
  );
}
