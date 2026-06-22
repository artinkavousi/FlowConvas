/**
 * FROST PERFORMANCE MONITOR PLUGIN - Tweakpane 4.x Compatible
 */

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const smoothToward = (prev, next, alpha) =>
  Number.isFinite(prev) ? prev + (next - prev) * alpha : next;

const readProviderValue = (providers, key) => {
  if (!providers) return NaN;
  const p = providers[key];
  if (typeof p === 'function') {
    try {
      const v = p();
      return typeof v === 'number' && Number.isFinite(v) ? v : NaN;
    } catch {
      return NaN;
    }
  }
  if (typeof p === 'number' && Number.isFinite(p)) return p;
  return NaN;
};

const detectRendererInfo = (canvas) => {
  if (!canvas || typeof canvas.getContext !== 'function') {
    return { type: 'NONE', name: '' };
  }

  // Check WebGL2 first (most common for modern apps)
  let gl = null;
  let type = '';
  try {
    gl = canvas.getContext('webgl2');
    if (gl) type = 'WEBGL2';
  } catch {}

  // Then WebGL1
  if (!gl) {
    try {
      gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) type = 'WEBGL';
    } catch {}
  }

  // Then WebGPU (least common, check last to avoid seizing context)
  if (!gl) {
    try {
      const webgpu = canvas.getContext('webgpu');
      if (webgpu) return { type: 'WEBGPU', name: '' };
    } catch {}
  }

  let name = '';
  if (gl && type) {
    try {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
        if (typeof renderer === 'string') name = renderer;
      }
    } catch {}
  }

  return { type: type || 'NONE', name };
};

// Inject CSS once
if (typeof document !== 'undefined' && !document.getElementById('frost-perf-styles')) {
  const style = document.createElement('style');
  style.id = 'frost-perf-styles';
  style.textContent = `
.frost-perf-monitor {
  position: relative;
  width: 100%;
  max-width: 314px;
  height: auto;
  padding: 16px 0px;
  box-sizing: border-box;
  background: transparent;
  border: none;
  box-shadow: none;
  backdrop-filter: none;
  border-radius: 18px;
  display: grid;
  grid-template-columns: 85px 1fr;
  grid-template-rows: auto auto;
  gap: 12px;
  column-gap: 16px;
  row-gap: 8px;
  margin-bottom: 0px;
  vertical-align: baseline;
  font-size: 11px;
}

.frost-perf-monitor::before {
  content: '';
  position: absolute;
  left: 1px;
  right: 1px;
  top: 24px;
  bottom: 1px;
  background-image: var(--frost-perf-bg-image, none);
  background-size: cover;
  background-position: center;
  mix-blend-mode: overlay;
  opacity: 0.03;
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
}
.frost-perf-monitor > *:not(.frost-perf-graphs) { position: relative; z-index: 10; }

.frost-perf-main {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0;
  box-sizing: border-box;
}

.frost-perf-fps-value {
  font-family: var(--frost-perf-font-display, 'DM Serif Display', 'Georgia', serif);
  font-size: 52px;
  line-height: 1;
  letter-spacing: -0.02em;
  color: #ffffff;
  text-align: center;
}

.frost-perf-fps-label {
  font-family: var(--frost-perf-font-mono, 'DM Mono', 'JetBrains Mono', monospace);
  font-size: 10px;
  line-height: 1;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
  text-align: center;
}

.frost-perf-metrics {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  justify-content: center;
}

.frost-perf-metric {
  display: flex;
  align-items: center;
  gap: 10px;
}

.frost-perf-metric-label {
  font-family: var(--frost-perf-font-mono, 'DM Mono', 'JetBrains Mono', monospace);
  font-size: 11px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.4);
  width: 32px;
  letter-spacing: 0.02em;
}

.frost-perf-metric:nth-child(2) .frost-perf-metric-label {
  color: #6EC9B8;
}

.frost-perf-bar-container {
  flex: 1;
  position: relative;
  height: 6px;
}

.frost-perf-bar-bg {
  position: absolute;
  left: 0;
  right: 0;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
}

.frost-perf-bar-fill {
  position: absolute;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #3D8B7A 0%, #4DB89E 30%, #5EE8B7 55%, #7FFF9E 80%, #A8FFC4 100%);
  border-radius: 9999px;
  transition: width 0.15s ease-out;
}

.frost-perf-bar-value {
  font-family: var(--frost-perf-font-mono, 'JetBrains Mono', monospace);
  font-size: 11px;
  font-weight: 500;
  color: #6EC9B8;
  width: 30px;
  text-align: right;
}

.frost-perf-footer {
  grid-column: 1 / -1;
  grid-row: 2;
  font-family: var(--frost-perf-font-mono, 'DM Mono', 'JetBrains Mono', monospace);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6EC9B8;
  opacity: 0.7;
  margin-top: 4px;
  padding-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.frost-perf-footer::before {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
}

.frost-perf-graphs {
  position: absolute;
  bottom: 32px;
  left: 0;
  right: 0;
  width: 100%;
  height: 60px;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  z-index: 0;
  pointer-events: none;
}

.frost-perf-graph {
  position: relative;
  height: 60px;
  overflow: hidden;
  border-radius: 8px;
  background: transparent;
}

.frost-perf-graph canvas {
  width: 100%;
  height: 100%;
  display: block;
}
`;
  document.head.appendChild(style);
}

