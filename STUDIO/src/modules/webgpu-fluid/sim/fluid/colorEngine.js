import { Color, Vector3 } from 'three/webgpu';
import {
    abs,
    and,
    clamp,
    cos,
    dot,
    float,
    Fn,
    fract,
    length,
    max,
    min,
    mix,
    pow,
    select,
    smoothstep,
    uniform,
    vec3
} from 'three/tsl';

// ─── Color mode index mapping ────────────────────────────────────────────────

const COLOR_MODE_IDS = {
    single: 0,
    dual: 1,
    gradient: 2,
    multiStop: 3,
    rainbow: 4,
    velocity: 5,
    temperature: 6,
    age: 7,
    ramp: 8
};

export function getColorModeIndex(mode) {
    return COLOR_MODE_IDS[mode] ?? 2;
}

// ─── Uniform factory ─────────────────────────────────────────────────────────

export function createColorUniforms() {
    return {
        colorMode: uniform(2),

        // Single / Dual
        singleColor: uniform(new Color(0x46dcff)),
        secondaryColor: uniform(new Color(0xff5cbe)),

        // Gradient (legacy 3-stop) — handled by existing paletteA/B/C uniforms

        // Multi-stop (up to 8 stops)
        stopColors: Array.from({ length: 8 }, () => uniform(new Vector3(0, 0, 0))),
        stopPositions: Array.from({ length: 8 }, (_, i) => uniform(i / 7)),
        stopCount: uniform(5),

        // Rainbow
        rainbowSpeed: uniform(0.12),
        rainbowRange: uniform(0.85),
        hueShift: uniform(0),

        // Velocity-mapped
        velocityColorLow: uniform(new Color(0x0a1450)),
        velocityColorMid: uniform(new Color(0x32c8dc)),
        velocityColorHigh: uniform(new Color(0xff3c1e)),

        // Temperature-mapped
        tempColorCold: uniform(new Color(0x143cff)),
        tempColorHot: uniform(new Color(0xff500a)),

        // Age-mapped
        ageColorYoung: uniform(new Color(0xffffff)),
        ageColorOld: uniform(new Color(0x280a05)),
        ageAmount: uniform(0),

        // Mix
        colorSourceMix: uniform(0.5)
    };
}

// ─── Update uniforms from config ─────────────────────────────────────────────

export function updateColorUniforms(uniforms, config) {
    uniforms.colorMode.value = getColorModeIndex(config.COLOR_MODE);

    uniforms.singleColor.value.setRGB(
        config.SINGLE_COLOR.r / 255,
        config.SINGLE_COLOR.g / 255,
        config.SINGLE_COLOR.b / 255
    );
    uniforms.secondaryColor.value.setRGB(
        config.SECONDARY_COLOR.r / 255,
        config.SECONDARY_COLOR.g / 255,
        config.SECONDARY_COLOR.b / 255
    );

    // Multi-stop
    const stops = config.COLOR_STOPS || [];
    const count = Math.min(config.COLOR_BAND_COUNT || stops.length, stops.length, 8);
    uniforms.stopCount.value = count;

    for (let i = 0; i < 8; i += 1) {
        if (i < count) {
            const stop = stops[i];
            uniforms.stopColors[i].value.set(
                stop.color.r / 255,
                stop.color.g / 255,
                stop.color.b / 255
            );
            uniforms.stopPositions[i].value = stop.position;
        }
    }

    uniforms.rainbowSpeed.value = config.RAINBOW_SPEED;
    uniforms.rainbowRange.value = config.RAINBOW_RANGE;
    uniforms.hueShift.value = config.HUE_SHIFT;

    uniforms.velocityColorLow.value.setRGB(
        config.VELOCITY_COLOR_LOW.r / 255,
        config.VELOCITY_COLOR_LOW.g / 255,
        config.VELOCITY_COLOR_LOW.b / 255
    );
    uniforms.velocityColorMid.value.setRGB(
        config.VELOCITY_COLOR_MID.r / 255,
        config.VELOCITY_COLOR_MID.g / 255,
        config.VELOCITY_COLOR_MID.b / 255
    );
    uniforms.velocityColorHigh.value.setRGB(
        config.VELOCITY_COLOR_HIGH.r / 255,
        config.VELOCITY_COLOR_HIGH.g / 255,
        config.VELOCITY_COLOR_HIGH.b / 255
    );

    uniforms.tempColorCold.value.setRGB(
        config.TEMP_COLOR_COLD.r / 255,
        config.TEMP_COLOR_COLD.g / 255,
        config.TEMP_COLOR_COLD.b / 255
    );
    uniforms.tempColorHot.value.setRGB(
        config.TEMP_COLOR_HOT.r / 255,
        config.TEMP_COLOR_HOT.g / 255,
        config.TEMP_COLOR_HOT.b / 255
    );

    uniforms.ageColorYoung.value.setRGB(
        config.AGE_COLOR_YOUNG.r / 255,
        config.AGE_COLOR_YOUNG.g / 255,
        config.AGE_COLOR_YOUNG.b / 255
    );
    uniforms.ageColorOld.value.setRGB(
        config.AGE_COLOR_OLD.r / 255,
        config.AGE_COLOR_OLD.g / 255,
        config.AGE_COLOR_OLD.b / 255
    );
    uniforms.ageAmount.value = config.AGE_AMOUNT;

    uniforms.colorSourceMix.value = config.COLOR_SOURCE_MIX;
}

