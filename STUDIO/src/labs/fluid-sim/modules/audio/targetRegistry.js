// targetRegistry — declarative table of every modulation target the matrix
// can write into. Replaces the hardcoded TARGET_KEYS list in the old engine.
//
// Each entry: { id, group, label, range, mode (default), get(config), set(config, v) }
//
// `mode` is the default mixing mode but a route can override per-route.
// `cost` is a UI hint only.

export const TARGETS = [];
const TARGETS_BY_ID = new Map();

function add(entry) {
    if (!entry.get) entry.get = (config) => config[entry.id];
    if (!entry.set) entry.set = (config, value) => { config[entry.id] = value; };
    if (!entry.mode) entry.mode = 'add';
    if (!entry.cost) entry.cost = 'cheap';
    TARGETS.push(entry);
    TARGETS_BY_ID.set(entry.id, entry);
}

// --- Solver ----------------------------------------------------------
add({ id: 'CURL', group: 'Solver', label: 'Vorticity', range: [0, 80] });
add({ id: 'VISCOSITY', group: 'Solver', label: 'Viscosity', range: [0, 10] });
add({ id: 'DENSITY_DISSIPATION', group: 'Solver', label: 'Density diffusion', range: [0, 4] });
add({ id: 'VELOCITY_DISSIPATION', group: 'Solver', label: 'Velocity diffusion', range: [0, 4] });
add({ id: 'TURBULENCE_AMOUNT', group: 'Solver', label: 'Turbulence', range: [0, 80] });
add({ id: 'TURBULENCE_SCALE', group: 'Solver', label: 'Turb scale', range: [0.1, 16] });
add({ id: 'TURBULENCE_SPEED', group: 'Solver', label: 'Turb speed', range: [0, 4] });
add({ id: 'CURL_NOISE_AMOUNT', group: 'Solver', label: 'Curl-noise amt', range: [0, 4000] });
add({ id: 'CURL_NOISE_SCALE', group: 'Solver', label: 'Curl-noise scale', range: [0.5, 12] });
add({ id: 'FOAM_AMOUNT', group: 'Solver', label: 'Foam', range: [0, 1] });
add({ id: 'FOAM_VORTICITY_WEIGHT', group: 'Solver', label: 'Foam in eddies', range: [0, 8] });
add({ id: 'FOAM_CURVATURE_WEIGHT', group: 'Solver', label: 'Foam on folds', range: [0, 8] });
add({ id: 'FOAM_BUOYANCY', group: 'Solver', label: 'Foam buoyancy', range: [0, 200] });
add({ id: 'BUOYANCY_STRENGTH', group: 'Solver', label: 'Buoyancy', range: [-30, 30] });
add({ id: 'BUOYANCY_DIRECTION', group: 'Solver', label: 'Buoyancy dir', range: [-Math.PI, Math.PI] });
add({ id: 'TEMPERATURE_AMOUNT', group: 'Solver', label: 'Temperature', range: [0, 1] });
add({ id: 'GRAVITY_X', group: 'Solver', label: 'Gravity X', range: [-80, 80] });
add({ id: 'GRAVITY_Y', group: 'Solver', label: 'Gravity Y', range: [-80, 80] });
add({ id: 'WIND_X', group: 'Solver', label: 'Wind X', range: [-80, 80] });
add({ id: 'WIND_Y', group: 'Solver', label: 'Wind Y', range: [-80, 80] });
add({ id: 'SPLAT_RADIUS', group: 'Splat', label: 'Splat radius', range: [0.01, 1] });
add({ id: 'SPLAT_FORCE', group: 'Splat', label: 'Splat force', range: [0, 12000] });
add({ id: 'EMITTER_RATE', group: 'Splat', label: 'Emitter rate', range: [0, 80] });
add({ id: 'EMITTER_INTENSITY', group: 'Splat', label: 'Emitter intensity', range: [0, 2] });
add({ id: 'EMITTER_AUDIO_REACTIVITY', group: 'Splat', label: 'Emitter audio gain', range: [0, 2] });

// --- Color ----------------------------------------------------------
add({ id: 'HUE_SHIFT', group: 'Color', label: 'Hue shift', range: [-360, 360] });
add({ id: 'RAINBOW_SPEED', group: 'Color', label: 'Rainbow speed', range: [0, 1.2] });
add({ id: 'RAINBOW_RANGE', group: 'Color', label: 'Rainbow range', range: [0, 1] });
add({ id: 'GRADIENT_SCALE', group: 'Color', label: 'Gradient scale', range: [0.1, 4] });
add({ id: 'GRADIENT_OFFSET', group: 'Color', label: 'Gradient offset', range: [-1, 1] });
add({ id: 'COLOR_SOURCE_MIX', group: 'Color', label: 'Dye mix', range: [0, 1] });

