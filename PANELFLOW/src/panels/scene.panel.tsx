import { type ReactNode } from 'react';
import {
  Activity,
  Box,
  Circle,
  Cpu,
  Eye,
  Grid3X3,
  Layers,
  Monitor,
  Orbit,
  ScanLine,
  ScrollText,
  Sparkles,
  Square,
  Sun,
  Workflow,
  Zap,
} from 'lucide-react';
import { definePanel } from '@/panel-os/define-panel';
import { PanelShell } from '@/panel-os/panel-shell';
import { useGraphStore, type SceneSettings } from '@/graph/graph-store';
import { defaultPanelCapabilities } from '@/panel-os/panel-types';
import { useInspectorStore } from '@/inspector/inspector-store';
import { getInspector } from '@/inspector/attach';

type Option<T extends string> = { value: T; label: string };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <div className="text-[9px] font-black uppercase tracking-[0.24em] text-white/35">{title}</div>
      {children}
    </section>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      className="grid gap-1 rounded-xl border border-white/8 bg-black/28 p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={
              'min-h-8 rounded-lg px-2 text-[10px] font-black uppercase tracking-[0.12em] transition ' +
              (active
                ? 'bg-white text-black shadow-[0_0_18px_rgba(255,255,255,0.12)]'
                : 'text-white/45 hover:bg-white/8 hover:text-white/80')
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function ToggleTile({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: any;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={
        'flex min-h-[70px] flex-col items-start justify-between rounded-xl border p-3 text-left transition ' +
        (checked
          ? 'border-teal-300/30 bg-teal-300/[0.085] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
          : 'border-white/7 bg-black/25 text-white/42 hover:border-white/14 hover:bg-white/[0.045] hover:text-white/70')
      }
    >
      <Icon size={16} className={checked ? 'text-teal-300' : 'text-white/35'} />
      <span className="text-[10px] font-black uppercase tracking-[0.14em] leading-tight">{label}</span>
    </button>
  );
}