// ─── TSL color mode functions ────────────────────────────────────────────────

/**
 * HSL to RGB conversion in TSL (Hue-Saturation-Lightness → RGB).
 * Used by rainbow mode.
 */
function hslToRgb(h, s, l) {
    const c = s.mul(float(1).sub(abs(l.mul(2).sub(1))));
    const x = c.mul(float(1).sub(abs(fract(h.mul(6)).mul(2).sub(1))));
    const m = l.sub(c.mul(0.5));
    const h6 = fract(h).mul(6);

    // Piecewise RGB selection via smoothstep blending
    const r = clamp(abs(h6.sub(3)).sub(1), 0, 1);
    const g = clamp(float(2).sub(abs(h6.sub(2))), 0, 1);
    const b = clamp(float(2).sub(abs(h6.sub(4))), 0, 1);

    return vec3(
        r.mul(c).add(m),
        g.mul(c).add(m),
        b.mul(c).add(m)
    );
}

// ─── TSL Oklab Color Space Functions ───────────────────────────────────────────

function linearToOklab(c) {
    const l = c.x.mul(0.4122214708).add(c.y.mul(0.5363325363)).add(c.z.mul(0.0514459929));
    const m = c.x.mul(0.2119034982).add(c.y.mul(0.6806995451)).add(c.z.mul(0.1073969566));
    const s = c.x.mul(0.0883024619).add(c.y.mul(0.2817188376)).add(c.z.mul(0.6299787005));

    const l_ = pow(max(l, 1e-6), 1.0 / 3.0);
    const m_ = pow(max(m, 1e-6), 1.0 / 3.0);
    const s_ = pow(max(s, 1e-6), 1.0 / 3.0);

    return vec3(
        l_.mul(0.2104542553).add(m_.mul(0.7936177850)).sub(s_.mul(0.0040720468)),
        l_.mul(1.9779984951).sub(m_.mul(2.4285922050)).add(s_.mul(0.4505937099)),
        l_.mul(0.0259040371).add(m_.mul(0.7827717662)).sub(s_.mul(0.8086757660))
    );
}

function oklabToLinear(c) {
    const l_ = c.x.add(c.y.mul(0.3963377774)).add(c.z.mul(0.2158037573));
    const m_ = c.x.sub(c.y.mul(0.1055613458)).sub(c.z.mul(0.0638541728));
    const s_ = c.x.sub(c.y.mul(0.0894841775)).sub(c.z.mul(1.2914855480));

    const l = l_.mul(l_).mul(l_);
    const m = m_.mul(m_).mul(m_);
    const s = s_.mul(s_).mul(s_);

    return vec3(
        l.mul(4.0767416621).sub(m.mul(3.3077115913)).add(s.mul(0.2309699292)),
        l.mul(-1.2684380046).add(m.mul(2.6097574011)).sub(s.mul(0.3413193965)),
        l.mul(-0.0041960863).sub(m.mul(0.7034186147)).add(s.mul(1.7076147010))
    );
}

