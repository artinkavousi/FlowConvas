import { Pane } from './tweakpane.js';
import { EssentialsPlugin, CamerakitPlugin, WaveformPlugin, InfodumpPlugin } from './tweakpane-plugins.js';

export class FrostTweakpane {
  constructor(container) {
    if (!container) throw new Error('Container element is required');
    this.container = container;
    this.container.classList.add('frost-tweakpane');
    this.pane = new Pane({ container: this.container, expanded: true });
    this.intervalId = null;
    this.params = {
      // Primitives
      text: 'Hello FROST',
      number: 42,
      slider: 0.5,
      boolean: true,
      
      // Sliders
      intensity: 65,
      scale: 1.0,
      rotation: 0,
      
      // Colors
      color: '#6ec9b8',
      colorRgb: { r: 110, g: 201, b: 184 },
      
      // Points
      point2d: { x: 0, y: 0 },
      point3d: { x: 0, y: 45, z: 0 },
      
      // Lists
      theme: 'Teal',
      quality: 'High',
      
      // Range
      range: { min: 20, max: 80 },
      
      // Bezier
      easing: [0.4, 0, 0.2, 1],
      
      // Monitor
      fps: 60,
      time: 0,
      wave: 0,
      
      // Camera parameters
      focalLength: 35,
      fStop: 2.8,
      iso: 100,
      shutterSpeed: 1/125,
      exposure: 0,
      whiteBalance: 5500,
      
      // Waveform data
      waveformData: Array.from({ length: 64 }, (_, i) => Math.sin(i * 0.2) * 0.5 + 0.5),
    };
    
    // Log params separated since it's used differently in the original
    this.logParams = { log: 'System initialized...\nAll plugins loaded.\nReady.' };

    this._init();
  }

  _init() {
    console.log('FrostTweakpane: _init called');
    // Register all plugins
    try {
        console.log('FrostTweakpane: Registering plugins...');
        if (EssentialsPlugin) this.pane.registerPlugin(EssentialsPlugin);
        if (CamerakitPlugin) this.pane.registerPlugin(CamerakitPlugin);
        if (WaveformPlugin) this.pane.registerPlugin(WaveformPlugin);
        console.log('FrostTweakpane: Plugins registered successfully');
    } catch (e) {
        console.error('FrostTweakpane: Error registering plugins:', e);
    }
    
    // Register new plugins
    try {
        if (window.TweakpaneCompactKit) {
            // TweakpaneCompactKit UMD exports CompactKitBundle
            const plugin = window.TweakpaneCompactKit.CompactKitBundle || window.TweakpaneCompactKit;
            this.pane.registerPlugin(plugin);
        }
    } catch (e) {
        console.warn('FrostTweakpane: Failed to register CompactKit:', e);
    }

    try {
        if (window.TweakpaneChromaticPlugin) {
            console.log('FrostTweakpane: Found ChromaticPlugin, registering...');
            this.pane.registerPlugin(window.TweakpaneChromaticPlugin);
        }
    } catch (e) {
        console.warn('FrostTweakpane: Failed to register ChromaticPlugin:', e);
    }

    try {
        if (InfodumpPlugin) {
            this.pane.registerPlugin(InfodumpPlugin);
        }
    } catch (e) {
        console.warn('FrostTweakpane: Failed to register InfodumpPlugin:', e);
    }

    try {
        if (window.PerformanceMonitorPlugin) {
            console.log('FrostTweakpane: Found PerformanceMonitorPlugin, registering...');
            this.pane.registerPlugin(window.PerformanceMonitorPlugin);
        }
    } catch (e) {
        console.warn('FrostTweakpane: Failed to register PerformanceMonitorPlugin:', e);
    }
    
    // Fix dropdown display by adding visible text overlay
    this._fixDropdowns();
    setTimeout(() => this._fixDropdowns(), 100);
    setTimeout(() => this._fixDropdowns(), 300);

    // Build UI
    this._buildUI();
    
    // Start Loop
    this._startLoop();
  }

