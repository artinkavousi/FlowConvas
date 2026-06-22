import React from 'react';
import { 
  Camera, Sun, Zap, Monitor, Sparkles, Layers, Box, 
  Grid, Move3d, Eye, PaintBucket, Focus, Moon, Cone
} from 'lucide-react';
import { definePanel } from '@/panel-os/define-panel';
import { PanelShell } from '@/panel-os/panel-shell';
import { useGraphStore } from '@/graph/graph-store';
import { defaultPanelCapabilities } from '@/panel-os/panel-types';

function VisualToggle({ icon: Icon, label, checked, onChange }: any) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 ${
        checked 
          ? 'bg-white/10 text-white border-white/20 shadow-sm inset-shadow-sm' 
          : 'bg-black/30 border-white/5 text-white/40 hover:bg-white/5 hover:text-white/70'
      }`}
    >
      <Icon size={18} className="mb-2" />
      <span className="text-[10px] font-semibold tracking-wider uppercase text-center leading-tight">
        {label}
      </span>
    </button>
  );
}

function ChipSelector({ label, value, options, onChange }: any) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt: any) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                isActive
                  ? 'bg-white text-black shadow-sm'
                  : 'bg-black/40 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SceneView() {
  const sceneSettings = useGraphStore(s => s.scene);
  const updateScene = useGraphStore(s => s.updateScene);

  return (
    <PanelShell>
      <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-8 w-full text-sm">
        
        {/* Header Block */}
        <div className="flex justify-between items-center bg-white/[0.02] p-4 rounded-xl border border-white/5">
          <div>
            <h2 className="text-white/80 font-bold uppercase tracking-widest text-[11px] mb-1 flex items-center gap-2">
              <Zap size={12} className="text-[var(--color-accent)]" /> Render Pipeline
            </h2>
            <div className="text-white/40 text-[10px] uppercase tracking-wider font-mono">
              Engine Settings & Visuals
            </div>
          </div>
          <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
             <button 
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition ${sceneSettings.backend === 'webgpu' ? 'bg-white/10 text-white shadow-sm' : 'text-white/30 hover:text-white/60'}`}
                onClick={() => updateScene({ backend: 'webgpu' })}
             >WebGPU</button>
             <button 
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition ${sceneSettings.backend === 'webgl' ? 'bg-white/10 text-white shadow-sm' : 'text-white/30 hover:text-white/60'}`}
                onClick={() => updateScene({ backend: 'webgl' })}
             >WebGL2</button>
          </div>
        </div>

        {/* Global Lighting / Env */}
        <ChipSelector 
          label="Environment HDRI"
          value={sceneSettings.env}
          onChange={(val: any) => updateScene({ env: val })}
          options={[
            { value: 'none', label: 'Void' },
            { value: 'studio', label: 'Studio' },
            { value: 'city', label: 'City Dusk' },
            { value: 'sunset', label: 'Sunset' },
            { value: 'night', label: 'Night' },
            { value: 'warehouse', label: 'Warehouse' }
          ]}
        />

        {/* Look Dev & Sandbox */}
        <div className="space-y-4">
          <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Look Dev Sandbox</span>
          
          <div className="grid grid-cols-2 gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
             <ChipSelector 
                label="Geometry Preset"
                value={sceneSettings.geometry}
                onChange={(val: any) => updateScene({ geometry: val })}
                options={[
                  { value: 'sphere', label: 'Sphere' },
                  { value: 'box', label: 'Box' },
                  { value: 'plane', label: 'Plane' },
                  { value: 'torus', label: 'Torus' }
                ]}
              />

              <ChipSelector 
                label="Material Class"
                value={sceneSettings.material}
                onChange={(val: any) => updateScene({ material: val })}
                options={[
                  { value: 'standard', label: 'Standard' },
                  { value: 'physical', label: 'Physical (PBR)' },
                  { value: 'toon', label: 'Toon' },
                  { value: 'transmission', label: 'Glass' },
                  { value: 'subsurface', label: 'Skin' },
                  { value: 'custom_tsl', label: 'Custom TSL' }
                ]}
              />
          </div>
        </div>

        {/* Next-Gen Effects Grid */}
        <div className="space-y-3">
          <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 flex items-center gap-2">
            <Sparkles size={12} className="text-amber-400" /> Post-FX & Quality Adjustments
          </span>
          <div className="grid grid-cols-3 gap-2">
            <VisualToggle 
              icon={Sun} label="Shadows" color="amber"
              checked={sceneSettings.shadows} onChange={(c: boolean) => updateScene({ shadows: c })} 
            />
            <VisualToggle 
              icon={Moon} label="Ambient Occlusion" color="purple"
              checked={sceneSettings.ao} onChange={(c: boolean) => updateScene({ ao: c })} 
            />
            <VisualToggle 
              icon={Layers} label="Global Illumination" color="rose"
              checked={sceneSettings.ssgi} onChange={(c: boolean) => updateScene({ ssgi: c })} 
            />
            <VisualToggle 
              icon={PaintBucket} label="SSR Reflections" color="cyan"
              checked={sceneSettings.ssr} onChange={(c: boolean) => updateScene({ ssr: c })} 
            />
            <VisualToggle 
              icon={Sun} label="Bloom Emission" color="emerald"
              checked={sceneSettings.bloom} onChange={(c: boolean) => updateScene({ bloom: c })} 
            />
            <VisualToggle 
              icon={Focus} label="Depth of Field" color="blue"
              checked={sceneSettings.dof} onChange={(c: boolean) => updateScene({ dof: c })} 
            />
          </div>
        </div>

        {/* Color Science */}
        <div className="grid grid-cols-2 gap-4">
          <ChipSelector 
            label="Anti-Aliasing"
            value={sceneSettings.antialiasing}
            onChange={(val: any) => updateScene({ antialiasing: val })}
            options={[
              { value: 'msaa', label: 'Hardware MSAA' },
              { value: 'smaa', label: 'SMAA (Post)' },
              { value: 'fxaa', label: 'FXAA (Post)' },
              { value: 'none', label: 'Off' }
            ]}
          />
          <ChipSelector 
            label="Tone Mapping"
            value={sceneSettings.toneMapping}
            onChange={(val: any) => updateScene({ toneMapping: val })}
            options={[
              { value: 'agx', label: 'AgX (Filmic)' },
              { value: 'aces', label: 'ACES (HDR)' },
              { value: 'cineon', label: 'Cineon' },
              { value: 'linear', label: 'Linear' }
            ]}
          />
        </div>

        {/* Camera & Overlays */}
        <div className="space-y-4 pt-4 border-t border-white/5">
           <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Viewport State</span>
           
           <div className="flex gap-2">
             <button
               onClick={() => updateScene({ viewMode: '3d' })}
               className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                 sceneSettings.viewMode === '3d' ? 'bg-white/10 border-white/20 text-white' : 'bg-black/30 border-white/5 text-white/40 hover:bg-white/5'
               }`}
             >
               <Camera size={20} className="mb-2" />
               <span className="text-[10px] font-bold uppercase tracking-widest">3D Orbit</span>
             </button>
             <button
               onClick={() => updateScene({ viewMode: '2d' })}
               className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                 sceneSettings.viewMode === '2d' ? 'bg-white/10 border-white/20 text-white' : 'bg-black/30 border-white/5 text-white/40 hover:bg-white/5'
               }`}
             >
               <Monitor size={20} className="mb-2" />
               <span className="text-[10px] font-bold uppercase tracking-widest">2D Ortho</span>
             </button>
           </div>

           <div className="grid grid-cols-2 gap-2">
             <label className="flex items-center gap-3 bg-black/40 hover:bg-white/5 p-3 rounded-xl border border-white/5 cursor-pointer transition-colors group">
               <input type="checkbox" checked={sceneSettings.autoRotate} onChange={e => updateScene({ autoRotate: e.target.checked })} className="accent-blue-500" />
               <span className="text-xs font-semibold uppercase tracking-wider text-white/60 group-hover:text-white">Auto-Orbit</span>
             </label>
             <label className="flex items-center gap-3 bg-black/40 hover:bg-white/5 p-3 rounded-xl border border-white/5 cursor-pointer transition-colors group">
               <input type="checkbox" checked={sceneSettings.wireframe} onChange={e => updateScene({ wireframe: e.target.checked })} className="accent-blue-500" />
               <span className="text-xs font-semibold uppercase tracking-wider text-white/60 group-hover:text-white">Wireframe</span>
             </label>
             <label className="flex items-center gap-3 bg-black/40 hover:bg-white/5 p-3 rounded-xl border border-white/5 cursor-pointer transition-colors group">
               <input type="checkbox" checked={sceneSettings.showGrid} onChange={e => updateScene({ showGrid: e.target.checked })} className="accent-blue-500" />
               <span className="text-xs font-semibold uppercase tracking-wider text-white/60 group-hover:text-white">Floor Grid</span>
             </label>
             <label className="flex items-center gap-3 bg-black/40 hover:bg-white/5 p-3 rounded-xl border border-white/5 cursor-pointer transition-colors group">
               <input type="checkbox" checked={sceneSettings.showGizmos} onChange={e => updateScene({ showGizmos: e.target.checked })} className="accent-blue-500" />
               <span className="text-xs font-semibold uppercase tracking-wider text-white/60 group-hover:text-white">Transform Gizmos</span>
             </label>
             <label className="flex items-center gap-3 bg-black/40 hover:bg-white/5 p-3 rounded-xl border border-white/5 cursor-pointer transition-colors group">
               <input type="checkbox" checked={sceneSettings.volumetrics} onChange={e => updateScene({ volumetrics: e.target.checked })} className="accent-blue-500" />
               <span className="text-xs font-semibold uppercase tracking-wider text-white/60 group-hover:text-white">Volumetric Fog</span>
             </label>
           </div>

           <ChipSelector 
              label="Debug Render View"
              value={sceneSettings.debugMode}
              onChange={(val: any) => updateScene({ debugMode: val })}
              options={[
                { value: 'none', label: 'Beauty (Full Base)' },
                { value: 'normals', label: 'World Normals' },
                { value: 'depth', label: 'Z-Depth' },
                { value: 'uv', label: 'UV Coords' }
              ]}
           />
        </div>

      </div>
    </PanelShell>
  );
}

export const ScenePanel = definePanel({
  id: 'scene',
  title: 'Scene Control',
  description: 'Global rendering and viewport configuration',
  icon: Zap,
  defaultPlacement: 'right',
  defaultSize: 380,
  minSize: 320,
  maxSize: 600,
  capabilities: { ...defaultPanelCapabilities },
  component: SceneView,
  tags: ['scene', 'render', 'effects'],
});
