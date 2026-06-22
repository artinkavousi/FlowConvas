import {
    Color,
    AddEquation,
    AdditiveBlending,
    CustomBlending,
    DataTexture,
    DstColorFactor,
    NormalBlending,
    OneFactor,
    OneMinusSrcAlphaFactor,
    RGBAFormat,
    ZeroFactor,
    UnsignedByteType,
    Vector2,
    Vector3
} from 'three/webgpu';
import {
    abs,
    clamp,
    cos,
    dot,
    exp,
    float,
    floor,
    fract,
    Fn,
    hash,
    length,
    log2,
    max,
    min,
    mix,
    normalize,
    pow,
    select,
    sin,
    smoothstep,
    step,
    texture,
    uniform,
    uv,
    vec2,
    vec3,
    vec4
} from 'three/tsl';
import { FullscreenPass } from './FullscreenPass.js';
import { createColorUniforms, resolveColor } from './colorEngine.js';
import { createMaterialUniforms, compositeMaterial, computeNormal } from './materialModels.js';

// A valid 1×1 texture placeholder. Passes are created with this as their
// texture-input default and only ever sample real targets at render time, but
// giving the placeholder real data avoids TSL "invalid texture" warnings when
// the renderer prewarms a pass before its first real assignment.
const emptyTexture = new DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1, RGBAFormat, UnsignedByteType);
emptyTexture.needsUpdate = true;

function sample(textureNode, coord) {
    return texture(textureNode, vec2(coord.x, float(1).sub(coord.y)));
}

function solverUv() {
    return uv().flipY();
}

function luminanceMax(colorNode) {
    return max(colorNode.r, max(colorNode.g, colorNode.b));
}

// JS-side vec2 normalize for building constant wave directions at module load.
function normalizeVec2(x, y) {
    const length = Math.hypot(x, y) || 1;
    return { x: x / length, y: y / length };
}

// --- Procedural noise helpers (TSL) ---------------------------------------
// Deterministic 2D hash → [0,1). Used to build value noise for curl-noise
// turbulence. Kept self-contained so passes don't depend on a noise texture.
const hash2 = Fn(([p]) => {
    const h = dot(p, vec2(127.1, 311.7));
    return fract(sin(h).mul(43758.5453));
});

// Smooth 2D value noise in [0,1].
const valueNoise = Fn(([p]) => {
    const i = floor(p);
    const f = fract(p);
    const u = f.mul(f).mul(float(3).sub(f.mul(2)));
    const a = hash2(i);
    const b = hash2(i.add(vec2(1, 0)));
    const c = hash2(i.add(vec2(0, 1)));
    const d = hash2(i.add(vec2(1, 1)));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
});

export function createCopyPass() {
    const source = texture(emptyTexture);
    const pass = new FullscreenPass('copy', Fn(() => sample(source, solverUv()))());
    pass.source = source;
    return pass;
}

export function createClearPass() {
    const source = texture(emptyTexture);
    const value = uniform(0);
    const pass = new FullscreenPass('clear', Fn(() => sample(source, solverUv()).mul(value))());
    pass.source = source;
    pass.value = value;
    return pass;
}

export function createColorPass() {
    const colorValue = uniform(new Color(0x000000));
    const alpha = uniform(1);
    const pass = new FullscreenPass('color', Fn(() => vec4(colorValue, alpha))());
    pass.color = colorValue;
    pass.alpha = alpha;
    return pass;
}

export function createSplatPass() {
    const source = texture(emptyTexture);
    const aspectRatio = uniform(1);
    const point = uniform(new Vector2(0.5, 0.5));
    const splatColor = uniform(new Vector3(1, 1, 1));
    const radius = uniform(0.0008);

    const pass = new FullscreenPass('splat', Fn(() => {
        const st = solverUv();
        const p = vec2(st.x.sub(point.x).mul(aspectRatio), st.y.sub(point.y));
        const impulse = exp(dot(p, p).negate().div(radius)).mul(splatColor);
        const base = sample(source, st).xyz;

        return vec4(base.add(impulse), 1);
    })());

    pass.source = source;
    pass.aspectRatio = aspectRatio;
    pass.point = point;
    pass.splatColor = splatColor;
    pass.radius = radius;

    return pass;
}

// SplatMask pass — accumulates a single-channel R8 mask that marks where
// splats happened this frame (or recently, via dissipation). Particle roles
// read this to spawn at fresh splat edges instead of any high-dye region.
export function createSplatMaskPass() {
    const source = texture(emptyTexture);
    const aspectRatio = uniform(1);
    const point = uniform(new Vector2(0.5, 0.5));
    const amplitude = uniform(1.0);
    const radius = uniform(0.0008);

    const pass = new FullscreenPass('splatMask', Fn(() => {
        const st = solverUv();
        const p = vec2(st.x.sub(point.x).mul(aspectRatio), st.y.sub(point.y));
        const impulse = exp(dot(p, p).negate().div(radius)).mul(amplitude);
        const base = sample(source, st).r;
        return vec4(min(base.add(impulse), float(1)), 0, 0, 1);
    })());

    pass.source = source;
    pass.aspectRatio = aspectRatio;
    pass.point = point;
    pass.amplitude = amplitude;
    pass.radius = radius;
    return pass;
}

// SplatMask dissipation — applied once per frame to fade the mask
// before this frame's new splats are written.
export function createSplatMaskDissipationPass() {
    const source = texture(emptyTexture);
    const decay = uniform(0.85);
    const pass = new FullscreenPass('splatMaskDecay', Fn(() => {
        const v = sample(source, solverUv()).r.mul(decay);
        return vec4(v, 0, 0, 1);
    })());
    pass.source = source;
    pass.decay = decay;
    return pass;
}

export function createAdvectionPass() {
    const velocity = texture(emptyTexture);
    const source = texture(emptyTexture);
    const texelSize = uniform(new Vector2(1 / 128, 1 / 128));
    const dt = uniform(1 / 60);
    const dissipation = uniform(1);

    const pass = new FullscreenPass('advection', Fn(() => {
        const st = solverUv();
        const velocitySample = sample(velocity, st).xy;
        const coord = st.sub(velocitySample.mul(texelSize).mul(dt));
        const result = sample(source, coord);
        const decay = float(1).add(dissipation.mul(dt));

        return result.div(decay);
    })());

    pass.velocity = velocity;
    pass.source = source;
    pass.texelSize = texelSize;
    pass.dt = dt;
    pass.dissipation = dissipation;

    return pass;
}

export function createMacCormackAdvectionPass() {
    const velocity = texture(emptyTexture);
    const source = texture(emptyTexture);
    const texelSize = uniform(new Vector2(1 / 128, 1 / 128));
    const dt = uniform(1 / 60);
    const dissipation = uniform(1);

    const pass = new FullscreenPass('macCormackAdvection', Fn(() => {
        const st = solverUv();
        const velocitySample = sample(velocity, st).xy;
        const backCoord = st.sub(velocitySample.mul(texelSize).mul(dt));
        const forwardValue = sample(source, backCoord);
        const repairedCoord = backCoord.add(sample(velocity, backCoord).xy.mul(texelSize).mul(dt));
        const reverseValue = sample(source, repairedCoord);
        const center = sample(source, st);
        const corrected = forwardValue.add(center.sub(reverseValue).mul(0.5));
        const left = sample(source, st.sub(vec2(texelSize.x, 0)));
        const right = sample(source, st.add(vec2(texelSize.x, 0)));
        const top = sample(source, st.add(vec2(0, texelSize.y)));
        const bottom = sample(source, st.sub(vec2(0, texelSize.y)));
        const localMin = min(min(left, right), min(top, bottom));
        const localMax = max(max(left, right), max(top, bottom));
        const limited = clamp(corrected, localMin, localMax);
        const decay = float(1).add(dissipation.mul(dt));

        return limited.div(decay);
    })());

    pass.velocity = velocity;
    pass.source = source;
    pass.texelSize = texelSize;
    pass.dt = dt;
    pass.dissipation = dissipation;

    return pass;
}

export function createBFECCAdvectionPass() {
    const velocity = texture(emptyTexture);
    const source = texture(emptyTexture);
    const texelSize = uniform(new Vector2(1 / 128, 1 / 128));
    const dt = uniform(1 / 60);
    const dissipation = uniform(1);

    const pass = new FullscreenPass('bfeccAdvection', Fn(() => {
        const st = solverUv();
        const vel0 = sample(velocity, st).xy;
        const backCoord = st.sub(vel0.mul(texelSize).mul(dt));
        const forwardValue = sample(source, backCoord);
        const vel1 = sample(velocity, backCoord).xy;
        const repairedCoord = backCoord.add(vel1.mul(texelSize).mul(dt));
        const backwardValue = sample(source, repairedCoord);
        const center = sample(source, st);
        const compensated = forwardValue.add(center.sub(backwardValue).mul(0.5));
        const left = sample(source, st.sub(vec2(texelSize.x, 0)));
        const right = sample(source, st.add(vec2(texelSize.x, 0)));
        const top = sample(source, st.add(vec2(0, texelSize.y)));
        const bottom = sample(source, st.sub(vec2(0, texelSize.y)));
        const localMin = min(min(left, right), min(top, bottom));
        const localMax = max(max(left, right), max(top, bottom));
        const decay = float(1).add(dissipation.mul(dt));

        return clamp(compensated, localMin, localMax).div(decay);
    })());

    pass.velocity = velocity;
    pass.source = source;
    pass.texelSize = texelSize;
    pass.dt = dt;
    pass.dissipation = dissipation;

    return pass;
}

