/**
 * PreviewStage — renders one module's live preview, error-isolated and
 * capability-checked (FR-13). Reused by the fullscreen viewport.
 *
 * A render error in a module preview is caught here so it can't take down the
 * Studio shell; WebGPU-only modules show a friendly notice when unsupported.
 */

import { Component, Suspense, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ArtinosModule } from '../registry/types';

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
      <AlertTriangle size={18} className="text-amber-400/80" />
      <p className="text-xs max-w-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
        {children}
      </p>
    </div>
  );
}

class PreviewErrorBoundary extends Component<{ moduleId: string; children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidUpdate(prev: { moduleId: string }) {
    // Reset the boundary when switching modules so a new module gets a clean try.
    if (prev.moduleId !== this.props.moduleId && this.state.error) {
      this.setState({ error: null });
    }
  }
  render() {
    if (this.state.error) {
      return <Notice>Preview failed to render: {this.state.error.message}</Notice>;
    }
    return this.props.children;
  }
}

export function PreviewStage({ module }: { module: ArtinosModule }) {
  const Preview = module.preview;
  const needsWebGPU = module.dependencies.includes('webgpu');
  const noWebGPU = needsWebGPU && typeof navigator !== 'undefined' && !('gpu' in navigator);
  if (noWebGPU) {
    return <Notice>This module requires WebGPU, which isn't available in this browser.</Notice>;
  }
  return (
    <PreviewErrorBoundary moduleId={module.id}>
      <Suspense fallback={<Notice>Loading preview...</Notice>}>
        <Preview />
      </Suspense>
    </PreviewErrorBoundary>
  );
}