  _fixDropdowns() {
    const containers = this.container.querySelectorAll('.tp-lstv');
    containers.forEach(container => {
      if (container.querySelector('.frost-select-text')) return;
      
      const select = container.querySelector('select');
      if (!select) return;
      
      const textOverlay = document.createElement('span');
      textOverlay.className = 'frost-select-text';
      textOverlay.textContent = select.options[select.selectedIndex]?.text || '';
      
      select.addEventListener('change', () => {
        textOverlay.textContent = select.options[select.selectedIndex]?.text || '';
      });
      
      container.appendChild(textOverlay);
    });
  }

  _addPerformanceMonitor() {
    const pane = this.pane;
    if (pane && window.PerformanceMonitorPlugin) {
      try {
        const canvas = document.getElementById('bg-canvas');
        this.perfBlade = pane.addBlade({
          view: 'performance',
          label: '',
          source: 'auto',
          canvas: canvas || null,
          targetFps: 60,
        });
        this.perfElements = null;
        console.log('Performance monitor blade added');
        return;
      } catch (e) {
        console.warn('Performance monitor plugin failed, using fallback:', e);
      }
    }
    this._addPerformanceMonitorFallback();
  }

  _addPerformanceMonitorFallback() {
    console.log('🔍 _addPerformanceMonitor called');
    const paneEl = this.container.querySelector('.tp-rotv');
    console.log('🔍 paneEl found:', !!paneEl);
    if (!paneEl) {
      console.error('❌ Cannot find .tp-rotv element!');
      return;
    }

    const init = this.perfMonitorData || { fps: 0, cpu: 0, gpu: 0, mem: 0 };
    const canvas = document.getElementById('bg-canvas');
    let footer = 'CANVAS';
    try {
      if (canvas && canvas.getContext) {
        if (canvas.getContext('webgpu')) footer = 'WEBGPU';
        else if (canvas.getContext('webgl2')) footer = 'WEBGL2';
        else if (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) footer = 'WEBGL';
      }
    } catch {}

    const perfEl = document.createElement('div');
    perfEl.className = 'frost-perf-monitor';
    perfEl.innerHTML = `
      <div class="frost-perf-main">
        <div class="frost-perf-fps-value">${Math.round(init.fps || 0)}</div>
        <div class="frost-perf-fps-label">FPS</div>
      </div>
      <div class="frost-perf-metrics">
        <div class="frost-perf-metric">
          <div class="frost-perf-metric-label">CPU</div>
          <div class="frost-perf-bar-container">
            <div class="frost-perf-bar-bg">
              <div class="frost-perf-bar-fill" style="width: ${Math.round(init.cpu || 0)}%"></div>
            </div>
          </div>
          <div class="frost-perf-bar-value">${Math.round(init.cpu || 0)}</div>
        </div>
        <div class="frost-perf-metric">
          <div class="frost-perf-metric-label">GPU</div>
          <div class="frost-perf-bar-container">
            <div class="frost-perf-bar-bg">
              <div class="frost-perf-bar-fill" style="width: ${Math.round(init.gpu || 0)}%"></div>
            </div>
          </div>
          <div class="frost-perf-bar-value">${Math.round(init.gpu || 0)}</div>
        </div>
        <div class="frost-perf-metric">
          <div class="frost-perf-metric-label">MEM</div>
          <div class="frost-perf-bar-container">
            <div class="frost-perf-bar-bg">
              <div class="frost-perf-bar-fill" style="width: ${Math.round(init.mem || 0)}%"></div>
            </div>
          </div>
          <div class="frost-perf-bar-value">${Math.round(init.mem || 0)}</div>
        </div>
      </div>
      <div class="frost-perf-footer">${footer}</div>
    `;

    // Insert at the very beginning
    paneEl.insertBefore(perfEl, paneEl.firstChild);

    // Create graphs container (single overlaid graph) - ABSOLUTE POSITIONING BEHIND MONITOR
    const graphsContainer = document.createElement('div');
    graphsContainer.className = 'frost-perf-graphs';
    graphsContainer.style.cssText = 'position: absolute; bottom: 32px; left: 0; right: 0; width: 100%; height: 60px; z-index: 0; pointer-events: none;';

    // Single graph wrapper for overlaid lines
    const graphWrapper = document.createElement('div');
    graphWrapper.style.cssText = 'position: relative; width: 100%; height: 60px;';
    
    // Single canvas for both lines
    const graphCanvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    graphCanvas.width = 314 * dpr;
    graphCanvas.height = 60 * dpr;
    graphCanvas.style.cssText = 'width: 100%; height: 60px; display: block;';
    const graphCtx = graphCanvas.getContext('2d');
    graphCtx.scale(dpr, dpr);
    
    graphWrapper.appendChild(graphCanvas);
    graphsContainer.appendChild(graphWrapper);
    
    // Make perfEl position relative for absolute positioning of graphs
    perfEl.style.position = 'relative';
    
    // Insert graphs INSIDE the performance monitor as first child (behind everything)
    perfEl.insertBefore(graphsContainer, perfEl.firstChild);

    // Store references for updates
    this.perfElements = {
      fps: perfEl.querySelector('.frost-perf-fps-value'),
      cpuFill: perfEl.querySelectorAll('.frost-perf-bar-fill')[0],
      cpuValue: perfEl.querySelectorAll('.frost-perf-bar-value')[0],
      gpuFill: perfEl.querySelectorAll('.frost-perf-bar-fill')[1],
      gpuValue: perfEl.querySelectorAll('.frost-perf-bar-value')[1],
      memFill: perfEl.querySelectorAll('.frost-perf-bar-fill')[2],
      memValue: perfEl.querySelectorAll('.frost-perf-bar-value')[2],
      graphCanvas: graphCanvas,
      graphCtx: graphCtx,
      cpuHistory: [],
      gpuHistory: [],
      maxHistory: 60,
    };

    console.log('✅ ✅ ✅ PERFORMANCE MONITOR WITH GRAPHS ADDED SUCCESSFULLY ✅ ✅ ✅');
  }