export function createRK4AdvectionPass() {
    const velocity = texture(emptyTexture);
    const source = texture(emptyTexture);
    const texelSize = uniform(new Vector2(1 / 128, 1 / 128));
    const dt = uniform(1 / 60);
    const dissipation = uniform(1);

    const pass = new FullscreenPass('rk4Advection', Fn(() => {
        const st = solverUv();
        const h = texelSize.mul(dt);
        const k1 = sample(velocity, st).xy;
        const k2 = sample(velocity, st.sub(k1.mul(h).mul(0.5))).xy;
        const k3 = sample(velocity, st.sub(k2.mul(h).mul(0.5))).xy;
        const k4 = sample(velocity, st.sub(k3.mul(h))).xy;
        const backVelocity = k1.add(k2.mul(2)).add(k3.mul(2)).add(k4).div(6);
        const coord = st.sub(backVelocity.mul(h));
        const decay = float(1).add(dissipation.mul(dt));

        return sample(source, coord).div(decay);
    })());

    pass.velocity = velocity;
    pass.source = source;
    pass.texelSize = texelSize;
    pass.dt = dt;
    pass.dissipation = dissipation;

    return pass;
}

export function createCurlPass() {
    const velocity = texture(emptyTexture);
    const texelSize = uniform(new Vector2(1 / 128, 1 / 128));

    const pass = new FullscreenPass('curl', Fn(() => {
        const st = solverUv();
        const left = sample(velocity, st.sub(vec2(texelSize.x, 0))).y;
        const right = sample(velocity, st.add(vec2(texelSize.x, 0))).y;
        const top = sample(velocity, st.add(vec2(0, texelSize.y))).x;
        const bottom = sample(velocity, st.sub(vec2(0, texelSize.y))).x;
        const vorticity = right.sub(left).sub(top).add(bottom).mul(0.5);

        return vec4(vorticity, 0, 0, 1);
    })());

    pass.velocity = velocity;
    pass.texelSize = texelSize;

    return pass;
}

export function createVorticityPass() {
    const velocity = texture(emptyTexture);
    const curl = texture(emptyTexture);
    const texelSize = uniform(new Vector2(1 / 128, 1 / 128));
    const curlStrength = uniform(30);
    const dt = uniform(1 / 60);

    const pass = new FullscreenPass('vorticity', Fn(() => {
        const st = solverUv();
        const left = sample(curl, st.sub(vec2(texelSize.x, 0))).x;
        const right = sample(curl, st.add(vec2(texelSize.x, 0))).x;
        const top = sample(curl, st.add(vec2(0, texelSize.y))).x;
        const bottom = sample(curl, st.sub(vec2(0, texelSize.y))).x;
        const center = sample(curl, st).x;
        const forceBase = vec2(abs(top).sub(abs(bottom)), abs(right).sub(abs(left))).mul(0.5);
        const force = forceBase.div(length(forceBase).add(0.0001)).mul(curlStrength).mul(center);
        const correctedForce = vec2(force.x, force.y.negate());
        const nextVelocity = clamp(sample(velocity, st).xy.add(correctedForce.mul(dt)), -1000, 1000);

        return vec4(nextVelocity, 0, 1);
    })());

    pass.velocity = velocity;
    pass.curl = curl;
    pass.texelSize = texelSize;
    pass.curlStrength = curlStrength;
    pass.dt = dt;

    return pass;
}

export function createForcePass() {
    const velocity = texture(emptyTexture);
    const force = uniform(new Vector2(0, 0));
    const turbulenceAmount = uniform(0);
    const turbulenceScale = uniform(4);
    const turbulenceSpeed = uniform(0.8);
    const time = uniform(0);
    const dt = uniform(1 / 60);

    const pass = new FullscreenPass('force', Fn(() => {
        const st = solverUv();
        const noiseX = sin(st.y.mul(turbulenceScale).mul(32).add(time.mul(turbulenceSpeed))).mul(turbulenceAmount);
        const noiseY = cos(st.x.mul(turbulenceScale).mul(32).sub(time.mul(turbulenceSpeed))).mul(turbulenceAmount);
        const nextVelocity = sample(velocity, st).xy.add(force.add(vec2(noiseX, noiseY)).mul(dt));

        return vec4(nextVelocity, 0, 1);
    })());

    pass.velocity = velocity;
    pass.force = force;
    pass.turbulenceAmount = turbulenceAmount;
    pass.turbulenceScale = turbulenceScale;
    pass.turbulenceSpeed = turbulenceSpeed;
    pass.time = time;
    pass.dt = dt;

    return pass;
}

// Divergence-free curl-noise turbulence. We take the curl of a scalar
// potential ψ (value noise): v += (∂ψ/∂y, -∂ψ/∂x). Because it's the curl of a
// potential it adds rotational eddies without injecting divergence the
// pressure solve must undo — unlike the sinusoidal `force` turbulence.
// `force` carries the base gravity+wind so a single pass covers both when this
// turbulence mode is active.
export function createCurlNoiseForcePass() {
    const velocity = texture(emptyTexture);
    const force = uniform(new Vector2(0, 0));
    const amount = uniform(0);
    const scale = uniform(3);
    const speed = uniform(0.5);
    const time = uniform(0);
    const dt = uniform(1 / 60);

    const pass = new FullscreenPass('curlNoiseForce', Fn(() => {
        const st = solverUv();
        const eps = float(0.001);
        const p = vec2(st.x.mul(scale), st.y.mul(scale)).add(time.mul(speed));
        const psiUp = valueNoise(p.add(vec2(0, eps)));
        const psiDown = valueNoise(p.sub(vec2(0, eps)));
        const psiRight = valueNoise(p.add(vec2(eps, 0)));
        const psiLeft = valueNoise(p.sub(vec2(eps, 0)));
        const inv = float(1).div(eps.mul(2));
        const curlX = psiUp.sub(psiDown).mul(inv);
        const curlY = psiLeft.sub(psiRight).mul(inv); // -∂ψ/∂x
        const noiseForce = vec2(curlX, curlY).mul(amount);
        const nextVelocity = sample(velocity, st).xy.add(force.add(noiseForce).mul(dt));

        return vec4(nextVelocity, 0, 1);
    })());

    pass.velocity = velocity;
    pass.force = force;
    pass.amount = amount;
    pass.scale = scale;
    pass.speed = speed;
    pass.time = time;
    pass.dt = dt;

    return pass;
}

export function createTemperatureBuoyancyPass() {
    const velocity = texture(emptyTexture);
    const temperature = texture(emptyTexture);
    const direction = uniform(1.57);
    const strength = uniform(12);
    const dt = uniform(1 / 60);

    const pass = new FullscreenPass('temperatureBuoyancy', Fn(() => {
        const st = solverUv();
        const heat = sample(temperature, st).r;
        const buoyancy = vec2(cos(direction), sin(direction)).mul(heat).mul(strength).mul(dt);
        const nextVelocity = sample(velocity, st).xy.add(buoyancy);

        return vec4(nextVelocity, 0, 1);
    })());

    pass.velocity = velocity;
    pass.temperature = temperature;
    pass.direction = direction;
    pass.strength = strength;
    pass.dt = dt;

    return pass;
}

export function createViscosityPass() {
    const source = texture(emptyTexture);
    const velocity = texture(emptyTexture);
    const texelSize = uniform(new Vector2(1 / 128, 1 / 128));
    const viscosity = uniform(0);
    const dt = uniform(1 / 60);

    const pass = new FullscreenPass('viscosity', Fn(() => {
        const st = solverUv();
        const alpha = viscosity.mul(dt).mul(100);
        const left = sample(velocity, st.sub(vec2(texelSize.x, 0))).xy;
        const right = sample(velocity, st.add(vec2(texelSize.x, 0))).xy;
        const top = sample(velocity, st.add(vec2(0, texelSize.y))).xy;
        const bottom = sample(velocity, st.sub(vec2(0, texelSize.y))).xy;
        const base = sample(source, st).xy;
        const nextVelocity = base.add(left.add(right).add(top).add(bottom).mul(alpha)).div(float(1).add(alpha.mul(4)));

        return vec4(nextVelocity, 0, 1);
    })());

    pass.source = source;
    pass.velocity = velocity;
    pass.texelSize = texelSize;
    pass.viscosity = viscosity;
    pass.dt = dt;

    return pass;
}

export function createObstaclePaintPass() {
    const source = texture(emptyTexture);
    const aspectRatio = uniform(1);
    const point = uniform(new Vector2(0.5, 0.5));
    const radius = uniform(0.008);
    const value = uniform(1);

    const pass = new FullscreenPass('obstaclePaint', Fn(() => {
        const st = solverUv();
        const p = vec2(st.x.sub(point.x).mul(aspectRatio), st.y.sub(point.y));
        const brush = smoothstep(radius, radius.mul(0.35), length(p)).mul(value);
        const current = sample(source, st).r;
        const mask = select(value.greaterThan(0.5), max(current, brush), current.mul(float(1).sub(brush)));

        return vec4(mask, 0, 0, 1);
    })());

    pass.source = source;
    pass.aspectRatio = aspectRatio;
    pass.point = point;
    pass.radius = radius;
    pass.value = value;

    return pass;
}

export function createObstacleVelocityPass() {
    const velocity = texture(emptyTexture);
    const obstacles = texture(emptyTexture);
    const texelSize = uniform(new Vector2(1 / 128, 1 / 128));
    const mode = uniform(0); // 0 = no-slip (zero velocity), 1 = free-slip

    const pass = new FullscreenPass('obstacleVelocity', Fn(() => {
        const st = solverUv();
        const solid = sample(obstacles, st).r;
        const v = sample(velocity, st).xy;
        const noSlip = v.mul(float(1).sub(solid));

        // Free-slip: remove only the wall-normal component. The wall normal is
        // the gradient of the obstacle field; guard against the zero gradient
        // in the solid interior (n→0 ⇒ velocity unchanged there).
        const gx = sample(obstacles, st.add(vec2(texelSize.x, 0))).r.sub(sample(obstacles, st.sub(vec2(texelSize.x, 0))).r);
        const gy = sample(obstacles, st.add(vec2(0, texelSize.y))).r.sub(sample(obstacles, st.sub(vec2(0, texelSize.y))).r);
        const grad = vec2(gx, gy);
        const n = grad.div(length(grad).add(0.0001));
        const tangential = v.sub(n.mul(dot(v, n)));
        const freeSlip = mix(v, tangential, solid);

        const nextVelocity = select(mode.greaterThan(0.5), freeSlip, noSlip);

        return vec4(nextVelocity, 0, 1);
    })());

    pass.velocity = velocity;
    pass.obstacles = obstacles;
    pass.texelSize = texelSize;
    pass.mode = mode;

    return pass;
}

