import { Color } from 'three/webgpu';
import { flattenSvgPath } from './sampling/svgSampler.js';
import { loadImage } from './sampling/imageSampler.js';
// EmitterTypes registry — single import populates it with all built-in shapes.
import {
    getType as getEmitterType,
    getTypeOptions as getEmitterTypeOptions
} from './EmitterTypes/index.js';

// Continuous-flow model (v0.6 clean rewrite).
//
// Every emitter lays down a steady ribbon/sheet of fluid along its WHOLE form
// each frame — no triggers, no bursts, no modulation routes, no per-emitter
// sequencing. Just: a shape, a flow rate, a speed, a colour, and one built-in
// audio knob. Each shape's sampleSplats(emitter, env) returns the splats that
// cover its form for this frame; the orchestrator scales them by flow + audio.

const AUDIO_ATTACK = 0.08;   // s — envelope smoothing so audio doesn't jitter
const AUDIO_RELEASE = 0.18;  // s

export class EmitterSystem {
    constructor() {
        this.emitters = [];
        this.selectedId = '';
    }

    setEmitters(definitions) {
        this.emitters = (definitions || []).map((d, i) => normalizeEmitter(d, i));
        for (const e of this.emitters) realizeEmitterSamples(e);
        this.selectedId = this.emitters[0]?.id || '';
        this.writeDebugState();
    }

    // Groups were removed in the clean rewrite; keep a no-op so older preset
    // loaders that call setGroups don't throw.
    setGroups() {}
    serializeGroups() { return []; }

    addEmitter(type = 'point') {
        const defaults = getEmitterType(type)?.defaults || {};
        const emitter = normalizeEmitter({
            id: uniqueEmitterId(type, this.emitters),
            type,
            label: `${capitalize(type)} ${this.emitters.length + 1}`,
            x: 0.5, y: 0.5,
            x2: 0.7, y2: 0.5,
            x3: type === 'spline' ? 0.34 : 0.5,
            y3: type === 'spline' ? 0.72 : 0.5,
            x4: type === 'spline' ? 0.82 : 0.7,
            y4: type === 'spline' ? 0.32 : 0.5,
            points: getDefaultPoints(type),
            text: type === 'text' ? 'FLUID' : undefined,
            width: type === 'text' ? 0.46 : type === 'image' ? 0.36 : 0.28,
            height: type === 'text' ? 0.16 : type === 'image' ? 0.24 : 0.18,
            color: type === 'area' ? '#7dd3fc' : '#55ddff',
            ...defaults
        }, this.emitters.length);
        realizeEmitterSamples(emitter);
        this.emitters.push(emitter);
        this.selectedId = emitter.id;
        this.writeDebugState();
        return emitter;
    }

    duplicateSelected({ mirrored = false } = {}) {
        const src = this.getSelected();
        if (!src) return null;
        const clone = normalizeEmitter({
            ...serializeEmitter(src),
            id: uniqueEmitterId(`${src.type}-copy`, this.emitters),
            label: `${src.label} copy`,
            x: mirrored ? 1 - src.x : clamp01(src.x + 0.04), y: src.y,
            x2: mirrored ? 1 - src.x2 : clamp01(src.x2 + 0.04), y2: src.y2,
            x3: mirrored ? 1 - src.x3 : clamp01(src.x3 + 0.04), y3: src.y3,
            x4: mirrored ? 1 - src.x4 : clamp01(src.x4 + 0.04), y4: src.y4,
            points: src.points?.map((p) => ({ x: mirrored ? 1 - p.x : clamp01(p.x + 0.04), y: p.y }))
        }, this.emitters.length);
        realizeEmitterSamples(clone);
        this.emitters.push(clone);
        this.selectedId = clone.id;
        this.writeDebugState();
        return clone;
    }

    removeSelected() {
        if (this.emitters.length <= 1) return false;
        const index = this.emitters.findIndex((e) => e.id === this.selectedId);
        if (index < 0) return false;
        this.emitters.splice(index, 1);
        this.selectedId = this.emitters[Math.min(index, this.emitters.length - 1)]?.id || '';
        this.writeDebugState();
        return true;
    }

    setSelected(id) {
        if (this.emitters.some((e) => e.id === id)) {
            this.selectedId = id;
            this.writeDebugState();
        }
    }

    getSelected() {
        return this.emitters.find((e) => e.id === this.selectedId) || this.emitters[0] || null;
    }

