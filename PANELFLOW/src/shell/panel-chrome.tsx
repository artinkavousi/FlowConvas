import React from 'react';
import { PanelRightClose, X, ExternalLink, Move } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Tooltip } from '@/components/ui/tooltip';

interface PanelChromeProps {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  isDocked?: boolean;
  onClose?: () => void;
  onToggleFloat?: () => void;
  className?: string;
  style?: React.CSSProperties;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function PanelChrome({
  title,
  icon: Icon,
  children,
  isDocked = false,
  onClose,
  onToggleFloat,
  className,
  style,
  dragHandleProps,
}: PanelChromeProps) {
  return (
    <div 
      className={cn(
        "glass-panel overflow-hidden flex flex-col relative pointer-events-auto",
        isDocked ? "h-full w-full border-l border-white/10" : "rounded-[16px] border border-white/10",
        className
      )}
      style={style}
    >
      {/* Panel Header */}
      <div 
        className={cn(
          "flex items-center justify-between min-h-[44px] px-4 border-b border-white/5 bg-black/40",
          !isDocked && "cursor-grab active:cursor-grabbing"
        )}
        {...(isDocked ? {} : dragHandleProps)}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={14} className="text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]" />}
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">{title}</span>
        </div>
        
        <div className="flex items-center gap-1.5" onPointerDown={e => e.stopPropagation()}>
          {onToggleFloat && (
            <Tooltip text={isDocked ? "Float" : "Dock"} side="bottom">
              <button 
                onClick={onToggleFloat}
                className="p-1.5 text-zinc-500 hover:text-teal-400 rounded-md transition-colors hover:bg-white/10"
              >
                {isDocked ? <ExternalLink size={13} /> : <PanelRightClose size={13} />}
              </button>
            </Tooltip>
          )}
          {onClose && (
            <Tooltip text="Close" side="bottom">
              <button 
                onClick={onClose}
                className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-md transition-colors"
              >
                <X size={14} />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
      
      {/* Panel Body */}
      <div className="flex-1 relative overflow-auto custom-scrollbar bg-black/20">
        {children}
      </div>
    </div>
  );
}