export function createObstacleDyePass() {
    const dye = texture(emptyTexture);
    const obstacles = texture(emptyTexture);

    const pass = new FullscreenPass('obstacleDye', Fn(() => {
        const st = solverUv();
        const solid = sample(obstacles, st).r;
        const nextDye = sample(dye, st).rgb.mul(float(1).sub(solid.mul(0.88)));

        return vec4(nextDye, 1);
    })());

    pass.dye = dye;
    pass.obstacles = obstacles;

    return pass;
}

export function createDivergencePass() {
    const velocity = texture(emptyTexture);
    const texelSize = uniform(new Vector2(1 / 128, 1 / 128));
    const edgeOpen = uniform(0); // 0 = closed (reflective wall), 1 = open (outflow)

    const pass = new FullscreenPass('divergence', Fn(() => {
        const st = solverUv();
        const center = sample(velocity, st).xy;
        const leftUv = st.sub(vec2(texelSize.x, 0));
        const rightUv = st.add(vec2(texelSize.x, 0));
        const topUv = st.add(vec2(0, texelSize.y));
        const bottomUv = st.sub(vec2(0, texelSize.y));
        const leftRaw = sample(velocity, leftUv).x;
        const rightRaw = sample(velocity, rightUv).x;
        const topRaw = sample(velocity, topUv).y;
        const bottomRaw = sample(velocity, bottomUv).y;
        // Closed edge reflects (negate the centre component → solid wall); open
        // edge uses the clamped neighbour (zero-gradient outflow).
        const open = edgeOpen.greaterThan(0.5);
        const left = select(leftUv.x.lessThan(0), select(open, leftRaw, center.x.negate()), leftRaw);
        const right = select(rightUv.x.greaterThan(1), select(open, rightRaw, center.x.negate()), rightRaw);
        const top = select(topUv.y.greaterThan(1), select(open, topRaw, center.y.negate()), topRaw);
        const bottom = select(bottomUv.y.lessThan(0), select(open, bottomRaw, center.y.negate()), bottomRaw);
        const divergence = right.sub(left).add(top).sub(bottom).mul(0.5);

        return vec4(divergence, 0, 0, 1);
    })());

    pass.velocity = velocity;
    pass.texelSize = texelSize;
    pass.edgeOpen = edgeOpen;

    return pass;
}

export function createBloomFinalPass() {
    const source = texture(emptyTexture);
    const texelSize = uniform(new Vector2(1 / 256, 1 / 256));
    const intensity = uniform(0.8);

    const pass = new FullscreenPass('bloomFinal', Fn(() => {
        const st = solverUv();
        const left = sample(source, st.sub(vec2(texelSize.x, 0)));
        const right = sample(source, st.add(vec2(texelSize.x, 0)));
        const top = sample(source, st.add(vec2(0, texelSize.y)));
        const bottom = sample(source, st.sub(vec2(0, texelSize.y)));

        return left.add(right).add(top).add(bottom).mul(0.25).mul(intensity);
    })());

    pass.source = source;
    pass.texelSize = texelSize;
    pass.intensity = intensity;

    return pass;
}

export function createBloomBlurPass() {
    const source = texture(emptyTexture);
    const texelSize = uniform(new Vector2(1 / 256, 1 / 256));

    const pass = new FullscreenPass('bloomBlur', Fn(() => {
        const st = solverUv();
        const left = sample(source, st.sub(vec2(texelSize.x, 0)));
        const right = sample(source, st.add(vec2(texelSize.x, 0)));
        const top = sample(source, st.add(vec2(0, texelSize.y)));
        const bottom = sample(source, st.sub(vec2(0, texelSize.y)));

        return left.add(right).add(top).add(bottom).mul(0.25);
    })());

    pass.source = source;
    pass.texelSize = texelSize;

    return pass;
}

export function createAddPass() {
    const base = texture(emptyTexture);
    const source = texture(emptyTexture);

    const pass = new FullscreenPass('add', Fn(() => {
        const st = solverUv();
        return sample(base, st).add(sample(source, st));
    })());

    pass.base = base;
    pass.source = source;

    return pass;
}

export function createPressurePass() {
    const pressure = texture(emptyTexture);
    const divergence = texture(emptyTexture);
    const texelSize = uniform(new Vector2(1 / 128, 1 / 128));

    const pass = new FullscreenPass('pressure', Fn(() => {
        const st = solverUv();
        const left = sample(pressure, st.sub(vec2(texelSize.x, 0))).x;
        const right = sample(pressure, st.add(vec2(texelSize.x, 0))).x;
        const top = sample(pressure, st.add(vec2(0, texelSize.y))).x;
        const bottom = sample(pressure, st.sub(vec2(0, texelSize.y))).x;
        const div = sample(divergence, st).x;
        const nextPressure = left.add(right).add(top).add(bottom).sub(div).mul(0.25);

        return vec4(nextPressure, 0, 0, 1);
    })());

    pass.pressure = pressure;
    pass.divergence = divergence;
    pass.texelSize = texelSize;

    return pass;
}

export function createRedBlackPressurePass() {
    const pressure = texture(emptyTexture);
    const divergence = texture(emptyTexture);
    const texelSize = uniform(new Vector2(1 / 128, 1 / 128));
    const phase = uniform(0);

    const pass = new FullscreenPass('redBlackPressure', Fn(() => {
        const st = solverUv();
        const left = sample(pressure, st.sub(vec2(texelSize.x, 0))).x;
        const right = sample(pressure, st.add(vec2(texelSize.x, 0))).x;
        const top = sample(pressure, st.add(vec2(0, texelSize.y))).x;
        const bottom = sample(pressure, st.sub(vec2(0, texelSize.y))).x;
        const div = sample(divergence, st).x;
        const nextPressure = left.add(right).add(top).add(bottom).sub(div).mul(0.25);
        const checker = fract(st.x.div(texelSize.x).add(st.y.div(texelSize.y)).mul(0.5)).mul(2);
        const active = abs(checker.sub(phase)).lessThan(0.5);

        return vec4(select(active, nextPressure, sample(pressure, st).x), 0, 0, 1);
    })());

    pass.pressure = pressure;
    pass.divergence = divergence;
    pass.texelSize = texelSize;
    pass.phase = phase;

    return pass;
}

// Foam generation. White-water collects where flow is energetic (speed),
// sheared, swirling (vorticity), and where the surface folds / air is
// entrained (curvature ~ |divergence|). The vorticity/curvature weights default
// to 0 so the result matches the legacy speed+shear generator until enabled.
export function createFoamPass() {
    const foam = texture(emptyTexture);
    const velocity = texture(emptyTexture);
    const curl = texture(emptyTexture);
    const texelSize = uniform(new Vector2(1 / 128, 1 / 128));
    const amount = uniform(0);
    const threshold = uniform(180);
    const dissipation = uniform(0.92);
    const vorticityWeight = uniform(0);
    const curvatureWeight = uniform(0);

    const pass = new FullscreenPass('foam', Fn(() => {
        const st = solverUv();
        const current = sample(foam, st).r.mul(dissipation);
        const center = sample(velocity, st).xy;
        const left = sample(velocity, st.sub(vec2(texelSize.x, 0))).xy;
        const right = sample(velocity, st.add(vec2(texelSize.x, 0))).xy;
        const top = sample(velocity, st.add(vec2(0, texelSize.y))).xy;
        const bottom = sample(velocity, st.sub(vec2(0, texelSize.y))).xy;
        const shear = length(right.sub(left)).add(length(top.sub(bottom))).mul(0.5);
        const speed = length(center);
        // Vorticity: foam pools in eddies. |curl| scaled by its weight.
        const vorticity = abs(sample(curl, st).x).mul(vorticityWeight);
        // Curvature / air entrainment: |∂u/∂x + ∂v/∂y| (divergence magnitude).
        const divergence = abs(right.x.sub(left.x).add(top.y.sub(bottom.y)).mul(0.5)).mul(curvatureWeight);
        const energy = speed.add(shear).add(vorticity).add(divergence);
        const generated = smoothstep(threshold, threshold.mul(2), energy).mul(amount);
        const value = clamp(max(current, generated), 0, 1);

        return vec4(value, 0, 0, 1);
    })());

    pass.foam = foam;
    pass.velocity = velocity;
    pass.curl = curl;
    pass.texelSize = texelSize;
    pass.amount = amount;
    pass.threshold = threshold;
    pass.dissipation = dissipation;
    pass.vorticityWeight = vorticityWeight;
    pass.curvatureWeight = curvatureWeight;

    return pass;
}

// Foam buoyancy — dense foam rises, coupling a small upward velocity. Applied
// to the velocity field after the pressure solve when FOAM_BUOYANCY > 0.
export function createFoamBuoyancyPass() {
    const velocity = texture(emptyTexture);
    const foam = texture(emptyTexture);
    const strength = uniform(0);
    const dt = uniform(1 / 60);

    const pass = new FullscreenPass('foamBuoyancy', Fn(() => {
        const st = solverUv();
        const density = sample(foam, st).r;
        // Lift is +y in solver space (upward on screen).
        const lift = vec2(0, density.mul(strength).mul(dt));
        const nextVelocity = sample(velocity, st).xy.add(lift);

        return vec4(nextVelocity, 0, 1);
    })());

    pass.velocity = velocity;
    pass.foam = foam;
    pass.strength = strength;
    pass.dt = dt;

    return pass;
}