  _updatePerformanceMonitor() {
    if (!this.perfElements || !this.perfMonitorData) return;

    const d = this.perfMonitorData;
    this.perfElements.fps.textContent = Math.round(d.fps);
    
    const cpu = Math.round(d.cpu);
    this.perfElements.cpuFill.style.width = `${cpu}%`;
    this.perfElements.cpuValue.textContent = cpu;
    
    const gpu = Math.round(d.gpu);
    this.perfElements.gpuFill.style.width = `${gpu}%`;
    this.perfElements.gpuValue.textContent = gpu;
    
    const mem = Math.round(d.mem);
    this.perfElements.memFill.style.width = `${mem}%`;
    this.perfElements.memValue.textContent = mem;

    // Update graphs (overlaid on same canvas)
    if (this.perfElements.graphCtx) {
      const cpuVal = typeof d.cpu === 'number' && isFinite(d.cpu) ? d.cpu : 0;
      const gpuVal = typeof d.gpu === 'number' && isFinite(d.gpu) ? d.gpu : 0;
      
      this.perfElements.cpuHistory.push(cpuVal);
      this.perfElements.gpuHistory.push(gpuVal);
      
      if (this.perfElements.cpuHistory.length > this.perfElements.maxHistory) {
        this.perfElements.cpuHistory.shift();
      }
      if (this.perfElements.gpuHistory.length > this.perfElements.maxHistory) {
        this.perfElements.gpuHistory.shift();
      }

      // Clear canvas
      const ctx = this.perfElements.graphCtx;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      // Draw both lines on same canvas with 15% transparency
      // CPU = white, GPU = teal
      this._drawLine(ctx, this.perfElements.cpuHistory, 'rgba(255, 255, 255, 0.15)');
      this._drawLine(ctx, this.perfElements.gpuHistory, 'rgba(110, 201, 184, 0.15)');
    }
  }

