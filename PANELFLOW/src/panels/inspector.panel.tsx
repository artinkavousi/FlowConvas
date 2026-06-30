import { useMemo, useState, type ReactNode } from 'react';
import { Check, ChevronDown, ChevronRight, Copy, SlidersHorizontal } from 'lucide-react';
import { definePanel } from '@/panel-os/define-panel';
import { PanelShell } from '@/panel-os/panel-shell';
import { useGraphStore, type FluidityNode } from '@/graph/graph-store';
import { getNodeDef } from '@/graph/node-registry';
import { editorGraphSummary } from '@/graph/editor-pipeline';
import { serialize, type WorkflowDoc } from '@/graph/GraphRuntime';
import { defaultPanelCapabilities } from '@/panel-os/panel-types';
import { GooeySlider } from '@/components/GooeySlider';

type Tab = 'inspect' | 'export';

function Section({ title, defaultOpen = true, children, detail }: { title: string; defaultOpen?: boolean; children: ReactNode; detail?: string }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-white/7 bg-white/[0.025]">
      <button
        className="flex w-full items-center justify-between gap-3 border-b border-white/5 px-3 py-2.5 text-left transition hover:bg-white/[0.035]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex min-w-0 items-center gap-2">
          {isOpen ? <ChevronDown size={13} className="text-white/42" /> : <ChevronRight size={13} className="text-white/42" />}
          <span className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-white/72">{title}</span>
        </div>
        {detail && <span className="shrink-0 font-mono text-[9px] text-white/28">{detail}</span>}
      </button>
      {isOpen && <div className="space-y-4 p-3">{children}</div>}
    </div>
  );
}

function FieldLabel({ label, type }: { label: string; type: string }) {
  return (
    <div className="mb-1.5 flex items-end justify-between gap-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/48">{label}</span>
      <span className="font-mono text-[9px] uppercase text-white/25">{type}</span>
    </div>
  );
}

