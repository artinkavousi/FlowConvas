import { memo } from 'react';
import { motion } from 'framer-motion';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/cn';
import { spring } from '@/lib/motion';
import type { FluidityNodeData } from '@/graph/graph-store';
import { editorPortsOf } from '@/graph/editor-pipeline';

const CATEGORY_LABEL: Record<FluidityNodeData['category'], string> = {
  input: 'INPUT',
  math: 'MATH',
  advanced: 'ADVANCED',
  output: 'OUTPUT',
};

function UniversalNodeImpl({ data, selected }: NodeProps) {
  const d = data as FluidityNodeData;
  const energy = d.energy ?? 0;
  const themeColor = d.themeColor ?? 'var(--color-accent)';
  const inputKeys = Object.keys(d.inputs);
  const ports = editorPortsOf({
    id: 'preview',
    type: 'universal',
    position: { x: 0, y: 0 },
    data: d,
  });

  return (
    <motion.div
      className={cn('relative min-w-[160px] rounded-[14px] glass-panel backdrop-blur-xl')}
      initial={{ opacity: 0, scale: 0.85, y: 8 }}
      animate={{
        opacity: 1,
        scale: 1 + energy * 0.035,
        y: 0,
        boxShadow:
          energy > 0 || selected
            ? `0 0 0 1px ${themeColor}, 0 0 16px -4px ${themeColor}44, 0 12px 36px rgba(0,0,0,0.8)`
            : '0 0 0 1px rgba(255,255,255,0.06), 0 12px 36px rgba(0,0,0,0.6)',
      }}
      transition={spring}
      style={{
        background: 'rgba(12, 12, 12, 0.7)',
      }}
    >
      <div 
        className="absolute inset-0 rounded-[14px] pointer-events-none transition-opacity duration-300" 
        style={{
          boxShadow: selected || energy > 0 ? `inset 0 0 20px ${themeColor}11` : 'inset 0 1px 1px rgba(255,255,255,0.05)',
        }} 
      />
      {/* header */}
      <div
        className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-t-[14px] relative z-10"
        style={{
          background: selected || energy > 0 ? `linear-gradient(180deg, ${themeColor}22 0%, transparent 100%)` : 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}
      >
        <span
          className="text-[10px] font-medium uppercase tracking-[0.2em] truncate drop-shadow-sm"
          style={{ color: selected ? themeColor : 'rgba(255,255,255,0.8)' }}
        >
          {d.label}
        </span>
        <span
          className="text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
          style={{ 
            color: selected || energy > 0 ? themeColor : 'rgba(255,255,255,0.4)', 
            background: 'rgba(0,0,0,0.5)',
            border: `1px solid ${selected || energy > 0 ? `${themeColor}44` : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          {CATEGORY_LABEL[d.category]}
        </span>
      </div>

      <div className="px-3 py-3 flex flex-col gap-2 relative z-10">
        {ports.inputs.length > 0 && (
          <div className="space-y-2">
            {ports.inputs.map((port) => (
              <div key={port.key} className="relative flex items-center justify-between gap-3 pl-1">
                <Handle 
                  id={port.key} 
                  type="target" 
                  position={Position.Left} 
                  className="!w-5 !h-5 !bg-transparent !border-0 flex items-center justify-center group/handle z-20"
                  style={{ left: -22 }} 
                >
                  <div 
                    className="w-2.5 h-2.5 rounded-full border border-white/20 bg-[#0c0c0c] flex items-center justify-center transition-all duration-300 group-hover/handle:scale-[1.4] group-hover/handle:border-white/40"
                    style={{ 
                      boxShadow: `0 0 10px ${getPortColor(port.type)}33, inset 0 0 6px ${getPortColor(port.type)}66`
                    }}
                  >
                    <div 
                      className="w-1 h-1 rounded-full opacity-70 group-hover/handle:opacity-100 transition-all duration-300 group-hover/handle:w-[5px] group-hover/handle:h-[5px]"
                      style={{ background: getPortColor(port.type), boxShadow: `0 0 6px ${getPortColor(port.type)}` }} 
                    />
                  </div>
                </Handle>
                <span className="text-[9px] uppercase tracking-wider font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {port.label}
                </span>
                <span className="text-[8px] tracking-wider uppercase font-mono px-1.5 py-[1px] rounded-sm bg-black/30 border border-white/5" style={{ color: getPortColor(port.type) }}>
                  {port.type ?? 'any'}
                </span>
              </div>
            ))}
          </div>
        )}

        {inputKeys.length > 0 && (
          <div className="space-y-1.5 border-t border-white/5 pt-2 mt-0.5">
            {inputKeys.map((key) => (
              <div key={key} className="flex items-center justify-between gap-3 px-1">
                <span className="text-[9px] uppercase tracking-wider font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {key}
                </span>
                <span className="max-w-[120px] truncate text-[9px] tabular-nums font-mono px-1.5 py-[1px] text-white/40">
                  {String(d.inputs[key])}
                </span>
              </div>
            ))}
          </div>
        )}

        {ports.outputs.length > 0 && (
          <div className="space-y-2 border-t border-white/5 pt-2.5 mt-0.5">
            {ports.outputs.map((port) => (
              <div key={port.key} className="relative flex items-center justify-between gap-3 pr-1">
                <span className="text-[9px] uppercase tracking-wider font-medium flex-1 text-right" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {port.label}
                </span>
                <span className="text-[8px] tracking-wider uppercase font-mono px-1.5 py-[1px] rounded-sm bg-black/30 border border-white/5" style={{ color: getPortColor(port.type) }}>
                  {port.type ?? 'any'}
                </span>
                <Handle 
                  id={port.key} 
                  type="source" 
                  position={Position.Right} 
                  className="!w-5 !h-5 !bg-transparent !border-0 flex items-center justify-center group/handle z-20"
                  style={{ right: -22 }} 
                >
                  <div 
                    className="w-2.5 h-2.5 rounded-full border border-white/20 bg-[#0c0c0c] flex items-center justify-center transition-all duration-300 group-hover/handle:scale-[1.4] group-hover/handle:border-white/40"
                    style={{ 
                      boxShadow: `0 0 10px ${getPortColor(port.type)}33, inset 0 0 6px ${getPortColor(port.type)}66`
                    }}
                  >
                    <div 
                      className="w-1 h-1 rounded-full opacity-70 group-hover/handle:opacity-100 transition-all duration-300 group-hover/handle:w-[5px] group-hover/handle:h-[5px]"
                      style={{ background: getPortColor(port.type), boxShadow: `0 0 6px ${getPortColor(port.type)}` }} 
                    />
                  </div>
                </Handle>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

const PORT_COLORS: Record<string, string> = {
  f32: '#3b82f6', // blue
  vec2: '#8b5cf6', // violet
  vec3: '#ec4899', // pink
  vec4: '#f43f5e', // rose
  color_srgb: '#eab308', // yellow
  color_linear: '#eab308',
  texture2D: '#14b8a6', // teal
  material: '#c084fc', // purple
  geometry: '#f97316', // orange
  bool: '#ef4444', // red
  i32: '#6366f1', // indigo
  u32: '#6366f1',
};

const getPortColor = (type?: string) => type ? (PORT_COLORS[type] || 'var(--color-accent)') : 'var(--color-accent)';

export const UniversalNode = memo(UniversalNodeImpl);
