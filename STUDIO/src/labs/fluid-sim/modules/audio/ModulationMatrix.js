// ModulationMatrix — routes audio sources to config targets, non-destructively.
//
// A route is plain data:
//   {
//     id: 'bass-to-bloom',
//     source: 'bands.bass'              // dot path into the AudioFrame
//             | 'loudness.aWeighted'
//             | 'spectral.centroid'
//             | 'beat.pulse' | 'beat.edge'
//             | 'onsets.<band>.value' | 'onsets.<band>.edge'
//             | 'flux'
//             | 'lfo[0]' | 'lfo[1]' ...      // primary LFO bank
//             | 'sah[0]' ...                  // sample-and-hold latches
//     target: 'BLOOM_INTENSITY' | 'GOD_RAY_SOURCE.x' | ...
//     mode:   'add' | 'mul' | 'replace' | 'bipolar'
//     range:  [lo, hi]                  // mapped output range (target units)
//     curve:  { type: 'pow', k: 1.3 }   // shapes 0..1 source value
//     attack: 18,   release: 220,       // ms, per-route envelope follower
//     gate:   0.05,                     // input gate
//     polarity: 1                       // -1 inverts
//     enabled: true,
//     mute: false, solo: false,
//     label: 'Bass → Bloom'
//   }
//
// Per frame the matrix:
//   1) caches the *current* base value of each affected target from config
//      (so that user edits made via GUI while audio is on stay live).
//   2) For each route: pull source, gate, curve, follower, range, polarity.
//   3) Apply per-route contribution in declared mode against the cached base.
//   4) Write the final value back into config.
//
// On disable() the matrix restores the cached base values once and clears.

import { applyCurve, EnvelopeFollower } from './Modulators.js';
import { getTarget } from './targetRegistry.js';

export class ModulationMatrix {
    constructor() {
        this.routes = [];
        this.followers = new Map();       // routeId -> EnvelopeFollower
        this.baseCache = new Map();       // targetId -> last frame base value
        this.contribCache = new Map();    // targetId -> [{ mode, value }]
        this.active = false;
        this.amount = 1.0;                // global wet/dry
        this.lastFrame = null;
    }

    setRoutes(routes) {
        this.routes = (routes || []).map((r, index) => normalizeRoute(r, index));
        // Drop followers whose routes are gone
        const ids = new Set(this.routes.map((r) => r.id));
        for (const key of [...this.followers.keys()]) {
            if (!ids.has(key)) this.followers.delete(key);
        }
        // Ensure every active route has a follower
        for (const route of this.routes) {
            if (!this.followers.has(route.id)) {
                this.followers.set(route.id, new EnvelopeFollower());
            }
        }
        this.lastFrame = null;
    }

    setAmount(value) {
        this.amount = Math.max(0, Math.min(2, value));
    }

    /**
     * Apply routes for the current frame.
     * @param {object} audioFrame   AudioFrame from FeatureExtractor + beat
     * @param {object} config       The live config object (mutated in place)
     * @param {object} extras       { lfos: [], sahs: [] } — modulators owned by AudioReactivity
     */
    update(audioFrame, config, extras, dt) {
        if (!audioFrame || this.routes.length === 0) {
            if (this.active) this.disable(config);
            return;
        }

        if (!this.active) {
            this.active = true;
        }

        const hasSoloed = this.routes.some((r) => r.solo);

        // 1) Rebuild base cache from config — this is non-destructive: any value
        // a route writes will be re-derived from config next frame, so manual
        // edits in the GUI immediately propagate.
        this.baseCache.clear();
        this.contribCache.clear();
        for (const route of this.routes) {
            if (!route.enabled || route.mute) continue;
            if (hasSoloed && !route.solo) continue;
            const target = getTarget(route.target);
            if (!target) continue;
            if (!this.baseCache.has(route.target)) {
                this.baseCache.set(route.target, numericOrFallback(target.get(config), 0));
                this.contribCache.set(route.target, []);
            }
        }

        // 2) Each route — compute its contribution
        for (const route of this.routes) {
            if (!route.enabled || route.mute) continue;
            if (hasSoloed && !route.solo) continue;
            const target = getTarget(route.target);
            if (!target) continue;
            const raw = resolveSource(audioFrame, extras, route.source);
            const gated = raw < route.gate ? 0 : (raw - route.gate) / Math.max(1 - route.gate, 1e-4);
            const curved = applyCurve(gated, route.curve);
            const follower = this.followers.get(route.id);
            const smoothed = follower.process(curved, dt, route.attack, route.release);
            const polarised = smoothed * route.polarity;
            const mapped = route.range[0] + (route.range[1] - route.range[0]) * polarised;
            const value = mapped * this.amount;
            this.contribCache.get(route.target).push({ mode: route.mode, value });
        }

        // 3) Compose contributions per target and write back to config.
        for (const [targetId, contribs] of this.contribCache.entries()) {
            const target = getTarget(targetId);
            const base = this.baseCache.get(targetId);
            let value = base;
            let hasReplace = false;
            // 'replace' overrides everything; 'mul' multiplies running; 'add' sums; 'bipolar' adds centred
            for (const c of contribs) {
                if (c.mode === 'replace') {
                    value = c.value;
                    hasReplace = true;
                }
            }
            if (!hasReplace) {
                for (const c of contribs) {
                    if (c.mode === 'add') value = value + c.value;
                    else if (c.mode === 'mul') value = value * (1 + c.value);
                    else if (c.mode === 'bipolar') value = value + (c.value - (target.range[0] + target.range[1]) * 0.5);
                }
            }
            // Clamp to target's declared range to avoid runaway values.
            const [lo, hi] = target.range;
            if (value < lo) value = lo;
            if (value > hi) value = hi;
            target.set(config, value);
        }

        this.lastFrame = audioFrame;
        document.documentElement.dataset.fluidAudioMatrixActive = String(this.routes.filter((r) => r.enabled && !r.mute).length);
    }