function mixOklab(colorA, colorB, t) {
    const okA = linearToOklab(colorA);
    const okB = linearToOklab(colorB);
    const mixed = mix(okA, okB, t);
    return max(oklabToLinear(mixed), vec3(0));
}

/**
 * Resolve the color node dynamically.
 * Returns a TSL expression node representing the resolved vec3 color.
 */
export function resolveColor(dyeColor, density, speed, time, u, paletteUniforms) {
    const mode = u.colorMode;

    // ── Single ──
    const singleResult = u.singleColor.mul(density.add(0.08)).toVar();

    // ── Dual ──
    const dualResult = mixOklab(u.singleColor, u.secondaryColor, density).mul(density.add(0.08)).toVar();

    // ── Gradient (3-stop, legacy) ──
    const lowRamp = mixOklab(paletteUniforms.paletteA, paletteUniforms.paletteB, density.mul(2));
    const highRamp = mixOklab(paletteUniforms.paletteB, paletteUniforms.paletteC, density.sub(0.5).mul(2));
    const gradientResult = select(density.lessThan(0.5), lowRamp, highRamp).mul(density.add(0.08)).toVar();

    // ── Multi-stop gradient ──
    const multiStopResult = buildMultiStopGradient(u, density).toVar();

    // ── Rainbow ──
    const hue = fract(time.mul(u.rainbowSpeed).add(density.mul(u.rainbowRange)).add(u.hueShift.div(360)));
    const rainbowResult = hslToRgb(hue, float(0.9), float(0.55)).mul(density.add(0.08)).toVar();

    // ── Velocity-mapped ──
    const speedNorm = clamp(speed.mul(0.005), 0, 1);
    const velLow = mixOklab(u.velocityColorLow, u.velocityColorMid, speedNorm.mul(2));
    const velHigh = mixOklab(u.velocityColorMid, u.velocityColorHigh, speedNorm.sub(0.5).mul(2));
    const velocityResult = select(speedNorm.lessThan(0.5), velLow, velHigh).mul(density.add(0.08)).toVar();

    // ── Temperature-mapped (uses density as proxy if no temp field) ──
    const tempResult = mixOklab(u.tempColorCold, u.tempColorHot, density).mul(density.add(0.08)).toVar();

    // ── Age-mapped ──
    const ageProxy = mix(float(1).sub(density), fract(time.mul(0.04).add(density.mul(0.37))), clamp(u.ageAmount, 0, 1));
    const ageResult = mixOklab(u.ageColorYoung, u.ageColorOld, ageProxy).mul(density.add(0.08)).toVar();

    // ── Ramp (falls back to gradient for now) ──
    const rampResult = gradientResult;

    // ── Dispatch ──
    // We chain select() from highest mode down to 0
    const result = select(mode.greaterThan(7.5), rampResult,       // 8: ramp
        select(mode.greaterThan(6.5), ageResult,                    // 7: age
            select(mode.greaterThan(5.5), tempResult,               // 6: temperature
                select(mode.greaterThan(4.5), velocityResult,       // 5: velocity
                    select(mode.greaterThan(3.5), rainbowResult,    // 4: rainbow
                        select(mode.greaterThan(2.5), multiStopResult, // 3: multiStop
                            select(mode.greaterThan(1.5), gradientResult, // 2: gradient
                                select(mode.greaterThan(0.5), dualResult, // 1: dual
                                    singleResult                    // 0: single
                                )
                            )
                        )
                    )
                )
            )
        )
    );

    // Mix with original dye color based on colorSourceMix
    return mix(result, dyeColor, u.colorSourceMix);
}

// ─── Internal: Multi-stop gradient builder ───────────────────────────────────

function buildMultiStopGradient(u, density) {
    // Start with first stop color
    let result = u.stopColors[0];

    // Cascade through stops 1–7
    for (let i = 1; i < 8; i += 1) {
        const prev = u.stopPositions[i - 1];
        const curr = u.stopPositions[i];
        const range = max(curr.sub(prev), float(0.001));
        const t = clamp(density.sub(prev).div(range), 0, 1);
        const inRange = density.greaterThanEqual(prev);
        const withinCount = float(i).lessThan(u.stopCount);

        result = select(
            and(inRange, withinCount),
            mixOklab(u.stopColors[i - 1], u.stopColors[i], t),
            result
        );
    }

    return result.mul(density.add(0.08));
}