function NodeInspector({ node }: { node: FluidityNode }) {
  const updateNodeInput = useGraphStore((s) => s.updateNodeInput);
  const def = node.data.runtimeType ? getNodeDef(node.data.runtimeType.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')) : null;
  const inputs = def?.inputs || [];

  return (
    <Section title={node.data?.label || node.type || 'Node'} detail={node.id}>
      <div className="rounded-lg border border-white/6 bg-black/22 p-3">
        <div className="text-[11px] font-semibold text-white/74">{node.data.runtimeType || 'Universal node'}</div>
        <div className="mt-1 text-[10px] leading-relaxed text-white/36">Runtime inputs are editable here; graph wiring remains in the Node Graph panel.</div>
      </div>

      {inputs.map((input) => {
        const value = node.data.inputs?.[input.key] ?? input.default;
        return (
          <div key={input.key}>
            <FieldLabel label={input.label || input.key} type={input.type} />

            {input.type === 'number' && (
              <div className="space-y-2">
                <input
                  type="number"
                  value={Number(value)}
                  step={input.step || 0.1}
                  onChange={(e) => updateNodeInput(node.id, input.key, Number(e.target.value))}
                  className="w-full rounded-lg border border-white/8 bg-black/42 px-2.5 py-2 font-mono text-xs text-white outline-none transition focus:border-teal-300/50"
                />
                {input.range && (
                  <GooeySlider
                    min={input.range[0]}
                    max={input.range[1]}
                    step={input.step || 0.01}
                    value={Number(value)}
                    onChange={(val) => updateNodeInput(node.id, input.key, val)}
                    color={node.data.themeColor || 'var(--color-accent)'}
                    textColor="#0c0c0c"
                  />
                )}
              </div>
            )}

            {input.type === 'color' && (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={String(value)}
                  onChange={(e) => updateNodeInput(node.id, input.key, e.target.value)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-black/40 p-1"
                />
                <input
                  type="text"
                  value={String(value)}
                  onChange={(e) => updateNodeInput(node.id, input.key, e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-white/8 bg-black/42 px-2.5 py-2 font-mono text-xs uppercase text-white outline-none transition focus:border-teal-300/50"
                />
              </div>
            )}

            {input.type === 'boolean' && (
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/7 bg-black/28 px-3 py-2 transition hover:bg-white/[0.035]">
                <span className="text-xs font-semibold text-white/68">{Boolean(value) ? 'Enabled' : 'Disabled'}</span>
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(e) => updateNodeInput(node.id, input.key, e.target.checked)}
                  className="h-4 w-4 accent-teal-300"
                />
              </label>
            )}

            {input.type === 'string' && (
              <input
                type="text"
                value={String(value)}
                onChange={(e) => updateNodeInput(node.id, input.key, e.target.value)}
                className="w-full rounded-lg border border-white/8 bg-black/42 px-2.5 py-2 text-xs text-white outline-none transition focus:border-teal-300/50"
              />
            )}
          </div>
        );
      })}

      {inputs.length === 0 && (
        <div className="rounded-lg border border-white/6 bg-black/24 px-3 py-4 text-center text-[10px] uppercase tracking-[0.18em] text-white/30">
          No mutable inputs
        </div>
      )}
    </Section>
  );
}

function EmptyInspector() {
  return (
    <div className="grid h-full min-h-[220px] place-items-center rounded-xl border border-dashed border-white/8 bg-white/[0.018] p-6 text-center">
      <div>
        <SlidersHorizontal size={20} className="mx-auto mb-3 text-white/20" />
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/36">No node selected</div>
        <p className="mt-2 max-w-[240px] text-xs leading-relaxed text-white/32">Open Node Graph, select a runtime node, then edit its inputs here.</p>
      </div>
    </div>
  );
}

function ExportView() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const [copied, setCopied] = useState(false);

  const code = useMemo(() => {
    const { graph, previewTarget } = editorGraphSummary(nodes, edges);
    const doc: WorkflowDoc = {
      $schema: 'artinos/nsgraph-1',
      version: 1,
      three_version: 'r185',
      title: previewTarget ? `Preview: ${previewTarget}` : 'PanelFlow Graph Material',
      slug: previewTarget ?? 'graph-material',
      graph,
      metadata: { previewTarget: previewTarget ?? null, generatedBy: 'PANELFLOW Graph Tools' },
    };
    return serialize(doc);
  }, [nodes, edges]);

  const copy = () => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/7 bg-black/34">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/6 px-3 py-2.5">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/68">Current.nsgraph</div>
          <div className="mt-0.5 text-[9px] uppercase tracking-[0.16em] text-white/28">{nodes.length} nodes / {edges.length} edges</div>
        </div>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/[0.045] px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/62 transition hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <textarea
        className="min-h-[260px] flex-1 resize-none bg-transparent p-3 font-mono text-[11px] leading-relaxed text-teal-100/78 outline-none"
        value={code}
        readOnly
        spellCheck={false}
      />
    </div>
  );
}

export const InspectorPanel = definePanel({
  id: 'inspector',
  title: 'Inspector',
  description: 'Inspect selected graph nodes and export runtime documents.',
  icon: SlidersHorizontal,
  minSize: 300,
  maxSize: 680,
  defaultSize: 380,
  defaultPlacement: 'right',
  capabilities: { ...defaultPanelCapabilities },
  tags: ['core', 'inspector', 'graph', 'export'],
  component: function InspectorView() {
    const [tab, setTab] = useState<Tab>('inspect');
    const nodes = useGraphStore((s) => s.nodes);
    const selectedNodes = nodes.filter((n) => n.selected);

    return (
      <PanelShell>
        <div className="flex h-full min-h-0 flex-col gap-3">
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/8 bg-black/30 p-1">
            {(['inspect', 'export'] as const).map((id) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={
                  'rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition ' +
                  (tab === id ? 'bg-white text-black' : 'text-white/42 hover:bg-white/[0.055] hover:text-white/75')
                }
              >
                {id}
              </button>
            ))}
          </div>

          {tab === 'inspect' ? (
            <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {selectedNodes.length === 0 ? <EmptyInspector /> : selectedNodes.map((node) => <NodeInspector key={node.id} node={node} />)}
            </div>
          ) : (
            <ExportView />
          )}
        </div>
      </PanelShell>
    );
  },
});