    /** Snapshot of active routes with their latest follower output.
     *  Used by the AudioPanel to draw live route-activity bars.
     *  Returns: [{ id, label, source, target, output (0..1+), enabled, mute, solo }] */
    getRouteActivity() {
        const out = [];
        for (const route of this.routes) {
            const follower = this.followers.get(route.id);
            out.push({
                id: route.id,
                label: route.label,
                source: route.source,
                target: route.target,
                mode: route.mode,
                output: follower ? follower.value : 0,
                enabled: route.enabled,
                mute: route.mute,
                solo: route.solo
            });
        }
        return out;
    }

    /** Restore cached base values once when disabling. */
    disable(config) {
        if (!this.active) return;
        for (const [targetId, base] of this.baseCache.entries()) {
            const target = getTarget(targetId);
            if (target && Number.isFinite(base)) target.set(config, base);
        }
        this.baseCache.clear();
        this.contribCache.clear();
        for (const follower of this.followers.values()) follower.reset(0);
        this.active = false;
        document.documentElement.dataset.fluidAudioMatrixActive = '0';
    }
}

function normalizeRoute(r, index) {
    return {
        id: r.id || `route-${index + 1}`,
        label: r.label || `${r.source} → ${r.target}`,
        source: r.source,
        target: r.target,
        mode: r.mode || 'add',
        range: Array.isArray(r.range) && r.range.length === 2 ? r.range : [0, 1],
        curve: r.curve || { type: 'linear' },
        attack: Number.isFinite(r.attack) ? r.attack : 18,
        release: Number.isFinite(r.release) ? r.release : 180,
        gate: Number.isFinite(r.gate) ? r.gate : 0,
        polarity: r.polarity === -1 ? -1 : 1,
        enabled: r.enabled !== false,
        mute: !!r.mute,
        solo: !!r.solo
    };
}

function resolveSource(frame, extras, path) {
    if (!path) return 0;
    // Special shorthands
    if (path === 'beat.pulse') return frame.beat?.pulse || 0;
    if (path === 'beat.edge')  return frame.beat?.edge ? 1 : 0;
    if (path === 'beat.phase') return frame.beat?.phase || 0;
    if (path === 'beat.barPhase') return frame.beat?.barPhase || 0;

    if (path.startsWith('lfo[')) {
        const i = parseInt(path.slice(4), 10);
        const lfo = extras.lfos?.[i];
        // LFO outputs -1..1; map to 0..1 here so the matrix range is meaningful.
        return lfo ? (lfo.lastValue + 1) * 0.5 : 0;
    }
    if (path.startsWith('sah[')) {
        const i = parseInt(path.slice(4), 10);
        return extras.sahs?.[i]?.value || 0;
    }

    // Dot-path resolve on the frame
    const parts = path.split('.');
    let node = frame;
    for (const p of parts) {
        if (node == null) return 0;
        node = node[p];
    }
    if (typeof node === 'boolean') return node ? 1 : 0;
    return Number.isFinite(node) ? node : 0;
}

function numericOrFallback(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
}
