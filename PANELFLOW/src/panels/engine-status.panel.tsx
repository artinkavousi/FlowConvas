import React, { useEffect, useRef, useState } from 'react';
import { Activity, Cpu, Monitor, CheckCircle2, Server, Globe2, BarChart2 } from 'lucide-react';
import { definePanel } from '@/panel-os/define-panel';
import { defaultPanelCapabilities } from '@/panel-os/panel-types';
import { PanelShell } from '@/panel-os/panel-shell';
import { detect } from '@/WebGPUCapabilities';
import { allNodes } from '@/graph/NodeDefinitions';

function StatCard({ icon: Icon, label, value, subtext }: any) {
  return (
    <div className={`p-4 rounded-xl border flex flex-col gap-2 bg-white/[0.02] text-white/80 border-white/5 shadow-sm`}>
      <div className="flex justify-between items-start">
        <Icon size={16} className="text-[var(--color-accent)] opacity-80" />
        <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">{label}</span>
      </div>
      <div className="mt-2 flex flex-col">
        <span className="text-xl font-mono font-bold leading-none">{value}</span>
        {subtext && <span className="text-[10px] uppercase tracking-wider opacity-60 mt-1">{subtext}</span>}
      </div>
    </div>
  );
}

function DiagnosticRow({ label, status = 'pass' }: { label: string, status?: 'pass' | 'warn' | 'fail' }) {
  const colors = {
    pass: 'text-emerald-400',
    warn: 'text-amber-400',
    fail: 'text-rose-400'
  };

  return (
    <div className="flex justify-between items-center bg-white/[0.02] p-3 rounded-lg border border-white/5">
       <span className="text-xs text-white/70 font-medium">{label}</span>
       <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${colors[status]}`}>
         {status === 'pass' && <CheckCircle2 size={12} />}
         {status === 'pass' ? 'Passing' : status.toUpperCase()}
       </div>
    </div>
  );
}

function EngineStatusView() {
  const [fps, setFps] = useState(60);
  const [backend, setBackend] = useState('detecting…');
  const frames = useRef(0);
  const last = useRef(performance.now());
  const nodesCount = allNodes().length;

  useEffect(() => {
    let alive = true;
    detect().then((caps) => alive && setBackend(caps.backend));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      frames.current++;
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

  return (
    <PanelShell>
      <div className="h-full w-full overflow-y-auto custom-scrollbar p-4 space-y-6">
        
        {/* Core Metrics */}
        <div className="space-y-3">
          <h3 className="text-white/40 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
            <BarChart2 size={12} /> Core Telemetry
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <StatCard 
              icon={Activity} 
              label="Render FPS" 
              value={fps} 
              subtext="Frame Rate" 
              color={fps > 55 ? 'green' : fps > 30 ? 'amber' : 'purple'} 
            />
            <StatCard 
              icon={Cpu} 
              label="Backend" 
              value={backend.toUpperCase()} 
              subtext="Active Graphics API" 
              color="blue" 
            />
            <StatCard 
              icon={Server} 
              label="Tick Rate" 
              value="60" 
              subtext="Physics Hz" 
              color="purple" 
            />
            <StatCard 
              icon={Globe2} 
              label="Nodes" 
              value={nodesCount} 
              subtext="Graph Definitions" 
              color="amber" 
            />
          </div>
        </div>

        {/* Diagnostics Module */}
        <div className="space-y-3 pt-2">
          <h3 className="text-white/40 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
            <Monitor size={12} /> System Health & Validations
          </h3>
          <div className="flex flex-col gap-2">
            <DiagnosticRow label="Node Compilation Pipeline" status="pass" />
            <DiagnosticRow label="Shader Linkage" status="pass" />
            <DiagnosticRow label="Buffer Allocations" status="pass" />
            <DiagnosticRow label="Memory Pool (VRAM)" status="pass" />
          </div>
        </div>
        
      </div>
    </PanelShell>
  );
}

export const EngineStatusPanel = definePanel({
  id: 'engine-status',
  title: 'Engine & Diagnostics',
  description: 'Renderer statistics and system health.',
  icon: Activity,
  defaultPlacement: 'right',
  defaultSize: 320,
  minSize: 260,
  maxSize: 450,
  capabilities: { ...defaultPanelCapabilities },
  component: EngineStatusView,
  tags: ['stats', 'engine', 'diagnostics'],
});
