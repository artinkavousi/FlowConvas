/**
 * Material Models — PBR-inspired shading, Fresnel, normal mapping,
 * and specialized display mode functions for the fluid display pass.
 *
 * All functions return TSL node expressions.
 */

import { Vector2 } from 'three/webgpu';
import {
    abs,
    clamp,
    dot,
    exp,
    float,
    Fn,
    length,
    max,
    min,
    mix,
    normalize,
    pow,
    select,
    smoothstep,
    uniform,
    vec2,
    vec3
} from 'three/tsl';

// ─── Uniform factory ─────────────────────────────────────────────────────────

export function createMaterialUniforms() {
    return {
        roughness: uniform(0.62),
        specular: uniform(0.18),
        rimPower: uniform(0.22),
        rimColor: uniform(vec3(1, 1, 1)),
        shadowIntensity: uniform(0.2),
        emissive: uniform(0.35),
        lightDir: uniform(new Vector2(-0.35, 0.55)),
        fresnelPower: uniform(2.5),
        fresnelBias: uniform(0.1),
        normalStrength: uniform(1.0),
        envIntensity: uniform(0.3)
    };
}

// ─── Update from config ──────────────────────────────────────────────────────

export function updateMaterialUniforms(uniforms, config) {
    uniforms.roughness.value = config.MATERIAL_ROUGHNESS;
    uniforms.specular.value = config.MATERIAL_SPECULAR;
    uniforms.rimPower.value = config.MATERIAL_RIM;
    uniforms.shadowIntensity.value = config.MATERIAL_SHADOW;
    uniforms.emissive.value = config.MATERIAL_EMISSIVE;
    uniforms.lightDir.value.set(config.LIGHT_X, config.LIGHT_Y);
    uniforms.fresnelPower.value = config.FRESNEL_POWER;
    uniforms.fresnelBias.value = config.FRESNEL_BIAS;
    uniforms.normalStrength.value = config.NORMAL_STRENGTH;
    uniforms.envIntensity.value = config.ENV_INTENSITY;
}

// ─── Normal map from dye density ─────────────────────────────────────────────

/**
 * Compute surface normals from the dye field using a Sobel-like filter.
 * Returns a normalized vec3 normal.
 *
 * @param {Function} sampleFn - (coord) => vec4 dye sample
 * @param {Node} st - current UV
 * @param {Node} texelSize - vec2 pixel size
 * @param {Node} strength - normal map intensity
 */
export function computeNormal(sampleFn, st, texelSize, strength) {
    // 4-sample Central Difference (optimized to use half the texture lookups)
    const left = length(sampleFn(st.sub(vec2(texelSize.x, 0))).rgb);
    const right = length(sampleFn(st.add(vec2(texelSize.x, 0))).rgb);
    const top = length(sampleFn(st.add(vec2(0, texelSize.y))).rgb);
    const bottom = length(sampleFn(st.sub(vec2(0, texelSize.y))).rgb);

    // X gradient: right - left
    const dx = right.sub(left).mul(strength);
    // Y gradient: top - bottom
    const dy = top.sub(bottom).mul(strength);

    return normalize(vec3(
        dx.negate(),
        dy.negate(),
        float(0.02)
    ));
}

// ─── PBR-inspired shading ────────────────────────────────────────────────────

/**
 * Cook-Torrance inspired shading with GGX-like specular.
 * Simplified for real-time fluid rendering.
 *
 * @param {Node} normal - vec3 surface normal
 * @param {Node} lightDirUniform - vec2 light direction XY
 * @param {Node} roughness - scalar
 * @param {Node} specularIntensity - scalar
 * @param {Node} shadowIntensity - scalar
 */
