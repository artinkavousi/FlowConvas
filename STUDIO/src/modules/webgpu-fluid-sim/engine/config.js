export const config = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 1024,
    CAPTURE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 1,
    VELOCITY_DISSIPATION: 0.2,
    PRESSURE: 0.8,
    PRESSURE_SOLVER: 'jacobi',
    PRESSURE_ITERATIONS: 20,
    MULTIGRID_LEVELS: 3,
    // Real geometric multigrid V-cycle controls (used when PRESSURE_SOLVER ===
    // 'multigrid'). CYCLES = number of V-cycles per solve; SMOOTH = red-black
    // smoothing sweeps per level per descent/ascent.
    MULTIGRID_CYCLES: 2,
    MULTIGRID_SMOOTH: 2,
    // Inter-grid transfer gains. With a unit-spacing smoother on every level,
    // restriction is full-weighting average (0.25) and prolongation adds the
    // correction directly (1.0). Exposed for tuning/validation.
    MULTIGRID_RESTRICT_GAIN: 0.25,
    MULTIGRID_PROLONG_GAIN: 1,
    // Boundary handling (Phase 1). OBSTACLE_BOUNDARY: 'noslip' zeros velocity
    // in solids (legacy); 'freeslip' removes only the wall-normal component.
    OBSTACLE_BOUNDARY: 'noslip',
    // DOMAIN_EDGE: 'closed' reflects at the domain border (legacy); 'open'
    // lets flow exit (zero-gradient / outflow).
    DOMAIN_EDGE: 'closed',
    CURL: 30,
    VISCOSITY: 0,
    VISCOSITY_ITERATIONS: 8,
    ADVECTION_METHOD: 'linear',
    // --- Solver upgrades (Phase 0/1) — all default to no-op so existing
    // presets are pixel-identical until opted into. ---
    // CFL-adaptive substepping: split the frame into N physics substeps when
    // the flow exceeds the CFL limit. Stabilises fast splats / high force.
    ADAPTIVE_SUBSTEP: false,
    MAX_SUBSTEPS: 4,
    // Turbulence injection: 'sin' = legacy sinusoidal force (unchanged),
    // 'curl' = divergence-free curl-noise (organic eddies, no added divergence).
    TURBULENCE_MODE: 'sin',
    CURL_NOISE_AMOUNT: 0,
    CURL_NOISE_SCALE: 3,
    CURL_NOISE_SPEED: 0.5,
    SPLAT_RADIUS: 0.25,
    OBSTACLE_RADIUS: 0.8,
    BRUSH_MODE: 'fluid',
    SPLAT_FORCE: 6000,
    SHADING: true,
    COLORFUL: true,
    COLOR_UPDATE_SPEED: 10,
    PAUSED: false,
    BACK_COLOR: { r: 0, g: 0, b: 0 },
    TRANSPARENT: false,
    BLOOM: true,
    BLOOM_ITERATIONS: 8,
    BLOOM_RESOLUTION: 256,
    BLOOM_INTENSITY: 0.58,
    BLOOM_THRESHOLD: 0.74,
    BLOOM_SOFT_KNEE: 0.7,
    SUNRAYS: true,
    SUNRAYS_RESOLUTION: 196,
    SUNRAYS_WEIGHT: 0.68,
    RENDER_MODE: 'fluid',
    // --- Ocean surface mode (Phase 6). RENDER_MODE:'ocean' swaps the display
    // for a Gerstner-wave water surface perturbed by the fluid velocity. ---
    OCEAN_WAVE_SCALE: 3.2,
    OCEAN_STEEPNESS: 1.0,
    OCEAN_CHOPPINESS: 0.55,
    OCEAN_FLOW: 0.6,
    OCEAN_WATER_COLOR: { r: 16, g: 84, b: 124 },
    OCEAN_DEEP_COLOR: { r: 3, g: 18, b: 38 },
    OCEAN_SKY_COLOR: { r: 150, g: 192, b: 236 },
    OCEAN_SUN: { x: -0.4, y: 0.55 },
    OCEAN_FRESNEL: 2.6,
    OCEAN_CAUSTICS: 0.45,
    OCEAN_FOAM: 0.85,
    DISPLAY_STYLE: 'classic',
    COLOR_MODE: 'gradient',
    MATERIAL_STYLE: 'dye',
    PALETTE_A: { r: 8, g: 18, b: 35 },
    PALETTE_B: { r: 26, g: 245, b: 198 },
    PALETTE_C: { r: 180, g: 82, b: 255 },
    PALETTE_D: { r: 255, g: 245, b: 168 },
    SINGLE_COLOR: { r: 70, g: 220, b: 255 },
    SECONDARY_COLOR: { r: 255, g: 92, b: 190 },
    COLOR_STOPS: [
        { position: 0, color: { r: 5, g: 12, b: 34 } },
        { position: 0.25, color: { r: 52, g: 245, b: 197 } },
        { position: 0.5, color: { r: 140, g: 92, b: 255 } },
        { position: 0.75, color: { r: 255, g: 92, b: 190 } },
        { position: 1, color: { r: 255, g: 245, b: 168 } }
    ],
    COLOR_BAND_COUNT: 5,
    RAINBOW_SPEED: 0.12,
    RAINBOW_RANGE: 0.85,
    HUE_SHIFT: 0,
    COLOR_SOURCE_MIX: 0.5,
    VELOCITY_COLOR_LOW: { r: 10, g: 20, b: 80 },
    VELOCITY_COLOR_MID: { r: 50, g: 200, b: 220 },
    VELOCITY_COLOR_HIGH: { r: 255, g: 60, b: 30 },
    TEMP_COLOR_COLD: { r: 20, g: 60, b: 255 },
    TEMP_COLOR_HOT: { r: 255, g: 80, b: 10 },
    AGE_COLOR_YOUNG: { r: 255, g: 255, b: 255 },
    AGE_COLOR_OLD: { r: 40, g: 10, b: 5 },
    TEMPERATURE_AMOUNT: 0,
    TEMPERATURE_DISSIPATION: 0.98,
    TEMPERATURE_SPLAT: 1,
    BUOYANCY_STRENGTH: 12,
    BUOYANCY_DIRECTION: 1.57,
    AGE_AMOUNT: 0,
    FOAM_AMOUNT: 0.6,
    FOAM_DISSIPATION: 0.92,
    FOAM_VELOCITY_THRESHOLD: 140,
    // --- White-water foam upgrades (Phase 2) — default no-op. ---
    // FOAM_ADVECTION makes the foam scalar flow with the velocity field (it is
    // static otherwise). Off by default to keep current foam look unchanged.
    FOAM_ADVECTION: false,
    // Extra generation criteria: foam collects in eddies (vorticity) and where
    // the surface folds / air is entrained (curvature ~ |divergence|). 0 = off.
    FOAM_VORTICITY_WEIGHT: 0,
    FOAM_CURVATURE_WEIGHT: 0,
    // Dense foam rises slightly, coupling a small upward velocity. 0 = off.
    FOAM_BUOYANCY: 0,
    // --- FX (Phase 7) ---
    // Splash: fast splats deposit a burst of foam (white-water on impact).
    SPLASH_THRESHOLD: 3000,   // |splat velocity| above which a splash fires
    SPLASH_FOAM: 0.9,         // foam amount deposited by a splash
    // Sparkle: glittering specular glints on foam crests (additive overlay).
    SPARKLE_AMOUNT: 0,
    SPARKLE_SCALE: 130,
    SPARKLE_SPEED: 1,
    // --- Particle layer (Phase 3/4) — CPU-simulated white-water sprites. ---
    PARTICLES_ENABLED: false,
    PARTICLE_SIZE: 1,
    // Coupling to the fluid: points are carried by the solver velocity field
    // (1 = fully advected). This is what makes them an extension of the solver.
    PARTICLE_FLOW: 1.0,
    PARTICLE_FLOW_FLIP_Y: false,
    PARTICLE_GRAVITY: 0.06,
    PARTICLE_LIFETIME: 3.0,    // long life so points trace flowing filaments
    PARTICLE_BRIGHTNESS: 1.0,  // additive intensity of the filament layer
    PARTICLE_DENSITY: 16,      // points emitted per splat (×role weight)
    PARTICLE_AMBIENT: 0,       // points seeded across the whole frame per frame
    PARTICLE_FOAM: 1,          // foam weight
    PARTICLE_SPRAY: 1,         // spray weight
    PARTICLE_BUBBLE: 0,        // bubble weight
    PARTICLE_SPARK: 0,         // spark weight
    PARTICLE_SPLASH_BURST: 40, // extra points on a splash (fast splat)
    TURBULENCE_AMOUNT: 0,
    TURBULENCE_SCALE: 4,
    TURBULENCE_SPEED: 0.8,
    // --- Smoke (Phase 5) — dedicated grey density field, off by default. ---
    SMOKE_ENABLED: false,
    SMOKE_DISSIPATION: 0.1,     // advection dissipation (lower = lingers longer)
    SMOKE_BUOYANCY: 0,         // upward velocity coupling from density
    SMOKE_SPLAT: 0.6,          // density injected per splat
    SMOKE_SHADOW: 0.6,         // self-shadow strength 0..1
    SMOKE_AMOUNT: 1,           // display opacity multiplier
    SMOKE_COLOR: { r: 198, g: 200, b: 210 },
    SMOKE_LIGHT: { x: -0.35, y: 0.7 },  // direction toward the light source
    // --- Reaction-diffusion (Part B) — chemical patterning on a packed
    // two-species field (r=U, g=V), advected by the flow. Off by default. ---
    RD_ENABLED: false,
    RD_MODEL: 'grayScott',     // grayScott | giererMeinhardt | fitzHughNagumo
    RD_FEED: 0.055,            // model-dependent: F / source rho / stimulus I
    RD_KILL: 0.062,            // model-dependent: k / decay mu / recovery b
    RD_DU: 0.16,               // U diffusion rate
    RD_DV: 0.08,               // V diffusion rate
    RD_TIMESTEP: 1.0,          // RD internal step (params are tuned for ~1)
    RD_SUBSTEPS: 8,            // RD iterations per physics step
    RD_REACTION_RATE: 1.0,     // global reaction-speed multiplier (stiff models)
    RD_FLOW_COUPLING: 0.5,     // 0 = static petri dish, 1 = fully carried by flow
    RD_SEED_ON_SPLAT: true,    // splats inject V (seed reactant)
    RD_SEED_AMOUNT: 0.9,
    // --- Dye coupling (default path) — the RD pattern sculpts the dye itself
    // so the fluid IS the reaction, not a separate overlay. ---
    RD_COUPLE: 1.0,            // overall coupling strength (0 = dye untouched)
    RD_DISSOLVE: 1.2,          // how strongly the ink dissolves in inhibited regions
    RD_TINT: 0.8,              // how strongly the ink takes the RD colour
    // --- Optional flat overlay (legacy look) — OFF by default. ---
    RD_OVERLAY: false,
    RD_OPACITY: 1.0,           // overlay blend over the display
    RD_RELIEF: 1.0,            // overlay emboss/relief lighting strength
    RD_GLOW: 0.6,              // overlay additive ridge glow
    RD_COLOR_A: { r: 6, g: 16, b: 38 },
    RD_COLOR_B: { r: 90, g: 220, b: 255 },
    // --- Dissolution (Part C) — ways the dye field disappears. Off by
    // default (DISSOLVE_ENABLED). ---
    DISSOLVE_ENABLED: false,
    DISSOLVE_DECAY: 0,         // C.1 exponential fade rate
    DISSOLVE_DIFFUSE: 0,       // C.2 molecular diffusion (edges bleed)
    DISSOLVE_MIX: 0,           // C.3 turbulent mixing (diffuse faster where stirred)
    DISSOLVE_EVAPORATE: 0,     // C.5 flat erase toward background (drying)
    DISSOLVE_SETTLE: 0,        // C.10 sedimentation — dense dye sinks
    // Chemical dissolution (C.7/C.8): paint an obstacle (soluble solid); it
    // erodes into dye, saturation-limited, and re-precipitates when supersat.
    CHEM_DISSOLVE_ENABLED: false,
    CHEM_RATE: 0.5,
    CHEM_SOLUBILITY: 1.0,
    CHEM_STIR: 1.0,
    CHEM_SUPERSAT: 1.0,
    CHEM_PRECIP: 0.2,
    CHEM_COLOR: { r: 150, g: 216, b: 255 },
    // Beer-Lambert optical absorption (C.11) — thick dye saturates, thin fades.
    ABSORPTION: 0,
    ABSORPTION_EXTINCTION: { x: 0.2, y: 0.5, z: 0.9 },
    GRADIENT_SCALE: 0.9,
    GRADIENT_OFFSET: 0,
    MATERIAL_CONTRAST: 1,
    MATERIAL_SATURATION: 0.95,
    MATERIAL_EXPOSURE: 0.9,
    MATERIAL_ROUGHNESS: 0.62,
    MATERIAL_SPECULAR: 0.18,
    MATERIAL_RIM: 0.22,
    MATERIAL_SHADOW: 0.2,
    MATERIAL_EMISSIVE: 0.35,
    LIGHT_X: -0.35,
    LIGHT_Y: 0.55,
    FRESNEL_POWER: 2.5,
    FRESNEL_BIAS: 0.1,
    NORMAL_STRENGTH: 1,
    ENV_INTENSITY: 0.3,
    REFRACTION_RATIO: 0.98,
    OUTPUT_GAIN: 1.05,
    CHROMATIC_ABERRATION: 0,
    LENS_DISTORTION: 0,
    VELOCITY_DISTORTION: 0,
    FILM_GRAIN: 0,
    FILM_GRAIN_SPEED: 1,
    VIGNETTE: 0,
    VIGNETTE_RADIUS: 0.85,
    MOTION_BLUR: 0,
    TONE_MAPPING: 'reinhard',
    LIFT: { r: 0, g: 0, b: 0 },
    GAMMA: { r: 1, g: 1, b: 1 },
    GAIN: { r: 1, g: 1, b: 1 },
    ANAMORPHIC_BLOOM: 0,
    ANAMORPHIC_RATIO: 4,
    GOD_RAY_SOURCE: { x: 0.5, y: 0.5 },
    FXAA_ENABLED: false,
    ADAPTIVE_VISUALS: false,
    GRAVITY_X: 0,
    GRAVITY_Y: 0,
    WIND_X: 0,
    WIND_Y: 0,
    EMITTERS_ENABLED: true,
    EMITTER_RATE: 9,
    EMITTER_INTENSITY: 0.48,
    EMITTER_AUDIO_REACTIVITY: 0.35,
    AUDIO_ENABLED: false,
    AUDIO_GAIN: 1,
    AUDIO_BINDING_MODE: 'off',
    AUDIO_FX_AMOUNT: 0.35,
    AUDIO_USE_WORKLET: false,
    AUDIO_LATENCY_MS: 0,
    SHOW_PERFORMANCE_HUD: true,
    VISUALIZER_MODE: 'bands',
    VISUALIZER_OPACITY: 0.72,
    FPS_TARGET: 60,
    AUTO_QUALITY: false,
    QUALITY_PROFILE: 'high',
    QUALITY_STATUS: 'manual',

    RECORD_FPS: 60,
    RECORD_MIME: 'video/webm;codecs=vp9',
    RECORD_BITS_PER_SECOND: 12000000,
    ACTIVE_PRESET: 'aurora'
};

