// AudioReactiveVisualizer — the module's own canvas renderer (presentation only).
//
// New code: it does NOT touch the DSP. It draws an AudioFrame snapshot
// (produced by the ported `audio/` engine) as a spectrum + band meters + beat
// pulse. Kept untyped (engine.js convention) so the typed .tsx wrapper owns the
// canvas lifecycle. The reusable system is the engine under `audio/`; this is the
// showcase surface for it.

const DEFAULTS = {
  bars: 48,
  sensitivity: 1,
  smoothing: 0.6,
  color: '#38e8c8',
  accent: '#f5a3ff',
  beatFlash: true,
  showMeters: true,
  style: 'bars', // 'bars' | 'radial'
  background: '#05060c',
};

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [56, 232, 200];
}

// Resample an arbitrary-length spectrum array down/up to `n` bars (max-pool).
function resample(spectrum, n) {
  const out = new Array(n).fill(0);
  if (!spectrum || spectrum.length === 0) return out;
  const ratio = spectrum.length / n;
  for (let i = 0; i < n; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.max(start + 1, Math.floor((i + 1) * ratio));
    let v = 0;
    for (let j = start; j < end && j < spectrum.length; j += 1) v = Math.max(v, spectrum[j] || 0);
    out[i] = v;
  }
  return out;
}

export function createVisualizer(canvas) {
  const ctx = canvas.getContext('2d');
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  let params = { ...DEFAULTS };
  let display = []; // smoothed bar values
  let beatPulse = 0; // decays each frame

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, Math.floor(rect.width));
    h = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function setParams(next) {
    params = { ...DEFAULTS, ...(next || {}) };
  }

  // snapshot: { enabled, energy, bass, mid, treble, beat, bpm, confidence, spectrum, frame }
  function draw(snapshot) {
    const p = params;
    ctx.fillStyle = p.background;
    ctx.fillRect(0, 0, w, h);

    const snap = snapshot || {};
    const n = Math.max(8, Math.min(128, Math.round(p.bars)));
    const raw = resample(snap.spectrum, n);
    if (display.length !== n) display = raw.slice();

    const a = Math.max(0, Math.min(0.95, p.smoothing));
    const gain = Math.max(0.1, p.sensitivity);
    for (let i = 0; i < n; i += 1) {
      const target = Math.min(1, (raw[i] || 0) * gain);
      display[i] = display[i] * a + target * (1 - a); // EMA
    }

    if (snap.beat) beatPulse = 1;
    beatPulse *= 0.86;

    const [cr, cg, cb] = hexToRgb(p.color);
    const [ar, ag, ab] = hexToRgb(p.accent);

    if (p.style === 'radial') {
      drawRadial(p, n, cr, cg, cb, ar, ag, ab);
    } else {
      drawBars(p, n, cr, cg, cb, ar, ag, ab);
    }

    if (p.beatFlash && beatPulse > 0.02) {
      ctx.strokeStyle = `rgba(${ar},${ag},${ab},${beatPulse * 0.8})`;
      ctx.lineWidth = 2 + beatPulse * 6;
      ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, w - ctx.lineWidth * 2, h - ctx.lineWidth * 2);
    }

    if (p.showMeters) drawMeters(snap);
    drawStatus(snap);
  }

  function drawBars(p, n, cr, cg, cb, ar, ag, ab) {
    const gap = Math.max(1, w / n * 0.18);
    const bw = (w - gap * (n + 1)) / n;
    const baseY = h * 0.82;
    for (let i = 0; i < n; i += 1) {
      const v = display[i];
      const barH = v * (h * 0.66);
      const x = gap + i * (bw + gap);
      const t = i / (n - 1);
      const r = Math.round(cr + (ar - cr) * t);
      const g = Math.round(cg + (ag - cg) * t);
      const b = Math.round(cb + (ab - cb) * t);
      const grad = ctx.createLinearGradient(0, baseY, 0, baseY - barH);
      grad.addColorStop(0, `rgba(${r},${g},${b},0.25)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},1)`);
      ctx.fillStyle = grad;
      ctx.fillRect(x, baseY - barH, bw, barH);
      // mirrored reflection
      ctx.fillStyle = `rgba(${r},${g},${b},0.10)`;
      ctx.fillRect(x, baseY, bw, barH * 0.35);
    }
  }

  function drawRadial(p, n, cr, cg, cb, ar, ag, ab) {
    const cx = w / 2;
    const cy = h / 2;
    const inner = Math.min(w, h) * 0.16;
    const maxLen = Math.min(w, h) * 0.32;
    ctx.lineWidth = Math.max(1.5, (Math.PI * 2 * inner) / n * 0.4);
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i += 1) {
      const v = display[i];
      const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
      const len = inner + v * maxLen;
      const t = i / (n - 1);
      const r = Math.round(cr + (ar - cr) * t);
      const g = Math.round(cg + (ag - cg) * t);
      const b = Math.round(cb + (ab - cb) * t);
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.4 + v * 0.6})`;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * inner, cy + Math.sin(ang) * inner);
      ctx.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
      ctx.stroke();
    }
  }

  function drawMeters(snap) {
    const bands = [
      ['BASS', snap.bass || 0, '#ff6b9d'],
      ['MID', snap.mid || 0, '#7cf5a0'],
      ['TREBLE', snap.treble || 0, '#6bb8ff'],
    ];
    const pad = 12;
    const mw = 54;
    const mh = 6;
    bands.forEach(([label, val, col], i) => {
      const y = pad + i * 18;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '9px ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(label, pad, y + mh);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(pad + 46, y, mw, mh);
      ctx.fillStyle = col;
      ctx.fillRect(pad + 46, y, mw * Math.min(1, val), mh);
    });
  }

  function drawStatus(snap) {
    ctx.textAlign = 'right';
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillStyle = snap.enabled ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)';
    const bpm = snap.bpm ? `${Math.round(snap.bpm)} BPM` : '— BPM';
    const status = snap.enabled ? bpm : 'idle';
    ctx.fillText(status, w - 12, h - 12);
  }

  function dispose() {
    display = [];
  }

  resize();
  return { draw, resize, setParams, dispose };
}
