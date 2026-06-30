/**
 * ViewerView — inspectable node / buffer inventory.
 *
 * Modules surface buffers by calling `renderer.inspector.inspect(node)` inside
 * their render loop; those appear here live. Render-target / texture counts from
 * the memory snapshot give a baseline picture when nothing is explicitly
 * inspected. (Per-node texture *thumbnails* — offscreen QuadMesh previews — are a
 * follow-up; they require rendering into the module-owned renderer.)
 */

import { Boxes, Image, Layers } from 'lucide-react';
import { useInspectorStore } from '@/inspector/inspector-store';
import type { ViewerNode } from '@/inspector/types';

const ICON = {
  node: Boxes,
  texture: Image,
  renderTarget: Layers,
} as const;

function NodeCard({ node }: { node: ViewerNode }) {
  const Icon = ICON[node.kind];
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-white/7 bg-black/24 px-3 py-2">
      <Icon size={15} className="shrink-0 text-teal-300/75" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] font-semibold text-white/72">{node.name}</div>
        <div className="text-[9px] uppercase tracking-[0.16em] text-white/30">
          {node.kind}
          {node.width > 0 && ` · ${node.width}×${node.height}`}
        </div>
      </div>
    </div>
  );
}

export function ViewerView() {
  const nodes = useInspectorStore((s) => s.viewer.nodes);
  const memory = useInspectorStore((s) => s.memory);
  const rtRow = memory?.rows.find((r) => r.key === 'renderTargets');
  const texRow = memory?.rows.find((r) => r.key === 'textures');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/7 bg-black/24 p-3">
          <div className="flex items-center justify-between gap-2">
            <Layers size={13} className="text-teal-300/80" />
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30">Render Targets</span>
          </div>
          <div className="mt-2.5 font-mono text-lg font-bold text-white/90">{rtRow?.count ?? 0}</div>
        </div>
        <div className="rounded-xl border border-white/7 bg-black/24 p-3">
          <div className="flex items-center justify-between gap-2">
            <Image size={13} className="text-teal-300/80" />
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30">Textures</span>
          </div>
          <div className="mt-2.5 font-mono text-lg font-bold text-white/90">{texRow?.count ?? 0}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Inspected Buffers</div>
        {nodes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/8 bg-white/[0.018] px-4 py-6 text-center">
            <Boxes size={18} className="mx-auto mb-2 text-white/22" />
            <p className="mx-auto max-w-[260px] text-[10.5px] leading-relaxed text-white/34">
              No buffers inspected. A module can surface intermediate outputs with{' '}
              <code className="text-teal-200/70">renderer.inspector.inspect(node)</code> — they appear here live.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {nodes.map((node) => (
              <NodeCard key={node.id} node={node} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
