import { useMemo, useState } from 'react';
import { Code2, Copy, Activity } from 'lucide-react';
import { definePanel } from '@/panel-os/define-panel';
import { defaultPanelCapabilities } from '@/panel-os/panel-types';
import { useGraphStore } from '@/graph/graph-store';
import { editorGraphSummary } from '@/graph/editor-pipeline';
import { serialize, type WorkflowDoc } from '@/graph/GraphRuntime';

function CodeView() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const [copied, setCopied] = useState(false);

  const code = useMemo(() => {
    const { graph, previewTarget } = editorGraphSummary(nodes, edges);
    const doc: WorkflowDoc = {
      $schema: 'artinos/nsgraph-1',
      version: 1,
      three_version: 'r184',
      title: previewTarget ? `Preview: ${previewTarget}` : 'ARTINOS Graph Material',
      slug: previewTarget ?? 'graph-material',
      graph,
      metadata: { previewTarget: previewTarget ?? null, generatedBy: 'ARTINOS Studio Code panel' },
    };
    return serialize(doc);
  }, [nodes, edges]);

  const handleCopy = () => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-black/40">
      {/* header */}
      <div className="px-4 py-3 border-b border-white/[0.05] shrink-0 flex justify-between items-center bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse" />
          <span className="text-[11px] font-bold tracking-widest uppercase text-indigo-300 select-none">
            Current.nsgraph
          </span>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all border ${
            copied
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10 hover:text-white'
          }`}
        >
          {copied ? (
            <span className="flex items-center gap-1.5"><Activity size={12} /> Copied!</span>
          ) : (
            <span className="flex items-center gap-1.5"><Copy size={12} /> Copy Code</span>
          )}
        </button>
      </div>

      {/* code area */}
      <div className="flex-1 overflow-auto custom-scrollbar relative bg-black/50">
        <div className="absolute top-0 left-0 bottom-0 w-8 bg-black/40 border-r border-white/5 pointer-events-none z-10" />
        <textarea
          className="w-full min-h-full bg-transparent text-[11px] font-mono text-indigo-200/80 p-5 pl-12 outline-none resize-none leading-relaxed whitespace-pre"
          value={code}
          readOnly
          spellCheck={false}
        />
      </div>
    </div>
  );
}

export const CodePanel = definePanel({
  id: 'code',
  title: 'Code',
  description: 'Generated graph code.',
  icon: Code2,
  defaultPlacement: 'right',
  defaultSize: 320,
  minSize: 240,
  maxSize: 560,
  capabilities: { ...defaultPanelCapabilities },
  component: CodeView,
  tags: ['code', 'export'],
});
