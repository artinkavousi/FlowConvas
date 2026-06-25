import { getPanelDefinition, PANEL_DEFINITIONS } from '@/panel-os/panel-registry';
import { usePanelOSStore } from '@/panel-os/panel-store';
import type { PanelDefinition } from '@/panel-os/panel-types';

export interface IconRailProps {
  onOpen: (id: string) => void;
  side?: 'left' | 'right';
}

const CORE_ORDER = ['inspector', 'lab-capsules', 'library', 'scene-settings', 'graph'];
const STUDIO_ORDER = ['agent', 'console'];

function sortByOrder(items: PanelDefinition[], order: string[]) {
  return [...items].sort((a, b) => {
    const ai = order.indexOf(a.id);
    const bi = order.indexOf(b.id);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    return a.title.localeCompare(b.title);
  });
}

function railGroups(definitions: PanelDefinition[]) {
  const core = sortByOrder(definitions.filter((def) => CORE_ORDER.includes(def.id)), CORE_ORDER);
  const studio = sortByOrder(definitions.filter((def) => STUDIO_ORDER.includes(def.id)), STUDIO_ORDER);
  const controls = definitions
    .filter((def) => def.id.startsWith('auto-') && def.tags?.includes('rail'))
    .sort((a, b) => a.title.localeCompare(b.title));
  const utility = definitions
    .filter((def) => !CORE_ORDER.includes(def.id) && !STUDIO_ORDER.includes(def.id) && !def.id.startsWith('auto-'))
    .sort((a, b) => a.title.localeCompare(b.title));

  return [
    { label: 'Main', items: core },
    { label: 'Studio', items: studio },
    { label: 'Controls', items: controls },
    { label: 'Utility', items: utility },
  ].filter((group) => group.items.length > 0);
}

export function IconRail({ onOpen, side = 'right' }: IconRailProps) {
  const borderSide = side === 'right' ? 'border-l' : 'border-r';
  const activePanelId = usePanelOSStore((s) => s.activePanelId);
  const openPanelIds = usePanelOSStore((s) => s.openPanelIds);
  // Re-read the registry whenever it changes so auto-generated panels appear.
  usePanelOSStore((s) => s.registryVersion);
  const groups = railGroups(PANEL_DEFINITIONS());

  return (
    <div
      className={`shrink-0 w-[50px] sm:w-[54px] flex flex-col py-2 overflow-y-auto no-scrollbar ${borderSide} z-20`}
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.018), rgba(0,0,0,0.06))',
        borderColor: 'rgba(255,255,255,0.055)',
      }}
    >
      {groups.map((group, groupIndex) => (
        <div key={group.label} className={groupIndex === 0 ? '' : 'mt-1.5 border-t border-white/[0.055] pt-1.5'}>
          {group.items.map((def) => {
            const id = def.id;
            const liveDef = getPanelDefinition(id) ?? def;
            const isSelected = activePanelId === id;
            const isOpen = openPanelIds.includes(id);

            return (
              <button
                key={id}
                onClick={() => onOpen(id)}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'copy';
                  event.dataTransfer.setData('application/panelflow-panel', id);
                  event.dataTransfer.setData('text/plain', id);
                }}
                title={liveDef.description || liveDef.title}
                aria-label={liveDef.title}
                className={`relative flex min-h-[78px] w-full flex-col items-center justify-center py-2.5 transition-all group ${
                  isSelected
                    ? 'text-white'
                    : isOpen
                      ? 'text-zinc-400 hover:text-white hover:bg-white/[0.025]'
                      : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.025]'
                }`}
              >
                {isSelected && (
                  <div className={`absolute ${side === 'right' ? 'right-0' : 'left-0'} inset-y-0 w-[2px] bg-teal-300`} />
                )}

                {isSelected && (
                  <div
                    className="absolute inset-0 opacity-100"
                    style={{
                      background: side === 'right'
                        ? 'linear-gradient(to right, transparent, rgba(45,212,191,0.11))'
                        : 'linear-gradient(to left, transparent, rgba(45,212,191,0.11))',
                      boxShadow: 'inset 0 0 18px rgba(45, 212, 191, 0.1), 0 0 16px rgba(45, 212, 191, 0.08)',
                    }}
                  />
                )}

                <div className={`relative z-10 flex flex-col items-center ${isSelected ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>
                  <span
                    className={`max-h-[72px] text-[9.5px] uppercase tracking-[0.14em] transition-all font-semibold leading-none ${isSelected ? 'text-teal-300' : ''}`}
                    style={{
                      writingMode: 'vertical-rl',
                      transform: side === 'left' ? 'rotate(180deg)' : 'none',
                      textOrientation: 'mixed',
                    }}
                  >
                    {liveDef.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