// --- Material -------------------------------------------------------
add({ id: 'MATERIAL_EMISSIVE', group: 'Material', label: 'Emissive', range: [0, 2] });
add({ id: 'MATERIAL_CONTRAST', group: 'Material', label: 'Contrast', range: [0, 3] });
add({ id: 'MATERIAL_SATURATION', group: 'Material', label: 'Saturation', range: [0, 3] });
add({ id: 'MATERIAL_EXPOSURE', group: 'Material', label: 'Exposure', range: [0, 3] });
add({ id: 'MATERIAL_ROUGHNESS', group: 'Material', label: 'Roughness', range: [0.02, 1] });
add({ id: 'MATERIAL_SPECULAR', group: 'Material', label: 'Specular', range: [0, 2] });
add({ id: 'MATERIAL_RIM', group: 'Material', label: 'Rim', range: [0, 2] });
add({ id: 'FRESNEL_POWER', group: 'Material', label: 'Fresnel', range: [0.2, 8] });
add({ id: 'NORMAL_STRENGTH', group: 'Material', label: 'Normal', range: [0, 4] });

// --- Post FX --------------------------------------------------------
add({ id: 'BLOOM_INTENSITY', group: 'PostFX', label: 'Bloom intensity', range: [0, 2] });
add({ id: 'BLOOM_THRESHOLD', group: 'PostFX', label: 'Bloom threshold', range: [0, 1] });
add({ id: 'SUNRAYS_WEIGHT', group: 'PostFX', label: 'Sunrays', range: [0, 1.5] });
add({ id: 'CHROMATIC_ABERRATION', group: 'PostFX', label: 'Chromatic', range: [0, 8] });
add({ id: 'LENS_DISTORTION', group: 'PostFX', label: 'Lens', range: [-0.8, 0.8] });
add({ id: 'VELOCITY_DISTORTION', group: 'PostFX', label: 'Flow distort', range: [0, 8] });
add({ id: 'FILM_GRAIN', group: 'PostFX', label: 'Film grain', range: [0, 1] });
add({ id: 'VIGNETTE', group: 'PostFX', label: 'Vignette', range: [0, 1] });
add({ id: 'MOTION_BLUR', group: 'PostFX', label: 'Motion blur', range: [0, 1] });
add({ id: 'ANAMORPHIC_BLOOM', group: 'PostFX', label: 'Anamorphic bloom', range: [0, 1] });
add({ id: 'OUTPUT_GAIN', group: 'PostFX', label: 'Output gain', range: [0.1, 2] });
add({
    id: 'GOD_RAY_SOURCE.x',
    group: 'PostFX', label: 'God ray X',
    range: [0.05, 0.95],
    get: (c) => c.GOD_RAY_SOURCE?.x ?? 0.5,
    set: (c, v) => { c.GOD_RAY_SOURCE = c.GOD_RAY_SOURCE || { x: 0.5, y: 0.5 }; c.GOD_RAY_SOURCE.x = v; }
});
add({
    id: 'GOD_RAY_SOURCE.y',
    group: 'PostFX', label: 'God ray Y',
    range: [0.05, 0.95],
    get: (c) => c.GOD_RAY_SOURCE?.y ?? 0.5,
    set: (c, v) => { c.GOD_RAY_SOURCE = c.GOD_RAY_SOURCE || { x: 0.5, y: 0.5 }; c.GOD_RAY_SOURCE.y = v; }
});

// --- Particles ------------------------------------------------------
add({ id: 'PARTICLES_ENABLED', group: 'Particles', label: 'Particles on', range: [0, 1], cost: 'moderate',
    set: (c, v) => { c.PARTICLES_ENABLED = v > 0.5; },
    get: (c) => c.PARTICLES_ENABLED ? 1 : 0 });
add({ id: 'PARTICLE_SPAWN_RATE', group: 'Particles', label: 'Spawn rate', range: [0, 3500] });
add({ id: 'PARTICLE_TURBULENCE', group: 'Particles', label: 'P.turbulence', range: [0, 3] });
add({ id: 'PARTICLE_JITTER', group: 'Particles', label: 'P.jitter', range: [0, 3] });
add({ id: 'PARTICLE_OPACITY', group: 'Particles', label: 'P.opacity', range: [0, 1] });
add({ id: 'PARTICLE_VELOCITY_STRETCH', group: 'Particles', label: 'P.stretch', range: [0, 4] });
add({ id: 'PARTICLE_CURL_COUPLING', group: 'Particles', label: 'P.curl coupling', range: [0, 2] });
add({ id: 'PARTICLE_BLOOM_CONTRIB', group: 'Particles', label: 'P.bloom', range: [0, 1] });
add({ id: 'PARTICLE_FEEDBACK_VELOCITY', group: 'Particles', label: 'P.feedback vel', range: [0, 1] });
add({ id: 'PARTICLE_FEEDBACK_DYE', group: 'Particles', label: 'P.feedback dye', range: [0, 1] });
add({ id: 'PARTICLE_BUDGET_SCALE', group: 'Particles', label: 'P.budget', range: [0.05, 1] });

