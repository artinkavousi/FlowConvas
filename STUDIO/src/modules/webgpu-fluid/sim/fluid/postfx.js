/**
 * Post-Processing Effects — Film grain, vignette, tone mapping, color grading, motion blur.
 *
 * All functions return TSL node expressions for inline compositing
 * within the display pass (no separate render passes needed).
 */

import { Vector2, Vector3 } from 'three/webgpu';
import {
    abs,
    clamp,
    dot,
    exp,
    float,
    Fn,
    fract,
    length,
    log2,
    max,
    min,
    mix,
    pow,
    select,
    sin,
    smoothstep,
    uniform,
    vec2,
    vec3,
    vec4
} from 'three/tsl';

// ─── Uniform factory ─────────────────────────────────────────────────────────

export function createPostFXUniforms() {
    return {
        filmGrain: uniform(0),
        filmGrainSpeed: uniform(1),
        vignette: uniform(0),
        vignetteRadius: uniform(0.85),
        motionBlur: uniform(0),
        toneMapping: uniform(1),         // 0=none, 1=reinhard, 2=aces, 3=uncharted2, 4=agx
        lift: uniform(new Vector3(0, 0, 0)),
        gamma: uniform(new Vector3(1, 1, 1)),
        gain: uniform(new Vector3(1, 1, 1)),
        time: uniform(0)
    };
}

// ─── Update from config ──────────────────────────────────────────────────────

const TONE_MAP_IDS = { none: 0, reinhard: 1, aces: 2, uncharted2: 3, agx: 4 };

export function updatePostFXUniforms(uniforms, config, time) {
    uniforms.filmGrain.value = config.FILM_GRAIN;
    uniforms.filmGrainSpeed.value = config.FILM_GRAIN_SPEED;
    uniforms.vignette.value = config.VIGNETTE;
    uniforms.vignetteRadius.value = config.VIGNETTE_RADIUS;
    uniforms.motionBlur.value = config.MOTION_BLUR;
    uniforms.toneMapping.value = TONE_MAP_IDS[config.TONE_MAPPING] ?? 1;
    uniforms.lift.value.set(config.LIFT.r, config.LIFT.g, config.LIFT.b);
    uniforms.gamma.value.set(config.GAMMA.r, config.GAMMA.g, config.GAMMA.b);
    uniforms.gain.value.set(config.GAIN.r, config.GAIN.g, config.GAIN.b);
    uniforms.time.value = time;
}

// ─── Film Grain ──────────────────────────────────────────────────────────────

/**
 * Animated film grain noise overlay.
 *
 * @param {Node} color - vec3 input color
 * @param {Node} st - vec2 UV coordinate
 * @param {Node} intensity - grain strength
 * @param {Node} time - animation time
 * @param {Node} speed - animation speed
 * @returns {Node} vec3 color with grain applied
 */
export function applyFilmGrain(color, st, intensity, time, speed) {
    // Hash-based noise: fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453)
    const animatedSt = st.add(vec2(time.mul(speed).mul(0.1), time.mul(speed).mul(0.07)));
    const noise = fract(sin(dot(animatedSt, vec2(12.9898, 78.233))).mul(43758.5453));
    const grain = noise.sub(0.5).mul(intensity).mul(0.15);

    return max(color.add(vec3(grain)), vec3(0));
}

// ─── Vignette ────────────────────────────────────────────────────────────────

/**
 * Darkened edges vignette effect.
 *
 * @param {Node} color - vec3 input color
 * @param {Node} st - vec2 UV coordinate
 * @param {Node} intensity - vignette strength
 * @param {Node} radius - vignette radius (larger = less vignette)
 * @returns {Node} vec3 color with vignette
 */
export function applyVignette(color, st, intensity, radius) {
    const centered = st.sub(0.5);
    const dist = length(centered);
    const vignetteFactor = smoothstep(radius, radius.sub(float(0.4)), dist);
    const vignetteAmount = mix(float(1), vignetteFactor, intensity);

    return color.mul(vignetteAmount);
}

// ─── Tone Mapping ────────────────────────────────────────────────────────────

/**
 * Reinhard tone mapping.
 */
function reinhardTonemap(color) {
    return color.div(vec3(1).add(color));
}