const PerformanceMonitorPlugin = {
  id: 'performance-monitor',
  type: 'blade',
  css: '',

  accept(params) {
    if (!params || params.view !== 'performance') return null;

    const value =
      params.value && typeof params.value === 'object'
        ? params.value
        : null;

    const source =
      params.source === 'manual' || params.source === 'auto'
        ? params.source
        : (value ? 'manual' : 'auto');

    const footer = typeof params.footer === 'string' ? params.footer : null;
    const backgroundImage = typeof params.backgroundImage === 'string' ? params.backgroundImage : null;
    const canvas = params.canvas && typeof params.canvas.getContext === 'function' ? params.canvas : null;
    const providers = params.providers && typeof params.providers === 'object' ? params.providers : null;

    return {
      params: {
        view: params.view,
        value,
        source,
        targetFps: typeof params.targetFps === 'number' ? params.targetFps : 60,
        footer,
        backgroundImage,
        canvas,
        providers,
      },
    };
  },

  controller(args) {
    return new PerformanceMonitorController(args.document, args.params);
  },

  api(args) {
    if (args.controller instanceof PerformanceMonitorController) {
      return new PerformanceMonitorApi(args.controller);
    }
    return null;
  },
};

class PerformanceMonitorController {
  constructor(doc, params) {
    this.doc = doc;
    this.params_ = params;
    this.value_ = params.value;
    this.auto_ = params.source === 'auto';
    this.targetFps_ = params.targetFps || 60;
    this.footerExplicit_ = typeof params.footer === 'string' && params.footer.length > 0;
    this.footerText_ = this.footerExplicit_ ? params.footer : '';
    this.backgroundImage_ = params.backgroundImage;
    this.canvas_ = params.canvas || null;
    this.providers_ = params.providers || null;

    this.frameTimes_ = [];
    this.frameSum_ = 0;
    this.lastFrame_ = null;
    this.rafId_ = null;
    this.disposed_ = false;

    this.data_ = { fps: 0, cpu: 0, gpu: 0, mem: NaN };
    this.smooth_ = { cpu: NaN, gpu: NaN, mem: NaN };
    this.lastFooterDetect_ = 0;

    this.view = this.createView();
    this.updateView(this.value_ || this.data_);

    if (this.auto_) {
      this.startAuto_();
    }
  }

