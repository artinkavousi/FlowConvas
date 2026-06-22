import { getPanelDefinition, PANEL_REGISTRY } from '@/panel-os/panel-registry';
import { useGraphStore } from '@/graph/graph-store';
import { usePanelOSStore } from '@/panel-os/panel-store';

export interface IconRailProps {
  onOpen: (id: string) => void;
  side?: 'left' | 'right';
}

export function IconRail({ onOpen, side = 'right' }: IconRailProps) {
  const borderSide = side === 'right' ? 'border-l' : 'border-r';
  const nodes = useGraphStore((s) => s.nodes);
  const dockedPanelId = usePanelOSStore((s) => s.dockedPanelId);
  // Re-read the registry whenever it changes so auto-generated panels appear.
  usePanelOSStore((s) => s.registryVersion);
  const RAIL_PANEL_IDS = Object.keys(PANEL_REGISTRY);
  const openPanelIds = nodes
    .filter((n) => n.type === 'os-panel')
    .map((n) => (n.data as any).osPanelId);

  return (
    <div
      className={`shrink-0 w-[52px] sm:w-[60px] flex flex-col py-2 gap-0 overflow-y-auto no-scrollbar ${borderSide} z-20`}
      style={{
        background: 'transparent',
        borderColor: 'rgba(255,255,255,0.04)',
      }}
    >
      {RAIL_PANEL_IDS.map((id) => {
        const def = getPanelDefinition(id);
        if (!def) return null;
        const Icon = def.icon;
        
        const isSelected = dockedPanelId === id;
        const isOpen = openPanelIds.includes(id) || dockedPanelId === id;

        return (
          <button
            key={id}
            onClick={() => onOpen(id)}
            title={def.title}
            aria-label={def.title}
            className={`relative flex flex-col items-center justify-center py-5 transition-all group ${
              isSelected
                ? 'text-white'
                : isOpen 
                  ? 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                  : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.02]'
            }`}
          >
            {isSelected && (
              <div className={`absolute ${side === 'right' ? 'right-0' : 'left-0'} top-2 bottom-2 w-[2px] bg-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.8)] rounded-full`} />
            )}

            {isSelected && (
              <div 
                className="absolute inset-x-0 inset-y-1 rounded-sm opacity-100" 
                style={{
                  background: side === 'right' 
                    ? 'linear-gradient(to right, transparent, rgba(45,212,191,0.08))' 
                    : 'linear-gradient(to left, transparent, rgba(45,212,191,0.08))'
                }} 
              />
            )}
            
            <div className={`relative z-10 flex flex-col items-center gap-3 ${isSelected ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>
              <Icon size={15} className={`transition-transform duration-300 ${isSelected ? 'scale-110 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)] text-teal-400' : 'group-hover:scale-110'}`} />
              
              <span 
                className={`text-[9px] uppercase tracking-[0.25em] transition-all font-medium ${isSelected ? 'font-bold text-teal-400' : ''}`}
                style={{ 
                  writingMode: 'vertical-rl', 
                  transform: side === 'left' ? 'rotate(180deg)' : 'none',
                  textOrientation: 'mixed'
                }}
              >
                {def.title}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
