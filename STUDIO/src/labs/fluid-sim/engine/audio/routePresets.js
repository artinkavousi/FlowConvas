// routePresets — built-in route sets that supersede the old
// AUDIO_BINDING_MODE = 'off' | 'balanced' | 'pulse' values.
//
// Each entry is an array of route descriptors consumed by ModulationMatrix.
// Keep these as plain data — they're meant to be authored, copied, and edited.

export const routePresets = {
    off: [],

    // "Balanced" — sustained energy lifts atmosphere; transient on bloom is light.
    balanced: [
        // Atmosphere
        { id: 'bal-aw-bloom',        source: 'loudness.aWeighted', target: 'BLOOM_INTENSITY',  mode: 'add', range: [0, 0.28], curve: { type: 'pow', k: 1.2 }, attack: 80, release: 320, label: 'Loudness → Bloom' },
        { id: 'bal-bass-bloom-kick', source: 'beat.pulse',         target: 'BLOOM_INTENSITY',  mode: 'add', range: [0, 0.18], attack: 5,  release: 220, label: 'Beat → Bloom kick' },
        { id: 'bal-aw-sunrays',      source: 'loudness.aWeighted', target: 'SUNRAYS_WEIGHT',   mode: 'add', range: [0, 0.32], attack: 90, release: 400, label: 'Loudness → Sunrays' },
        { id: 'bal-cent-hue',        source: 'spectral.centroid',  target: 'HUE_SHIFT',        mode: 'add', range: [-40, 40], attack: 200, release: 600, label: 'Brightness → Hue' },
        { id: 'bal-cent-grad',       source: 'spectral.centroid',  target: 'GRADIENT_OFFSET',  mode: 'add', range: [-0.15, 0.15], attack: 200, release: 600, label: 'Brightness → Gradient' },
        // Motion
        { id: 'bal-bass-curl',       source: 'bands.bass',         target: 'CURL',             mode: 'add', range: [0, 14],   attack: 30, release: 250, label: 'Bass → Curl' },
        { id: 'bal-mid-turb',        source: 'bands.mid',          target: 'TURBULENCE_AMOUNT',mode: 'add', range: [0, 22],   attack: 30, release: 250, label: 'Mid → Turbulence' },
        { id: 'bal-air-chroma',      source: 'bands.air',          target: 'CHROMATIC_ABERRATION', mode: 'add', range: [0, 0.7], attack: 20, release: 220, label: 'Air → Chromatic' },
        { id: 'bal-bass-veldis',     source: 'bands.bass',         target: 'VELOCITY_DISTORTION', mode: 'add', range: [0, 0.45], attack: 20, release: 220, label: 'Bass → Flow distort' },
        // Splat
        { id: 'bal-bass-emit-rate', source: 'bands.bass',          target: 'EMITTER_RATE',     mode: 'add', range: [0, 10],   attack: 30, release: 250, label: 'Bass → Emitter rate' },
        { id: 'bal-aw-emit-int',    source: 'loudness.aWeighted',  target: 'EMITTER_INTENSITY',mode: 'add', range: [0, 0.25], attack: 60, release: 320, label: 'Loudness → Emit intensity' },
        // Material
        { id: 'bal-aw-emissive',     source: 'loudness.aWeighted', target: 'MATERIAL_EMISSIVE',mode: 'add', range: [0, 0.45], attack: 80, release: 350, label: 'Loudness → Emissive' },
        // Particles
        { id: 'bal-bass-pspawn',    source: 'bands.bass',          target: 'PARTICLE_SPAWN_RATE', mode: 'add', range: [0, 700], attack: 30, release: 280, label: 'Bass → P.spawn' },
        { id: 'bal-mid-pturb',      source: 'bands.mid',           target: 'PARTICLE_TURBULENCE', mode: 'add', range: [0, 0.6], attack: 40, release: 300, label: 'Mid → P.turbulence' },
        { id: 'bal-air-pjit',       source: 'bands.air',           target: 'PARTICLE_JITTER',     mode: 'add', range: [0, 0.4], attack: 25, release: 250, label: 'Air → P.jitter' }
    ],

    // "Pulse" — beat-driven impact; transient-heavy.
    pulse: [
        { id: 'pul-beat-bloom',     source: 'beat.pulse',           target: 'BLOOM_INTENSITY',  mode: 'add', range: [0, 0.45], attack: 4,  release: 240, label: 'Beat → Bloom' },
        { id: 'pul-beat-chroma',    source: 'beat.pulse',           target: 'CHROMATIC_ABERRATION', mode: 'add', range: [0, 1.6], attack: 4,  release: 220, label: 'Beat → Chromatic' },
        { id: 'pul-beat-anamorph',  source: 'beat.pulse',           target: 'ANAMORPHIC_BLOOM', mode: 'add', range: [0, 0.4], attack: 4,  release: 260, label: 'Beat → Anamorphic' },
        { id: 'pul-bass-emit-rate', source: 'bands.bass',           target: 'EMITTER_RATE',     mode: 'add', range: [0, 22],  attack: 12, release: 220, label: 'Bass → Emitter rate' },
        { id: 'pul-bass-emit-int',  source: 'bands.bass',           target: 'EMITTER_INTENSITY',mode: 'add', range: [0, 0.55],attack: 10, release: 240, label: 'Bass → Emit intensity' },
        { id: 'pul-bass-curl',      source: 'bands.bass',           target: 'CURL',             mode: 'add', range: [0, 28],  attack: 12, release: 220, label: 'Bass → Curl' },
        { id: 'pul-beat-veldis',    source: 'beat.pulse',           target: 'VELOCITY_DISTORTION', mode: 'add', range: [0, 1.1], attack: 4,  release: 220, label: 'Beat → Flow distort' },
        { id: 'pul-aw-emissive',    source: 'loudness.aWeighted',   target: 'MATERIAL_EMISSIVE',mode: 'add', range: [0, 0.55], attack: 60, release: 320, label: 'Loudness → Emissive' },
        { id: 'pul-air-hue',        source: 'bands.air',            target: 'HUE_SHIFT',        mode: 'add', range: [-60, 60], attack: 60, release: 400, label: 'Air → Hue' },
        { id: 'pul-cent-grad',      source: 'spectral.centroid',    target: 'GRADIENT_OFFSET',  mode: 'add', range: [-0.2, 0.2], attack: 80, release: 400, label: 'Brightness → Gradient' },
        // Particles
        { id: 'pul-beat-pspawn',    source: 'beat.pulse',           target: 'PARTICLE_SPAWN_RATE', mode: 'add', range: [0, 1500], attack: 4, release: 260, label: 'Beat → P.spawn' },
        { id: 'pul-bass-pturb',     source: 'bands.bass',           target: 'PARTICLE_TURBULENCE', mode: 'add', range: [0, 1.0], attack: 12, release: 220, label: 'Bass → P.turbulence' },
        { id: 'pul-air-pjit',       source: 'bands.air',            target: 'PARTICLE_JITTER',     mode: 'add', range: [0, 0.8], attack: 12, release: 220, label: 'Air → P.jitter' },
        { id: 'pul-aw-popacity',    source: 'loudness.aWeighted',   target: 'PARTICLE_OPACITY',    mode: 'add', range: [0, 0.2], attack: 80, release: 380, label: 'Loudness → P.opacity' }
    ],

    // "Cinema" — long releases, exposure & grain breathe with loudness.
    cinema: [
        { id: 'cin-aw-exposure',    source: 'loudness.aWeighted',   target: 'MATERIAL_EXPOSURE',mode: 'add', range: [0, 0.4],  attack: 200, release: 800, label: 'Loudness → Exposure' },
        { id: 'cin-aw-grain',       source: 'loudness.aWeighted',   target: 'FILM_GRAIN',       mode: 'add', range: [0, 0.18], attack: 200, release: 800, label: 'Loudness → Grain' },
        { id: 'cin-aw-bloom',       source: 'loudness.aWeighted',   target: 'BLOOM_INTENSITY',  mode: 'add', range: [0, 0.22], attack: 200, release: 1000, label: 'Loudness → Bloom' },
        { id: 'cin-cent-hue',       source: 'spectral.centroid',    target: 'HUE_SHIFT',        mode: 'add', range: [-25, 25], attack: 400, release: 1200, label: 'Brightness → Hue' },
        { id: 'cin-spread-anamorph',source: 'spectral.spread',      target: 'ANAMORPHIC_BLOOM', mode: 'add', range: [0, 0.35], attack: 300, release: 1000, label: 'Spread → Anamorphic' },
        { id: 'cin-bass-curl',      source: 'bands.bass',           target: 'CURL',             mode: 'add', range: [0, 12],   attack: 120, release: 600, label: 'Bass → Curl (slow)' }
    ],

    // "Cinema-slow" — even longer envelopes; tuned for ambient/orchestral.
    'cinema-slow': [
        { id: 'cs-aw-exposure',  source: 'loudness.aWeighted', target: 'MATERIAL_EXPOSURE', mode: 'add', range: [0, 0.32], attack: 400, release: 1800, label: 'Loudness → Exposure' },
        { id: 'cs-aw-bloom',     source: 'loudness.aWeighted', target: 'BLOOM_INTENSITY',   mode: 'add', range: [0, 0.18], attack: 400, release: 2200, label: 'Loudness → Bloom' },
        { id: 'cs-aw-sunrays',   source: 'loudness.aWeighted', target: 'SUNRAYS_WEIGHT',    mode: 'add', range: [0, 0.25], attack: 500, release: 2000, label: 'Loudness → Sunrays' },
        { id: 'cs-cent-hue',     source: 'spectral.centroid',  target: 'HUE_SHIFT',         mode: 'add', range: [-18, 18], attack: 800, release: 2500, label: 'Brightness → Hue (drift)' },
        { id: 'cs-aw-saturate',  source: 'loudness.aWeighted', target: 'MATERIAL_SATURATION', mode: 'add', range: [0, 0.3], attack: 600, release: 2200, label: 'Loudness → Saturation' },
        { id: 'cs-bass-buoy',    source: 'bands.bass',         target: 'BUOYANCY_STRENGTH', mode: 'add', range: [-6, 6],   attack: 300, release: 1500, label: 'Bass → Buoyancy' }
    ],

    // "Ambient" — soft sustain, no beat at all. Great for backgrounds.
    ambient: [
        { id: 'amb-aw-bloom',    source: 'loudness.aWeighted',  target: 'BLOOM_INTENSITY',    mode: 'add', range: [0, 0.15], attack: 600, release: 2400, label: 'Loudness → Bloom' },
        { id: 'amb-aw-emit-int', source: 'loudness.aWeighted',  target: 'EMITTER_INTENSITY',  mode: 'add', range: [0, 0.15], attack: 400, release: 1800, label: 'Loudness → Emitter intensity' },
        { id: 'amb-cent-hue',    source: 'spectral.centroid',   target: 'HUE_SHIFT',          mode: 'add', range: [-25, 25], attack: 1200, release: 3000, label: 'Brightness → Hue' },
        { id: 'amb-spread-grad', source: 'spectral.spread',     target: 'GRADIENT_OFFSET',    mode: 'add', range: [-0.12, 0.12], attack: 1200, release: 3000, label: 'Spread → Gradient' },
        { id: 'amb-flat-vignt',  source: 'spectral.flatness',   target: 'VIGNETTE',           mode: 'add', range: [0, 0.18], attack: 800, release: 2400, label: 'Flatness → Vignette' }
    ],

    // "Lo-fi" — grainy, mid-band biased, gentle wobble; mimics tape compression.
    lofi: [
        { id: 'lo-mid-grain',    source: 'bands.mid',           target: 'FILM_GRAIN',         mode: 'add', range: [0, 0.18], attack: 100, release: 600, label: 'Mid → Grain' },
        { id: 'lo-aw-vignt',     source: 'loudness.aWeighted',  target: 'VIGNETTE',           mode: 'add', range: [0, 0.22], attack: 300, release: 900, label: 'Loudness → Vignette' },
        { id: 'lo-bass-bloom',   source: 'bands.bass',          target: 'BLOOM_INTENSITY',    mode: 'add', range: [0, 0.2],  attack: 80,  release: 500, label: 'Bass → Bloom' },
        { id: 'lo-mid-chroma',   source: 'bands.mid',           target: 'CHROMATIC_ABERRATION', mode: 'add', range: [0, 0.45], attack: 60, release: 480, label: 'Mid → Chromatic' },
        { id: 'lo-bass-curl',    source: 'bands.bass',          target: 'CURL',               mode: 'add', range: [0, 9],    attack: 80,  release: 500, label: 'Bass → Curl' },
        { id: 'lo-aw-emissive',  source: 'loudness.aWeighted',  target: 'MATERIAL_EMISSIVE',  mode: 'add', range: [0, 0.25], attack: 200, release: 700, label: 'Loudness → Emissive' }
    ],

    // "Rave-hard" — every beat punches everything. Tier: extreme.
    'rave-hard': [
        { id: 'rh-beat-bloom',   source: 'beat.pulse',          target: 'BLOOM_INTENSITY',    mode: 'add', range: [0, 0.85], attack: 2,  release: 180, label: 'Beat → Bloom (hard)' },
        { id: 'rh-beat-chroma',  source: 'beat.pulse',          target: 'CHROMATIC_ABERRATION', mode: 'add', range: [0, 3.5], attack: 2,  release: 150, label: 'Beat → Chromatic (hard)' },
        { id: 'rh-beat-veldis',  source: 'beat.pulse',          target: 'VELOCITY_DISTORTION',mode: 'add', range: [0, 2.4],  attack: 2,  release: 160, label: 'Beat → Flow distort' },
        { id: 'rh-beat-anamorph',source: 'beat.pulse',          target: 'ANAMORPHIC_BLOOM',   mode: 'add', range: [0, 0.7],  attack: 2,  release: 180, label: 'Beat → Anamorphic' },
        { id: 'rh-bass-emit',    source: 'bands.bass',          target: 'EMITTER_INTENSITY',  mode: 'add', range: [0, 1.0],  attack: 8,  release: 200, label: 'Bass → Emit intensity' },
        { id: 'rh-bass-emit-rate',source:'bands.bass',          target: 'EMITTER_RATE',       mode: 'add', range: [0, 40],   attack: 8,  release: 200, label: 'Bass → Emit rate' },
        { id: 'rh-bass-curl',    source: 'bands.bass',          target: 'CURL',               mode: 'add', range: [0, 40],   attack: 8,  release: 180, label: 'Bass → Curl' },
        { id: 'rh-bass-turb',    source: 'bands.bass',          target: 'TURBULENCE_AMOUNT',  mode: 'add', range: [0, 50],   attack: 8,  release: 180, label: 'Bass → Turbulence' },
        { id: 'rh-air-hue',      source: 'bands.air',           target: 'HUE_SHIFT',          mode: 'add', range: [-90, 90], attack: 40, release: 280, label: 'Air → Hue (wide)' },
        { id: 'rh-beat-pspawn',  source: 'beat.pulse',          target: 'PARTICLE_SPAWN_RATE',mode: 'add', range: [0, 2500], attack: 2,  release: 200, label: 'Beat → Particle spawn' },
        { id: 'rh-bass-pturb',   source: 'bands.bass',          target: 'PARTICLE_TURBULENCE',mode: 'add', range: [0, 1.8],  attack: 8,  release: 200, label: 'Bass → P.turbulence' },
        { id: 'rh-air-pjit',     source: 'bands.air',           target: 'PARTICLE_JITTER',    mode: 'add', range: [0, 1.6],  attack: 8,  release: 200, label: 'Air → P.jitter' }
    ],

    // "Jazz pad" — mid + presence + spread; flowing curl + spectral hue.
    'jazz-pad': [
        { id: 'jz-mid-bloom',    source: 'bands.mid',           target: 'BLOOM_INTENSITY',    mode: 'add', range: [0, 0.32], attack: 80,  release: 500, label: 'Mid → Bloom' },
        { id: 'jz-pres-sunrays', source: 'bands.presence',      target: 'SUNRAYS_WEIGHT',     mode: 'add', range: [0, 0.32], attack: 100, release: 600, label: 'Presence → Sunrays' },
        { id: 'jz-cent-hue',     source: 'spectral.centroid',   target: 'HUE_SHIFT',          mode: 'add', range: [-50, 50], attack: 300, release: 1100, label: 'Centroid → Hue' },
        { id: 'jz-mid-curl',     source: 'bands.mid',           target: 'CURL',               mode: 'add', range: [0, 16],   attack: 80,  release: 500, label: 'Mid → Curl' },
        { id: 'jz-aw-emissive',  source: 'loudness.aWeighted',  target: 'MATERIAL_EMISSIVE',  mode: 'add', range: [0, 0.4],  attack: 150, release: 700, label: 'Loudness → Emissive' },
        { id: 'jz-spread-anam',  source: 'spectral.spread',     target: 'ANAMORPHIC_BLOOM',   mode: 'add', range: [0, 0.3],  attack: 200, release: 900, label: 'Spread → Anamorphic' },
        { id: 'jz-mid-pspawn',   source: 'bands.mid',           target: 'PARTICLE_SPAWN_RATE',mode: 'add', range: [0, 800],  attack: 80,  release: 500, label: 'Mid → Particle spawn' },
        { id: 'jz-pres-pjit',    source: 'bands.presence',      target: 'PARTICLE_JITTER',    mode: 'add', range: [0, 0.6],  attack: 80,  release: 500, label: 'Presence → P.jitter' }
    ]
};