  createView() {
    // Create wrapper container
    const wrapper = this.doc.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 100%; max-width: 314px;';

    // Create monitor element
    const el = this.doc.createElement('div');
    el.className = 'frost-perf-monitor';

    if (this.backgroundImage_) {
      const bg = this.backgroundImage_.trim();
      const cssValue = bg.startsWith('url(') ? bg : `url('${bg}')`;
      el.style.setProperty('--frost-perf-bg-image', cssValue);
    }

    const main = this.doc.createElement('div');
    main.className = 'frost-perf-main';

    this.fpsValue = this.doc.createElement('div');
    this.fpsValue.className = 'frost-perf-fps-value';

    this.fpsLabel = this.doc.createElement('div');
    this.fpsLabel.className = 'frost-perf-fps-label';
    this.fpsLabel.textContent = 'FPS';

    main.appendChild(this.fpsValue);
    main.appendChild(this.fpsLabel);

    const metrics = this.doc.createElement('div');
    metrics.className = 'frost-perf-metrics';

    this.metrics_ = ['CPU', 'GPU', 'MEM'].map((name) => {
      const metric = this.doc.createElement('div');
      metric.className = 'frost-perf-metric';

      const label = this.doc.createElement('div');
      label.className = 'frost-perf-metric-label';
      label.textContent = name;

      const barContainer = this.doc.createElement('div');
      barContainer.className = 'frost-perf-bar-container';

      const barBg = this.doc.createElement('div');
      barBg.className = 'frost-perf-bar-bg';

      const barFill = this.doc.createElement('div');
      barFill.className = 'frost-perf-bar-fill';
      barFill.style.width = '0%';

      const barValue = this.doc.createElement('div');
      barValue.className = 'frost-perf-bar-value';
      barValue.textContent = '--';

      barBg.appendChild(barFill);
      barContainer.appendChild(barBg);

      metric.appendChild(label);
      metric.appendChild(barContainer);
      metric.appendChild(barValue);

      metrics.appendChild(metric);

      return { fill: barFill, value: barValue };
    });

    const footer = this.doc.createElement('div');
    footer.className = 'frost-perf-footer';
    this.footerEl_ = footer;
    if (!this.footerExplicit_) {
      const info = detectRendererInfo(this.canvas_);
      let text = info.type;
      if (info.name) {
        const shortName = info.name.split('/').pop().trim();
        if (shortName && shortName.length <= 18) {
          text = `${info.type} • ${shortName}`;
        }
      }
      this.footerText_ = text;
    }
    footer.textContent = this.footerText_ || 'CANVAS';

    el.appendChild(main);
    el.appendChild(metrics);
    el.appendChild(footer);

    // Add monitor to wrapper
    wrapper.appendChild(el);

    // Create graphs container (as sibling, not child)
    const graphsContainer = this.doc.createElement('div');
    graphsContainer.className = 'frost-perf-graphs';

    // CPU Graph
    const cpuGraphWrapper = this.doc.createElement('div');
    cpuGraphWrapper.className = 'frost-perf-graph';
    
    const cpuLabel = this.doc.createElement('div');
    cpuLabel.className = 'frost-perf-graph-label cpu';
    cpuLabel.textContent = 'CPU';
    
    this.cpuCanvas = this.doc.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    this.cpuCanvas.width = 300 * dpr;
    this.cpuCanvas.height = 60 * dpr;
    this.cpuCanvas.style.width = '100%';
    this.cpuCanvas.style.height = '60px';
    this.cpuCtx = this.cpuCanvas.getContext('2d');
    this.cpuCtx.scale(dpr, dpr);
    
    cpuGraphWrapper.appendChild(cpuLabel);
    cpuGraphWrapper.appendChild(this.cpuCanvas);

    // GPU Graph
    const gpuGraphWrapper = this.doc.createElement('div');
    gpuGraphWrapper.className = 'frost-perf-graph';
    
    const gpuLabel = this.doc.createElement('div');
    gpuLabel.className = 'frost-perf-graph-label gpu';
    gpuLabel.textContent = 'GPU';
    
    this.gpuCanvas = this.doc.createElement('canvas');
    this.gpuCanvas.width = 300 * dpr;
    this.gpuCanvas.height = 60 * dpr;
    this.gpuCanvas.style.width = '100%';
    this.gpuCanvas.style.height = '60px';
    this.gpuCtx = this.gpuCanvas.getContext('2d');
    this.gpuCtx.scale(dpr, dpr);
    
    gpuGraphWrapper.appendChild(gpuLabel);
    gpuGraphWrapper.appendChild(this.gpuCanvas);

    graphsContainer.appendChild(cpuGraphWrapper);
    graphsContainer.appendChild(gpuGraphWrapper);
    
    // Add graphs container to wrapper (below monitor)
    wrapper.appendChild(graphsContainer);

    // Initialize graph history
    this.cpuHistory_ = [];
    this.gpuHistory_ = [];
    this.maxHistory_ = 60;

    // Debug logging
    console.log('✅ Performance monitor created with graphs');
    console.log('  - Monitor element:', el);
    console.log('  - Graphs container:', graphsContainer);
    console.log('  - CPU canvas:', this.cpuCanvas);
    console.log('  - GPU canvas:', this.gpuCanvas);
    console.log('  - Wrapper:', wrapper);

    return wrapper;
  }