  _drawLine(ctx, history, color) {
    if (!ctx || !history || history.length < 2) return;

    const width = 314;
    const height = 60;

    // Draw line (don't clear, we're overlaying)
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const maxHistory = this.perfElements?.maxHistory || 60;
    const step = width / (maxHistory - 1);

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

  _buildUI() {
    console.log('FrostTweakpane: _buildUI called');
    const pane = this.pane;
    const params = this.params;

    this.perfMonitorData = { fps: 0, cpu: 0, gpu: 0, mem: 0 };
    this._addPerformanceMonitor();

    // ═══════════════════════════════════════════════════════════════════════════
    // TABS
    // ═══════════════════════════════════════════════════════════════════════════
    const tab = pane.addTab({
      pages: [
        { title: 'Bindings' },
        { title: 'UI' },
        { title: 'Camera' },
        { title: 'Monitor' },
        { title: 'Plugins' },
      ],
    });



    // ═══════════════════════════════════════════════════════════════════════════
    // PAGE 1: BINDINGS
    // ═══════════════════════════════════════════════════════════════════════════
    try {
        const bindingsPage = tab.pages[0];

        // Primitives
        const primitives = bindingsPage.addFolder({ title: '◇ Primitives', expanded: true });
        primitives.addBinding(params, 'text', { label: 'Text' });
        primitives.addBinding(params, 'number', { label: 'Number', min: 0, max: 100, step: 1 });
        primitives.addBinding(params, 'boolean', { label: 'Boolean' });

        // Sliders
        const sliders = bindingsPage.addFolder({ title: '◐ Sliders', expanded: true });
        sliders.addBinding(params, 'slider', { label: 'Opacity', min: 0, max: 1 });
        sliders.addBinding(params, 'intensity', { label: 'Intensity', min: 0, max: 100 });
        sliders.addBinding(params, 'scale', { label: 'Scale', min: 0.1, max: 3, step: 0.1 });
        sliders.addBinding(params, 'rotation', { label: 'Rotation', min: -180, max: 180, step: 1 });

        // Colors
        const colors = bindingsPage.addFolder({ title: '◈ Colors', expanded: true });
        colors.addBinding(params, 'color', { label: 'Hex' });
        colors.addBinding(params, 'colorRgb', { label: 'RGB', color: { type: 'int' } });

        // Points
        const points = bindingsPage.addFolder({ title: '◐ Points', expanded: true });
        points.addBinding(params, 'point2d', { label: 'Point 2D', picker: 'inline', expanded: true });
        points.addBinding(params, 'point3d', { label: 'Point 3D' });

        // Lists
        const lists = bindingsPage.addFolder({ title: '◑ Selection', expanded: true });
        
        // Theme Selector
        const themeBinding = lists.addBinding(params, 'theme', {
          label: 'Accent',
          options: { Teal: 'Teal', Gold: 'Gold', Red: 'Red' },
        });
        
        themeBinding.on('change', (ev) => {
          const root = this.container;
          const theme = ev.value.toLowerCase();
          const vars = {
            teal: ['#6ec9b8', '#8ad4c6', 'rgba(110, 201, 184, 0.35)'],
            gold: ['#c8b070', '#dcc88a', 'rgba(200, 176, 112, 0.35)'],
            red:  ['#c08080', '#d4a0a0', 'rgba(192, 128, 128, 0.35)'],
          }[theme];
          
          if (vars) {
            root.style.setProperty('--frost-accent', vars[0]);
            root.style.setProperty('--frost-accent-hover', vars[1]);
            root.style.setProperty('--frost-accent-glow', vars[2]);
            root.style.setProperty('--frost-slider-end', vars[0]);
          }
        });

        lists.addBinding(params, 'quality', {
          label: 'Quality',
          options: { Low: 'Low', Medium: 'Medium', High: 'High', Ultra: 'Ultra' },
        });
    } catch (e) {
        console.error('FrostTweakpane: Error building Page 1 (Bindings):', e);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PAGE 2: UI COMPONENTS
    // ═══════════════════════════════════════════════════════════════════════════
    try {
        const uiPage = tab.pages[1];

        // Buttons
        const buttons = uiPage.addFolder({ title: '◎ Buttons', expanded: true });
        buttons.addButton({ title: 'Action Button' });
        buttons.addButton({ title: 'Another Action' });
        buttons.addBlade({ view: 'separator' });
        try {
            buttons.addBlade({
              view: 'buttongrid',
              size: [3, 2],
              cells: (x, y) => ({
                title: [['1', '2', '3'], ['4', '5', '6']][y][x],
              }),
              label: 'Grid',
            });
        } catch (e) { console.warn('ButtonGrid plugin missing?', e); }

        // Radio Grid
        try {
            const radios = uiPage.addFolder({ title: '◉ Radio', expanded: true });
            radios.addBlade({
              view: 'radiogrid',
              groupName: 'size',
              label: 'Size',
              size: [4, 1],
              cells: (x) => ({ title: ['XS', 'SM', 'MD', 'LG'][x], value: x }),
              value: 2,
            });
        } catch (e) { console.warn('RadioGrid plugin missing?', e); }

        // Interval (Essentials)
        try {
            const intervals = uiPage.addFolder({ title: '⬌ Range', expanded: true });
            intervals.addBinding(params, 'range', { label: 'Interval', min: 0, max: 100 });
        } catch (e) { console.warn('Interval plugin missing?', e); }

        // Cubic Bezier (Essentials)
        try {
            const bezier = uiPage.addFolder({ title: '⌇ Bezier', expanded: true });
            bezier.addBlade({ view: 'cubicbezier', label: 'Easing', value: params.easing, expanded: true });
        } catch (e) { console.warn('CubicBezier plugin missing?', e); }
    } catch (e) {
        console.error('FrostTweakpane: Error building Page 2 (UI):', e);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PAGE 3: CAMERA (Camerakit Plugin)
    // ═══════════════════════════════════════════════════════════════════════════
    try {
        const cameraPage = tab.pages[2];

        // Camera Ring Controls
        try {
            const cameraRings = cameraPage.addFolder({ title: '◎ Camera Rings', expanded: true });
            
            // Focal Length Ring
            cameraRings.addBinding(params, 'focalLength', {
              label: 'Focal',
              view: 'cameraring',
              series: 0,
              unit: { ticks: 10, pixels: 40, value: 5 },
              min: 14,
              max: 200,
              step: 1,
            });
            
            // F-Stop Ring  
            cameraRings.addBinding(params, 'fStop', {
              label: 'f-Stop',
              view: 'cameraring',
              series: 1,
              unit: { ticks: 10, pixels: 40, value: 0.2 },
              min: 1.4,
              max: 22,
              step: 0.1,
            });
            
            // ISO Ring
            cameraRings.addBinding(params, 'iso', {
              label: 'ISO',
              view: 'cameraring',
              series: 2,
              unit: { ticks: 5, pixels: 50, value: 100 },
              min: 100,
              max: 12800,
              step: 100,
            });
        } catch (e) { console.warn('CameraRing plugin missing?', e); }

        // Camera Wheel Controls
        try {
            const cameraWheels = cameraPage.addFolder({ title: '⊚ Camera Wheels', expanded: true });
            
            // Exposure Wheel
            cameraWheels.addBinding(params, 'exposure', {
              label: 'Exposure',
              view: 'camerawheel',
              amount: 10,
              min: -3,
              max: 3,
              step: 0.1,
            });
            
            // White Balance Wheel
            cameraWheels.addBinding(params, 'whiteBalance', {
              label: 'WB (K)',
              view: 'camerawheel',
              amount: 10,
              min: 2500,
              max: 10000,
              step: 100,
            });
        } catch (e) { console.warn('CameraWheel plugin missing?', e); }

        // Camera Line Controls
        try {
            const cameraLines = cameraPage.addFolder({ title: '⎯ Camera Lines', expanded: true });
            
            // Shutter Speed Line
            cameraLines.addBinding(params, 'shutterSpeed', {
              label: 'Shutter',
              view: 'cameraline',
              min: 1/4000,
              max: 1,
              step: 0.001,
            });
        } catch (e) { console.warn('CameraLine plugin missing?', e); }

    } catch (e) {
        console.error('FrostTweakpane: Error building Page 3 (Camera):', e);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PAGE 4: MONITOR
    // ═══════════════════════════════════════════════════════════════════════════
    try {
        const monitorPage = tab.pages[3];

        // FPS Graph (Essentials)
        try {
            const graphs = monitorPage.addFolder({ title: '📊 FPS Graph', expanded: true });
            this.fpsGraph = graphs.addBlade({
              view: 'fpsgraph',
              label: 'FPS',
              rows: 2,
            });
        } catch (e) { console.warn('FPSGraph plugin missing?', e); }

        // Waveform Display
        try {
            const waveforms = monitorPage.addFolder({ title: '〰 Waveform', expanded: true });
            waveforms.addBinding(params, 'waveformData', {
              view: 'waveform',
              label: 'Audio',
            });
        } catch (e) { console.warn('Waveform plugin missing?', e); }

        // Value monitors
        const values = monitorPage.addFolder({ title: '📈 Values', expanded: true });
        values.addBinding(params, 'fps', {
          label: 'Frame Rate',
          readonly: true,
          format: (v) => `${v.toFixed(0)} fps`,
        });
        values.addBinding(params, 'time', {
          label: 'Time',
          readonly: true,
          format: (v) => `${v.toFixed(2)}s`,
        });
        values.addBinding(params, 'wave', {
          label: 'Wave',
          readonly: true,
          view: 'graph',
          min: -1,
          max: 1,
        });

        // Multiline monitor
        const logs = monitorPage.addFolder({ title: '📝 Log', expanded: true });
        logs.addBinding(this.logParams, 'log', {
          label: 'Output',
          readonly: true,
          multiline: true,
          rows: 3,
        });
    } catch (e) {
        console.error('FrostTweakpane: Error building Page 4 (Monitor):', e);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PAGE 5: PLUGINS
    // ═══════════════════════════════════════════════════════════════════════════
    try {
        const pluginsPage = tab.pages[4];

        // Infodump
        try {
            pluginsPage.addBlade({
                view: 'infodump',
                content: '# Plugins Loaded\n\n- **Essentials**: Active\n- **Camerakit**: Active\n- **Waveform**: Active\n- **Infodump**: Active\n- **Compact Kit**: Active\n- **Chromatic**: Active',
                markdown: true,
                border: true,
            });
        } catch (e) {
            console.warn('Infodump plugin not available:', e.message);
        }

        // Compact Kit (Split Layout)
        try {
            const split = pluginsPage.addFolder({ title: 'Compact Kit (Split)' });
            split.addBlade({
                view: 'split-layout',
                height: 100,
                children: [
                    { view: 'button', title: 'Left' },
                    { view: 'button', title: 'Right' },
                ]
            });
        } catch (e) {
            console.warn('Split Layout plugin not available:', e.message);
        }
    } catch (e) {
        console.error('FrostTweakpane: Error building Page 5 (Plugins):', e);
    }
  }

  _startLoop() {
    const startTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = startTime;

    const rafLoop = (now) => {
      frameCount++;
      if (now - lastFpsUpdate >= 500) {
        this.params.fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
        frameCount = 0;
        lastFpsUpdate = now;
      }
      this.rafId = requestAnimationFrame(rafLoop);
    };
    this.rafId = requestAnimationFrame(rafLoop);

    const updateLoop = () => {
      const now = performance.now();

      this.params.time = (now - startTime) / 1000;
      this.params.wave = Math.sin(this.params.time * 2);

      // Update waveform data with animated values
      this.params.waveformData = Array.from({ length: 64 }, (_, i) => {
        const phase = this.params.time * 3 + i * 0.15;
        return Math.sin(phase) * 0.3 + Math.sin(phase * 2.5) * 0.2 + 0.5;
      });

      // Update fallback performance monitor if present
      if (this.perfElements && this.perfMonitorData) {
        this.perfMonitorData.fps = this.params.fps;
        this.perfMonitorData.cpu = Math.max(0, Math.min(100, 40 + Math.sin(this.params.time * 1.5) * 20 + Math.random() * 10));
        this.perfMonitorData.gpu = Math.max(0, Math.min(100, 60 + Math.cos(this.params.time * 1.2) * 15 + Math.random() * 8));
        this.perfMonitorData.mem = Math.max(0, Math.min(100, 65 + Math.sin(this.params.time * 0.8) * 10 + Math.random() * 5));
        this._updatePerformanceMonitor();
      }

      // FPS graph begin/end
      if (this.fpsGraph && this.fpsGraph.begin) this.fpsGraph.begin();
      if (this.fpsGraph && this.fpsGraph.end) this.fpsGraph.end();

      this.pane.refresh();
    };

    this.intervalId = setInterval(updateLoop, 50);
  }

  dispose() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pane.dispose();
  }
}