// --- Multigrid pressure solve ---------------------------------------------
// Equation (cell units, h=1): laplacian(p) = sum_neighbours - 4p = rhs, where
// rhs is the divergence at the finest level and the (×4-scaled) restricted
// residual at coarser levels. The red-black pressure pass is reused as the
// smoother. residual = rhs - laplacian(p).
export function createResidualPass() {
    const pressure = texture(emptyTexture);
    const rhs = texture(emptyTexture);
    const texelSize = uniform(new Vector2(1 / 128, 1 / 128));

    const pass = new FullscreenPass('mgResidual', Fn(() => {
        const st = solverUv();
        const center = sample(pressure, st).x;
        const left = sample(pressure, st.sub(vec2(texelSize.x, 0))).x;
        const right = sample(pressure, st.add(vec2(texelSize.x, 0))).x;
        const top = sample(pressure, st.add(vec2(0, texelSize.y))).x;
        const bottom = sample(pressure, st.sub(vec2(0, texelSize.y))).x;
        const laplacian = left.add(right).add(top).add(bottom).sub(center.mul(4));
        const residual = sample(rhs, st).x.sub(laplacian);

        return vec4(residual, 0, 0, 1);
    })());

    pass.pressure = pressure;
    pass.rhs = rhs;
    pass.texelSize = texelSize;

    return pass;
}

// Full-weighting restriction (fine residual → coarse rhs). The 2×2 fine cells
// covered by one coarse cell are summed (= 4 × average), which is the ×4
// rediscretisation factor (H = 2h) folded into the right-hand side so the
// unit-spacing smoother can be reused unchanged on every level.
export function createRestrictPass() {
    const source = texture(emptyTexture);
    const fineTexel = uniform(new Vector2(1 / 128, 1 / 128));
    const gain = uniform(1);

    const pass = new FullscreenPass('mgRestrict', Fn(() => {
        const st = solverUv();
        const ox = fineTexel.x.mul(0.5);
        const oy = fineTexel.y.mul(0.5);
        const a = sample(source, st.add(vec2(ox, oy))).x;
        const b = sample(source, st.add(vec2(ox.negate(), oy))).x;
        const c = sample(source, st.add(vec2(ox, oy.negate()))).x;
        const d = sample(source, st.add(vec2(ox.negate(), oy.negate()))).x;
        // gain selects the convention: 0.25 = full-weighting average (unit-
        // spacing rediscretisation), 1.0 = summed (×4 physical H=2h scaling).
        return vec4(a.add(b).add(c).add(d).mul(gain), 0, 0, 1);
    })());

    pass.source = source;
    pass.fineTexel = fineTexel;
    pass.gain = gain;

    return pass;
}

// Prolongation (coarse error → fine) with correction add. The coarse error is
// sampled with bilinear filtering (coarse targets use LinearFilter), giving
// smooth interpolation; the result is added to the current fine pressure.
export function createProlongPass() {
    const base = texture(emptyTexture);
    const correction = texture(emptyTexture);
    const gain = uniform(1);

    const pass = new FullscreenPass('mgProlong', Fn(() => {
        const st = solverUv();
        const corrected = sample(base, st).x.add(sample(correction, st).x.mul(gain));

        return vec4(corrected, 0, 0, 1);
    })());

    pass.base = base;
    pass.correction = correction;
    pass.gain = gain;

    return pass;
}

// Smoke self-shadow. Marches a fixed number of taps from each cell toward the
// light, accumulating density (extinction), and returns a Beer–Lambert shadow
// factor exp(-k·∑density). 2D approximation of volumetric self-shadowing.
export function createSmokeShadowPass() {
    const density = texture(emptyTexture);
    const lightDir = uniform(new Vector2(-0.35, 0.7));
    const texelSize = uniform(new Vector2(1 / 128, 1 / 128));
    const strength = uniform(0.6);

    const pass = new FullscreenPass('smokeShadow', Fn(() => {
        const st = solverUv();
        const dir = normalize(lightDir).mul(texelSize);
        let accum = float(0);
        for (let i = 1; i <= 8; i += 1) {
            accum = accum.add(sample(density, st.add(dir.mul(i * 2))).r);
        }
        const shadow = exp(accum.mul(strength).mul(0.5).negate());

        return vec4(shadow, 0, 0, 1);
    })());

    pass.density = density;
    pass.lightDir = lightDir;
    pass.texelSize = texelSize;
    pass.strength = strength;

    return pass;
}

// Smoke composite — a small standalone pass drawn over the display output with
// straight alpha blending. Kept separate from the (large, fragile) display
// shader so smoke is fully modular: grey, self-shadowed, density-as-alpha.
export function createSmokeCompositePass() {
    const density = texture(emptyTexture);
    const smokeShadow = texture(emptyTexture);
    const color = uniform(new Vector3(0.78, 0.78, 0.82));
    const amount = uniform(1);

    const pass = new FullscreenPass('smokeComposite', Fn(() => {
        const st = solverUv();
        const d = sample(density, st).r;
        const shade = clamp(sample(smokeShadow, st).r, 0.15, 1);
        const rgb = color.mul(shade);
        const alpha = clamp(d.mul(amount), 0, 1);

        return vec4(rgb, alpha);
    })());

    pass.material.transparent = true;
    pass.material.blending = NormalBlending;
    pass.density = density;
    pass.smokeShadow = smokeShadow;
    pass.color = color;
    pass.amount = amount;

    return pass;
}

// Sum-of-sines ocean height field. Fixed directional wave set; amplitude/phase
// derived from the wave coordinate `p` and time `t`. Returns a scalar height.
const OCEAN_WAVES = [
    { dir: normalizeVec2(1.0, 0.25), freq: 1.0, amp: 0.50, speed: 1.0 },
    { dir: normalizeVec2(0.5, 1.0), freq: 1.7, amp: 0.32, speed: 1.3 },
    { dir: normalizeVec2(-0.8, 0.6), freq: 2.7, amp: 0.22, speed: 0.9 },
    { dir: normalizeVec2(0.2, -1.0), freq: 4.1, amp: 0.14, speed: 1.7 },
    { dir: normalizeVec2(-1.0, -0.4), freq: 5.9, amp: 0.09, speed: 2.1 }
];

const oceanHeight = Fn(([p, t]) => {
    let height = float(0);
    for (const wave of OCEAN_WAVES) {
        const phase = dot(p, vec2(wave.dir.x, wave.dir.y)).mul(wave.freq).add(t.mul(wave.speed));
        height = height.add(sin(phase).mul(wave.amp));
    }
    return height;
});

// Ocean surface render. A self-contained pass (does not touch the display
// shader): Gerstner-style height → analytic-ish normal → Fresnel sky
// reflection, sun specular, depth tint, caustics, and crest foam. The fluid
// velocity perturbs the wave coordinate so pointer/emitter interaction makes
// wakes and ripples.
export function createOceanPass() {
    const velocity = texture(emptyTexture);
    const foam = texture(emptyTexture);
    const time = uniform(0);
    const aspect = uniform(1);
    const texelSize = uniform(new Vector2(1 / 128, 1 / 128));
    const waveScale = uniform(3.2);
    const steepness = uniform(1);
    const choppiness = uniform(0.55);
    const flow = uniform(0.6);
    const waterColor = uniform(new Vector3(0.06, 0.33, 0.49));
    const deepColor = uniform(new Vector3(0.012, 0.07, 0.15));
    const skyColor = uniform(new Vector3(0.59, 0.75, 0.92));
    const sunDir = uniform(new Vector2(-0.4, 0.55));
    const fresnelPower = uniform(2.6);
    const caustics = uniform(0.45);
    const foamAmount = uniform(0.85);

    const pass = new FullscreenPass('ocean', Fn(() => {
        const st = solverUv();
        const vel = sample(velocity, st).xy;
        const p = vec2(st.x.mul(aspect), st.y).mul(waveScale).add(vel.mul(texelSize).mul(flow).mul(80));
        const eps = float(0.012);
        const h0 = oceanHeight(p, time);
        const hx = oceanHeight(p.add(vec2(eps, 0)), time);
        const hy = oceanHeight(p.add(vec2(0, eps)), time);
        const slope = vec2(hx.sub(h0), hy.sub(h0)).div(eps).mul(steepness).mul(choppiness.add(0.5)).mul(0.35);
        const normal = normalize(vec3(slope.x.negate(), slope.y.negate(), 1));
        const viewDir = vec3(0, 0, 1);
        const ndv = clamp(dot(normal, viewDir), 0, 1);
        const fresnel = clamp(pow(float(1).sub(ndv), fresnelPower), 0, 1);
        const depth = clamp(h0.mul(0.5).add(0.5), 0, 1);
        const baseWater = mix(deepColor, waterColor, depth);
        const reflected = mix(baseWater, skyColor, fresnel);
        const sun = normalize(vec3(sunDir.x, sunDir.y, 0.6));
        const spec = pow(clamp(dot(normal, sun), 0, 1), 80).mul(2.2);
        const causticPattern = valueNoise(p.mul(0.7).add(normal.xy.mul(0.8)).add(time.mul(0.15)));
        const caust = pow(causticPattern, 4).mul(caustics).mul(depth);
        const slopeMag = length(slope);
        const foamField = sample(foam, st).r;
        const crest = clamp(smoothstep(0.7, 1.4, slopeMag).add(foamField), 0, 1).mul(foamAmount);
        const surface = reflected.add(vec3(spec)).add(vec3(caust));
        const color = mix(surface, vec3(0.92, 0.96, 1), crest);

        return vec4(max(color, vec3(0)), 1);
    })());

    pass.velocity = velocity;
    pass.foam = foam;
    pass.time = time;
    pass.aspect = aspect;
    pass.texelSize = texelSize;
    pass.waveScale = waveScale;
    pass.steepness = steepness;
    pass.choppiness = choppiness;
    pass.flow = flow;
    pass.waterColor = waterColor;
    pass.deepColor = deepColor;
    pass.skyColor = skyColor;
    pass.sunDir = sunDir;
    pass.fresnelPower = fresnelPower;
    pass.caustics = caustics;
    pass.foamAmount = foamAmount;

    return pass;
}