export function applyDeviceDefaults(targetConfig) {
    if (isMobile()) {
        targetConfig.DYE_RESOLUTION = 512;
        targetConfig.BLOOM_ITERATIONS = Math.min(targetConfig.BLOOM_ITERATIONS, 4);
    } else if (isLikelyIntegratedGpu()) {
        // Heuristic — Intel Iris / UHD / mobile-discrete tier
        targetConfig.BLOOM_ITERATIONS = Math.min(targetConfig.BLOOM_ITERATIONS, 6);
    }

    return targetConfig;
}



// Returns true on devices likely lacking a discrete GPU. The WebGPU adapter
// info gives the real signal; we read it once on bootstrap. Until that info
// is available we heuristic on userAgent + hardware concurrency.
let _integratedDetected = null;
export function setIntegratedGpuFlag(value) { _integratedDetected = !!value; }
export function isLikelyIntegratedGpu() {
    if (_integratedDetected !== null) return _integratedDetected;
    // Conservative default: assume *not* integrated until proven otherwise.
    // The check from main.js will refine this.
    if (typeof navigator === 'undefined') return false;
    const cores = navigator.hardwareConcurrency || 8;
    if (cores <= 4) return true; // low-core devices usually integrated
    return false;
}

export function isMobile() {
    return /Mobi|Android/i.test(navigator.userAgent);
}
