// PointerVelocitySplat.module.js
// Universal 2D pointer interaction: tracks normalized pointer position + per-frame velocity
// and emits splat events `{ x, y, vx, vy }` (origin bottom-left, y up). Mouse + touch, with
// per-frame velocity decay. Extracted from the "TSL_Fluid" CodePen (pashafd/OPVGJav)
// setupControls()/render() pointer handling, generalized for reuse by fluids, paint systems,
// ripple/heat fields, and 2D particle fields.
//
// Ported faithfully from REF/tsl-fluid/script.js. Deviation: normalization uses the canvas
// bounding rect (not window.innerWidth/Height) so the module is canvas-scoped and reusable.

export const pointerVelocitySplatDefaults = {
  velocityScale: 1.0,
  splatRadius: 0.02,
  decay: 0.95, // matches source mouseVelocity.multiplyScalar(0.95)
  enabled: true,
};

/**
 * @param {HTMLElement} canvas
 * @param {Partial<typeof pointerVelocitySplatDefaults>} [options]
 */
export function createPointerVelocitySplat(canvas, options = {}) {
  let cfg = { ...pointerVelocitySplatDefaults, ...options };
  const state = { x: 0, y: 0, vx: 0, vy: 0 };
  let lastX = 0;
  let lastY = 0;
  /** @type {Array<(s: typeof state) => void>} */
  const listeners = [];

  const emit = () => {
    for (const cb of listeners) cb({ ...state });
  };

  const handlePointer = (clientX, clientY, isStart = false) => {
    if (!cfg.enabled) return;
    const rect = canvas.getBoundingClientRect();
    const nx = (clientX - rect.left) / (rect.width || 1);
    const ny = 1 - (clientY - rect.top) / (rect.height || 1);
    if (isStart) {
      lastX = nx;
      lastY = ny;
    } else {
      lastX = state.x;
      lastY = state.y;
    }
    state.x = nx;
    state.y = ny;
    state.vx = (nx - lastX) * cfg.velocityScale;
    state.vy = (ny - lastY) * cfg.velocityScale;
    emit();
  };

  const onMouseDown = (e) => handlePointer(e.clientX, e.clientY, true);
  const onMouseMove = (e) => {
    if (e.buttons > 0) handlePointer(e.clientX, e.clientY);
  };
  const onTouchStart = (e) => {
    e.preventDefault();
    if (e.touches.length > 0) handlePointer(e.touches[0].clientX, e.touches[0].clientY, true);
  };
  const onTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length > 0) handlePointer(e.touches[0].clientX, e.touches[0].clientY);
  };

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });

  return {
    /** Subscribe to splat events; returns an unsubscribe fn. */
    onSplat(cb) {
      listeners.push(cb);
      return () => {
        const i = listeners.indexOf(cb);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
    /** Current pointer state (position + velocity). */
    read() {
      return { ...state };
    },
    /** Decay velocity — call once per frame AFTER consuming `read()` (source order). */
    tick() {
      state.vx *= cfg.decay;
      state.vy *= cfg.decay;
    },
    setOptions(next = {}) {
      cfg = { ...cfg, ...next };
    },
    reset() {
      state.x = state.y = state.vx = state.vy = 0;
    },
    dispose() {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      listeners.length = 0;
    },
  };
}