// Particle composite — the particle layer accumulates point DENSITY (additive).
// Here that density is mapped to white-water FOAM coverage with STRAIGHT ALPHA
// (NormalBlending), NOT an emissive glow: dense clusters read as opaque froth,
// sparse points as thin foam, calm water shows nothing. This is the secondary
// white-water/foam detail of the fluid, not glowing dots.
export function createParticleCompositePass() {
    const source = texture(emptyTexture);
    const foamColor = uniform(new Vector3(0.92, 0.96, 1.0));
    const opacity = uniform(1);
    const softness = uniform(0.6);
    const pass = new FullscreenPass('particleComposite', Fn(() => {
        const density = sample(source, solverUv()).x;
        const coverage = clamp(smoothstep(float(0), softness, density).mul(opacity), 0, 1);
        return vec4(foamColor, coverage);
    })());
    pass.foamColor = foamColor;
    pass.opacity = opacity;
    pass.softness = softness;
    pass.material.transparent = true;
    pass.material.blending = NormalBlending;
    pass.source = source;
    return pass;
}

// Sparkle — additive glints on foam crests. Each grid cell flickers via a
// time-stepped hash; sparkles appear only where foam is present, giving the
// "glittering white-water" look. Drawn additively over the display.
export function createSparklePass() {
    const foam = texture(emptyTexture);
    const time = uniform(0);
    const amount = uniform(0);
    const scale = uniform(130);
    const speed = uniform(1);

    const pass = new FullscreenPass('sparkle', Fn(() => {
        const st = solverUv();
        const foamValue = sample(foam, st).r;
        // One soft round twinkle per grid cell, placed at a hashed position and
        // flickering over time. Gated strongly on foam so sparkle only appears
        // on white-water — never as blocky cells across empty space.
        const grid = st.mul(scale);
        const cell = floor(grid);
        const local = fract(grid);
        const px = hash2(cell.add(vec2(1.3, 7.1)));
        const py = hash2(cell.add(vec2(5.2, 3.4)));
        const dist = length(local.sub(vec2(px, py)));
        const round = smoothstep(0.28, 0, dist);
        const tick = floor(time.mul(speed).mul(6));
        const flicker = smoothstep(0.84, 1, hash2(cell.add(tick.mul(2.13))));
        const foamGate = smoothstep(0.32, 0.7, foamValue);
        const glint = round.mul(flicker).mul(foamGate).mul(amount);
        const spark = vec3(0.95, 0.98, 1).mul(glint);

        return vec4(spark, glint);
    })());

    pass.material.transparent = true;
    pass.material.blending = AdditiveBlending;
    pass.foam = foam;
    pass.time = time;
    pass.amount = amount;
    pass.scale = scale;
    pass.speed = speed;

    return pass;
}

// Reaction-diffusion step. Operates on a packed two-species field:
//   r = U (substrate / activator), g = V (autocatalyst / inhibitor).
// The Laplacian uses the standard 9-point kernel (orthogonal 0.2, diagonal
// 0.05, centre -1). One `model` integer selects the reaction term via select():
//   0 Gray-Scott · 1 Gierer-Meinhardt · 2 FitzHugh-Nagumo · 3 Brusselator ·
//   4 Schnakenberg · 5 Ginzburg-Landau (complex amplitude in r,g). See reactions/.
// `dt` here is the RD internal timestep (≈1), independent of the physics dt.
// Stiff models carry a small internal reaction-rate constant so they integrate
// stably at dt≈1 with a raw (unnormalised) Laplacian; the output is clamped.
export function createReactionDiffusionPass() {
    const source = texture(emptyTexture);
    const texelSize = uniform(new Vector2(1 / 128, 1 / 128));
    const dt = uniform(1);
    const du = uniform(0.16);
    const dv = uniform(0.08);
    const feed = uniform(0.055);
    const kill = uniform(0.062);
    const reactionRate = uniform(1);
    const model = uniform(0);

    const pass = new FullscreenPass('reactionDiffusion', Fn(() => {
        const st = solverUv();
        const tx = vec2(texelSize.x, 0);
        const ty = vec2(0, texelSize.y);

        const c = sample(source, st).xy;
        const l = sample(source, st.sub(tx)).xy;
        const r = sample(source, st.add(tx)).xy;
        const t = sample(source, st.add(ty)).xy;
        const b = sample(source, st.sub(ty)).xy;
        const tl = sample(source, st.sub(tx).add(ty)).xy;
        const tr = sample(source, st.add(tx).add(ty)).xy;
        const bl = sample(source, st.sub(tx).sub(ty)).xy;
        const br = sample(source, st.add(tx).sub(ty)).xy;

        // 9-point Laplacian (kernel sums to zero).
        const lap = l.add(r).add(t).add(b).mul(0.2)
            .add(tl.add(tr).add(bl).add(br).mul(0.05))
            .sub(c);

        const u = c.x;
        const v = c.y;
        const lapU = lap.x;
        const lapV = lap.y;

        // --- Gray-Scott (0) ---
        const gsU = u.add(du.mul(lapU).sub(u.mul(v).mul(v)).add(feed.mul(float(1).sub(u))).mul(dt));
        const gsV = v.add(dv.mul(lapV).add(u.mul(v).mul(v)).sub(feed.add(kill).mul(v)).mul(dt));

        // --- Gierer-Meinhardt (1): feed=rho source, kill=mu decay. Semi-
        // implicit Euler: the linear decay terms (−mu·U, −V) are treated
        // implicitly (the /denominator), which is unconditionally stable and
        // keeps the field bounded. Steady state U≈(feed+1)/kill, so kill must
        // be ~1 (set in the registry defaults) to keep U in range. ---
        const vSafe = max(v, float(0.1));
        const rGM = float(0.08).mul(reactionRate);
        const gmU = u.add(du.mul(lapU).mul(dt)).add(u.mul(u).div(vSafe).add(feed).mul(rGM).mul(dt))
            .div(float(1).add(rGM.mul(kill).mul(dt)));
        const gmV = v.add(dv.mul(lapV).mul(dt)).add(u.mul(u).mul(rGM).mul(dt))
            .div(float(1).add(rGM.mul(dt)));

        // --- FitzHugh-Nagumo (2): feed=stimulus I, kill=recovery b ---
        const fnU = u.add(du.mul(lapU).add(u.sub(u.mul(u).mul(u)).sub(v)).add(feed).mul(dt));
        const fnV = v.add(dv.mul(lapV).add(u.sub(kill.mul(v)).mul(0.25)).mul(dt));

        // --- Brusselator (3): feed=A, kill=B. Rest state U=A, V=B/A. Semi-
        // implicit Euler: the linear loss −(B+1)U on U and the −U²V loss on V
        // go implicit, taming the limit-cycle so it oscillates instead of
        // spiralling out to the clamp. ---
        const kBr = float(0.06).mul(reactionRate);
        const prodBr = u.mul(u).mul(v);
        const bruU = u.add(du.mul(lapU).mul(dt)).add(feed.add(prodBr).mul(kBr).mul(dt))
            .div(float(1).add(kBr.mul(kill.add(1)).mul(dt)));
        const bruV = v.add(dv.mul(lapV).mul(dt)).add(kill.mul(u).mul(kBr).mul(dt))
            .div(float(1).add(kBr.mul(u.mul(u)).mul(dt)));

        // --- Schnakenberg (4): feed=a, kill=b. Rest state U=a+b, V=b/(a+b)².
        // Semi-implicit; a stronger reaction rate pushes it past the Turing
        // threshold so spots/stripes actually nucleate. ---
        const kSc = float(0.5).mul(reactionRate);
        const prodSc = u.mul(u).mul(v);
        const schU = u.add(du.mul(lapU).mul(dt)).add(feed.add(prodSc).mul(kSc).mul(dt))
            .div(float(1).add(kSc.mul(dt)));
        const schV = v.add(dv.mul(lapV).mul(dt)).add(kill.mul(kSc).mul(dt))
            .div(float(1).add(kSc.mul(u.mul(u)).mul(dt)));

        // --- Complex Ginzburg-Landau (5): A = U + iV. feed=b (dispersion),
        // kill=c (nonlinear phase). Spiral defect turbulence. ---
        const mag2 = u.mul(u).add(v.mul(v));
        const lapReal = du.mul(lapU.sub(feed.mul(lapV)));
        const lapImag = du.mul(lapV.add(feed.mul(lapU)));
        const nlReal = mag2.mul(u.sub(kill.mul(v)));
        const nlImag = mag2.mul(v.add(kill.mul(u)));
        const glU = u.add(u.add(lapReal).sub(nlReal).mul(0.12).mul(reactionRate).mul(dt));
        const glV = v.add(v.add(lapImag).sub(nlImag).mul(0.12).mul(reactionRate).mul(dt));

        const outU = select(model.greaterThan(4.5), glU,
            select(model.greaterThan(3.5), schU,
                select(model.greaterThan(2.5), bruU,
                    select(model.greaterThan(1.5), fnU,
                        select(model.greaterThan(0.5), gmU, gsU)))));
        const outV = select(model.greaterThan(4.5), glV,
            select(model.greaterThan(3.5), schV,
                select(model.greaterThan(2.5), bruV,
                    select(model.greaterThan(1.5), fnV,
                        select(model.greaterThan(0.5), gmV, gsV)))));

        // Lower bound is 0 for the concentration models (Gray-Scott 0,
        // Gierer-Meinhardt 1, Brusselator 3, Schnakenberg 4) so advection
        // overshoot can't drive a chemical amount negative and pollute the
        // field. FitzHugh-Nagumo (2) and Ginzburg-Landau (5) are signed
        // (excitable / complex amplitude) and keep a negative floor.
        const loBase = select(model.greaterThan(4.5), float(-2), float(0));
        const lo = select(model.lessThan(2.5),
            select(model.greaterThan(1.5), float(-2), loBase), loBase);
        return vec4(clamp(outU, lo, 3), clamp(outV, lo, 3), 0, 1);
    })());

    pass.source = source;
    pass.texelSize = texelSize;
    pass.dt = dt;
    pass.du = du;
    pass.dv = dv;
    pass.feed = feed;
    pass.kill = kill;
    pass.reactionRate = reactionRate;
    pass.model = model;

    return pass;
}

