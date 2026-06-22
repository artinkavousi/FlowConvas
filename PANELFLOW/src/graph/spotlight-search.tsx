import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { NODE_REGISTRY } from '@/graph/node-registry';

export interface SpotlightSearchProps {
  open: boolean;
  onClose: () => void;
  onPick: (defId: string) => void;
}

export function SpotlightSearch({ open, onClose, onPick }: SpotlightSearchProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.values(NODE_REGISTRY).filter(
      (d) => !q || d.label.toLowerCase().includes(q) || d.category.includes(q),
    );
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[18vh]"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-panel w-[460px] max-w-[92vw] overflow-hidden"
            initial={{ scale: 0.96, y: -8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: -8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center gap-2 px-3.5 py-3 border-b"
              style={{ borderColor: 'var(--color-border-soft)' }}
            >
              <Search size={15} style={{ color: 'var(--color-text-muted)' }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') onClose();
                  if (e.key === 'Enter' && results[0]) {
                    onPick(results[0].id);
                    onClose();
                  }
                }}
                placeholder="Add node…"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--color-text)' }}
              />
            </div>
            <div className="max-h-[320px] overflow-y-auto py-1.5">
              {results.map((d) => {
                const Icon = d.icon;
                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      onPick(d.id);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2 text-left transition-colors hover:bg-white/5"
                  >
                    <Icon size={14} style={{ color: d.themeColor || 'var(--color-accent)' }} />
                    <span 
                      className="flex-1 text-[12px] font-medium uppercase tracking-wide" 
                      style={{ color: d.themeColor || 'var(--color-text)' }}
                    >
                      {d.label}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider bg-black/30 px-1.5 py-0.5 rounded border border-white/5" style={{ color: d.themeColor || 'var(--color-text-muted)' }}>
                      {d.category}
                    </span>
                  </button>
                );
              })}
              {results.length === 0 && (
                <div className="px-3.5 py-6 text-center text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                  No matching nodes
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
