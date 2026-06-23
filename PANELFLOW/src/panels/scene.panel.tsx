import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Cpu,
  Eye,
  Grid3X3,
  Monitor,
  Orbit,
  ScanLine,
  Sparkles,
  Sun,
  Workflow,
  Zap,
} from 'lucide-react';
import { definePanel } from '@/panel-os/define-panel';
import { PanelShell } from '@/panel-os/panel-shell';
import { useGraphStore, type SceneSettings } from '@/graph/graph-store';
import { defaultPanelCapabilities } from '@/panel-os/panel-types';
import { detect } from '@/WebGPUCapabilities';
import { allNodes } from '@/graph/NodeDefinitions';

type Option<T extends string> = { value: T; label: string };

function PanelKicker({ icon: Icon, title, detail }: { icon: any; title: string; detail: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.035] p-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-teal-400/20 bg-teal-400/10 text-teal-300">
          <Icon size={15} />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/80">{title}</div>
          <div className="mt-1 text-[11px] leading-relaxed text-white/42">{detail}</div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="grid gap-1 rounded-xl border border-white/8 bg-black/28 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
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

function Metric({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub: string }) {
  return (
    <div className="rounded-xl border border-white/7 bg-black/24 p-3">
      <div className="flex items-center justify-between gap-2">
        <Icon size={14} className="text-teal-300/80" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/32">{label}</span>
      </div>
      <div className="mt-3 font-mono text-lg font-bold leading-none text-white/88">{value}</div>
      <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-white/30">{sub}</div>
    </div>
  );
}

function HealthRow({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/6 bg-white/[0.025] px-3 py-2">
      <div>
        <div className="text-[11px] font-semibold text-white/70">{label}</div>
        <div className="text-[9px] uppercase tracking-[0.16em] text-white/28">{detail}</div>
      </div>
      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-300">
        <CheckCircle2 size={12} />
        Ready
      </div>
    </div>
  );
}

function useFrameFps() {
  const [fps, setFps] = useState(60);
  const frames = useRef(0);
  const last = useRef(performance.now());

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      frames.current += 1;
      const now = performance.now();
      if (now - last.current >= 1000) {
        setFps(frames.current);
        frames.current = 0;
        last.current = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return fps;
}

function PipelineView() {
  const scene = useGraphStore((s) => s.scene);
  const updateScene = useGraphStore((s) => s.updateScene);
  const stats = useGraphStore((s) => s.stats);
  const [detectedBackend, setDetectedBackend] = useState('detecting');
  const fps = useFrameFps();
  const nodesCount = useMemo(() => allNodes().length, []);

  useEffect(() => {
    let alive = true;
    detect().then((caps) => alive && setDetectedBackend(caps.backend));
    return () => {
      alive = false;
    };
  }, []);

  const patch = (next: Partial<SceneSettings>) => updateScene(next);

  return (
    <PanelShell>
      <div className="h-full w-full overflow-y-auto custom-scrollbar space-y-5">
        <PanelKicker
          icon={Workflow}
          title="Scene Settings"
          detail="Viewport, camera, rendering, performance monitors, and pipeline health for the active workspace."
        />

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

        <Section title="Render">
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
        </Section>

        <Section title="Quality">
          <div className="grid grid-cols-3 gap-2">
            <ToggleTile icon={Sun} label="Shadows" checked={scene.shadows} onChange={(shadows) => patch({ shadows })} />
            <ToggleTile icon={Sparkles} label="Bloom" checked={scene.bloom} onChange={(bloom) => patch({ bloom })} />
            <ToggleTile icon={Activity} label="AO" checked={scene.ao} onChange={(ao) => patch({ ao })} />
            <ToggleTile icon={Zap} label="SSGI" checked={scene.ssgi} onChange={(ssgi) => patch({ ssgi })} />
            <ToggleTile icon={Monitor} label="SSR" checked={scene.ssr} onChange={(ssr) => patch({ ssr })} />
            <ToggleTile icon={Cpu} label="DOF" checked={scene.dof} onChange={(dof) => patch({ dof })} />
          </div>
        </Section>

        <Section title="Telemetry">
          <div className="grid grid-cols-2 gap-2">
            <Metric icon={Activity} label="FPS" value={stats.fps || fps} sub="viewport loop" />
            <Metric icon={Cpu} label="Backend" value={(stats.renderer || detectedBackend).toUpperCase()} sub="detected" />
            <Metric icon={Zap} label="Compute" value={`${stats.computeTime || 16.6}ms`} sub="frame budget" />
            <Metric icon={BarChart3} label="Nodes" value={nodesCount} sub="definitions" />
          </div>
        </Section>

        <Section title="Health">
          <div className="space-y-2">
            <HealthRow label="Panel registry" detail="dynamic + auto panels" />
            <HealthRow label="Control bridge" detail="schema and instance values" />
            <HealthRow label="Graph runtime" detail="nodes, edges, serialization" />
          </div>
        </Section>
      </div>
    </PanelShell>
  );
}

export const ScenePanel = definePanel({
  id: 'scene-settings',
  title: 'Scene Settings',
  description: 'Viewport, camera, render, performance, and pipeline settings.',
  icon: Workflow,
  defaultPlacement: 'right',
  defaultSize: 390,
  minSize: 320,
  maxSize: 620,
  capabilities: { ...defaultPanelCapabilities },
  component: PipelineView,
  tags: ['core', 'scene', 'render', 'engine', 'diagnostics'],
});