// Reaction-diffusion composite — high-quality visualisation of the V channel:
// a two-colour ramp with a smooth third highlight colour, relief lighting from
// the concentration gradient (emboss), a rim/edge term where the pattern
// fronts steepen, and an additive glow on dense ridges. Kept separate from the
// fragile display shader, like smokeComposite.
export function createReactionCompositePass() {
    const source = texture(emptyTexture);
    const texelSize = uniform(new Vector2(1 / 128, 1 / 128));
    const colorA = uniform(new Vector3(0.02, 0.06, 0.15));
    const colorB = uniform(new Vector3(0.35, 0.86, 1));
    const opacity = uniform(1);
    const relief = uniform(1);
    const glow = uniform(0.6);
    const lightDir = uniform(new Vector3(-0.4, 0.6, 0.7));

    const pass = new FullscreenPass('reactionComposite', Fn(() => {
        const st = solverUv();
        const tx = vec2(texelSize.x, 0);
        const ty = vec2(0, texelSize.y);

        const v = clamp(sample(source, st).y, 0, 1);
        const vl = sample(source, st.sub(tx)).y;
        const vr = sample(source, st.add(tx)).y;
        const vb = sample(source, st.sub(ty)).y;
        const vt = sample(source, st.add(ty)).y;

        // Height-field normal from the V gradient (relief / emboss).
        const grad = vec2(vr.sub(vl), vt.sub(vb)).mul(relief.mul(4));
        const normal = normalize(vec3(grad.x.negate(), grad.y.negate(), 1));
        const lambert = clamp(dot(normal, normalize(lightDir)), 0, 1).mul(0.6).add(0.4);
        const edge = clamp(length(grad), 0, 1);

        // Two-tone ramp with a brightened crest highlight on dense ridges.
        const ramp = smoothstep(0.08, 0.5, v);
        let rgb = mix(colorA, colorB, ramp);
        rgb = rgb.mul(lambert);
        rgb = rgb.add(colorB.mul(edge).mul(glow));                 // ridge glow
        rgb = mix(rgb, vec3(1), smoothstep(0.55, 0.95, v).mul(0.35)); // hot crest

        const alpha = clamp(smoothstep(0.04, 0.3, v).add(edge.mul(0.4)), 0, 1).mul(opacity);
        return vec4(rgb, alpha);
    })());

    pass.material.transparent = true;
    pass.material.blending = NormalBlending;
    pass.source = source;
    pass.texelSize = texelSize;
    pass.colorA = colorA;
    pass.colorB = colorB;
    pass.opacity = opacity;
    pass.relief = relief;
    pass.glow = glow;
    pass.lightDir = lightDir;

    return pass;
}

// Reaction ↔ dye coupling — the core of making the reaction-diffusion part of
// the fluid instead of a separate overlay. Each step it sculpts the dye by the
// RD pattern: the V channel is mapped to a 0..1 "activator" signal `a` via the
// per-model [vLo,vHi] range, then
//   • the dye DISSOLVES in the inhibited regions (a→0) — the fluid literally
//     dissolves according to the reaction (couple·dissolve·(1−a));
//   • surviving dye is tinted toward the RD colour ramp by `a` and its ridges
//     are brightened — so the ink reorganises into the pattern as it flows.
// Reads dye + chem, writes dye. Mean-independent edge term keeps contours crisp.
export function createReactionDyeCouplePass() {
    const dye = texture(emptyTexture);
    const chem = texture(emptyTexture);
    const texelSize = uniform(new Vector2(1 / 128, 1 / 128));
    const colorA = uniform(new Vector3(0.02, 0.06, 0.15));
    const colorB = uniform(new Vector3(0.35, 0.86, 1));
    const vLo = uniform(0.08);
    const vHi = uniform(0.35);
    const couple = uniform(1);      // overall coupling strength 0..1
    const dissolve = uniform(1);    // how strongly the ink dissolves in valleys
    const tint = uniform(1);        // how strongly the ink takes the RD colour
    const dt = uniform(1 / 60);

    const pass = new FullscreenPass('reactionDyeCouple', Fn(() => {
        const st = solverUv();
        const base = sample(dye, st).xyz;
        const v = sample(chem, st).y;
        const a = smoothstep(vLo, vHi, v);          // 0..1 activator signal

        // 1. Dissolve the ink where the reaction is inhibited (a→0). Bounded
        //    multiplicative fade — the fluid dissolves according to the pattern.
        const fade = clamp(float(1).sub(couple.mul(dissolve).mul(dt).mul(float(1).sub(a))), 0, 1);
        let out = base.mul(fade);

        // 2. Tint the surviving ink TOWARD the RD ramp (bounded lerp, never
        //    additive — so no runaway brightness and empty regions stay empty:
        //    the target tracks the dye's own intensity). The ramp goes
        //    colorA (valleys) → colorB (ridges) by the pattern signal.
        const luma = max(out.x, max(out.y, out.z));
        const ramp = mix(colorA, colorB, a);
        const target = ramp.mul(max(luma, float(0.001))).mul(1.6);
        const tintAmt = clamp(couple.mul(tint).mul(dt).mul(a).mul(4), 0, 0.6);
        out = mix(out, target, tintAmt);

        return vec4(out, 1);
    })());

    pass.dye = dye;
    pass.chem = chem;
    pass.texelSize = texelSize;
    pass.colorA = colorA;
    pass.colorB = colorB;
    pass.vLo = vLo;
    pass.vHi = vHi;
    pass.couple = couple;
    pass.dissolve = dissolve;
    pass.tint = tint;
    pass.dt = dt;

    return pass;
}

// Dissolution — the unified "ways fluid disappears" pass, applied to the dye
// field. Combines (C.1) exponential decay, (C.2) molecular diffusion, (C.3)
// turbulent mixing (diffusion scaled by local flow speed), and (C.5) a flat
// evaporation subtraction that erases faint dye toward the background. Each is
// an independent strength; all zero = no-op.
export function createDissolvePass() {
    const source = texture(emptyTexture);
    const velocity = texture(emptyTexture);
    const texelSize = uniform(new Vector2(1 / 128, 1 / 128));
    const dt = uniform(1 / 60);
    const decay = uniform(0);
    const diffuse = uniform(0);
    const mixStrength = uniform(0);
    const evaporate = uniform(0);
    const settle = uniform(0);

    const pass = new FullscreenPass('dissolve', Fn(() => {
        const st = solverUv();
        const tx = vec2(texelSize.x, 0);
        const ty = vec2(0, texelSize.y);

        const c = sample(source, st).xyz;
        const l = sample(source, st.sub(tx)).xyz;
        const r = sample(source, st.add(tx)).xyz;
        const t = sample(source, st.add(ty)).xyz;
        const b = sample(source, st.sub(ty)).xyz;
        const lap = l.add(r).add(t).add(b).sub(c.mul(4));

        // Turbulent mixing: stirred regions diffuse faster.
        const speed = length(sample(velocity, st).xy);
        const diffAmt = clamp(diffuse.add(mixStrength.mul(speed).mul(0.0008)).mul(dt), 0, 0.24);

        let result = c.add(lap.mul(diffAmt));

        // Sedimentation (C.10): dense dye drifts downward — pull from the cell
        // above (higher solver-uv y) so colour appears to settle/sink.
        const above = sample(source, st.add(ty)).xyz;
        result = result.add(above.sub(c).mul(clamp(settle.mul(dt), 0, 0.5)));

        result = result.mul(exp(decay.mul(dt).negate()));
        result = max(result.sub(evaporate.mul(dt)), vec3(0));

        return vec4(result, 1);
    })());

    pass.source = source;
    pass.velocity = velocity;
    pass.texelSize = texelSize;
    pass.dt = dt;
    pass.decay = decay;
    pass.diffuse = diffuse;
    pass.mixStrength = mixStrength;
    pass.evaporate = evaporate;
    pass.settle = settle;

    return pass;
}