    updateEmitter(id, patch) {
        const emitter = this.emitters.find((e) => e.id === id);
        if (!emitter) return;
        if (Number.isInteger(patch.pointIndex) && patch.point) {
            const points = [...emitter.points];
            if (points[patch.pointIndex]) {
                points[patch.pointIndex] = { x: clamp01(patch.point.x), y: clamp01(patch.point.y) };
                patch = { points };
            }
        }
        Object.assign(emitter, patch);
        if (patch.type) Object.assign(emitter, normalizeEmitter(emitter, this.emitters.indexOf(emitter)));
        if (patch.type || patch.svgPath != null || patch.imageDataUrl != null
            || patch.text != null || patch.useGlyphRaster != null
            || patch.width != null || patch.height != null) {
            realizeEmitterSamples(emitter);
        }
        this.writeDebugState();
    }

    resolveFrame({ dt, config, audio }) {
        if (!config.EMITTERS_ENABLED || this.emitters.length === 0) return [];

        const master = Math.max(0, config.EMITTER_INTENSITY);
        const audioOn = !!config.AUDIO_ENABLED && !!audio;
        const audioGain = config.AUDIO_GAIN ?? 1;
        const time = performance.now() * 0.001;
        const splats = [];
        let total = 0;

        for (const emitter of this.emitters) {
            if (!emitter.enabled) continue;

            // Native audio: one smoothed band value pumps flow + speed + size.
            let aMul = 1;
            if (audioOn && emitter.audioAmount > 0) {
                const band = readBand(audio, emitter.audioBand) * audioGain;
                const target = clamp01(band);
                const tau = target > emitter._audioEnv ? AUDIO_ATTACK : AUDIO_RELEASE;
                const k = 1 - Math.exp(-dt / Math.max(0.001, tau));
                emitter._audioEnv += (target - emitter._audioEnv) * k;
                aMul = 1 + emitter.audioAmount * emitter._audioEnv * 2;
            } else {
                emitter._audioEnv *= 0.9;
            }

            const flow = Math.max(0, emitter.flow) * aMul;
            if (flow <= 0) continue;

            // Continuous emission deposits dye every frame along the whole form,
            // so per-splat intensity must be small (a calm steady ribbon, not a
            // blow-out). Frame-rate normalised to ~60fps so it looks the same
            // regardless of refresh rate. Tune the overall brightness with the
            // emitter's Flow knob or the global Master flow.
            const dtNorm = Math.min(2, Math.max(0.2, dt * 60));
            const env = {
                // Dye per splat — kept small so continuous deposition settles
                // to a clean steady ribbon (dtNorm keeps it frame-rate independent).
                intensity: master * flow * 0.026 * dtNorm,
                // force is a 0-50 user knob. ×12 keeps injected velocity very
                // gentle so the fluid's own vorticity does the swirling (settled,
                // organic, drifting flow) instead of directional jets. Speed 5 ≈
                // 60 px/frame; the slider still reaches strong values at the top.
                speed: emitter.force * 12 * aMul,
                density: clampNum(flow, 0.1, 3),            // point-count multiplier
                radius: emitter.radius * (1 + emitter.audioAmount * emitter._audioEnv * 0.4),
                time, dt
            };

            const entry = getEmitterType(emitter.type);
            const list = (entry && typeof entry.sampleSplats === 'function')
                ? entry.sampleSplats(emitter, env)
                : [];
            for (let i = 0; i < list.length; i += 1) {
                splats.push(list[i]);
                total += 1;
            }
        }

        document.documentElement.dataset.fluidEmitterSplats = String(total);
        return splats;
    }

    writeDebugState() {
        document.documentElement.dataset.fluidEmitterCount = String(this.emitters.length);
        document.documentElement.dataset.fluidSelectedEmitter = this.selectedId;
    }
}

// --- model ----------------------------------------------------------------

