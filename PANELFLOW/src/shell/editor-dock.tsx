import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Circle, Box, Square, Disc, RotateCcw, Minus, Maximize2, Move, Activity, Triangle, Layers, X, ExternalLink, Cpu, Zap, HardDrive, PanelBottom, PanelLeft, PanelRight, PictureInPicture2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraphCanvas } from '@/graph/graph-canvas';
import { IconRail } from '@/shell/icon-rail';
import { BottomControls } from '@/shell/minimap';
import { Tooltip } from '@/components/ui/tooltip';
import { useGraphStore } from '@/graph/graph-store';
import { usePanelOSStore, type DockMode, type DockFloatRect } from '@/panel-os/panel-store';
import { PanelChrome } from '@/shell/panel-chrome';
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
        
        {/* If not hovered, show a little grab-like or expand icon just to indicate there's more, or keep default visible? 
            Let's keep the default visible if not hovered so user can always resize. */}
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
const MIN_H = 260;

export function EditorDock() {
  // docked size state
  const [heightPct, setHeightPct] = useState(46);    // bottom: % viewport height
  const [sideWidth, setSideWidth] = useState(480);    // left|right: px

  const [smooth, setSmooth] = useState(false);
  const dockDragging = useRef(false);

  const scene       = useGraphStore((s) => s.scene);
  const stats       = useGraphStore((s) => s.stats);
  const updateScene = useGraphStore((s) => s.updateScene);
  
  const dockedPanelId  = usePanelOSStore((s) => s.dockedPanelId);
  const setDockedPanelId = usePanelOSStore((s) => s.setDockedPanelId);
  const dockMode       = usePanelOSStore((s) => s.dockMode);
  const setDockMode    = usePanelOSStore((s) => s.setDockMode);
  const floatRect      = usePanelOSStore((s) => s.dockFloatRect);
  const setFloatRect   = usePanelOSStore((s) => s.setDockFloatRect);

  const isFloat   = dockMode === 'float';
  const isSidebar = dockMode === 'left' || dockMode === 'right';

  const dockedPanelDef = dockedPanelId ? getPanelDefinition(dockedPanelId) : null;
  const DockedPanelComponent = dockedPanelDef?.component;
  const DockedIcon = dockedPanelDef?.icon;

  const openPanel = useCallback((id: string) => {
    const { nodes, removeNodes } = useGraphStore.getState();
    const existingNode = nodes.find(n => n.type === 'os-panel' && (n.data as any).osPanelId === id);
    
    // If it's already a node, pop it out of the node graph and dock it.
    if (existingNode) {
      removeNodes([existingNode.id]);
    }
    
    // If it's already docked, close it (toggle behavior)
    if (usePanelOSStore.getState().dockedPanelId === id) {
      setDockedPanelId(null);
    } else {
      setDockedPanelId(id);
    }
  }, [setDockedPanelId]);

  const floatDockedPanel = useCallback(() => {
    if (!dockedPanelId) return;
    
    // Find where the docked panel currently is on screen
    const el = document.getElementById(`docked-panel-container-${dockedPanelId}`);
    let screenPosition = null;
    let size = null;
    if (el) {
      const rect = el.getBoundingClientRect();
      screenPosition = { x: rect.left, y: rect.top };
      size = { width: rect.width, height: rect.height };
    }

    window.dispatchEvent(new CustomEvent('fluidity:float-panel', { 
      detail: { panelId: dockedPanelId, screenPosition, size } 
    }));
    setDockedPanelId(null);
  }, [dockedPanelId, setDockedPanelId]);

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
               <Layers size={10} className="text-teal-400" />
             </div>
             <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">FLUIDITY</span>
          </div>

          <SceneControls />
        </div>

        {/* CENTER SECTION */}
        <div className="flex-1 flex justify-center items-center pointer-events-none hidden md:flex">
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-2">
          {/* perf stats — moved to right and improved */}
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

      {/* ── body ─────────────────────────────────────────────────────────── */}
      <ReactFlowProvider>
        <div className="flex-1 min-h-0 overflow-hidden flex flex-row relative">
          {/* left-side icon rail */}
          {dockMode === 'left' && (
            <>
              <IconRail onOpen={openPanel} side="left" />
              <AnimatePresence initial={false}>
                {dockedPanelId && DockedPanelComponent && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: (dockedPanelDef?.defaultSize ?? 340), opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                    className="shrink-0 h-full flex items-center justify-start z-10"
                  >
                    <PanelChrome
                      title={dockedPanelDef.title}
                      icon={DockedIcon}
                      isDocked={true}
                      onClose={() => setDockedPanelId(null)}
                      onToggleFloat={floatDockedPanel}
                      className="border-l-0 border-r"
                    >
                      <div className="p-1 h-full relative">
                        <DockedPanelComponent />
                      </div>
                    </PanelChrome>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* inner body: graph ONLY */}
          <div className={`flex-1 min-w-0 min-h-0 flex flex-col relative`}>
            {/* graph canvas — fills remaining space */}
            <div className="flex-1 relative min-w-0 min-h-0">
              <GraphCanvas />
              <BottomControls />
            </div>
          </div>
          
          {/* right-side dock panel & icon rail */}
          {dockMode !== 'left' && (
            <>
              {/* Docked side panel slide out */}
              <AnimatePresence initial={false}>
                {dockedPanelId && DockedPanelComponent && (
                  <motion.div
                    id={`docked-panel-container-${dockedPanelId}`}
                    key={dockedPanelId}
                    layoutId={`panel-${dockedPanelId}`}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: (dockedPanelDef?.defaultSize ?? 340), opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                    className="shrink-0 h-full flex items-center justify-end z-10"
                  >
                    <PanelChrome
                      title={dockedPanelDef.title}
                      icon={DockedIcon}
                      isDocked={true}
                      onClose={() => setDockedPanelId(null)}
                      onToggleFloat={floatDockedPanel}
                    >
                      <div className="p-1 h-full relative">
                        <DockedPanelComponent />
                      </div>
                    </PanelChrome>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* right-side icon rail (default + float mode) */}
              <IconRail onOpen={openPanel} side="right" />
            </>
          )}
        </div>
      </ReactFlowProvider>
      </div>

    </motion.div>
  );
}