// Chemical dissolution (C.7) + precipitation (C.8). A soluble solid field
// (the obstacle mask, used as un-dissolved material) erodes into the dye field
// at its wetted interface, limited by local saturation; stirring speeds it up.
// When saturation exceeds the supersaturation threshold the solute
// re-precipitates back onto the solid (coffee-ring / crystal growth).
//
// Three output passes share one set of uniform nodes and one `rates()` helper
// so the solid-carve, dye-deposit and saturation updates stay consistent. All
// three read the pre-step solid/saturation; the host swaps afterwards.
export function createChemicalDissolveSystem() {
    const solid = texture(emptyTexture);
    const saturation = texture(emptyTexture);
    const velocity = texture(emptyTexture);
    const dye = texture(emptyTexture);
    const texelSize = uniform(new Vector2(1 / 128, 1 / 128));
    const dt = uniform(1 / 60);
    const rate = uniform(0.5);
    const solubility = uniform(1);
    const stirGain = uniform(1);
    const supersat = uniform(1);
    const precipRate = uniform(0.2);
    const soluteColor = uniform(new Vector3(0.6, 0.85, 1));

    // Returns vec2(dissolveAmount, precipitateAmount) at a solver-uv coord.
    const rates = Fn(([st]) => {
        const tx = vec2(texelSize.x, 0);
        const ty = vec2(0, texelSize.y);
        const s = sample(solid, st).r;
        const neigh = sample(solid, st.sub(tx)).r
            .add(sample(solid, st.add(tx)).r)
            .add(sample(solid, st.sub(ty)).r)
            .add(sample(solid, st.add(ty)).r).mul(0.25);
        const interface_ = clamp(s.sub(neigh).add(0.15), 0, 1).mul(step(0.05, s));
        const sat = sample(saturation, st).r;
        const speed = length(sample(velocity, st).xy);
        const headroom = max(solubility.sub(sat), 0);
        const dissolve = rate.mul(interface_).mul(headroom)
            .mul(float(1).add(stirGain.mul(speed).mul(0.0006))).mul(dt);
        const precip = precipRate.mul(max(sat.sub(supersat), 0)).mul(dt);
        return vec2(min(dissolve, s), precip);
    });

    const assign = (pass) => {
        pass.solid = solid; pass.saturation = saturation; pass.velocity = velocity;
        pass.dye = dye; pass.soluteColor = soluteColor; pass.texelSize = texelSize;
        pass.dt = dt; pass.rate = rate; pass.solubility = solubility;
        pass.stirGain = stirGain; pass.supersat = supersat; pass.precipRate = precipRate;
        return pass;
    };

    // saturation += dissolved − precipitated.
    const saturationPass = new FullscreenPass('chemSaturation', Fn(() => {
        const st = solverUv();
        const rp = rates(st);
        return vec4(max(sample(saturation, st).r.add(rp.x).sub(rp.y), 0), 0, 0, 1);
    })());

    // solid −= dissolved, += precipitated.
    const carvePass = new FullscreenPass('chemCarve', Fn(() => {
        const st = solverUv();
        const rp = rates(st);
        return vec4(clamp(sample(solid, st).r.sub(rp.x).add(rp.y), 0, 1), 0, 0, 1);
    })());

    // dye += soluteColor * dissolved.
    const depositPass = new FullscreenPass('chemDeposit', Fn(() => {
        const st = solverUv();
        const rp = rates(st);
        return vec4(sample(dye, st).xyz.add(soluteColor.mul(rp.x.mul(6))), 1);
    })());

    return {
        saturation: assign(saturationPass),
        carve: assign(carvePass),
        deposit: assign(depositPass)
    };
}

// Beer-Lambert optical absorption (C.11). A display-side composite: the dye is
// re-tinted so thick regions go deep/saturated and thin regions fade toward
// transparency with a per-channel extinction — "dissolving into light" without
// removing mass. Multiplicative over the display.
export function createAbsorptionCompositePass() {
    const dye = texture(emptyTexture);
    const extinction = uniform(new Vector3(0.2, 0.05, 0.02));
    const strength = uniform(0);

    const pass = new FullscreenPass('absorption', Fn(() => {
        const st = solverUv();
        const thickness = luminanceMax(sample(dye, st).xyz).mul(strength);
        // Transmittance per channel; high extinction channels absorb faster.
        const transmit = exp(extinction.mul(thickness).negate());
        return vec4(transmit, clamp(strength, 0, 1));
    })());

    pass.material.transparent = true;
    pass.material.blending = CustomBlending;
    pass.material.blendEquation = AddEquation;
    pass.material.blendSrc = DstColorFactor;
    pass.material.blendDst = ZeroFactor;
    pass.dye = dye;
    pass.extinction = extinction;
    pass.strength = strength;
    return pass;
}

export function createGradientSubtractPass() {
    const pressure = texture(emptyTexture);
    const velocity = texture(emptyTexture);
    const texelSize = uniform(new Vector2(1 / 128, 1 / 128));

    const pass = new FullscreenPass('gradientSubtract', Fn(() => {
        const st = solverUv();
        const left = sample(pressure, st.sub(vec2(texelSize.x, 0))).x;
        const right = sample(pressure, st.add(vec2(texelSize.x, 0))).x;
        const top = sample(pressure, st.add(vec2(0, texelSize.y))).x;
        const bottom = sample(pressure, st.sub(vec2(0, texelSize.y))).x;
        const nextVelocity = sample(velocity, st).xy.sub(vec2(right.sub(left), top.sub(bottom)));

        return vec4(nextVelocity, 0, 1);
    })());

    pass.pressure = pressure;
    pass.velocity = velocity;
    pass.texelSize = texelSize;

    return pass;
}

export function createBlurPass() {
    const source = texture(emptyTexture);
    const texelSize = uniform(new Vector2(1 / 256, 0));

    const pass = new FullscreenPass('blur', Fn(() => {
        const st = solverUv();
        const center = sample(source, st).mul(0.29411764);
        const left = sample(source, st.sub(texelSize.mul(1.33333333))).mul(0.35294117);
        const right = sample(source, st.add(texelSize.mul(1.33333333))).mul(0.35294117);

        return center.add(left).add(right);
    })());

    pass.source = source;
    pass.texelSize = texelSize;

    return pass;
}

export function createBloomPrefilterPass() {
    const source = texture(emptyTexture);
    const curve = uniform(new Vector3(0.3, 0.84, 0.89));
    const threshold = uniform(0.6);

    const pass = new FullscreenPass('bloomPrefilter', Fn(() => {
        const c = sample(source, solverUv()).rgb;
        const brightness = luminanceMax(c);
        const rq = clamp(brightness.sub(curve.x), 0, curve.y).mul(curve.z).mul(clamp(brightness.sub(curve.x), 0, curve.y));
        const scale = max(rq, brightness.sub(threshold)).div(max(brightness, 0.0001));

        return vec4(c.mul(scale), 0);
    })());

    pass.source = source;
    pass.curve = curve;
    pass.threshold = threshold;

    return pass;
}

export function createSunraysMaskPass() {
    const source = texture(emptyTexture);

    const pass = new FullscreenPass('sunraysMask', Fn(() => {
        const c = sample(source, solverUv());
        const brightness = luminanceMax(c.rgb);
        const alpha = float(1).sub(min(max(brightness.mul(20), 0), 0.8));

        return vec4(c.rgb, alpha);
    })());

    pass.source = source;

    return pass;
}

export function createSunraysPass() {
    const source = texture(emptyTexture);
    const weight = uniform(1);
    const lightSource = uniform(new Vector2(0.5, 0.5));

    const pass = new FullscreenPass('sunrays', Fn(() => {
        const st = solverUv();
        const dir = st.sub(lightSource).mul(0.3 / 16);
        const c0 = sample(source, st).a;
        const c1 = sample(source, st.sub(dir.mul(1))).a.mul(0.95);
        const c2 = sample(source, st.sub(dir.mul(2))).a.mul(0.9025);
        const c3 = sample(source, st.sub(dir.mul(3))).a.mul(0.857375);
        const c4 = sample(source, st.sub(dir.mul(4))).a.mul(0.81450625);
        const c5 = sample(source, st.sub(dir.mul(5))).a.mul(0.77378094);
        const c6 = sample(source, st.sub(dir.mul(6))).a.mul(0.7350919);
        const c7 = sample(source, st.sub(dir.mul(7))).a.mul(0.6983373);
        const c8 = sample(source, st.sub(dir.mul(8))).a.mul(0.66342044);
        const c9 = sample(source, st.sub(dir.mul(9))).a.mul(0.6302494);
        const c10 = sample(source, st.sub(dir.mul(10))).a.mul(0.59873694);
        const c11 = sample(source, st.sub(dir.mul(11))).a.mul(0.5688001);
        const c12 = sample(source, st.sub(dir.mul(12))).a.mul(0.5403601);
        const c13 = sample(source, st.sub(dir.mul(13))).a.mul(0.5133421);
        const c14 = sample(source, st.sub(dir.mul(14))).a.mul(0.487675);
        const c15 = sample(source, st.sub(dir.mul(15))).a.mul(0.46329123);
        const c16 = sample(source, st.sub(dir.mul(16))).a.mul(0.44012666);
        const colorValue = c0.add(c1.add(c2).add(c3).add(c4).add(c5).add(c6).add(c7).add(c8).add(c9).add(c10).add(c11).add(c12).add(c13).add(c14).add(c15).add(c16).mul(weight)).mul(0.7);

        return vec4(colorValue, 0, 0, 1);
    })());

    pass.source = source;
    pass.weight = weight;
    pass.lightSource = lightSource;

    return pass;
}