export function pbrShading(normal, lightDirUniform, roughness, specularIntensity, shadowIntensity) {
    // Construct 3D light direction from 2D uniform
    const lightVec = normalize(vec3(lightDirUniform.x, lightDirUniform.y, float(0.65)));
    const viewVec = vec3(0, 0, 1);

    // Diffuse (Lambert with wrap for fake SSS)
    const wrap = float(0.4);
    const wrapDot = dot(normal, lightVec).add(wrap).div(float(1).add(wrap));
    const nDotL = max(dot(normal, lightVec), float(0));
    const diffuse = max(wrapDot, float(0));

    // Specular (Blinn-Phong approximation of GGX)
    const halfVec = normalize(lightVec.add(viewVec));
    const nDotH = max(dot(normal, halfVec), float(0));
    const roughSq = roughness.mul(roughness);
    const specPower = float(2).div(max(roughSq, float(0.001))).sub(2);
    const specHighlight = pow(nDotH, specPower).mul(specularIntensity);

    // Shadow term (soft self-shadowing)
    const shadow = smoothstep(float(0), float(0.3), nDotL).mul(float(1).sub(shadowIntensity)).add(shadowIntensity);

    // Fake Subsurface Scattering (Scatter at the terminator)
    const sss = smoothstep(float(-0.2), float(0.2), dot(normal, lightVec))
                .mul(smoothstep(float(0.4), float(0.0), dot(normal, lightVec)));

    return { diffuse, specular: specHighlight, shadow, sss };
}

// ─── Fresnel ─────────────────────────────────────────────────────────────────

/**
 * Schlick Fresnel approximation.
 *
 * @param {Node} normal - vec3 surface normal
 * @param {Node} power - fresnel exponent
 * @param {Node} bias - minimum fresnel value
 */
export function fresnelEffect(normal, power, bias) {
    const viewVec = vec3(0, 0, 1);
    const nDotV = max(dot(normal, viewVec), float(0));
    return bias.add(float(1).sub(bias).mul(pow(float(1).sub(nDotV), power)));
}

// ─── Rim Light ───────────────────────────────────────────────────────────────

/**
 * Edge glow / rim lighting effect.
 *
 * @param {Node} normal - vec3 surface normal
 * @param {Node} rimPower - rim width
 */
export function rimLight(normal, rimPower) {
    const viewVec = vec3(0, 0, 1);
    const nDotV = max(dot(normal, viewVec), float(0));
    return pow(float(1).sub(nDotV), float(3)).mul(rimPower);
}

// ─── Environment Reflection ──────────────────────────────────────────────────

/**
 * Fake environment reflection using the normal to derive a sky/horizon gradient.
 * No cubemap needed — generates a procedural sky dome.
 *
 * @param {Node} normal - vec3 surface normal
 * @param {Node} intensity - reflection intensity
 */
export function proceduralEnvReflection(normal, intensity) {
    // Map normal Y to sky gradient: dark at horizon, bright at zenith
    const sky = smoothstep(float(-0.3), float(0.8), normal.y);
    const horizon = smoothstep(float(0.1), float(-0.2), abs(normal.y));

    const skyColor = mix(
        vec3(0.02, 0.04, 0.12),   // deep space
        vec3(0.15, 0.25, 0.55),   // sky blue
        sky
    );
    const horizonGlow = vec3(0.35, 0.25, 0.15).mul(horizon);

    return skyColor.add(horizonGlow).mul(intensity);
}

// ─── Neon Glow Mode ──────────────────────────────────────────────────────────

/**
 * Neon display mode: emissive glow with edge detection.
 *
 * @param {Node} baseColor - vec3 input color
 * @param {Node} normal - vec3 surface normal
 * @param {Node} density - float dye density
 * @param {Node} emissiveStrength - float
 */
export function neonGlow(baseColor, normal, density, emissiveStrength) {
    const edgeFactor = float(1).sub(max(dot(normal, vec3(0, 0, 1)), float(0)));
    const glow = pow(edgeFactor, float(1.5)).mul(emissiveStrength);
    const brightened = baseColor.mul(float(1).add(glow.mul(3)));

    return brightened.mul(smoothstep(float(0.01), float(0.15), density));
}

// ─── Thermal Visualization ───────────────────────────────────────────────────

/**
 * False-color thermal imaging style.
 *
 * @param {Node} density - float dye density
 * @param {Node} speed - float velocity magnitude
 */
export function thermalVisualization(density, speed) {
    const heat = clamp(density.add(speed.mul(0.002)), 0, 1);

    // Classic thermal palette: black → blue → red → yellow → white
    const c0 = vec3(0, 0, 0);
    const c1 = vec3(0, 0, 0.6);
    const c2 = vec3(0.8, 0, 0);
    const c3 = vec3(1, 0.9, 0);
    const c4 = vec3(1, 1, 1);

    const seg1 = mix(c0, c1, clamp(heat.mul(4), 0, 1));
    const seg2 = mix(c1, c2, clamp(heat.sub(0.25).mul(4), 0, 1));
    const seg3 = mix(c2, c3, clamp(heat.sub(0.5).mul(4), 0, 1));
    const seg4 = mix(c3, c4, clamp(heat.sub(0.75).mul(4), 0, 1));

    return select(heat.lessThan(0.25), seg1,
        select(heat.lessThan(0.5), seg2,
            select(heat.lessThan(0.75), seg3, seg4)
        )
    );
}

