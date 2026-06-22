import { memo } from 'react';
import { motion } from 'framer-motion';
import { type NodeProps, useReactFlow } from '@xyflow/react';
import { cn } from '@/lib/cn';
import { spring } from '@/lib/motion';
import { getPanelDefinition } from '@/panel-os/panel-registry';
import { useGraphStore } from '@/graph/graph-store';
import { usePanelOSStore } from '@/panel-os/panel-store';
import { PanelChrome } from '@/shell/panel-chrome';

export function OSPanelNodeImpl({ id, data, selected }: NodeProps) {
  const rf = useReactFlow();
  const panelId = data.osPanelId as string;
  const def = getPanelDefinition(panelId);

  if (!def) return null;

  const PanelComponent = def.component;

  const handleDock = () => {
    // Remember position and viewport zoom
    const node = useGraphStore.getState().nodes.find(n => n.id === id);
    if (node) {
      usePanelOSStore.getState().setFloatMemory(panelId, {
        position: { x: node.position.x, y: node.position.y },
        viewport: { ...rf.getViewport() }
      });
    }
    useGraphStore.getState().removeNodes([id]);
    usePanelOSStore.getState().setDockedPanelId(panelId);
  };


  const handleClose = () => {
    useGraphStore.getState().removeNodes([id]);
  };

  const panelSize = data.size as { width: number, height: number } | undefined;

  return (
    <motion.div
      layoutId={`panel-${panelId}`}
      className={cn('relative w-full h-full flex')}
      initial={{ opacity: 0, scale: 0.85, y: 8 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        boxShadow: selected
          ? '0 0 0 2px var(--color-accent), 0 24px 48px -12px rgba(0,0,0,0.5)'
          : '0 12px 24px -12px rgba(0,0,0,0.5)',
      }}
      transition={spring}
      style={{
        width: panelSize?.width ?? def.defaultSize ?? 340,
        height: panelSize?.height ?? 600,
      }}
    >
      <PanelChrome
        title={def.title}
        icon={def.icon}
        isDocked={false}
        onClose={handleClose}
        onToggleFloat={handleDock}
        dragHandleProps={{ className: 'custom-drag-handle cursor-grab active:cursor-grabbing w-full flex items-center justify-between min-h-[44px] px-4 border-b border-white/5 bg-black/40' }}
        style={{
          borderColor: selected ? 'var(--color-accent)' : 'rgba(255, 255, 255, 0.08)',
          width: '100%',
          height: '100%'
        }}
      >
        <div className="p-1 h-full relative cursor-default nodrag nowheel">
          <PanelComponent />
        </div>
      </PanelChrome>
    </motion.div>
  );
}

export const OSPanelNode = memo(OSPanelNodeImpl);