export function createDisplayPass() {
    const dye = texture(emptyTexture);
    const velocity = texture(emptyTexture);
    const temperature = texture(emptyTexture);
    const foam = texture(emptyTexture);
    const bloom = texture(emptyTexture);
    const sunrays = texture(emptyTexture);
    const obstacles = texture(emptyTexture);
    const dithering = texture(emptyTexture);
    const texelSize = uniform(new Vector2(1 / 1024, 1 / 1024));
    const ditherScale = uniform(new Vector2(1, 1));
    const displayStyle = uniform(0);
    const paletteA = uniform(new Color(0x081223));
    const paletteB = uniform(new Color(0x1af5c6));
    const paletteC = uniform(new Color(0xb452ff));
    const gradientScale = uniform(1);
    const gradientOffset = uniform(0);
    const materialContrast = uniform(1);
    const materialSaturation = uniform(1);
    const materialExposure = uniform(1);
    const colorUniforms = createColorUniforms();
    const materialUniforms = createMaterialUniforms();
    const outputGain = uniform(0.82);
    const chromaticAberration = uniform(0);
    const lensDistortion = uniform(0);
    const velocityDistortion = uniform(0);
    const refractionRatio = uniform(0.98);
    const filmGrain = uniform(0);
    const filmGrainSpeed = uniform(1);
    const vignette = uniform(0);
    const vignetteRadius = uniform(0.85);
    const motionBlur = uniform(0);
    const anamorphicBloom = uniform(0);
    const anamorphicRatio = uniform(4);
    const fxaaEnabled = uniform(0);
    const toneMapping = uniform(1);
    const lift = uniform(new Color(0x000000));
    const gamma = uniform(new Color(0xffffff));
    const gain = uniform(new Color(0xffffff));
    const time = uniform(0);
    const bloomEnabled = uniform(1);
    const sunraysEnabled = uniform(1);
    const shadingEnabled = uniform(1);

    const pass = new FullscreenPass('display', Fn(() => {
        const st = solverUv();
        const velocitySample = sample(velocity, st).xy;
        const centered = st.sub(0.5);
        const lensCoord = st.add(centered.mul(dot(centered, centered)).mul(lensDistortion));
        const distortionCoord = lensCoord.sub(velocitySample.mul(texelSize).mul(velocityDistortion).mul(refractionRatio));
        const speed = length(velocitySample);
        const chromaOffset = velocitySample.mul(texelSize).mul(chromaticAberration).mul(clamp(speed.mul(0.01), 0, 6));
        const baseSample = sample(dye, distortionCoord);
        const blurCoordA = distortionCoord.sub(velocitySample.mul(texelSize).mul(motionBlur).mul(0.25));
        const blurCoordB = distortionCoord.sub(velocitySample.mul(texelSize).mul(motionBlur).mul(0.5));
        const blurredBase = baseSample.rgb
            .add(sample(dye, blurCoordA).rgb)
            .add(sample(dye, blurCoordB).rgb)
            .div(3);
        const splitR = sample(dye, distortionCoord.add(chromaOffset)).r;
        const splitB = sample(dye, distortionCoord.sub(chromaOffset)).b;
        const chromaticBase = vec3(splitR, baseSample.g, splitB);
        const motionBase = mix(baseSample.rgb, blurredBase, clamp(motionBlur, 0, 1));
        const base = mix(motionBase, chromaticBase, clamp(chromaticAberration, 0, 1));
        const density = clamp(length(base).mul(gradientScale).add(gradientOffset), 0, 1);
        const temperatureValue = sample(temperature, st).r;
        const foamValue = sample(foam, st).r;
        const paletteColor = resolveColor(
            base,
            clamp(max(density, temperatureValue.mul(0.65)), 0, 1),
            speed,
            time,
            colorUniforms,
            { paletteA, paletteB, paletteC }
        );
        const mono = dot(paletteColor, vec3(0.2126, 0.7152, 0.0722));
        const saturated = mix(vec3(mono), paletteColor, materialSaturation);
        const graded = saturated.sub(0.5).mul(materialContrast).add(0.5).mul(materialExposure);
        const normal = computeNormal((coord) => sample(dye, coord), distortionCoord, texelSize, materialUniforms.normalStrength);
        const materialColor = compositeMaterial(max(graded, vec3(0)), normal, materialUniforms, displayStyle, density, speed);
        const shadedBase = select(displayStyle.lessThan(1.5), paletteColor, materialColor);
        const diffuse = clamp(dot(normal, vec3(0, 0, 1)).add(0.72), 0.65, 1);
        const shaded = mix(shadedBase, shadedBase.mul(diffuse), shadingEnabled);
        const ray = mix(float(1), sample(sunrays, st).r, sunraysEnabled);
        const noise = sample(dithering, st.mul(ditherScale)).r.mul(2).sub(1);
        const bloomStretch = texelSize.x.mul(anamorphicRatio);
        const bloomBase = sample(bloom, st).rgb;
        const bloomWide = bloomBase
            .add(sample(bloom, st.add(vec2(bloomStretch, 0))).rgb)
            .add(sample(bloom, st.sub(vec2(bloomStretch, 0))).rgb)
            .div(3);
        const bloomInput = max(mix(bloomBase, bloomWide, clamp(anamorphicBloom, 0, 1)).add(noise.div(255)), vec3(0));
        const bloomColor = bloomInput.pow(0.416666667).mul(1.055).sub(0.055);
        const bloomed = max(bloomColor, vec3(0)).mul(bloomEnabled).mul(ray);
        const foamColor = vec3(0.86, 0.94, 1).mul(foamValue).mul(0.8);
        const colorValue = shaded.mul(ray).add(bloomed).add(foamColor);
        const solid = sample(obstacles, st).r;
        const obstacleTint = vec3(1, 0.18, 0.08).mul(solid).mul(0.42);
        const rawFinal = colorValue.mul(float(1).sub(solid.mul(0.35))).add(obstacleTint).mul(outputGain);
        const lifted = max(rawFinal.add(lift), vec3(0));
        const gradedFinal = pow(lifted, vec3(1).div(max(gamma, vec3(0.001)))).mul(gain);
        const reinhard = gradedFinal.div(vec3(1).add(gradedFinal.mul(0.38)));
        const aces = clamp(
            gradedFinal.mul(2.51).add(0.03).mul(gradedFinal).div(gradedFinal.mul(2.43).add(0.59).mul(gradedFinal).add(0.14)),
            0,
            1
        );
        const uncharted = gradedFinal.mul(0.15).add(0.05).mul(gradedFinal).add(0.004)
            .div(gradedFinal.mul(0.15).add(0.5).mul(gradedFinal).add(0.06))
            .sub(0.066);
        const agx = clamp(log2(gradedFinal.add(vec3(0.000001))).mul(0.18).add(0.5), 0, 1);
        const agxCurve = agx.mul(agx).mul(float(3).sub(agx.mul(2)));
        const toneMapped = select(toneMapping.greaterThan(3.5), agxCurve,
            select(toneMapping.greaterThan(2.5), uncharted,
                select(toneMapping.greaterThan(1.5), aces,
                    select(toneMapping.greaterThan(0.5), reinhard, gradedFinal)
                )
            )
        );
        const fxaaNeighbor = sample(dye, st.add(texelSize)).rgb
            .add(sample(dye, st.sub(texelSize)).rgb)
            .mul(0.5);
        const fxaaBlend = mix(toneMapped, fxaaNeighbor.mul(0.2).add(toneMapped.mul(0.8)), fxaaEnabled);
        const vignetteDist = length(centered);
        const vignetteMask = mix(float(1), smoothstep(float(0.95), vignetteRadius, vignetteDist), vignette);
        const grainSeed = dot(st.mul(vec2(127.1, 311.7)), vec2(12.9898, 78.233)).add(time.mul(filmGrainSpeed));
        const grain = fract(sin(grainSeed).mul(43758.5453)).sub(0.5).mul(filmGrain);
        const finalColor = max(fxaaBlend.mul(vignetteMask).add(vec3(grain)), vec3(0));
        const alpha = clamp(max(luminanceMax(finalColor), solid.mul(0.5)), 0, 1);

        return vec4(finalColor, alpha);
    })());

    pass.material.transparent = true;
    pass.material.blending = CustomBlending;
    pass.material.blendSrc = OneFactor;
    pass.material.blendDst = OneMinusSrcAlphaFactor;
    pass.material.blendEquation = AddEquation;

    pass.dye = dye;
    pass.velocity = velocity;
    pass.temperature = temperature;
    pass.foam = foam;
    pass.bloom = bloom;
    pass.sunrays = sunrays;
    pass.obstacles = obstacles;
    pass.dithering = dithering;
    pass.texelSize = texelSize;
    pass.ditherScale = ditherScale;
    pass.displayStyle = displayStyle;
    pass.paletteA = paletteA;
    pass.paletteB = paletteB;
    pass.paletteC = paletteC;
    pass.gradientScale = gradientScale;
    pass.gradientOffset = gradientOffset;
    pass.materialContrast = materialContrast;
    pass.materialSaturation = materialSaturation;
    pass.materialExposure = materialExposure;
    pass.colorUniforms = colorUniforms;
    pass.materialUniforms = materialUniforms;
    pass.outputGain = outputGain;
    pass.chromaticAberration = chromaticAberration;
    pass.lensDistortion = lensDistortion;
    pass.velocityDistortion = velocityDistortion;
    pass.refractionRatio = refractionRatio;
    pass.filmGrain = filmGrain;
    pass.filmGrainSpeed = filmGrainSpeed;
    pass.vignette = vignette;
    pass.vignetteRadius = vignetteRadius;
    pass.motionBlur = motionBlur;
    pass.anamorphicBloom = anamorphicBloom;
    pass.anamorphicRatio = anamorphicRatio;
    pass.fxaaEnabled = fxaaEnabled;
    pass.toneMapping = toneMapping;
    pass.lift = lift;
    pass.gamma = gamma;
    pass.gain = gain;
    pass.time = time;
    pass.bloomEnabled = bloomEnabled;
    pass.sunraysEnabled = sunraysEnabled;
    pass.shadingEnabled = shadingEnabled;

    return pass;
}

export function createScalarDebugPass() {
    const source = texture(emptyTexture);
    const scale = uniform(1);
    const bias = uniform(0.5);

    const pass = new FullscreenPass('scalarDebug', Fn(() => {
        const value = sample(source, solverUv()).x.mul(scale).add(bias);
        return vec4(vec3(value), 1);
    })());

    pass.source = source;
    pass.scale = scale;
    pass.bias = bias;

    return pass;
}

export function createVectorDebugPass() {
    const source = texture(emptyTexture);
    const scale = uniform(0.01);

    const pass = new FullscreenPass('vectorDebug', Fn(() => {
        const value = sample(source, solverUv()).xy.mul(scale).add(0.5);
        return vec4(value.x, value.y, 0.5, 1);
    })());

    pass.source = source;
    pass.scale = scale;

    return pass;
}

export function createCheckerboardPass() {
    const aspectRatio = uniform(1);
    const pass = new FullscreenPass('checkerboard', Fn(() => {
        const st = solverUv();
        const scaled = vec2(st.x.mul(aspectRatio), st.y).mul(25);
        const grid = scaled.floor();
        const checker = grid.x.add(grid.y).mod(2).mul(0.1).add(0.8);

        return vec4(vec3(checker), 1);
    })());

    pass.aspectRatio = aspectRatio;

    return pass;
}