function normalizeEmitter(def, index) {
    const color = def.color?.isColor ? def.color.clone() : new Color(def.color || '#55ddff');
    const id = def.id || `emitter-${index + 1}`;
    const type = def.type || 'point';
    return {
        id,
        type,
        label: def.label || `Emitter ${index + 1}`,
        enabled: def.enabled !== false,
        // geometry
        x: clamp01(def.x ?? 0.5),
        y: clamp01(def.y ?? 0.5),
        x2: clamp01(def.x2 ?? def.x ?? 0.7),
        y2: clamp01(def.y2 ?? def.y ?? 0.5),
        x3: clamp01(def.x3 ?? 0.35),
        y3: clamp01(def.y3 ?? 0.7),
        x4: clamp01(def.x4 ?? def.x2 ?? 0.65),
        y4: clamp01(def.y4 ?? def.y2 ?? 0.5),
        width: clamp01(def.width ?? 0.3),
        height: clamp01(def.height ?? 0.2),
        radius: clampNum(def.radius ?? 0.48, 0.01, 1.0),
        direction: def.direction ?? 0,
        segments: clampInt(def.segments ?? 28, 2, 64),
        points: normalizePoints(def.points),
        // emission essentials
        force: clampNum(def.force ?? 0.1, 0, 50),        // "Speed" — tiny push, fluid vorticity does the rest
        flow: clampNum(def.flow ?? 0.7, 0, 4),           // density / amount
        spread: clampNum(def.spread ?? 0.12, 0, 1),
        color,
        // shape content
        text: String(def.text || 'FLUID').slice(0, 24),
        useGlyphRaster: def.useGlyphRaster !== false,
        textSamples: clampInt(def.textSamples ?? 120, 8, 512),
        imageDataUrl: typeof def.imageDataUrl === 'string' ? def.imageDataUrl : null,
        imageThreshold: clamp01(def.imageThreshold ?? 0.18),
        imageSamples: clampInt(def.imageSamples ?? 220, 8, 1024),
        imageChannel: ['alpha', 'luma', 'r', 'g', 'b'].includes(def.imageChannel) ? def.imageChannel : 'luma',
        threshold: clamp01(def.threshold ?? 0.5),
        svgPath: typeof def.svgPath === 'string' ? def.svgPath : null,
        svgSamplesPerCurve: clampInt(def.svgSamplesPerCurve ?? 16, 4, 64),
        // native audio
        audioAmount: clampNum(def.audioAmount ?? 0, 0, 1),
        audioBand: ['bass', 'mid', 'treble', 'energy'].includes(def.audioBand) ? def.audioBand : 'bass',
        // transient
        _audioEnv: 0,
        _imageHandle: null
    };
}

function realizeEmitterSamples(emitter) {
    if (emitter.type === 'svg' && typeof emitter.svgPath === 'string' && emitter.svgPath.trim()) {
        try {
            const flat = flattenSvgPath(emitter.svgPath, { samplesPerCurve: emitter.svgSamplesPerCurve });
            if (flat.length >= 2) emitter.points = flat;
        } catch (error) {
            console.warn(`[Emitter] SVG flatten failed for ${emitter.id}:`, error?.message || error);
        }
    }
    if (emitter.type === 'image' && emitter.imageDataUrl && !emitter._imageHandle) {
        loadImage(emitter.imageDataUrl)
            .then((handle) => { emitter._imageHandle = handle; })
            .catch((error) => console.warn(`[Emitter] image load failed for ${emitter.id}:`, error?.message || error));
    }
}

export async function loadEmitterImage(emitter, srcOrFile) {
    const handle = await loadImage(srcOrFile);
    emitter._imageHandle = handle;
    if (srcOrFile instanceof Blob) {
        const reader = new FileReader();
        emitter.imageDataUrl = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(srcOrFile);
        });
    } else if (typeof srcOrFile === 'string') {
        emitter.imageDataUrl = srcOrFile;
    }
    return handle;
}

function serializeEmitter(emitter) {
    const { _audioEnv, _imageHandle, ...persistable } = emitter;
    return { ...persistable, color: `#${emitter.color.getHexString()}` };
}

// --- helpers --------------------------------------------------------------

function readBand(audio, band) {
    if (band === 'energy') return audio.energy || 0;
    return audio[band] || 0;
}

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
function clampNum(v, lo, hi) { return Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo)); }
function clampInt(v, lo, hi) { return Math.min(hi, Math.max(lo, Math.round(Number.isFinite(v) ? v : lo))); }

function normalizePoints(points) {
    const src = Array.isArray(points) && points.length >= 2 ? points : defaultBrushPoints();
    return src.slice(0, 16).map((p) => ({ x: clamp01(p.x ?? 0.5), y: clamp01(p.y ?? 0.5) }));
}

function getDefaultPoints(type) {
    if (type === 'brush') return defaultBrushPoints();
    if (type === 'vector') return defaultVectorPoints();
    if (type === 'svg') return defaultSvgPoints();
    return undefined;
}

function defaultBrushPoints() {
    return [{ x: 0.18, y: 0.38 }, { x: 0.36, y: 0.62 }, { x: 0.58, y: 0.42 }, { x: 0.8, y: 0.58 }];
}
function defaultVectorPoints() {
    return [{ x: 0.5, y: 0.75 }, { x: 0.72, y: 0.55 }, { x: 0.62, y: 0.28 }, { x: 0.38, y: 0.28 }, { x: 0.28, y: 0.55 }];
}
function defaultSvgPoints() {
    return [{ x: 0.2, y: 0.5 }, { x: 0.32, y: 0.7 }, { x: 0.48, y: 0.42 }, { x: 0.64, y: 0.66 }, { x: 0.8, y: 0.46 }];
}

function capitalize(v) { return v.charAt(0).toUpperCase() + v.slice(1); }

function uniqueEmitterId(prefix, emitters) {
    let i = emitters.length + 1;
    let id = `${prefix}-${i}`;
    while (emitters.some((e) => e.id === id)) { i += 1; id = `${prefix}-${i}`; }
    return id;
}

export { getEmitterTypeOptions };
