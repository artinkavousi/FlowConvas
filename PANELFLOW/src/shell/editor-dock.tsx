import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Circle, Box, Square, Disc, Minus, Maximize2, Move, Activity, Layers, X, Cpu, Zap, PanelBottom, PanelLeft, PanelRight, PictureInPicture2, LayoutGrid, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconRail } from '@/shell/icon-rail';
import { Tooltip } from '@/components/ui/tooltip';
import { useGraphStore } from '@/graph/graph-store';
import { usePanelOSStore, type DockMode, type DockFloatRect } from '@/panel-os/panel-store';
import { getPanelDefinition } from '@/panel-os/panel-registry';
import { spring } from '@/lib/motion';

const MESHES = [
  { id: 'sphere', Icon: Circle },
  { id: 'box',    Icon: Box    },
  { id: 'plane',  Icon: Square },
  { id: 'torus',  Icon: Disc   },
] as const;

function SceneControls() {
  const scene = useGraphStore((s) => s.scene);
  const updateScene = useGraphStore((s) => s.updateScene);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/5 shadow-inner overflow-hidden"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      layout
    >
      <div className="flex items-center pr-0.5">
        <AnimatePresence initial={false}>
          {(['3d', '2d'] as const).map((m) => {
            const isActive = scene.viewMode === m;
            if (!isActive && !isHovered) return null;
            return (
              <motion.button
                key={m}
                layout="position"
                initial={{ opacity: 0, width: 0, paddingLeft: 0, paddingRight: 0, scale: 0.8 }}
                animate={{ opacity: 1, width: 'auto', paddingLeft: 12, paddingRight: 12, scale: 1 }}
                exit={{ opacity: 0, width: 0, paddingLeft: 0, paddingRight: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={() => updateScene({ viewMode: m })}
                className={`py-1 rounded-md text-[9px] font-bold tracking-wider transition-colors focus:outline-none focus:ring-1 focus:ring-white/20 shrink-0 ${
                  isActive
                    ? 'bg-zinc-700/50 text-white shadow-sm ring-1 ring-white/10 ml-0.5'
                    : 'text-zinc-500 hover:text-white hover:bg-white/5 ml-0.5'
                }`}
              >
                {m.toUpperCase()}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      <motion.div layout="position" className="w-[1px] h-3 bg-white/10 shrink-0 mx-0.5" />

      <div className="flex items-center gap-0.5 pl-0.5">
        <AnimatePresence initial={false}>
          {MESHES.map(({ id, Icon }) => {
            const isActive = scene.geometry === id;
            if (!isActive && !isHovered) return null;
            return (
              <motion.div
                key={id}
                layout="position"
                initial={{ opacity: 0, width: 0, scale: 0.8 }}
                animate={{ opacity: 1, width: 'auto', scale: 1 }}
                exit={{ opacity: 0, width: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <Tooltip text={id.charAt(0).toUpperCase() + id.slice(1)}>
                  <button
                    onClick={() => updateScene({ geometry: id })}
                    className={`p-1.5 rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-white/20 shrink-0 ${
                      isActive
                        ? 'bg-zinc-700/50 text-white shadow-sm ring-1 ring-white/10'
                        : 'text-zinc-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={12} />
                  </button>
                </Tooltip>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

const DOCK_MODES = [
  { id: 'bottom', Icon: PanelBottom, label: 'Dock bottom' },
  { id: 'left',   Icon: PanelLeft,   label: 'Dock left' },
  { id: 'right',  Icon: PanelRight,  label: 'Dock right' },
  { id: 'float',  Icon: PictureInPicture2, label: 'Float' },
] as const;

const PANEL_DROP_TYPE = 'application/panelflow-panel';
const PANEL_DROP_ORIGIN = 'application/panelflow-panel-origin';

const PANEL_LAYOUT_PRESETS = [
  { id: 'main', label: 'Main layout', Icon: LayoutGrid, panels: ['inspector', 'scene-settings'], active: 'inspector' },
  { id: 'inspect', label: 'Inspect layout', Icon: PanelRight, panels: ['inspector', 'library'], active: 'inspector' },
  { id: 'graph', label: 'Graph layout', Icon: Activity, panels: ['graph', 'inspector'], active: 'graph' },
] as const;

function WindowControls({ setPreset }: { setPreset: (preset: 'min' | 'default' | 'max') => void }) {
  const dockMode = usePanelOSStore((s) => s.dockMode);
  const setDockMode = usePanelOSStore((s) => s.setDockMode);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/5 shadow-inner overflow-hidden"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      layout
    >
      <div className="flex items-center pr-0.5">
        <AnimatePresence initial={false}>
          {DOCK_MODES.map(({ id, Icon, label }) => {
            const isActive = dockMode === id;
            if (!isActive && !isHovered) return null;
            return (
              <motion.div
                key={id}
                layout="position"
                initial={{ opacity: 0, width: 0, scale: 0.8 }}
                animate={{ opacity: 1, width: 'auto', scale: 1 }}
                exit={{ opacity: 0, width: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <Tooltip text={label} side="bottom">
                  <button
                    onClick={() => setDockMode(id)}
                    aria-label={label}
                    className={`p-1.5 rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-white/20 shrink-0 ${
                      isActive
                        ? 'bg-zinc-700/50 text-white shadow-sm ring-1 ring-white/10 ml-0.5'
                        : 'text-zinc-500 hover:text-white hover:bg-white/10 ml-0.5'
                    }`}
                  >
                    <Icon size={12} />
                  </button>
                </Tooltip>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <motion.div layout="position" className="w-[1px] h-3 bg-white/10 shrink-0 mx-0.5" />

      <div className="flex items-center gap-0.5 pl-0.5">
        <AnimatePresence initial={false}>
          {([
            { id: 'min', Icon: Minus, label: 'Minimize dock' },
            { id: 'default', Icon: Square, label: 'Default size' },
            { id: 'max', Icon: Maximize2, label: 'Maximize dock' }
          ] as const).map(({ id, Icon, label }) => {
            if (!isHovered) return null;
            return (
              <motion.div
                key={id}
                layout="position"
                initial={{ opacity: 0, width: 0, scale: 0.8 }}
                animate={{ opacity: 1, width: 'auto', scale: 1 }}
                exit={{ opacity: 0, width: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <Tooltip text={label.split(' ')[0]} side="bottom">
                  <button
                    onClick={() => setPreset(id)}
                    className="p-1.5 hover:bg-white/10 rounded-md text-zinc-500 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-white/20 shrink-0"
                    aria-label={label}
                  >
                    <Icon size={id === 'default' ? 10 : 12} />
                  </button>
                </Tooltip>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <AnimatePresence initial={false}>
            {!isHovered && (
                <motion.div
                key="default-btn"
                layout="position"
                initial={{ opacity: 0, width: 0, scale: 0.8 }}
                animate={{ opacity: 1, width: 'auto', scale: 1 }}
                exit={{ opacity: 0, width: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <Tooltip text="Default Size" side="bottom">
                  <button
                    onClick={() => setPreset('default')}
                    className="p-1.5 hover:bg-white/10 rounded-md text-zinc-500 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-white/20 shrink-0"
                    aria-label="Default size"
                  >
                    <Square size={10} />
                  </button>
                </Tooltip>
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function LayoutPresetControls() {
  const setPanelLayout = usePanelOSStore((s) => s.setPanelLayout);

  return (
    <motion.div
      className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/5 shadow-inner"
      layout
    >
      {PANEL_LAYOUT_PRESETS.map(({ id, label, Icon, panels, active }) => (
        <Tooltip key={id} text={label} side="bottom">
          <button
            onClick={() => {
              const availablePanels = panels.filter((panelId) => getPanelDefinition(panelId));
              setPanelLayout(availablePanels, active);
            }}
            aria-label={label}
            className="p-1.5 rounded-md text-zinc-500 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-1 focus:ring-white/20"
          >
            <Icon size={12} />
          </button>
        </Tooltip>
      ))}
    </motion.div>
  );
}

// ─── multi-panel host (resizable split panels) ──────────────────────────────

function EmptyDockState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-6 select-none">
      <LayoutGrid size={20} className="text-white/20" />
      <p className="text-[11px] uppercase tracking-[0.2em] text-white/30">No panel open</p>
      <p className="text-[11px] text-white/25 max-w-[220px] leading-relaxed">
        Pick a panel from the rail, or press <kbd className="px-1 py-0.5 rounded bg-white/10 text-white/50">⌘K</kbd> to search.
      </p>
    </div>
  );
}

function DropIndicator() {
  return (
    <div className="relative z-20 w-0 shrink-0 pointer-events-none" aria-hidden="true">
      <div className="absolute left-[-1px] top-2 bottom-2 w-0.5 rounded-full bg-teal-300 shadow-[0_0_18px_rgba(45,212,191,0.9)]" />
    </div>
  );
}

const SPLIT_HANDLE_WIDTH = 8;
const TWO_PANEL_PRIMARY_RATIO = 0.61803398875;

function PanelHost() {
  const openPanelIds = usePanelOSStore((s) => s.openPanelIds);
  const activePanelId = usePanelOSStore((s) => s.activePanelId);
  const panelSizes = usePanelOSStore((s) => s.panelSizes);
  const setPanelSize = usePanelOSStore((s) => s.setPanelSize);
  const focusPanel = usePanelOSStore((s) => s.focusPanel);
  const closePanel = usePanelOSStore((s) => s.closePanel);
  const openPanelAt = usePanelOSStore((s) => s.openPanelAt);
  const movePanel = usePanelOSStore((s) => s.movePanel);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const resizing = useRef<{
    id: string;
    nextId: string;
    startX: number;
    startSize: number;
    startNextSize: number;
    min: number;
    nextMin: number;
  } | null>(null);
  const pointerPanelDrag = useRef<{ id: string; targetIndex: number | null } | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [hostWidth, setHostWidth] = useState(0);
  // Re-render when auto-generated panels are added/removed.
  usePanelOSStore((s) => s.registryVersion);

  const visiblePanels = openPanelIds
    .map((id) => getPanelDefinition(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof getPanelDefinition>>[];

  useEffect(() => {
    const element = scrollAreaRef.current;
    if (!element) return undefined;

    const updateWidth = () => setHostWidth(element.clientWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const getPanelBasis = useCallback((def: NonNullable<ReturnType<typeof getPanelDefinition>>, index: number) => {
    const min = def.minSize ?? 260;
    const explicit = panelSizes[def.id];
    if (explicit) return Math.max(min, explicit);
    if (visiblePanels.length === 1) return hostWidth || min;
    if (visiblePanels.length === 2 && hostWidth > 0) {
      const available = Math.max(min * 2, hostWidth - SPLIT_HANDLE_WIDTH);
      const primary = available * TWO_PANEL_PRIMARY_RATIO;
      return index === 0 ? Math.max(min, primary) : Math.max(min, available - primary);
    }
    return Math.max(min, def.defaultSize ?? 340);
  }, [hostWidth, panelSizes, visiblePanels.length]);

  const canDropPanel = useCallback((event: React.DragEvent) => (
    event.dataTransfer.types.includes(PANEL_DROP_TYPE)
  ), []);

  const applyPanelDrop = useCallback((event: React.DragEvent, targetIndex: number) => {
    const id = event.dataTransfer.getData(PANEL_DROP_TYPE) || event.dataTransfer.getData('text/plain');
    if (!id || !getPanelDefinition(id)) return;
    event.preventDefault();
    event.stopPropagation();
    const origin = event.dataTransfer.getData(PANEL_DROP_ORIGIN);
    if (origin === 'dock') movePanel(id, targetIndex);
    else openPanelAt(id, targetIndex);
    setDropIndex(null);
  }, [movePanel, openPanelAt]);

  const getSectionDropIndex = useCallback((event: React.DragEvent<HTMLElement>, index: number) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientX < rect.left + rect.width / 2 ? index : index + 1;
  }, []);

  const getPointerDropIndex = useCallback((clientX: number, clientY: number) => {
    const target = document
      .elementFromPoint(clientX, clientY)
      ?.closest<HTMLElement>('[data-panelflow-panel-section]');
    if (!target) return visiblePanels.length;
    const index = Number(target.dataset.panelIndex ?? visiblePanels.length);
    const rect = target.getBoundingClientRect();
    return clientX < rect.left + rect.width / 2 ? index : index + 1;
  }, [visiblePanels.length]);

  const updateSplitResize = useCallback((clientX: number) => {
    if (!resizing.current) return;
    const pairSize = resizing.current.startSize + resizing.current.startNextSize;
    const delta = clientX - resizing.current.startX;
    const nextSize = Math.max(
      resizing.current.min,
      Math.min(pairSize - resizing.current.nextMin, resizing.current.startSize + delta),
    );
    setPanelSize(resizing.current.id, nextSize);
    setPanelSize(resizing.current.nextId, pairSize - nextSize);
  }, [setPanelSize]);

  const stopSplitResize = useCallback(() => {
    resizing.current = null;
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => updateSplitResize(event.clientX);
    const handleMouseUp = () => stopSplitResize();
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [stopSplitResize, updateSplitResize]);

  return (
    <div
      className="flex-1 min-w-0 min-h-0 relative"
      onDragOver={(event) => {
        if (canDropPanel(event)) {
          event.preventDefault();
          event.dataTransfer.dropEffect = event.dataTransfer.getData(PANEL_DROP_ORIGIN) === 'dock' ? 'move' : 'copy';
          if (visiblePanels.length === 0) setDropIndex(0);
        }
      }}
      onDrop={(event) => {
        applyPanelDrop(event, visiblePanels.length);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropIndex(null);
      }}
      onDragEnd={() => setDropIndex(null)}
    >
      {visiblePanels.length === 0 ? (
        <EmptyDockState />
      ) : (
        <div ref={scrollAreaRef} className="h-full min-w-0 overflow-x-auto overflow-y-hidden custom-scrollbar">
          <div className="flex h-full min-w-full items-stretch gap-0">
            {visiblePanels.map((def, index) => {
              const Icon = def.icon;
              const Component = def.component;
              const isActive = def.id === activePanelId;
              const closable = def.capabilities?.closable !== false;
              const min = def.minSize ?? 260;
              const basis = getPanelBasis(def, index);

              return (
                <React.Fragment key={def.id}>
                  {dropIndex === index && <DropIndicator />}
                  <section
                    data-panelflow-panel-section
                    data-panel-index={index}
                    onPointerDown={() => focusPanel(def.id)}
                    onDragOver={(event) => {
                      if (!canDropPanel(event)) return;
                      event.preventDefault();
                      event.stopPropagation();
                      event.dataTransfer.dropEffect = event.dataTransfer.getData(PANEL_DROP_ORIGIN) === 'dock' ? 'move' : 'copy';
                      setDropIndex(getSectionDropIndex(event, index));
                    }}
                    onDrop={(event) => applyPanelDrop(event, getSectionDropIndex(event, index))}
                    className={`group/panel flex min-h-0 flex-col border-r border-white/[0.055] transition-colors ${
                      isActive ? 'bg-white/[0.026]' : 'bg-black/[0.045] hover:bg-white/[0.014]'
                    }`}
                    style={{
                      flex: visiblePanels.length === 1 ? '1 1 100%' : `0 0 ${basis}px`,
                      minWidth: min,
                    }}
                  >
                    <header
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData(PANEL_DROP_TYPE, def.id);
                        event.dataTransfer.setData(PANEL_DROP_ORIGIN, 'dock');
                        event.dataTransfer.setData('text/plain', def.id);
                      }}
                      onDragEnd={() => setDropIndex(null)}
                      className={`flex min-h-[42px] items-center justify-between gap-3 border-b px-3 py-2 transition ${
                        isActive ? 'border-teal-300/16 bg-teal-300/[0.045]' : 'border-white/[0.055] bg-white/[0.018]'
                      }`}
                    >
                      <button
                        onClick={() => focusPanel(def.id)}
                        className="flex min-w-0 items-center gap-2 text-left focus:outline-none"
                      >
                        {Icon && (
                          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border ${
                            isActive ? 'border-teal-300/24 bg-teal-300/10 text-teal-300' : 'border-white/8 bg-black/22 text-white/38'
                          }`}>
                            <Icon size={13} />
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-[10px] font-black uppercase tracking-[0.18em] text-white/76">
                            {def.title}
                          </span>
                          <span className="mt-0.5 hidden truncate text-[9px] text-white/28 xl:block">
                            {def.description}
                          </span>
                        </span>
                      </button>

                      <div className="flex shrink-0 items-center gap-1">
                        {visiblePanels.length > 1 && (
                          <div className="flex items-center gap-0.5 opacity-35 transition group-hover/panel:opacity-100">
                            <button
                              aria-label={`Move ${def.title} left`}
                              disabled={index === 0}
                              onClick={(event) => {
                                event.stopPropagation();
                                movePanel(def.id, index - 1);
                              }}
                              className="grid h-6 w-5 place-items-center rounded-md text-white/20 transition hover:bg-white/8 hover:text-teal-200 disabled:pointer-events-none disabled:opacity-20"
                            >
                              <ChevronLeft size={12} />
                            </button>
                            <button
                              aria-label={`Move ${def.title} right`}
                              disabled={index === visiblePanels.length - 1}
                              onClick={(event) => {
                                event.stopPropagation();
                                movePanel(def.id, index + 2);
                              }}
                              className="grid h-6 w-5 place-items-center rounded-md text-white/20 transition hover:bg-white/8 hover:text-teal-200 disabled:pointer-events-none disabled:opacity-20"
                            >
                              <ChevronRight size={12} />
                            </button>
                          </div>
                        )}
                        <button
                          aria-label={`Move ${def.title}`}
                          className="grid h-6 w-5 place-items-center rounded-md text-white/18 opacity-0 transition hover:bg-white/8 hover:text-teal-200 group-hover/panel:opacity-100 cursor-grab active:cursor-grabbing"
                          onPointerDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            event.currentTarget.setPointerCapture(event.pointerId);
                            focusPanel(def.id);
                            pointerPanelDrag.current = { id: def.id, targetIndex: index };
                            setDropIndex(index);
                          }}
                          onPointerMove={(event) => {
                            if (pointerPanelDrag.current?.id !== def.id) return;
                            const targetIndex = getPointerDropIndex(event.clientX, event.clientY);
                            pointerPanelDrag.current.targetIndex = targetIndex;
                            setDropIndex(targetIndex);
                          }}
                          onPointerUp={(event) => {
                            if (pointerPanelDrag.current?.id === def.id) {
                              const targetIndex = pointerPanelDrag.current.targetIndex;
                              if (targetIndex !== null) movePanel(def.id, targetIndex);
                            }
                            pointerPanelDrag.current = null;
                            setDropIndex(null);
                            event.currentTarget.releasePointerCapture(event.pointerId);
                          }}
                        >
                          <GripVertical size={12} />
                        </button>
                        {closable && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              closePanel(def.id);
                            }}
                            aria-label={`Close ${def.title}`}
                            className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-white/24 transition hover:bg-white/8 hover:text-white/80"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </header>

                    <div className="min-h-0 flex-1 overflow-hidden">
                      <Component />
                    </div>
                  </section>

                  {index < visiblePanels.length - 1 && (
                    <div
                      className="group/resize relative z-10 w-2 shrink-0 cursor-col-resize bg-black/10"
                      onPointerDown={(e) => {
                        if (e.pointerType === 'mouse') return;
                        const nextDef = visiblePanels[index + 1];
                        if (!nextDef) return;
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        resizing.current = {
                          id: def.id,
                          nextId: nextDef.id,
                          startX: e.clientX,
                          startSize: basis,
                          startNextSize: getPanelBasis(nextDef, index + 1),
                          min,
                          nextMin: nextDef.minSize ?? 260,
                        };
                      }}
                      onPointerMove={(e) => {
                        if (!resizing.current || resizing.current.id !== def.id) return;
                        updateSplitResize(e.clientX);
                      }}
                      onPointerUp={(e) => {
                        if (resizing.current?.id === def.id) stopSplitResize();
                        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                          e.currentTarget.releasePointerCapture(e.pointerId);
                        }
                      }}
                      onMouseDown={(e) => {
                        if (e.button !== 0) return;
                        const nextDef = visiblePanels[index + 1];
                        if (!nextDef) return;
                        e.preventDefault();
                        e.stopPropagation();
                        resizing.current = {
                          id: def.id,
                          nextId: nextDef.id,
                          startX: e.clientX,
                          startSize: basis,
                          startNextSize: getPanelBasis(nextDef, index + 1),
                          min,
                          nextMin: nextDef.minSize ?? 260,
                        };
                      }}
                      onDoubleClick={() => {
                        const nextDef = visiblePanels[index + 1];
                        if (!nextDef) return;
                        if (visiblePanels.length === 2 && hostWidth > 0) {
                          const available = Math.max(min + (nextDef.minSize ?? 260), hostWidth - SPLIT_HANDLE_WIDTH);
                          const leftSize = Math.max(min, available * TWO_PANEL_PRIMARY_RATIO);
                          setPanelSize(def.id, leftSize);
                          setPanelSize(nextDef.id, Math.max(nextDef.minSize ?? 260, available - leftSize));
                          return;
                        }
                        setPanelSize(def.id, def.defaultSize ?? 340);
                        setPanelSize(nextDef.id, nextDef.defaultSize ?? 340);
                      }}
                      aria-label={`Resize ${def.title}`}
                    >
                      <div className="absolute inset-y-2 left-1/2 w-px -translate-x-1/2 rounded-full bg-white/8 transition group-hover/resize:bg-teal-300/55 group-hover/resize:shadow-[0_0_14px_rgba(45,212,191,0.65)]" />
                      <GripVertical size={12} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/14 transition group-hover/resize:text-teal-300/80" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
            {dropIndex === visiblePanels.length && <DropIndicator />}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── dock container geometry ────────────────────────────────────────────────

function dockStyle(mode: DockMode, h: number, w: number, fr: DockFloatRect): React.CSSProperties {
  const common: React.CSSProperties = { position: 'absolute', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' };
  if (mode === 'float') {
    return { ...common, left: fr.x, top: fr.y, width: fr.w, height: fr.h };
  }
  if (mode === 'left')   return { ...common, top: 76, bottom: 24, left: 24, width: w };
  if (mode === 'right')  return { ...common, top: 76, bottom: 24, right: 24, width: w };
  return { ...common, bottom: 24, left: 24, right: 24, height: `calc(${h}% - 24px)` };
}

const MIN_W = 420;

export interface EditorDockBrand {
  name?: string;
  mark?: React.ReactNode;
}

export interface EditorDockProps {
  brand?: EditorDockBrand;
}

export function EditorDock({ brand }: EditorDockProps = {}) {
  const brandName = brand?.name ?? 'PANELFLOW';
  // docked size state
  const [heightPct, setHeightPct] = useState(46);    // bottom: % viewport height
  const [sideWidth, setSideWidth] = useState(480);    // left|right: px

  const [smooth, setSmooth] = useState(false);
  const dockDragging = useRef(false);

  const stats       = useGraphStore((s) => s.stats);

  const dockMode       = usePanelOSStore((s) => s.dockMode);
  const floatRect      = usePanelOSStore((s) => s.dockFloatRect);
  const setFloatRect   = usePanelOSStore((s) => s.setDockFloatRect);
  const openPanel      = usePanelOSStore((s) => s.openPanel);

  const isFloat   = dockMode === 'float';

  useEffect(() => {
    const handler = (e: Event) => { const id = (e as CustomEvent<string>).detail; if (id) openPanel(id); };
    window.addEventListener('fluidity:open-panel', handler);
    return () => window.removeEventListener('fluidity:open-panel', handler);
  }, [openPanel]);

  const setPreset = (size: 'min' | 'default' | 'max') => {
    setSmooth(true);
    if (dockMode === 'bottom') setHeightPct(size === 'min' ? 9 : size === 'max' ? 88 : 46);
    else setSideWidth(size === 'min' ? MIN_W : size === 'max' ? 800 : 480);
    setTimeout(() => setSmooth(false), 480);
  };

  // ── edge-resize handle (docked modes) ───────────────────────────────────
  const edgeHandleCls =
    dockMode === 'bottom' ? 'h-3 w-full -top-1.5 left-0 cursor-row-resize'
    : dockMode === 'left' ? 'w-3 h-full top-0 -right-1.5 cursor-col-resize'
    :                        'w-3 h-full top-0 -left-1.5 cursor-col-resize';
  const gripCls = dockMode === 'bottom' ? 'w-16 h-1' : 'h-16 w-1';

  return (
    <motion.div
      className="fluidity-dock-in absolute z-20 flex flex-col pointer-events-auto glass-panel"
      style={{
        ...dockStyle(dockMode, heightPct, sideWidth, floatRect),
        transition: smooth ? 'height 0.46s cubic-bezier(0.16,1,0.3,1), width 0.46s cubic-bezier(0.16,1,0.3,1)' : 'none',
        boxShadow: isFloat ? 'var(--shadow-drag)' : undefined,
      }}
      layout="position"
      transition={spring}
    >

      {/* ── outer edge-resize handle (docked modes only) ─────────────────── */}
      {!isFloat && (
        <div
          className={`absolute z-30 group ${edgeHandleCls}`}
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            setSmooth(false);
            dockDragging.current = true;
          }}
          onPointerMove={(e) => {
            if (!dockDragging.current) return;
            if (dockMode === 'bottom') {
              const height = window.innerHeight - e.clientY;
              const pct = Math.max(9, Math.min(88, (height / window.innerHeight) * 100));
              setHeightPct(pct);
            } else {
              const w = dockMode === 'left' ? e.clientX - 24 : window.innerWidth - e.clientX - 24;
              setSideWidth(Math.max(MIN_W, Math.min(960, w)));
            }
          }}
          onPointerUp={(e) => {
            e.currentTarget.releasePointerCapture(e.pointerId);
            dockDragging.current = false;
          }}
          onDoubleClick={() => setPreset('default')}
        >
          <div
            className={`rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-colors opacity-40 group-hover:opacity-100 ${gripCls}`}
            style={{ background: 'rgba(255, 255, 255, 0.5)', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}
          />
        </div>
      )}

      {/* ── content container ─────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col w-full h-full overflow-hidden" style={{ borderRadius: 'inherit' }}>
        {/* ── title / toolbar ─────────────────────────────────────────────── */}
        <div
          className="min-h-[50px] py-1.5 px-4 border-b flex items-center justify-between shrink-0 relative z-10 gap-4"
          style={{ marginTop: isFloat ? 0 : 4, borderColor: 'rgba(255, 255, 255, 0.05)' }}
        >
        {/* LEFT SECTION */}
        <div className="flex items-center gap-3">
          {isFloat && (
            <button
              className="flex items-center justify-center w-6 h-6 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-1 focus:ring-white/20"
              aria-label="Drag floating dock"
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                setSmooth(false);
                dockDragging.current = true;
              }}
              onPointerMove={(e) => {
                if (!dockDragging.current) return;
                setFloatRect({
                  ...floatRect,
                  x: floatRect.x + e.movementX,
                  y: floatRect.y + e.movementY,
                });
              }}
              onPointerUp={(e) => {
                e.currentTarget.releasePointerCapture(e.pointerId);
                dockDragging.current = false;
              }}
            >
              <Move size={13} />
            </button>
          )}
          <div className="flex items-center gap-2 pr-2 border-r border-white/10 hidden sm:flex" aria-hidden="true">
             <div className="w-5 h-5 rounded flex items-center justify-center bg-teal-500/10 border border-teal-500/20">
               {brand?.mark ?? <Layers size={10} className="text-teal-400" />}
             </div>
             <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">{brandName}</span>
          </div>

          <SceneControls />
        </div>

        {/* CENTER SECTION */}
        <div className="flex-1 flex justify-center items-center pointer-events-none hidden md:flex">
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-2">
          <LayoutPresetControls />

          {/* perf stats */}
          {(dockMode === 'bottom' || isFloat) && (
            <div
              className="flex items-center gap-2 bg-black/40 rounded-lg border border-white/5 p-0.5 pr-2.5 shadow-inner hidden lg:flex pointer-events-auto mr-1"
              aria-label="Performance monitor"
            >
              <div
                className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-teal-500/10 to-teal-500/5 rounded-md border border-teal-500/20 text-[9px] font-bold tracking-wider text-teal-200/80 uppercase shadow-sm"
                title="Active Renderer"
              >
                <div className="w-1.5 h-1.5 bg-teal-400/80 rounded-full animate-pulse blur-[0.5px]" />
                <span>{stats.renderer || 'WebGPU'}</span>
              </div>
              <div className="flex items-center gap-2.5 px-1">
                <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400" title="Frames Per Second" aria-label="FPS">
                  <Activity size={10} className={stats.fps > 50 ? 'text-teal-400/80' : stats.fps > 30 ? 'text-orange-400/80' : 'text-rose-400/80'} />
                  <span className="w-4 text-right inline-block text-white/90 font-medium">{stats.fps > 0 ? Math.round(stats.fps) : 60}</span>
                </div>
                <div className="w-[1px] h-3 bg-white/10" />
                <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400" title="Frame Compute Time" aria-label="Compute Time">
                  <Zap size={10} className="text-yellow-400/70" />
                  <span className="text-white/90 font-medium">{stats.computeTime || 16.6}</span>
                  <span className="text-zinc-600">ms</span>
                </div>
                <div className="w-[1px] h-3 bg-white/10" />
                <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400" title="Memory Usage" aria-label="Memory">
                  <Cpu size={10} className="text-emerald-400/70" />
                  <span className="text-white/90 font-medium">{stats.memory || 110}</span>
                  <span className="text-zinc-600">mb</span>
                </div>
              </div>
            </div>
          )}

          <WindowControls setPreset={setPreset} />
        </div>
      </div>

      {/* ── body: rail + panel host ───────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-row relative">
        {dockMode === 'left' && <IconRail onOpen={openPanel} side="left" />}
        <PanelHost />
        {dockMode !== 'left' && <IconRail onOpen={openPanel} side="right" />}
      </div>
      </div>

    </motion.div>
  );
}