// --- Reaction-Diffusion --------------------------------------------
add({ id: 'RD_FEED', group: 'Reaction', label: 'RD feed', range: [0, 4] });
add({ id: 'RD_KILL', group: 'Reaction', label: 'RD kill', range: [0, 4] });
add({ id: 'RD_REACTION_RATE', group: 'Reaction', label: 'RD rate', range: [0.1, 3] });
add({ id: 'RD_FLOW_COUPLING', group: 'Reaction', label: 'RD flow coupling', range: [0, 1] });
add({ id: 'RD_OPACITY', group: 'Reaction', label: 'RD opacity', range: [0, 1] });
add({ id: 'RD_GLOW', group: 'Reaction', label: 'RD glow', range: [0, 2] });
add({ id: 'RD_COUPLE', group: 'Reaction', label: 'RD couple to dye', range: [0, 1] });
add({ id: 'RD_DISSOLVE', group: 'Reaction', label: 'RD dissolve ink', range: [0, 4] });
add({ id: 'RD_TINT', group: 'Reaction', label: 'RD tint ink', range: [0, 2] });

// --- Dissolution ----------------------------------------------------
add({ id: 'DISSOLVE_DECAY', group: 'Dissolve', label: 'Decay', range: [0, 4] });
add({ id: 'DISSOLVE_DIFFUSE', group: 'Dissolve', label: 'Diffuse', range: [0, 8] });
add({ id: 'DISSOLVE_MIX', group: 'Dissolve', label: 'Turbulent mix', range: [0, 8] });
add({ id: 'DISSOLVE_EVAPORATE', group: 'Dissolve', label: 'Evaporate', range: [0, 2] });
add({ id: 'DISSOLVE_SETTLE', group: 'Dissolve', label: 'Sediment', range: [0, 4] });
add({ id: 'CHEM_RATE', group: 'Dissolve', label: 'Chem rate', range: [0, 4] });
add({ id: 'ABSORPTION', group: 'Dissolve', label: 'Absorption', range: [0, 4] });

// --- World hook -----------------------------------------------------
// A "world" reference holding { config, particles, emitters } so dynamic
// targets (particles.<role>.*, emitter.<id>.*) can resolve correctly.
let _world = null;
export function setTargetWorld(world) { _world = world; }
export function getTargetWorld() { return _world; }

// --- Dynamic targets: particle roles --------------------------------
// `particles.<role>.<field>` writes into ParticleSystemV2.world.audioTargets.
const PARTICLE_ROLE_FIELDS = {
    spawnGain:    { range: [0, 4],  mode: 'mul' },
    sizeGain:     { range: [0.25, 4], mode: 'mul' },
    opacityGain:  { range: [0, 2],  mode: 'mul' },
    hueShift:     { range: [-0.5, 0.5], mode: 'add' },
    forceGain:    { range: [0, 4],  mode: 'mul' },
    lifetimeGain: { range: [0.4, 3], mode: 'mul' },
    buoyancyGain: { range: [0, 3],  mode: 'mul' },
    jitterGain:   { range: [0, 3],  mode: 'mul' }
};

function resolveParticleRoleTarget(id) {
    // id like "particles.foam.spawnGain"
    const parts = id.split('.');
    if (parts.length !== 3 || parts[0] !== 'particles') return null;
    const role = parts[1];
    const field = parts[2];
    const spec = PARTICLE_ROLE_FIELDS[field];
    if (!spec) return null;
    return {
        id,
        group: 'Particles',
        label: `${role}.${field}`,
        range: spec.range,
        mode: spec.mode,
        get: () => {
            const t = _world?.particles?.world?.audioTargets?.[role];
            return t ? (t[field] ?? 1) : 1;
        },
        set: (_unused, value) => {
            const t = _world?.particles?.world?.audioTargets?.[role];
            if (t) t[field] = value;
        }
    };
}

// Emitters now have native, built-in audio reactivity (a per-emitter Audio
// amount + band), so the old global `emitter.<id>.<field>` modulation targets
// were removed in the v0.6 clean rewrite.

export function getTarget(id) {
    let t = TARGETS_BY_ID.get(id);
    if (t) return t;
    if (id?.startsWith('particles.')) {
        t = resolveParticleRoleTarget(id);
        if (t) { TARGETS_BY_ID.set(id, t); return t; }
    }
    return null;
}

export function getTargetIds() {
    return TARGETS.map((t) => t.id);
}

export function getTargetsByGroup() {
    const map = new Map();
    for (const t of TARGETS) {
        const list = map.get(t.group) || [];
        list.push(t);
        map.set(t.group, list);
    }
    return map;
}

// Helpful for the UI: list all roles+fields that *could* be targeted.
export function getDynamicTargetsHint() {
    const out = [];
    const roles = ['foam', 'spray', 'spark', 'mist', 'bubble', 'ember', 'dust', 'ribbon', 'debris'];
    for (const r of roles) {
        for (const f of Object.keys(PARTICLE_ROLE_FIELDS)) {
            out.push({ id: `particles.${r}.${f}`, group: 'Particles', label: `${r}.${f}` });
        }
    }
    return out;
}
