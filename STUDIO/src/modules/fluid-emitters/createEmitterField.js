// createEmitterField — module engine for fluid-emitters.
//
// Wraps the EmitterSystem (ported verbatim from REF/src/emitters) and paints its
// per-frame splats into a lightweight 2D dye field so each emitter TYPE is
// visible standalone — without the WebGPU fluid pipeline. The emitter geometry
// (positions, velocities, colours, counts) is the REAL ported code; the field
// accumulation/render is this module's own presentation surface.
//
// Untyped (engine.js convention); the typed .tsx wrapper owns the canvas
// lifecycle. resolveFrame()'s splats are {x,y,dx,dy,radius,color:THREE.Color},
// coords in [0,1].

import { EmitterSystem, getEmitterTypeOptions } from './engine/EmitterSystem.js';

export { getEmitterTypeOptions };

const DEFAULTS = {
  emitterType: 'radial',
  intensity: 1,
  fade: 0.06, // per-frame field decay (higher = shorter trails)
  blob: 1, // splat size multiplier
  background: '#05060c',
};

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function createEmitterField(canvas) {
  const ctx = canvas.getContext('2d');
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  let raf = 0;
  let running = true;
  let last = performance.now();
  let time = 0;
  let params = { ...DEFAULTS };

  const cfg = { EMITTERS_ENABLED: true, EMITTER_INTENSITY: 1, AUDIO_ENABLED: false, AUDIO_GAIN: 1 };
  let system = new EmitterSystem();
  let currentType = DEFAULTS.emitterType;
  system.addEmitter(currentType);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, Math.floor(rect.width));
    h = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = params.background;
    ctx.fillRect(0, 0, w, h);
  }

  function setType(type) {
    if (!type || type === currentType) return;
    system = new EmitterSystem();
    system.addEmitter(type);
    currentType = type;
  }

  function setParams(next) {
    params = { ...DEFAULTS, ...(next || {}) };
    cfg.EMITTER_INTENSITY = Number.isFinite(params.intensity) ? params.intensity : 1;
    setType(params.emitterType);
  }

  function drawBlob(s) {
    const px = clamp01(s.x) * w;
    const py = (1 - clamp01(s.y)) * h; // y-up sim -> y-down canvas
    const r = Math.max(1.5, (s.radius || 0.1) * Math.min(w, h) * 0.12 * params.blob);
    const c = s.color;
    const cr = Math.round(Math.min(1, c.r) * 255);
    const cg = Math.round(Math.min(1, c.g) * 255);
    const cb = Math.round(Math.min(1, c.b) * 255);
    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    grad.addColorStop(0, `rgba(${cr},${cg},${cb},0.9)`);
    grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function frame(now = performance.now()) {
    if (!running) return;
    raf = requestAnimationFrame(frame); // reschedule first
    const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05);
    last = now;
    time += dt;

    // Fade the field toward the background (trails).
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = Math.max(0.01, Math.min(0.4, params.fade));
    ctx.fillStyle = params.background;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;

    // Gentle synthetic pulse so audio-coupled emitters still breathe (audio off).
    const audio = { energy: 0.5 + 0.5 * Math.sin(time * 1.6), beat: false };
    const splats = system.resolveFrame({ dt, config: cfg, audio }) || [];

    ctx.globalCompositeOperation = 'lighter'; // additive accumulation
    for (const s of splats) drawBlob(s);
    ctx.globalCompositeOperation = 'source-over';
  }

  resize();
  raf = requestAnimationFrame(frame);

  return {
    update(next) {
      setParams(next);
    },
    resize,
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}