/**
 * ACES Filmic tone mapping (simplified fit by Krzysztof Narkowicz).
 */
function acesTonemap(color) {
    const a = float(2.51);
    const b = float(0.03);
    const c = float(2.43);
    const d = float(0.59);
    const e = float(0.14);

    return clamp(
        color.mul(color.mul(a).add(b)).div(color.mul(color.mul(c).add(d)).add(e)),
        0, 1
    );
}

/**
 * Uncharted 2 tone mapping (John Hable).
 */
function uncharted2Tonemap(color) {
    const A = float(0.15);
    const B = float(0.50);
    const C = float(0.10);
    const D = float(0.20);
    const E = float(0.02);
    const F = float(0.30);

    const mapped = color.mul(A).add(C.mul(B)).mul(color).add(D.mul(E));
    const denom = color.mul(A).add(B).mul(color).add(D.mul(F));

    return mapped.div(max(denom, vec3(0.001))).sub(E.div(F));
}

/**
 * AgX tone mapping (simplified approximation).
 */
function agxTonemap(color) {
    // AgX uses a log-space encoding before applying a sigmoid
    const logColor = max(color, vec3(0.000001));
    const encoded = log2(logColor).mul(0.18).add(0.5);
    const clamped = clamp(encoded, 0, 1);

    // Sigmoid curve (punchy, preserves saturation)
    return clamped.mul(clamped).mul(float(3).sub(clamped.mul(2)));
}

/**
 * Apply selected tone mapping operator.
 *
 * @param {Node} color - vec3 HDR color
 * @param {Node} mode - tone mapping mode index
 * @returns {Node} vec3 LDR color
 */
export function applyToneMapping(color, mode) {
    const none = color;
    const reinhard = reinhardTonemap(color);
    const aces = acesTonemap(color);
    const uncharted = uncharted2Tonemap(color);
    const agx = agxTonemap(color);

    return select(mode.greaterThan(3.5), agx,
        select(mode.greaterThan(2.5), uncharted,
            select(mode.greaterThan(1.5), aces,
                select(mode.greaterThan(0.5), reinhard,
                    none
                )
            )
        )
    );
}

// ─── Color Grading (Lift-Gamma-Gain) ─────────────────────────────────────────

/**
 * ASC-CDL inspired lift-gamma-gain color grading.
 *
 * Lift: offsets shadows
 * Gamma: power curve on midtones
 * Gain: multiplier on highlights
 *
 * @param {Node} color - vec3 input
 * @param {Node} lift - vec3 shadow offset
 * @param {Node} gamma - vec3 midtone power
 * @param {Node} gain - vec3 highlight multiplier
 * @returns {Node} vec3 graded color
 */
export function applyColorGrading(color, lift, gamma, gain) {
    // CDL formula: out = (in * gain + lift) ^ (1/gamma)
    const lifted = color.mul(gain).add(lift);
    const safeGamma = max(gamma, vec3(0.001));
    const graded = pow(max(lifted, vec3(1e-6)), vec3(1).div(safeGamma));

    return graded;
}

// ─── Full Post-FX Chain ──────────────────────────────────────────────────────

/**
 * Apply all post-processing effects in order.
 * Call this as the final step before output in the display shader.
 *
 * @param {Node} color - vec3 composited color (after shading + bloom + sunrays)
 * @param {Node} st - vec2 UV coordinate
 * @param {Object} pfx - postfx uniforms from createPostFXUniforms()
 * @returns {Node} vec3 final color
 */
export function applyPostFXChain(color, st, pfx) {
    // 1. Color grading
    let result = applyColorGrading(color, pfx.lift, pfx.gamma, pfx.gain);

    // 2. Tone mapping
    result = applyToneMapping(result, pfx.toneMapping);

    // 3. Vignette
    result = select(pfx.vignette.greaterThan(0.001),
        applyVignette(result, st, pfx.vignette, pfx.vignetteRadius),
        result
    );

    // 4. Film grain
    result = select(pfx.filmGrain.greaterThan(0.001),
        applyFilmGrain(result, st, pfx.filmGrain, pfx.time, pfx.filmGrainSpeed),
        result
    );

    return result;
}