function Chip<T extends string>({
  value,
  options,
  onChange,
  columns = 3,
}: {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  columns?: number;
}) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={
              'min-h-8 rounded-lg border px-2 text-[10px] font-bold capitalize transition ' +
              (active
                ? 'border-teal-300/30 bg-teal-300/[0.1] text-white'
                : 'border-white/7 bg-black/24 text-white/45 hover:bg-white/[0.05] hover:text-white/80')
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function SceneView() {
  const scene = useGraphStore((s) => s.scene);
  const updateScene = useGraphStore((s) => s.updateScene);
  const inspectorSettings = useInspectorStore((s) => s.settings);
  const inspectorAttached = useInspectorStore((s) => s.attached);

  const patch = (next: Partial<SceneSettings>) => updateScene(next);

  return (
    <PanelShell>
      <div className="h-full w-full space-y-5 overflow-y-auto custom-scrollbar">
        <Section title="Viewport">
          <Segmented
            value={scene.viewMode}
            onChange={(viewMode) => patch({ viewMode })}
            options={[
              { value: '3d', label: '3D' },
              { value: '2d', label: '2D' },
            ]}
          />
          <div className="grid grid-cols-2 gap-2">
            <ToggleTile icon={Orbit} label="Auto Orbit" checked={scene.autoRotate} onChange={(autoRotate) => patch({ autoRotate })} />
            <ToggleTile icon={Grid3X3} label="Floor Grid" checked={scene.showGrid} onChange={(showGrid) => patch({ showGrid })} />
            <ToggleTile icon={Eye} label="Gizmos" checked={scene.showGizmos} onChange={(showGizmos) => patch({ showGizmos })} />
            <ToggleTile icon={ScanLine} label="Wireframe" checked={scene.wireframe} onChange={(wireframe) => patch({ wireframe })} />
          </div>
        </Section>

        <Section title="Environment">
          <Chip
            value={scene.env}
            onChange={(env) => patch({ env })}
            options={[
              { value: 'none', label: 'None' },
              { value: 'studio', label: 'Studio' },
              { value: 'city', label: 'City' },
              { value: 'sunset', label: 'Sunset' },
              { value: 'night', label: 'Night' },
              { value: 'warehouse', label: 'Warehouse' },
            ]}
          />
          <Chip
            value={scene.geometry}
            onChange={(geometry) => patch({ geometry })}
            columns={4}
            options={[
              { value: 'sphere', label: 'Sphere' },
              { value: 'box', label: 'Box' },
              { value: 'torus', label: 'Torus' },
              { value: 'plane', label: 'Plane' },
            ]}
          />
          <ToggleTile icon={Layers} label="Volumetric Fog" checked={scene.volumetrics} onChange={(volumetrics) => patch({ volumetrics })} />
        </Section>

        <Section title="Render / Canvas">
          <Segmented
            value={scene.backend}
            onChange={(backend) => patch({ backend })}
            options={[
              { value: 'webgpu', label: 'WebGPU' },
              { value: 'webgl', label: 'WebGL2' },
            ]}
          />
          <Segmented
            value={scene.toneMapping}
            onChange={(toneMapping) => patch({ toneMapping })}
            options={[
              { value: 'agx', label: 'AgX' },
              { value: 'aces', label: 'ACES' },
              { value: 'cineon', label: 'Cineon' },
              { value: 'linear', label: 'Linear' },
            ]}
          />
          <Segmented
            value={scene.material}
            onChange={(material) => patch({ material })}
            options={[
              { value: 'custom_tsl', label: 'TSL' },
              { value: 'physical', label: 'PBR' },
              { value: 'transmission', label: 'Glass' },
            ]}
          />
          <Segmented
            value={scene.antialiasing}
            onChange={(antialiasing) => patch({ antialiasing })}
            options={[
              { value: 'none', label: 'Off' },
              { value: 'msaa', label: 'MSAA' },
              { value: 'smaa', label: 'SMAA' },
              { value: 'fxaa', label: 'FXAA' },
            ]}
          />
        </Section>

        <Section title="Post-processing">
          <div className="grid grid-cols-3 gap-2">
            <ToggleTile icon={Sun} label="Shadows" checked={scene.shadows} onChange={(shadows) => patch({ shadows })} />
            <ToggleTile icon={Sparkles} label="Bloom" checked={scene.bloom} onChange={(bloom) => patch({ bloom })} />
            <ToggleTile icon={Activity} label="AO" checked={scene.ao} onChange={(ao) => patch({ ao })} />
            <ToggleTile icon={Zap} label="SSGI" checked={scene.ssgi} onChange={(ssgi) => patch({ ssgi })} />
            <ToggleTile icon={Monitor} label="SSR" checked={scene.ssr} onChange={(ssr) => patch({ ssr })} />
            <ToggleTile icon={Cpu} label="DOF" checked={scene.dof} onChange={(dof) => patch({ dof })} />
          </div>
        </Section>

        <Section title="Debug / Render Modes">
          <Chip
            value={scene.debugMode}
            onChange={(debugMode) => patch({ debugMode })}
            columns={4}
            options={[
              { value: 'none', label: 'Off' },
              { value: 'normals', label: 'Normals' },
              { value: 'depth', label: 'Depth' },
              { value: 'uv', label: 'UV' },
            ]}
          />
          <div className="grid grid-cols-2 gap-2">
            <ToggleTile
              icon={Square}
              label="Overdraw"
              checked={inspectorSettings.overdraw}
              onChange={(v) => getInspector().setOverdraw(v)}
            />
            <ToggleTile
              icon={ScrollText}
              label="Stack Trace"
              checked={inspectorSettings.captureStackTrace}
              onChange={(v) => getInspector().setCaptureStackTrace(v)}
            />
          </div>
          <ToggleTile icon={Circle} label="Stats HUD" checked={scene.showStats} onChange={(showStats) => patch({ showStats })} />
          {!inspectorAttached && (
            <p className="rounded-lg border border-white/6 bg-black/24 px-3 py-2 text-[10px] leading-relaxed text-white/32">
              <Box size={11} className="mr-1 inline" />
              Render-mode debug toggles apply once a renderer is attached. Open the Telemetry panel for live profiling.
            </p>
          )}
        </Section>
      </div>
    </PanelShell>
  );
}

export const ScenePanel = definePanel({
  id: 'scene-settings',
  title: 'Scene',
  description: 'Scene, environment, post-processing and canvas settings.',
  icon: Workflow,
  defaultPlacement: 'right',
  defaultSize: 390,
  minSize: 320,
  maxSize: 620,
  capabilities: { ...defaultPanelCapabilities },
  component: SceneView,
  tags: ['core', 'scene', 'environment', 'render', 'postprocessing'],
});
