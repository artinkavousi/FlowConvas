import { useEffect, useRef } from 'react';
import { Command } from 'cmdk';
import { usePanelOSStore } from '@/panel-os/panel-store';
import { PANEL_DEFINITIONS } from '@/panel-os/panel-registry';
import { resetWorkspace } from '@/graph/graph-store';

export function openPanelById(id: string): void {
  window.dispatchEvent(new CustomEvent('fluidity:open-panel', { detail: id }));
}

export function CommandPalette() {
  const open = usePanelOSStore((s) => s.commandPaletteOpen);
  const setOpen = usePanelOSStore((s) => s.setCommandPaletteOpen);
  const theme = usePanelOSStore((s) => s.theme);
  const setTheme = usePanelOSStore((s) => s.setTheme);
  // Re-render when auto-generated panels are added/removed.
  usePanelOSStore((s) => s.registryVersion);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  if (!open) return null;

  const run = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.45)' }}
      onClick={() => setOpen(false)}
    >
      <div className="glass-panel" style={{ margin: '16vh auto 0', width: 460, maxWidth: '92vw', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        <Command label="Command palette" onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
          <Command.Input
            ref={inputRef}
            placeholder="Type a command…"
            className="w-full bg-transparent outline-none px-4 py-3 text-sm border-b"
            style={{ color: 'var(--color-text)', borderColor: 'var(--color-border-soft)' }}
          />
          <Command.List className="max-h-[320px] overflow-y-auto py-1.5 px-2">
            <Command.Empty className="px-2 py-6 text-center text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
              No results
            </Command.Empty>
            <Command.Group heading="Panels" className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              {PANEL_DEFINITIONS().filter((def) => !def.id.startsWith('auto-') || def.tags?.includes('command')).map((def) => {
                const Icon = def.icon;
                return (
                  <Command.Item
                    key={def.id}
                    value={`open ${def.title}`}
                    onSelect={() => run(() => openPanelById(def.id))}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer text-[12px] data-[selected=true]:bg-white/5"
                    style={{ color: 'var(--color-text)' }}
                  >
                    <Icon size={14} style={{ color: 'var(--color-accent)' }} />
                    Open {def.title}
                  </Command.Item>
                );
              })}
            </Command.Group>
            <Command.Group heading="Workspace" className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              <Command.Item
                value="toggle theme"
                onSelect={() => run(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
                className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer text-[12px] data-[selected=true]:bg-white/5"
                style={{ color: 'var(--color-text)' }}
              >
                Toggle theme
              </Command.Item>
              <Command.Item
                value="reset workspace"
                onSelect={() => run(() => { resetWorkspace(); window.location.reload(); })}
                className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer text-[12px] data-[selected=true]:bg-white/5"
                style={{ color: 'var(--color-text)' }}
              >
                Reset workspace
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
