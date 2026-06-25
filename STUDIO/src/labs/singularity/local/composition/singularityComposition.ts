export const singularityComposition = {
  renderer: 'WebGPURenderer + WebgpuBloomComposer snapshot',
  scene: 'Perspective camera with OrbitControls, equirectangular nebula background, black-hole sphere at origin',
  preserved:
    'Source camera framing, ACES exposure, Bloom defaults, nebula environment blend, deep-noise accretion band, and orange/gold B-spline ramp.',
  deviations:
    'ARTINOS owns lifecycle, ResizeObserver sizing, PANELFLOW controls, and Studio telemetry; source singleton Experience shell, Tweakpane, stats.js, and analytics are omitted.',
} as const;
