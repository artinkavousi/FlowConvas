/**
 * StudioViewport — the host-owned viewport content for the PANELFLOW workspace.
 *
 * Switches between the gallery and the active module's showcase based on nav state.
 * The showcase branch renders the bare preview for now; the full Showcase (controls,
 * usage, deps, agent notes) lands in T-8.
 */

import { useStudioStore } from '../studio-store';
import { getModule } from '../registry/registry';
import { Gallery } from './Gallery';
import { Showcase } from './Showcase';

export function StudioViewport() {
  const view = useStudioStore((s) => s.view);
  const activeModuleId = useStudioStore((s) => s.activeModuleId);

  if (view === 'showcase' && activeModuleId) {
    const module = getModule(activeModuleId);
    if (!module) {
      return (
        <div className="absolute inset-0 flex items-center justify-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Module "{activeModuleId}" not found.
        </div>
      );
    }
    return <Showcase module={module} />;
  }

  return <Gallery />;
}