// ─── Watercolor Effect ───────────────────────────────────────────────────────

/**
 * Watercolor paint-on-paper effect.
 * Darkens edges and softens color based on density.
 *
 * @param {Node} baseColor - vec3 input color
 * @param {Node} density - float dye density
 * @param {Node} normal - vec3 surface normal
 */
export function watercolorEffect(baseColor, density, normal) {
    // Edge darkening
    const edgeFactor = float(1).sub(max(dot(normal, vec3(0, 0, 1)), float(0)));
    const edgeDarken = float(1).sub(pow(edgeFactor, float(2)).mul(0.45));

    // Paper lightening at low densities
    const paperBlend = smoothstep(float(0), float(0.2), density);
    const paperColor = vec3(0.94, 0.92, 0.87);

    // Soft saturation reduction
    const mono = dot(baseColor, vec3(0.2126, 0.7152, 0.0722));
    const desaturated = mix(vec3(mono), baseColor, float(0.65));

    return mix(paperColor, desaturated.mul(edgeDarken), paperBlend);
}

// ─── Composite shading function ──────────────────────────────────────────────

/**
 * Full material compositing function for the display pass.
 * Combines PBR shading, Fresnel, rim light, and optional env reflection.
 *
 * @param {Node} baseColor - vec3 from color engine
 * @param {Node} normal - vec3 surface normal
 * @param {Object} materialU - material uniforms
 * @param {Node} displayStyle - display style index
 * @param {Node} density - dye density
 * @param {Node} speed - velocity magnitude
 */
export function compositeMaterial(baseColor, normal, materialU, displayStyle, density, speed) {
    const { diffuse, specular, shadow, sss } = pbrShading(
        normal,
        materialU.lightDir,
        materialU.roughness,
        materialU.specular,
        materialU.shadowIntensity
    );

    const fresnel = fresnelEffect(normal, materialU.fresnelPower, materialU.fresnelBias);
    const rim = rimLight(normal, materialU.rimPower);
    const envReflect = proceduralEnvReflection(normal, materialU.envIntensity);

    // PBR compositing with Subsurface Scattering
    const sssColor = baseColor.mul(baseColor).mul(sss).mul(0.6); // Richer saturated scatter
    const pbrColor = baseColor.mul(diffuse).mul(shadow)
        .add(vec3(specular))
        .add(vec3(rim))
        .add(envReflect.mul(fresnel))
        .add(baseColor.mul(materialU.emissive))
        .add(sssColor).toVar();

    // Neon mode (displayStyle == 4)
    const neonColor = neonGlow(baseColor, normal, density, materialU.emissive).toVar();

    // Thermal mode (displayStyle == 5)
    const thermalColor = thermalVisualization(density, speed).toVar();

    // Watercolor mode (displayStyle == 6)
    const waterColor = watercolorEffect(baseColor, density, normal).toVar();

    // Metallic mode (displayStyle == 3): heavy env reflection + specular
    const metallicColor = baseColor.mul(0.3)
        .add(envReflect.mul(fresnel).mul(2))
        .add(vec3(specular.mul(2)))
        .add(vec3(rim.mul(1.5))).toVar();

    // Glass mode (displayStyle == 7): high Fresnel, refractive tint
    const glassColor = baseColor.mul(float(0.2).add(fresnel.mul(0.6)))
        .add(envReflect.mul(fresnel))
        .add(vec3(specular.mul(1.5))).toVar();

    // Dispatch based on displayStyle
    // 0=classic (no shading), 1=gradient (no shading), 2=material (PBR),
    // 3=metallic, 4=neon, 5=thermal, 6=watercolor, 7=glass
    return select(displayStyle.greaterThan(6.5), glassColor,
        select(displayStyle.greaterThan(5.5), waterColor,
            select(displayStyle.greaterThan(4.5), thermalColor,
                select(displayStyle.greaterThan(3.5), neonColor,
                    select(displayStyle.greaterThan(2.5), metallicColor,
                        select(displayStyle.greaterThan(1.5), pbrColor,
                            baseColor // classic + gradient: no material shading applied here
                        )
                    )
                )
            )
        )
    );
}