  startAuto_() {
    this.lastFrame_ = performance.now();
    const tick = (now) => {
      if (this.disposed_) return;
      const dt = now - this.lastFrame_;
      this.lastFrame_ = now;

      if (dt > 0 && dt < 1000) {
        this.frameTimes_.push(dt);
        this.frameSum_ += dt;
        if (this.frameTimes_.length > 60) {
          this.frameSum_ -= this.frameTimes_.shift();
        }
      }

      const avgDt = this.frameTimes_.length ? this.frameSum_ / this.frameTimes_.length : 0;
      const fps = avgDt ? 1000 / avgDt : 0;
      const targetMs = this.targetFps_ ? 1000 / this.targetFps_ : 16.67;
      const load = avgDt && targetMs ? (avgDt / targetMs) * 100 : 0;

      const cpuProv = readProviderValue(this.providers_, 'cpu');
      const gpuProv = readProviderValue(this.providers_, 'gpu');
      const memProv = readProviderValue(this.providers_, 'mem');

      const cpuRaw = Number.isFinite(cpuProv) ? cpuProv : load;
      const gpuRaw = Number.isFinite(gpuProv) ? gpuProv : load;

      let memRaw = memProv;
      if (!Number.isFinite(memRaw)) {
        const mem = performance && performance.memory
          ? (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
          : NaN;
        memRaw = mem;
      }

      const alpha = 0.25;
      this.smooth_.cpu = Number.isFinite(cpuRaw)
        ? smoothToward(this.smooth_.cpu, clamp(cpuRaw, 0, 100), alpha)
        : NaN;
      this.smooth_.gpu = Number.isFinite(gpuRaw)
        ? smoothToward(this.smooth_.gpu, clamp(gpuRaw, 0, 100), alpha)
        : NaN;
      this.smooth_.mem = Number.isFinite(memRaw)
        ? smoothToward(this.smooth_.mem, clamp(memRaw, 0, 100), alpha)
        : NaN;

      this.data_.fps = fps;
      this.data_.cpu = this.smooth_.cpu;
      this.data_.gpu = this.smooth_.gpu;
      this.data_.mem = this.smooth_.mem;

      if (!this.footerExplicit_ && this.canvas_ && this.footerEl_ && now - this.lastFooterDetect_ > 1000) {
        const info = detectRendererInfo(this.canvas_);
        if (info.type && info.type !== 'NONE') {
          let text = info.type;
          if (info.name) {
            const shortName = info.name.split('/').pop().trim();
            if (shortName && shortName.length <= 18) {
              text = `${info.type} • ${shortName}`;
            }
          }
          if (text !== this.footerText_) {
            this.footerText_ = text;
            this.footerEl_.textContent = text;
          }
        }
        this.lastFooterDetect_ = now;
      }

      this.updateView(this.data_);
      this.rafId_ = requestAnimationFrame(tick);
    };
    this.rafId_ = requestAnimationFrame(tick);
  }

  stopAuto_() {
    if (this.rafId_ != null) {
      cancelAnimationFrame(this.rafId_);
      this.rafId_ = null;
    }
  }

  updateView(v) {
    const fps = v && typeof v.fps === 'number' ? v.fps : 0;
    this.fpsValue.textContent = fps > 0 ? String(Math.round(fps)) : '--';

    const setMetric = (idx, val) => {
      const percent = typeof val === 'number' && Number.isFinite(val) ? clamp(val, 0, 100) : NaN;
      this.metrics_[idx].fill.style.width = Number.isFinite(percent) ? `${Math.round(percent)}%` : '0%';
      this.metrics_[idx].value.textContent = Number.isFinite(percent) ? String(Math.round(percent)) : '--';
    };

    setMetric(0, v && v.cpu);
    setMetric(1, v && v.gpu);
    setMetric(2, v && v.mem);

    // Update graph history
    const cpuVal = v && typeof v.cpu === 'number' && Number.isFinite(v.cpu) ? v.cpu : 0;
    const gpuVal = v && typeof v.gpu === 'number' && Number.isFinite(v.gpu) ? v.gpu : 0;
    
    this.cpuHistory_.push(cpuVal);
    this.gpuHistory_.push(gpuVal);
    
    if (this.cpuHistory_.length > this.maxHistory_) this.cpuHistory_.shift();
    if (this.gpuHistory_.length > this.maxHistory_) this.gpuHistory_.shift();

    // Draw graphs with 15% transparency
    // CPU = white, GPU = teal
    if (this.cpuCtx && this.gpuCtx) {
      this.drawGraph(this.cpuCtx, this.cpuHistory_, 'rgba(255, 255, 255, 0.15)');
      this.drawGraph(this.gpuCtx, this.gpuHistory_, 'rgba(110, 201, 184, 0.15)');
      
      // Log first few updates for debugging
      if (this.cpuHistory_.length <= 5) {
        console.log(`Graph update ${this.cpuHistory_.length}: CPU=${cpuVal.toFixed(1)}%, GPU=${gpuVal.toFixed(1)}%`);
      }
    }
  }

  drawGraph(ctx, history, color) {
    if (!ctx || !history || history.length < 2) return;

    // Use logical dimensions (not scaled by DPR)
    const width = 300;
    const height = 60;

    // Clear canvas (use actual canvas dimensions)
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const step = width / (this.maxHistory_ - 1);

    for (let i = 0; i < history.length; i++) {
      const x = i * step;
      const y = height - (history[i] / 100) * height;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }

  setManualValue(v) {
    this.value_ = v;
    if (this.auto_) {
      this.auto_ = false;
      this.stopAuto_();
    }
    this.updateView(this.value_);
  }

  get element() {
    return this.view;
  }

  dispose() {
    this.disposed_ = true;
    this.stopAuto_();
  }
}

class PerformanceMonitorApi {
  constructor(controller) {
    this.controller_ = controller;
  }

  get value() {
    return this.controller_.value_ || this.controller_.data_;
  }

  set value(v) {
    this.controller_.setManualValue(v);
  }
}

export default PerformanceMonitorPlugin;