// V2 route packs — target per-role audio gains via the new dynamic targets.
// These pair with `?particlesV2` and the role-based ParticleSystemV2.
const V2_PARTICLE_ROUTES = {
    balanced: [
        { id: 'v2-bal-bass-foam',   source: 'bands.bass',  target: 'particles.foam.spawnGain',  mode: 'mul', range: [0, 0.8], attack: 30, release: 280, label: 'Bass → Foam spawn' },
        { id: 'v2-bal-air-spark',   source: 'bands.air',   target: 'particles.spark.spawnGain', mode: 'mul', range: [0, 1.2], attack: 12, release: 200, label: 'Air → Spark spawn' },
        { id: 'v2-bal-mid-mist',    source: 'bands.mid',   target: 'particles.mist.opacityGain',mode: 'mul', range: [0, 0.6], attack: 80, release: 400, label: 'Mid → Mist opacity' },
        { id: 'v2-bal-cent-hue-fm', source: 'spectral.centroid', target: 'particles.foam.hueShift', mode: 'add', range: [-0.18, 0.18], attack: 200, release: 700, label: 'Centroid → Foam hue' }
    ],
    pulse: [
        { id: 'v2-pul-beat-foam',  source: 'beat.pulse',  target: 'particles.foam.spawnGain',  mode: 'mul', range: [0, 1.6], attack: 4,  release: 240, label: 'Beat → Foam burst' },
        { id: 'v2-pul-beat-spark', source: 'beat.pulse',  target: 'particles.spark.spawnGain', mode: 'mul', range: [0, 2.4], attack: 3,  release: 220, label: 'Beat → Spark burst' },
        { id: 'v2-pul-bass-spray', source: 'bands.bass',  target: 'particles.spray.spawnGain', mode: 'mul', range: [0, 1.8], attack: 8,  release: 240, label: 'Bass → Spray rate' },
        { id: 'v2-pul-bass-spray-force', source: 'bands.bass', target: 'particles.spray.forceGain', mode: 'mul', range: [0, 1.5], attack: 8, release: 260, label: 'Bass → Spray force' },
        { id: 'v2-pul-air-spark-size',   source: 'bands.air',  target: 'particles.spark.sizeGain', mode: 'mul', range: [0, 1.4], attack: 6, release: 220, label: 'Air → Spark size' },
        { id: 'v2-pul-cent-foam-hue',    source: 'spectral.centroid', target: 'particles.foam.hueShift', mode: 'add', range: [-0.25, 0.25], attack: 120, release: 600, label: 'Centroid → Foam hue' }
    ],
    cinema: [
        { id: 'v2-cin-aw-mist',    source: 'loudness.aWeighted', target: 'particles.mist.opacityGain',  mode: 'mul', range: [0, 0.7], attack: 300, release: 1200, label: 'Loudness → Mist' },
        { id: 'v2-cin-aw-ember',   source: 'loudness.aWeighted', target: 'particles.ember.spawnGain',   mode: 'mul', range: [0, 0.8], attack: 250, release: 1100, label: 'Loudness → Ember' },
        { id: 'v2-cin-cent-ribbon',source: 'spectral.centroid',  target: 'particles.ribbon.hueShift',   mode: 'add', range: [-0.2, 0.2], attack: 400, release: 1500, label: 'Centroid → Ribbon hue' }
    ],
    ambient: [
        { id: 'v2-amb-aw-mist',    source: 'loudness.aWeighted', target: 'particles.mist.spawnGain',  mode: 'mul', range: [0, 0.6], attack: 800, release: 2200, label: 'Loudness → Mist drift' },
        { id: 'v2-amb-aw-dust',    source: 'loudness.aWeighted', target: 'particles.dust.opacityGain',mode: 'mul', range: [0, 0.6], attack: 600, release: 2000, label: 'Loudness → Dust' },
        { id: 'v2-amb-cent-mist-hue', source: 'spectral.centroid', target: 'particles.mist.hueShift', mode: 'add', range: [-0.18, 0.18], attack: 1200, release: 3000, label: 'Centroid → Mist hue' }
    ],
    'rave-hard': [
        { id: 'v2-rh-beat-spark',  source: 'beat.pulse',  target: 'particles.spark.spawnGain', mode: 'mul', range: [0, 4],  attack: 2, release: 160, label: 'Beat → Spark hard' },
        { id: 'v2-rh-beat-foam',   source: 'beat.pulse',  target: 'particles.foam.spawnGain',  mode: 'mul', range: [0, 3],  attack: 2, release: 180, label: 'Beat → Foam hard' },
        { id: 'v2-rh-bass-spray',  source: 'bands.bass',  target: 'particles.spray.spawnGain', mode: 'mul', range: [0, 3],  attack: 6, release: 180, label: 'Bass → Spray hard' },
        { id: 'v2-rh-air-spark-hue', source: 'bands.air', target: 'particles.spark.hueShift',  mode: 'add', range: [-0.4, 0.4], attack: 30, release: 280, label: 'Air → Spark hue' }
    ]
};

export function getRoutePreset(name) {
    if (Array.isArray(name)) return name;
    const base = routePresets[name] || [];
    const v2 = V2_PARTICLE_ROUTES[name] || [];
    // V2 routes are appended; legacy presets without a V2 list just return base.
    return [...base, ...v2];
}
