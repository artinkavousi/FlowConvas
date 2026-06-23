export const presets = {
    aurora: {
        schemaVersion: 3,
        label: 'Aurora',
        category: 'Cinematic',
        description: 'Layered ribbon emitters with restrained bloom and soft chromatic drift.',
        tags: ['line', 'radial', 'cinematic'],
        performanceTier: 'medium',
        requires: { particles: true, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 1, g: 4, b: 9 },
            DISPLAY_STYLE: 'glass',
            COLOR_MODE: 'multiStop',
            PALETTE_A: { r: 5, g: 12, b: 34 },
            PALETTE_B: { r: 52, g: 245, b: 197 },
            PALETTE_C: { r: 140, g: 92, b: 255 },
            COLOR_STOPS: [
                { position: 0, color: { r: 3, g: 8, b: 28 } },
                { position: 0.22, color: { r: 28, g: 224, b: 196 } },
                { position: 0.48, color: { r: 96, g: 108, b: 255 } },
                { position: 0.76, color: { r: 255, g: 92, b: 210 } },
                { position: 1, color: { r: 255, g: 235, b: 166 } }
            ],
            COLOR_SOURCE_MIX: 0.34,
            GRADIENT_SCALE: 0.82,
            MATERIAL_CONTRAST: 1.02,
            MATERIAL_SATURATION: 1.14,
            MATERIAL_EXPOSURE: 0.9,
            MATERIAL_ROUGHNESS: 0.22,
            MATERIAL_SPECULAR: 0.58,
            MATERIAL_RIM: 0.36,
            FRESNEL_POWER: 1.9,
            OUTPUT_GAIN: 1.02,
            TONE_MAPPING: 'aces',
            CHROMATIC_ABERRATION: 0.5,
            LENS_DISTORTION: 0.035,
            VELOCITY_DISTORTION: 0.35,
            BLOOM_INTENSITY: 0.62,
            BLOOM_THRESHOLD: 0.76,
            ANAMORPHIC_BLOOM: 0.24,
            ANAMORPHIC_RATIO: 5.8,
            SUNRAYS_WEIGHT: 0.62,
            GOD_RAY_SOURCE: { x: 0.5, y: 0.34 },
            VIGNETTE: 0.18,
            FILM_GRAIN: 0.035,
            CURL: 36,
            VISCOSITY: 0.1,
            TURBULENCE_AMOUNT: 11,
            TURBULENCE_SCALE: 4.8,
            ADVECTION_METHOD: 'maccormack',
            GRAVITY_Y: 0,
            WIND_X: 9,
            WIND_Y: 0,
            EMITTER_RATE: 8,
            EMITTER_INTENSITY: 0.44,
            PARTICLES_ENABLED: true,
            PARTICLE_ARCHETYPE: 'magic',
            PARTICLE_SPAWN_MODE: 'density',
            PARTICLE_SPAWN_THRESHOLD: 0.15,
            PARTICLE_SPAWN_RATE: 180,
            PARTICLE_MAX_COUNT: 26000,
            PARTICLE_SIZE_MIN: 1.2,
            PARTICLE_SIZE_MAX: 5.5,
            PARTICLE_OPACITY: 0.48,
            PARTICLE_BLEND_MODE: 'additive',
            PARTICLE_TURBULENCE: 0.38,
            PARTICLE_JITTER: 0.16,
            AUDIO_BINDING_MODE: 'off',
            AUDIO_FX_AMOUNT: 0.35
        },
        emitters: [
            { id: 'left-wave', type: 'line', label: 'Left wave', x: 0.12, y: 0.22, x2: 0.18, y2: 0.78, color: '#34f5c5', force: 0.1, radius: 0.41, particleConfig: { enabled: true, particleArchetype: 'magic', particleSpawnRate: 150 } },
            { id: 'right-wave', type: 'line', label: 'Right wave', x: 0.88, y: 0.78, x2: 0.82, y2: 0.22, color: '#8c5cff', force: 0.1, radius: 0.41, particleConfig: { enabled: true, particleArchetype: 'magic', particleSpawnRate: 150 } },
            { id: 'crown', type: 'radial', label: 'Aurora crown', x: 0.5, y: 0.52, width: 0.34, segments: 15, color: '#b452ff', force: 0.1, radius: 0.25, pulse: 0.25, particleConfig: { enabled: true, particleArchetype: 'magic', particleSpawnRate: 200 } }
        ],
        particles: {
            roles: {
                ribbon: { enabled: true,  style: 'ribbon-aurora', budget: 3500, spawnGain: 0.5  },
                mist:   { enabled: true,  style: 'mist-fog',      budget: 2000, spawnGain: 0.25 },
                foam:   { enabled: true,  style: 'foam-soft',     budget: 6000, spawnGain: 1.0  },
                spray:  { enabled: true,  style: 'spray-water',   budget: 4000, spawnGain: 1.0  },
                spark:  { enabled: true,  style: 'spark-impact',  budget: 3000, spawnGain: 1.0  },
                bubble: { enabled: false }, ember: { enabled: false }, dust: { enabled: false }, debris: { enabled: false }
            }
        }
    },
    ember: {
        schemaVersion: 3,
        label: 'Ember',
        category: 'Cinematic',
        description: 'Warm thermal bed with upward area emission and dense orange highlights.',
        tags: ['fire', 'area', 'thermal'],
        performanceTier: 'medium',
        requires: { particles: false, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 10, g: 4, b: 1 },
            DISPLAY_STYLE: 'material',
            PALETTE_A: { r: 24, g: 5, b: 1 },
            PALETTE_B: { r: 255, g: 86, b: 18 },
            PALETTE_C: { r: 255, g: 225, b: 128 },
            GRADIENT_SCALE: 0.95,
            MATERIAL_CONTRAST: 1.14,
            MATERIAL_SATURATION: 1.05,
            MATERIAL_EXPOSURE: 0.86,
            OUTPUT_GAIN: 0.95,
            CHROMATIC_ABERRATION: 0.35,
            LENS_DISTORTION: 0.02,
            VELOCITY_DISTORTION: 0.25,
            BLOOM_INTENSITY: 0.68,
            BLOOM_THRESHOLD: 0.82,
            SUNRAYS_WEIGHT: 0.62,
            CURL: 34,
            VISCOSITY: 0.35,
            ADVECTION_METHOD: 'maccormack',
            GRAVITY_Y: 14,
            WIND_X: -4,
            EMITTER_RATE: 9,
            EMITTER_INTENSITY: 0.45,
            AUDIO_BINDING_MODE: 'off',
            AUDIO_FX_AMOUNT: 0.35
        },
        emitters: [
            { id: 'ember-bed', type: 'line', label: 'Ember bed', x: 0.24, y: 0.12, x2: 0.76, y2: 0.12, color: '#ff7a18', force: 0.1, radius: 0.45 },
            { id: 'spark', type: 'point', label: 'Spark', x: 0.52, y: 0.18, color: '#ffe082', force: 0.1, radius: 0.25, spread: 0.4 },
            { id: 'heat-bed', type: 'area', label: 'Heat bed', x: 0.5, y: 0.1, width: 0.58, height: 0.06, segments: 14, direction: 1.57, color: '#ff3d00', force: 0.1, radius: 0.31, pulse: 0.45 }
        ],
        particles: {
            roles: {
                ember:  { enabled: true, style: 'ember-volcano', budget: 4000, spawnGain: 0.55 },
                spark:  { enabled: true, style: 'spark-impact',  budget: 1500, spawnGain: 0.35 },
                foam: { enabled: false }, spray: { enabled: false }, mist: { enabled: false }, bubble: { enabled: false }, dust: { enabled: false }, ribbon: { enabled: false }, debris: { enabled: false }
            }
        }
    },
    ink: {
        schemaVersion: 3,
        label: 'Ink',
        category: 'Starter',
        description: 'Quiet ink-on-paper field tuned for contrast without bloom washout.',
        tags: ['ink', 'minimal', 'area'],
        performanceTier: 'low',
        requires: { particles: false, temperature: false, audio: 'disabled' },
        config: {
            BACK_COLOR: { r: 238, g: 242, b: 236 },
            DISPLAY_STYLE: 'material',
            PALETTE_A: { r: 238, g: 242, b: 236 },
            PALETTE_B: { r: 45, g: 55, b: 72 },
            PALETTE_C: { r: 6, g: 10, b: 16 },
            GRADIENT_SCALE: 0.72,
            MATERIAL_CONTRAST: 1.2,
            MATERIAL_SATURATION: 0.18,
            MATERIAL_EXPOSURE: 0.78,
            OUTPUT_GAIN: 0.88,
            CHROMATIC_ABERRATION: 0,
            LENS_DISTORTION: -0.04,
            VELOCITY_DISTORTION: 0.3,
            BLOOM: false,
            SUNRAYS: false,
            SHADING: true,
            CURL: 18,
            VISCOSITY: 1.4,
            ADVECTION_METHOD: 'linear',
            GRAVITY_Y: -6,
            WIND_X: 0,
            EMITTER_RATE: 6,
            EMITTER_INTENSITY: 0.32,
            AUDIO_BINDING_MODE: 'off',
            AUDIO_FX_AMOUNT: 0.25
        },
        emitters: [
            { id: 'ink-drop', type: 'point', label: 'Ink drop', x: 0.5, y: 0.72, color: '#111827', force: 0.1, radius: 0.6, spread: 0.12 },
            { id: 'wash', type: 'area', label: 'Paper wash', x: 0.5, y: 0.35, width: 0.42, height: 0.12, segments: 14, direction: -1.57, color: '#4b5563', force: 0.1, radius: 0.38, pulse: 0.08 }
        ]
    },
    bassDrop: {
        schemaVersion: 3,
        label: 'Bass Drop',
        category: 'Audio Reactive',
        description: 'Beat-friendly radial shockwave scene with controlled highlights.',
        tags: ['radial', 'audio', 'beat'],
        performanceTier: 'medium',
        requires: { particles: true, temperature: false, audio: 'required' },
        config: {
            BACK_COLOR: { r: 2, g: 2, b: 7 },
            DISPLAY_STYLE: 'neon',
            COLOR_MODE: 'rainbow',
            PALETTE_A: { r: 2, g: 2, b: 7 },
            PALETTE_B: { r: 32, g: 214, b: 255 },
            PALETTE_C: { r: 255, g: 60, b: 185 },
            RAINBOW_SPEED: 0.32,
            RAINBOW_RANGE: 0.94,
            GRADIENT_SCALE: 0.88,
            MATERIAL_EMISSIVE: 0.82,
            OUTPUT_GAIN: 1.08,
            TONE_MAPPING: 'aces',
            BLOOM: true,
            BLOOM_INTENSITY: 0.82,
            BLOOM_THRESHOLD: 0.72,
            ANAMORPHIC_BLOOM: 0.38,
            ANAMORPHIC_RATIO: 6.4,
            SUNRAYS: true,
            SUNRAYS_WEIGHT: 0.62,
            GOD_RAY_SOURCE: { x: 0.5, y: 0.5 },
            CHROMATIC_ABERRATION: 1.05,
            LENS_DISTORTION: 0.075,
            VELOCITY_DISTORTION: 0.58,
            CURL: 42,
            TURBULENCE_AMOUNT: 18,
            TURBULENCE_SCALE: 5.6,
            VISCOSITY: 0.08,
            ADVECTION_METHOD: 'maccormack',
            WIND_X: 0,
            WIND_Y: 0,
            GRAVITY_Y: 0,
            EMITTER_RATE: 11,
            EMITTER_INTENSITY: 0.58,
            EMITTER_AUDIO_REACTIVITY: 1.25,
            PARTICLES_ENABLED: true,
            PARTICLE_ARCHETYPE: 'magic',
            PARTICLE_SPAWN_MODE: 'density',
            PARTICLE_SPAWN_THRESHOLD: 0.18,
            PARTICLE_SPAWN_RATE: 520,
            PARTICLE_MAX_COUNT: 28000,
            PARTICLE_SIZE_MIN: 1.4,
            PARTICLE_SIZE_MAX: 7,
            PARTICLE_OPACITY: 0.7,
            PARTICLE_TURBULENCE: 0.55,
            PARTICLE_JITTER: 0.38,
            PARTICLE_FLOW_RESPONSE: 1.45,
            PARTICLE_FIELD_COUPLING: 1.1,
            PARTICLE_ADAPTIVE: true,
            PARTICLE_BUDGET_SCALE: 0.9,
            AUDIO_BINDING_MODE: 'pulse',
            AUDIO_GAIN: 1.25,
            AUDIO_FX_AMOUNT: 0.72
        },
        emitters: [
            { id: 'sub-ring', type: 'radial', label: 'Sub ring', x: 0.5, y: 0.5, width: 0.32, segments: 25, color: '#20d6ff', force: 0.1, radius: 0.28, pulse: 0.55, particleConfig: { enabled: true, particleArchetype: 'magic', particleSpawnRate: 360 } },
            { id: 'snare-core', type: 'point', label: 'Snare core', x: 0.5, y: 0.5, color: '#ff3cb9', force: 0.1, radius: 0.32, spread: 0.2, particleConfig: { enabled: true, particleArchetype: 'magic', particleSpawnRate: 260 } }
        ]
    },
    spectrumWall: {
        schemaVersion: 3,
        label: 'Spectrum Wall',
        category: 'Scientific',
        description: 'Readable frequency-wall layout using eight restrained line emitters.',
        tags: ['audio', 'diagnostic', 'line'],
        performanceTier: 'medium',
        requires: { particles: true, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 0, g: 0, b: 0 },
            DISPLAY_STYLE: 'neon',
            COLOR_MODE: 'multiStop',
            COLOR_STOPS: [
                { position: 0, color: { r: 8, g: 18, b: 40 } },
                { position: 0.18, color: { r: 23, g: 218, b: 255 } },
                { position: 0.38, color: { r: 116, g: 91, b: 255 } },
                { position: 0.62, color: { r: 255, g: 70, b: 188 } },
                { position: 0.82, color: { r: 255, g: 208, b: 80 } },
                { position: 1, color: { r: 148, g: 255, b: 76 } }
            ],
            COLOR_SOURCE_MIX: 0.42,
            MATERIAL_EMISSIVE: 0.62,
            OUTPUT_GAIN: 1.02,
            TONE_MAPPING: 'aces',
            BLOOM: true,
            BLOOM_INTENSITY: 0.64,
            BLOOM_THRESHOLD: 0.76,
            ANAMORPHIC_BLOOM: 0.22,
            SUNRAYS: true,
            SUNRAYS_WEIGHT: 0.28,
            CHROMATIC_ABERRATION: 0.48,
            LENS_DISTORTION: 0.025,
            VELOCITY_DISTORTION: 0.28,
            CURL: 26,
            TURBULENCE_AMOUNT: 9,
            VISCOSITY: 0.04,
            ADVECTION_METHOD: 'linear',
            WIND_X: 0,
            WIND_Y: 6,
            GRAVITY_Y: 0,
            EMITTER_RATE: 10,
            EMITTER_INTENSITY: 0.42,
            EMITTER_AUDIO_REACTIVITY: 1.15,
            PARTICLES_ENABLED: true,
            PARTICLE_ARCHETYPE: 'magic',
            PARTICLE_SPAWN_MODE: 'density',
            PARTICLE_SPAWN_THRESHOLD: 0.12,
            PARTICLE_SPAWN_RATE: 260,
            PARTICLE_MAX_COUNT: 16000,
            PARTICLE_SIZE_MIN: 1,
            PARTICLE_SIZE_MAX: 4.5,
            PARTICLE_OPACITY: 0.56,
            PARTICLE_TURBULENCE: 0.32,
            PARTICLE_FLOW_RESPONSE: 1.2,
            PARTICLE_FIELD_COUPLING: 0.8,
            PARTICLE_ADAPTIVE: true,
            PARTICLE_BUDGET_SCALE: 0.75,
            AUDIO_BINDING_MODE: 'balanced',
            AUDIO_GAIN: 1.15,
            AUDIO_FX_AMOUNT: 0.58,
            VISUALIZER_MODE: 'both'
        },
        emitters: [
            { id: 'band-1', type: 'line', label: 'Band 1', x: 0.12, y: 0.12, x2: 0.12, y2: 0.24, color: '#22d3ee', force: 0.1, radius: 0.2, particleConfig: { enabled: true, particleArchetype: 'magic', particleSpawnRate: 150 } },
            { id: 'band-2', type: 'line', label: 'Band 2', x: 0.23, y: 0.12, x2: 0.23, y2: 0.32, color: '#38bdf8', force: 0.1, radius: 0.2, particleConfig: { enabled: true, particleArchetype: 'magic', particleSpawnRate: 150 } },
            { id: 'band-3', type: 'line', label: 'Band 3', x: 0.34, y: 0.12, x2: 0.34, y2: 0.42, color: '#818cf8', force: 0.1, radius: 0.2, particleConfig: { enabled: true, particleArchetype: 'magic', particleSpawnRate: 150 } },
            { id: 'band-4', type: 'line', label: 'Band 4', x: 0.45, y: 0.12, x2: 0.45, y2: 0.52, color: '#c084fc', force: 0.1, radius: 0.2, particleConfig: { enabled: true, particleArchetype: 'magic', particleSpawnRate: 150 } },
            { id: 'band-5', type: 'line', label: 'Band 5', x: 0.56, y: 0.12, x2: 0.56, y2: 0.52, color: '#f472b6', force: 0.1, radius: 0.2, particleConfig: { enabled: true, particleArchetype: 'magic', particleSpawnRate: 150 } },
            { id: 'band-6', type: 'line', label: 'Band 6', x: 0.67, y: 0.12, x2: 0.67, y2: 0.42, color: '#fb7185', force: 0.1, radius: 0.2, particleConfig: { enabled: true, particleArchetype: 'magic', particleSpawnRate: 150 } },
            { id: 'band-7', type: 'line', label: 'Band 7', x: 0.78, y: 0.12, x2: 0.78, y2: 0.32, color: '#facc15', force: 0.1, radius: 0.2, particleConfig: { enabled: true, particleArchetype: 'magic', particleSpawnRate: 150 } },
            { id: 'band-8', type: 'line', label: 'Band 8', x: 0.89, y: 0.12, x2: 0.89, y2: 0.24, color: '#a3e635', force: 0.1, radius: 0.2, particleConfig: { enabled: true, particleArchetype: 'magic', particleSpawnRate: 150 } }
        ]
    },
    zenGarden: {
        schemaVersion: 3,
        label: 'Zen Garden',
        category: 'Starter',
        description: 'Low-contrast meditative area wash with very restrained post effects.',
        tags: ['calm', 'minimal', 'area'],
        performanceTier: 'low',
        requires: { particles: false, temperature: false, audio: 'disabled' },
        config: {
            BACK_COLOR: { r: 8, g: 11, b: 12 },
            DISPLAY_STYLE: 'material',
            PALETTE_A: { r: 8, g: 11, b: 12 },
            PALETTE_B: { r: 116, g: 185, b: 163 },
            PALETTE_C: { r: 210, g: 223, b: 196 },
            GRADIENT_SCALE: 0.52,
            MATERIAL_CONTRAST: 0.82,
            MATERIAL_SATURATION: 0.56,
            MATERIAL_EXPOSURE: 0.72,
            OUTPUT_GAIN: 0.86,
            BLOOM: true,
            BLOOM_INTENSITY: 0.22,
            BLOOM_THRESHOLD: 0.86,
            SUNRAYS: false,
            CHROMATIC_ABERRATION: 0,
            LENS_DISTORTION: -0.02,
            VELOCITY_DISTORTION: 0.12,
            CURL: 12,
            VISCOSITY: 0.9,
            ADVECTION_METHOD: 'linear',
            WIND_X: 3,
            WIND_Y: 0,
            GRAVITY_Y: 0,
            EMITTER_RATE: 5,
            EMITTER_INTENSITY: 0.28,
            AUDIO_BINDING_MODE: 'off',
            VISUALIZER_MODE: 'off'
        },
        emitters: [
            { id: 'mist-rake', type: 'area', label: 'Mist rake', x: 0.5, y: 0.42, width: 0.56, height: 0.18, segments: 14, direction: 0, color: '#74b9a3', force: 0.1, radius: 0.41, pulse: 0.05 }
        ]
    },
    solarFlare: {
        schemaVersion: 3,
        label: 'Solar Flare',
        category: 'Cinematic',
        description: 'Hot radial plasma scene with safe tonemapping and visible structure.',
        tags: ['radial', 'fire', 'cinematic'],
        performanceTier: 'high',
        requires: { particles: false, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 4, g: 1, b: 0 },
            DISPLAY_STYLE: 'gradient',
            PALETTE_A: { r: 12, g: 2, b: 0 },
            PALETTE_B: { r: 255, g: 93, b: 24 },
            PALETTE_C: { r: 255, g: 232, b: 127 },
            GRADIENT_SCALE: 1.05,
            OUTPUT_GAIN: 0.9,
            BLOOM: true,
            BLOOM_INTENSITY: 0.78,
            BLOOM_THRESHOLD: 0.86,
            SUNRAYS: true,
            SUNRAYS_WEIGHT: 0.82,
            CHROMATIC_ABERRATION: 0.35,
            LENS_DISTORTION: 0.08,
            VELOCITY_DISTORTION: 0.32,
            CURL: 40,
            VISCOSITY: 0.2,
            ADVECTION_METHOD: 'maccormack',
            WIND_X: -3,
            WIND_Y: 0,
            GRAVITY_Y: 8,
            EMITTER_RATE: 7,
            EMITTER_INTENSITY: 0.42,
            EMITTER_AUDIO_REACTIVITY: 0.35,
            AUDIO_BINDING_MODE: 'balanced',
            AUDIO_FX_AMOUNT: 0.32
        },
        emitters: [
            { id: 'flare-ring', type: 'radial', label: 'Flare ring', x: 0.5, y: 0.45, width: 0.42, segments: 30, color: '#ff5d18', force: 0.1, radius: 0.25, pulse: 0.35 },
            { id: 'flare-core', type: 'point', label: 'Flare core', x: 0.5, y: 0.45, color: '#ffe87f', force: 0.1, radius: 0.32, spread: 0.15 }
        ],
        particles: {
            roles: {
                spark:  { enabled: true, style: 'spark-impact',  budget: 3000, spawnGain: 0.5 },
                ember:  { enabled: true, style: 'ember-volcano', budget: 3000, spawnGain: 0.5 },
                foam: { enabled: false }, spray: { enabled: false }, mist: { enabled: false }, bubble: { enabled: false }, dust: { enabled: false }, ribbon: { enabled: false }, debris: { enabled: false }
            }
        }
    },
    deepSpace: {
        schemaVersion: 3,
        label: 'Deep Space',
        category: 'Cinematic',
        description: 'Nebula-like slow drift with cool shadows and magenta cores.',
        tags: ['nebula', 'radial', 'area'],
        performanceTier: 'medium',
        requires: { particles: false, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 0, g: 1, b: 8 },
            DISPLAY_STYLE: 'material',
            PALETTE_A: { r: 0, g: 1, b: 8 },
            PALETTE_B: { r: 41, g: 121, b: 255 },
            PALETTE_C: { r: 222, g: 76, b: 255 },
            GRADIENT_SCALE: 0.68,
            MATERIAL_CONTRAST: 1.05,
            MATERIAL_SATURATION: 1.08,
            MATERIAL_EXPOSURE: 0.82,
            OUTPUT_GAIN: 0.94,
            BLOOM: true,
            BLOOM_INTENSITY: 0.5,
            BLOOM_THRESHOLD: 0.8,
            SUNRAYS: true,
            SUNRAYS_WEIGHT: 0.45,
            CHROMATIC_ABERRATION: 0.42,
            LENS_DISTORTION: 0.03,
            VELOCITY_DISTORTION: 0.28,
            CURL: 24,
            VISCOSITY: 0.55,
            ADVECTION_METHOD: 'maccormack',
            WIND_X: 4,
            WIND_Y: -2,
            GRAVITY_Y: 0,
            EMITTER_RATE: 7,
            EMITTER_INTENSITY: 0.38,
            AUDIO_BINDING_MODE: 'off'
        },
        emitters: [
            { id: 'nebula-field', type: 'area', label: 'Nebula field', x: 0.5, y: 0.44, width: 0.68, height: 0.28, segments: 14, direction: 0.08, color: '#2979ff', force: 0.1, radius: 0.41, pulse: 0.12 },
            { id: 'stellar-core', type: 'radial', label: 'Stellar core', x: 0.55, y: 0.54, width: 0.22, segments: 20, color: '#de4cff', force: 0.1, radius: 0.22, pulse: 0.18 }
        ],
        particles: {
            roles: {
                mist:   { enabled: true, style: 'mist-fog',       budget: 3000, spawnGain: 0.35 },
                spark:  { enabled: true, style: 'spark-electric', budget: 1500, spawnGain: 0.3 },
                foam: { enabled: false }, spray: { enabled: false }, bubble: { enabled: false }, ember: { enabled: false }, dust: { enabled: false }, ribbon: { enabled: false }, debris: { enabled: false }
            }
        }
    },
    northernLights: {
        schemaVersion: 3,
        label: 'Northern Lights',
        category: 'Cinematic',
        description: 'Spline-driven aurora ribbons with soft drift and treble-friendly shimmer.',
        tags: ['spline', 'aurora', 'cinematic'],
        performanceTier: 'medium',
        requires: { particles: false, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 1, g: 5, b: 12 },
            DISPLAY_STYLE: 'gradient',
            PALETTE_A: { r: 1, g: 5, b: 12 },
            PALETTE_B: { r: 50, g: 230, b: 178 },
            PALETTE_C: { r: 120, g: 96, b: 255 },
            GRADIENT_SCALE: 0.76,
            MATERIAL_CONTRAST: 0.98,
            MATERIAL_SATURATION: 1.02,
            MATERIAL_EXPOSURE: 0.82,
            OUTPUT_GAIN: 0.94,
            BLOOM: true,
            BLOOM_INTENSITY: 0.48,
            BLOOM_THRESHOLD: 0.8,
            SUNRAYS: true,
            SUNRAYS_WEIGHT: 0.46,
            CHROMATIC_ABERRATION: 0.38,
            LENS_DISTORTION: 0.025,
            VELOCITY_DISTORTION: 0.4,
            CURL: 24,
            VISCOSITY: 0.18,
            ADVECTION_METHOD: 'maccormack',
            WIND_X: 10,
            WIND_Y: 0,
            GRAVITY_Y: 0,
            EMITTER_RATE: 7,
            EMITTER_INTENSITY: 0.4,
            EMITTER_AUDIO_REACTIVITY: 0.32,
            AUDIO_BINDING_MODE: 'balanced',
            AUDIO_FX_AMOUNT: 0.26
        },
        emitters: [
            { id: 'green-arc', type: 'spline', label: 'Green arc', x: 0.08, y: 0.3, x2: 0.28, y2: 0.82, x3: 0.58, y3: 0.18, x4: 0.92, y4: 0.66, segments: 23, color: '#32e6b2', force: 0.1, radius: 0.25, spread: 0.28, pulse: 0.16 },
            { id: 'violet-arc', type: 'spline', label: 'Violet arc', x: 0.12, y: 0.7, x2: 0.36, y2: 0.24, x3: 0.62, y3: 0.86, x4: 0.88, y4: 0.34, segments: 20, color: '#785fff', force: 0.1, radius: 0.22, spread: 0.22, pulse: 0.12 }
        ],
        particles: {
            roles: {
                ribbon: { enabled: true, style: 'ribbon-aurora', budget: 3500, spawnGain: 0.5 },
                mist:   { enabled: true, style: 'mist-fog',      budget: 2000, spawnGain: 0.3 },
                foam: { enabled: false }, spray: { enabled: false }, spark: { enabled: false }, bubble: { enabled: false }, ember: { enabled: false }, dust: { enabled: false }, debris: { enabled: false }
            }
        }
    },
    jazzSmoke: {
        schemaVersion: 3,
        label: 'Jazz Smoke',
        category: 'Audio Reactive',
        description: 'Editable brush-path smoke ribbons with muted stage color and slow curl.',
        tags: ['brush', 'smoke', 'audio'],
        performanceTier: 'medium',
        requires: { particles: false, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 3, g: 3, b: 4 },
            DISPLAY_STYLE: 'material',
            PALETTE_A: { r: 3, g: 3, b: 4 },
            PALETTE_B: { r: 146, g: 184, b: 190 },
            PALETTE_C: { r: 210, g: 154, b: 91 },
            GRADIENT_SCALE: 0.62,
            MATERIAL_CONTRAST: 0.92,
            MATERIAL_SATURATION: 0.7,
            MATERIAL_EXPOSURE: 0.76,
            OUTPUT_GAIN: 0.9,
            BLOOM: true,
            BLOOM_INTENSITY: 0.34,
            BLOOM_THRESHOLD: 0.84,
            SUNRAYS: false,
            CHROMATIC_ABERRATION: 0.08,
            LENS_DISTORTION: -0.015,
            VELOCITY_DISTORTION: 0.18,
            CURL: 22,
            VISCOSITY: 0.8,
            ADVECTION_METHOD: 'linear',
            WIND_X: 5,
            WIND_Y: 3,
            GRAVITY_Y: -2,
            EMITTER_RATE: 7,
            EMITTER_INTENSITY: 0.34,
            EMITTER_AUDIO_REACTIVITY: 0.45,
            AUDIO_BINDING_MODE: 'balanced',
            AUDIO_FX_AMOUNT: 0.22
        },
        emitters: [
            {
                id: 'smoke-staff',
                type: 'brush',
                label: 'Smoke staff',
                points: [
                    { x: 0.16, y: 0.22 },
                    { x: 0.3, y: 0.36 },
                    { x: 0.44, y: 0.3 },
                    { x: 0.56, y: 0.48 },
                    { x: 0.7, y: 0.42 },
                    { x: 0.84, y: 0.58 }
                ],
                segments: 20,
                color: '#92b8be',
                force: 0.1,
                radius: 0.32,
                spread: 0.34,
                pulse: 0.12
            },
            { id: 'warm-note', type: 'point', label: 'Warm note', x: 0.32, y: 0.24, color: '#d29a5b', force: 0.1, radius: 0.28, spread: 0.12 }
        ],
        particles: {
            roles: {
                mist:   { enabled: true, style: 'mist-warm',     budget: 3500, spawnGain: 0.4 },
                ember:  { enabled: true, style: 'ember-volcano', budget: 1500, spawnGain: 0.3 },
                foam: { enabled: false }, spray: { enabled: false }, bubble: { enabled: false }, spark: { enabled: false }, ribbon: { enabled: false }, dust: { enabled: false }, debris: { enabled: false }
            }
        }
    },
    crystalPrism: {
        schemaVersion: 3,
        label: 'Crystal Prism',
        category: 'Cinematic',
        description: 'Editable vector-shape emission with crisp edges and restrained prism color.',
        tags: ['vector', 'shape', 'prism'],
        performanceTier: 'medium',
        requires: { particles: false, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 1, g: 2, b: 5 },
            DISPLAY_STYLE: 'gradient',
            PALETTE_A: { r: 1, g: 2, b: 5 },
            PALETTE_B: { r: 72, g: 225, b: 210 },
            PALETTE_C: { r: 255, g: 92, b: 190 },
            GRADIENT_SCALE: 0.86,
            MATERIAL_CONTRAST: 1.08,
            MATERIAL_SATURATION: 1.0,
            MATERIAL_EXPOSURE: 0.8,
            OUTPUT_GAIN: 0.92,
            BLOOM: true,
            BLOOM_INTENSITY: 0.5,
            BLOOM_THRESHOLD: 0.82,
            SUNRAYS: true,
            SUNRAYS_WEIGHT: 0.38,
            CHROMATIC_ABERRATION: 0.55,
            LENS_DISTORTION: 0.025,
            VELOCITY_DISTORTION: 0.26,
            CURL: 26,
            VISCOSITY: 0.22,
            ADVECTION_METHOD: 'maccormack',
            WIND_X: 2,
            WIND_Y: 0,
            GRAVITY_Y: 0,
            EMITTER_RATE: 7,
            EMITTER_INTENSITY: 0.38,
            EMITTER_AUDIO_REACTIVITY: 0.28,
            AUDIO_BINDING_MODE: 'off'
        },
        emitters: [
            {
                id: 'prism-shape',
                type: 'vector',
                label: 'Prism shape',
                points: [
                    { x: 0.5, y: 0.78 },
                    { x: 0.72, y: 0.58 },
                    { x: 0.62, y: 0.26 },
                    { x: 0.38, y: 0.26 },
                    { x: 0.28, y: 0.58 }
                ],
                segments: 25,
                color: '#48e1d2',
                force: 0.1,
                radius: 0.25,
                spread: 0.2,
                pulse: 0.16
            },
            { id: 'prism-core', type: 'point', label: 'Prism core', x: 0.5, y: 0.5, color: '#ff5cbe', force: 0.1, radius: 0.22, spread: 0.1 }
        ],
        particles: {
            roles: {
                bubble: { enabled: true, style: 'bubble-soap',  budget: 2500, spawnGain: 0.45 },
                spark:  { enabled: true, style: 'spark-electric', budget: 1500, spawnGain: 0.35 },
                foam: { enabled: false }, spray: { enabled: false }, mist: { enabled: false }, ember: { enabled: false }, dust: { enabled: false }, ribbon: { enabled: false }, debris: { enabled: false }
            }
        }
    },
    neonSigil: {
        schemaVersion: 3,
        label: 'Neon Sigil',
        category: 'Typography/Mask',
        description: 'SVG-style editable path nodes driving a sharp neon symbol.',
        tags: ['svg', 'path', 'neon'],
        performanceTier: 'medium',
        requires: { particles: false, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 0, g: 3, b: 8 },
            DISPLAY_STYLE: 'gradient',
            PALETTE_A: { r: 0, g: 3, b: 8 },
            PALETTE_B: { r: 55, g: 244, b: 210 },
            PALETTE_C: { r: 180, g: 92, b: 255 },
            GRADIENT_SCALE: 0.84,
            OUTPUT_GAIN: 0.94,
            BLOOM: true,
            BLOOM_INTENSITY: 0.54,
            BLOOM_THRESHOLD: 0.82,
            SUNRAYS: true,
            SUNRAYS_WEIGHT: 0.42,
            CHROMATIC_ABERRATION: 0.42,
            LENS_DISTORTION: 0.03,
            VELOCITY_DISTORTION: 0.3,
            CURL: 28,
            VISCOSITY: 0.18,
            ADVECTION_METHOD: 'maccormack',
            WIND_X: 3,
            WIND_Y: 0,
            GRAVITY_Y: 0,
            EMITTER_RATE: 7,
            EMITTER_INTENSITY: 0.38,
            AUDIO_BINDING_MODE: 'off'
        },
        emitters: [
            {
                id: 'sigil-path',
                type: 'svg',
                label: 'Sigil path',
                points: [
                    { x: 0.25, y: 0.32 },
                    { x: 0.42, y: 0.72 },
                    { x: 0.52, y: 0.42 },
                    { x: 0.68, y: 0.78 },
                    { x: 0.76, y: 0.34 }
                ],
                segments: 25,
                color: '#37f4d2',
                force: 0.1,
                radius: 0.22,
                spread: 0.18,
                pulse: 0.14
            }
        ],
        particles: {
            roles: {
                spark:  { enabled: true, style: 'spark-electric', budget: 4000, spawnGain: 0.55 },
                ribbon: { enabled: true, style: 'ribbon-aurora',  budget: 2500, spawnGain: 0.4 },
                foam: { enabled: false }, spray: { enabled: false }, mist: { enabled: false }, bubble: { enabled: false }, ember: { enabled: false }, dust: { enabled: false }, debris: { enabled: false }
            }
        }
    },
    kineticType: {
        schemaVersion: 3,
        label: 'Kinetic Type',
        category: 'Typography/Mask',
        description: 'Editable text emitter for title-like typography masks.',
        tags: ['text', 'typography', 'mask'],
        performanceTier: 'medium',
        requires: { particles: false, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 2, g: 2, b: 3 },
            DISPLAY_STYLE: 'material',
            PALETTE_A: { r: 2, g: 2, b: 3 },
            PALETTE_B: { r: 255, g: 255, b: 255 },
            PALETTE_C: { r: 255, g: 82, b: 145 },
            GRADIENT_SCALE: 0.7,
            MATERIAL_CONTRAST: 1.08,
            MATERIAL_SATURATION: 0.75,
            MATERIAL_EXPOSURE: 0.78,
            OUTPUT_GAIN: 0.92,
            BLOOM: true,
            BLOOM_INTENSITY: 0.42,
            BLOOM_THRESHOLD: 0.84,
            SUNRAYS: false,
            CHROMATIC_ABERRATION: 0.18,
            LENS_DISTORTION: -0.02,
            VELOCITY_DISTORTION: 0.22,
            CURL: 18,
            VISCOSITY: 0.5,
            ADVECTION_METHOD: 'linear',
            WIND_X: 4,
            WIND_Y: 0,
            GRAVITY_Y: 0,
            EMITTER_RATE: 7,
            EMITTER_INTENSITY: 0.34,
            AUDIO_BINDING_MODE: 'balanced',
            AUDIO_FX_AMOUNT: 0.2
        },
        emitters: [
            { id: 'title-type', type: 'text', label: 'Title type', text: 'FLUID', x: 0.5, y: 0.54, width: 0.54, height: 0.18, segments: 35, color: '#ffffff', force: 0.1, radius: 0.2, spread: 0.2, pulse: 0.12 },
            { id: 'accent-type', type: 'line', label: 'Accent underline', x: 0.26, y: 0.38, x2: 0.74, y2: 0.38, color: '#ff5291', force: 0.1, radius: 0.15 }
        ]
    },
    imageMask: {
        schemaVersion: 3,
        label: 'Image Mask',
        category: 'Typography/Mask',
        description: 'Procedural image-mask style emitter with editable bounds and threshold.',
        tags: ['image', 'mask', 'grid'],
        performanceTier: 'medium',
        requires: { particles: false, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 1, g: 4, b: 7 },
            DISPLAY_STYLE: 'gradient',
            PALETTE_A: { r: 1, g: 4, b: 7 },
            PALETTE_B: { r: 96, g: 210, b: 255 },
            PALETTE_C: { r: 218, g: 255, b: 135 },
            GRADIENT_SCALE: 0.78,
            OUTPUT_GAIN: 0.9,
            BLOOM: true,
            BLOOM_INTENSITY: 0.4,
            BLOOM_THRESHOLD: 0.84,
            SUNRAYS: true,
            SUNRAYS_WEIGHT: 0.36,
            CHROMATIC_ABERRATION: 0.16,
            LENS_DISTORTION: 0.02,
            VELOCITY_DISTORTION: 0.2,
            CURL: 24,
            VISCOSITY: 0.35,
            ADVECTION_METHOD: 'maccormack',
            WIND_X: -2,
            WIND_Y: 2,
            GRAVITY_Y: 0,
            EMITTER_RATE: 7,
            EMITTER_INTENSITY: 0.36,
            AUDIO_BINDING_MODE: 'off'
        },
        emitters: [
            { id: 'mask-field', type: 'image', label: 'Mask field', x: 0.5, y: 0.5, width: 0.48, height: 0.34, threshold: 0.42, segments: 45, color: '#60d2ff', force: 0.1, radius: 0.2, spread: 0.16, pulse: 0.12 },
            { id: 'mask-core', type: 'point', label: 'Mask core', x: 0.5, y: 0.5, color: '#daff87', force: 0.1, radius: 0.22, spread: 0.08 }
        ]
    }
};

Object.assign(presets, {
    moltenMetal: {
        schemaVersion: 3,
        label: 'Molten Metal',
        category: 'V3 Material',
        description: 'Metallic heat-driven ribbons with temperature color and ember particles.',
        tags: ['metallic', 'temperature', 'particles'],
        performanceTier: 'high',
        requires: { particles: true, temperature: true, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 5, g: 3, b: 2 },
            DISPLAY_STYLE: 'metallic',
            COLOR_MODE: 'temperature',
            TEMPERATURE_AMOUNT: 0.85,
            BUOYANCY_STRENGTH: 18,
            TEMP_COLOR_COLD: { r: 50, g: 12, b: 4 },
            TEMP_COLOR_HOT: { r: 255, g: 210, b: 90 },
            MATERIAL_ROUGHNESS: 0.28,
            MATERIAL_SPECULAR: 0.82,
            ENV_INTENSITY: 0.72,
            MATERIAL_EMISSIVE: 0.58,
            OUTPUT_GAIN: 1.04,
            TONE_MAPPING: 'aces',
            BLOOM_INTENSITY: 0.8,
            BLOOM_THRESHOLD: 0.74,
            ANAMORPHIC_BLOOM: 0.24,
            SUNRAYS_WEIGHT: 0.5,
            VIGNETTE: 0.28,
            FILM_GRAIN: 0.08,
            CURL: 44,
            TURBULENCE_AMOUNT: 16,
            TURBULENCE_SCALE: 5.4,
            AGE_AMOUNT: 0.42,
            AGE_COLOR_YOUNG: { r: 255, g: 228, b: 130 },
            AGE_COLOR_OLD: { r: 76, g: 14, b: 4 },
            PARTICLES_ENABLED: true,
            PARTICLE_ARCHETYPE: 'fire',
            PARTICLE_SPAWN_MODE: 'density',
            PARTICLE_SPAWN_THRESHOLD: 0.16,
            PARTICLE_SPAWN_RATE: 420,
            PARTICLE_MAX_COUNT: 26000,
            PARTICLE_COLOR_MODE: 'temperature',
            PARTICLE_SIZE_MIN: 1.8,
            PARTICLE_SIZE_MAX: 9,
            PARTICLE_OPACITY: 0.82,
            PARTICLE_TURBULENCE: 0.5,
            PARTICLE_FLOW_RESPONSE: 1.05,
            PARTICLE_FIELD_COUPLING: 1.25,
            PARTICLE_ADAPTIVE: true,
            PARTICLE_BUDGET_SCALE: 0.85,
            PARTICLE_ROTATION_SPEED: 1.2,
            PARTICLE_VELOCITY_STRETCH: 0.45,
            AUDIO_BINDING_MODE: 'balanced',
            AUDIO_GAIN: 1,
            AUDIO_FX_AMOUNT: 0.46
        },
        emitters: [
            { id: 'metal-pour', type: 'line', label: 'Metal pour', x: 0.22, y: 0.14, x2: 0.78, y2: 0.16, color: '#ff8a18', force: 0.1, radius: 0.41, particleConfig: { enabled: true, particleArchetype: 'fire', particleSpawnRate: 360 } },
            { id: 'hot-core', type: 'point', label: 'Hot core', x: 0.5, y: 0.22, color: '#ffe082', force: 0.1, radius: 0.35, spread: 0.24, particleConfig: { enabled: true, particleArchetype: 'fire', particleSpawnRate: 240 } }
        ]
    },
    frozenLake: {
        schemaVersion: 3,
        label: 'Frozen Lake',
        category: 'V3 Material',
        description: 'Glass shading, cold temperature ramp, and slow crystalline drift.',
        tags: ['glass', 'ice', 'particles'],
        performanceTier: 'medium',
        requires: { particles: true, temperature: true, audio: 'disabled' },
        config: {
            BACK_COLOR: { r: 3, g: 10, b: 18 },
            DISPLAY_STYLE: 'glass',
            COLOR_MODE: 'temperature',
            TEMPERATURE_AMOUNT: 0.35,
            TEMP_COLOR_COLD: { r: 145, g: 220, b: 255 },
            TEMP_COLOR_HOT: { r: 230, g: 255, b: 255 },
            MATERIAL_ROUGHNESS: 0.12,
            MATERIAL_SPECULAR: 0.75,
            FRESNEL_POWER: 1.7,
            ENV_INTENSITY: 0.9,
            VISCOSITY: 1.6,
            PARTICLES_ENABLED: true,
            PARTICLE_ARCHETYPE: 'snow',
            PARTICLE_SPAWN_MODE: 'everywhere',
            PARTICLE_SPAWN_RATE: 90,
            PARTICLE_MAX_COUNT: 10000,
            PARTICLE_BLEND_MODE: 'alpha',
            PARTICLE_FLOW_RESPONSE: 0.22,
            PARTICLE_FIELD_COUPLING: 0.2,
            PARTICLE_ADAPTIVE: true,
            PARTICLE_BUDGET_SCALE: 0.7
        },
        emitters: [
            { id: 'ice-sheet', type: 'area', label: 'Ice sheet', x: 0.5, y: 0.46, width: 0.72, height: 0.18, segments: 15, color: '#b8ecff', force: 0.1, radius: 0.41, pulse: 0.04 }
        ]
    },
    neonPulse: {
        schemaVersion: 3,
        label: 'Neon Pulse',
        category: 'V3 Material',
        description: 'Rainbow neon bloom with audio-ready radial pulses and sparkle particles.',
        tags: ['neon', 'rainbow', 'audio'],
        performanceTier: 'high',
        requires: { particles: true, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 0, g: 0, b: 4 },
            DISPLAY_STYLE: 'neon',
            COLOR_MODE: 'rainbow',
            RAINBOW_SPEED: 0.28,
            RAINBOW_RANGE: 0.92,
            MATERIAL_EMISSIVE: 0.85,
            OUTPUT_GAIN: 1.12,
            TONE_MAPPING: 'aces',
            BLOOM_INTENSITY: 0.96,
            BLOOM_THRESHOLD: 0.68,
            ANAMORPHIC_BLOOM: 0.46,
            ANAMORPHIC_RATIO: 7.5,
            SUNRAYS_WEIGHT: 0.54,
            CHROMATIC_ABERRATION: 1.12,
            LENS_DISTORTION: 0.06,
            VELOCITY_DISTORTION: 0.48,
            CURL: 46,
            TURBULENCE_AMOUNT: 22,
            TURBULENCE_SCALE: 6.2,
            AUDIO_BINDING_MODE: 'pulse',
            AUDIO_GAIN: 1.35,
            AUDIO_FX_AMOUNT: 0.78,
            EMITTER_AUDIO_REACTIVITY: 1.35,
            PARTICLES_ENABLED: true,
            PARTICLE_ARCHETYPE: 'magic',
            PARTICLE_SPAWN_MODE: 'density',
            PARTICLE_SPAWN_THRESHOLD: 0.15,
            PARTICLE_SPAWN_RATE: 520,
            PARTICLE_MAX_COUNT: 28000,
            PARTICLE_SIZE_MIN: 1.2,
            PARTICLE_SIZE_MAX: 6.5,
            PARTICLE_OPACITY: 0.72,
            PARTICLE_TURBULENCE: 0.58,
            PARTICLE_JITTER: 0.46,
            PARTICLE_FLOW_RESPONSE: 1.5,
            PARTICLE_FIELD_COUPLING: 1.1,
            PARTICLE_ADAPTIVE: true,
            PARTICLE_BUDGET_SCALE: 0.9,
            PARTICLE_ROTATION_SPEED: 2.2,
            PARTICLE_VELOCITY_STRETCH: 0.32
        },
        emitters: [
            { id: 'neon-ring', type: 'radial', label: 'Neon ring', x: 0.5, y: 0.5, width: 0.38, segments: 35, color: '#37f4d2', force: 0.1, radius: 0.25, pulse: 0.65, particleConfig: { enabled: true, particleArchetype: 'magic', particleSpawnRate: 380 } },
            { id: 'magenta-core', type: 'point', label: 'Magenta core', x: 0.5, y: 0.5, color: '#ff4fd8', force: 0.1, radius: 0.31, spread: 0.2, particleConfig: { enabled: true, particleArchetype: 'magic', particleSpawnRate: 260 } }
        ],
        particles: {
            roles: {
                spark:  { enabled: true, style: 'spark-electric', budget: 4000, spawnGain: 0.6 },
                ribbon: { enabled: true, style: 'ribbon-aurora',  budget: 2500, spawnGain: 0.4 },
                foam: { enabled: false }, spray: { enabled: false }, mist: { enabled: false }, bubble: { enabled: false }, ember: { enabled: false }, dust: { enabled: false }, debris: { enabled: false }
            }
        }
    },
    watercolorDreams: {
        schemaVersion: 3,
        label: 'Watercolor Dreams',
        category: 'V3 Material',
        description: 'Soft paper-toned watercolor rendering with grain and vignette.',
        tags: ['watercolor', 'grain', 'soft'],
        performanceTier: 'low',
        requires: { particles: false, temperature: false, audio: 'disabled' },
        config: {
            BACK_COLOR: { r: 236, g: 232, b: 220 },
            DISPLAY_STYLE: 'watercolor',
            COLOR_MODE: 'multiStop',
            COLOR_SOURCE_MIX: 0.18,
            BLOOM: false,
            SUNRAYS: false,
            VISCOSITY: 1.15,
            FILM_GRAIN: 0.12,
            VIGNETTE: 0.18,
            TONE_MAPPING: 'aces',
            MATERIAL_SATURATION: 0.72
        },
        emitters: [
            { id: 'wash-left', type: 'area', label: 'Wash left', x: 0.38, y: 0.48, width: 0.5, height: 0.16, segments: 14, color: '#62c6b8', force: 0.1, radius: 0.45, pulse: 0.06 },
            { id: 'wash-warm', type: 'point', label: 'Warm bloom', x: 0.62, y: 0.42, color: '#ef9f7a', force: 0.1, radius: 0.5, spread: 0.18 }
        ]
    },
    thermalVision: {
        schemaVersion: 3,
        label: 'Thermal Vision',
        category: 'V3 Fields',
        description: 'False-color thermal display coupled to heat buoyancy.',
        tags: ['thermal', 'temperature', 'debug'],
        performanceTier: 'medium',
        requires: { particles: false, temperature: true, audio: 'disabled' },
        config: {
            BACK_COLOR: { r: 0, g: 0, b: 0 },
            DISPLAY_STYLE: 'thermal',
            COLOR_MODE: 'temperature',
            TEMPERATURE_AMOUNT: 1,
            BUOYANCY_STRENGTH: 14,
            BLOOM: false,
            SUNRAYS: false,
            TONE_MAPPING: 'none',
            OUTPUT_GAIN: 1
        },
        emitters: [
            { id: 'heat-scan', type: 'line', label: 'Heat scan', x: 0.18, y: 0.18, x2: 0.82, y2: 0.82, color: '#ff500a', force: 0.1, radius: 0.32 },
            { id: 'cold-stream', type: 'line', label: 'Cold stream', x: 0.82, y: 0.18, x2: 0.18, y2: 0.82, color: '#143cff', force: 0.1, radius: 0.25 }
        ]
    },
    oceanStorm: {
        schemaVersion: 3,
        label: 'Ocean Storm',
        category: 'V3 Particles',
        description: 'Foam field and water particles driven by fast velocity shear.',
        tags: ['water', 'foam', 'particles'],
        performanceTier: 'high',
        requires: { particles: true, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 0, g: 5, b: 11 },
            DISPLAY_STYLE: 'glass',
            COLOR_MODE: 'velocity',
            VELOCITY_COLOR_LOW: { r: 4, g: 20, b: 54 },
            VELOCITY_COLOR_MID: { r: 45, g: 206, b: 230 },
            VELOCITY_COLOR_HIGH: { r: 245, g: 252, b: 255 },
            FOAM_AMOUNT: 0.75,
            FOAM_VELOCITY_THRESHOLD: 90,
            MATERIAL_ROUGHNESS: 0.08,
            MATERIAL_SPECULAR: 0.7,
            FRESNEL_POWER: 1.6,
            REFRACTION_RATIO: 1.04,
            OUTPUT_GAIN: 0.98,
            TONE_MAPPING: 'aces',
            BLOOM_INTENSITY: 0.42,
            BLOOM_THRESHOLD: 0.8,
            SUNRAYS_WEIGHT: 0.38,
            GOD_RAY_SOURCE: { x: 0.42, y: 0.22 },
            CURL: 50,
            TURBULENCE_AMOUNT: 28,
            TURBULENCE_SCALE: 7,
            VIGNETTE: 0.2,
            PARTICLES_ENABLED: true,
            PARTICLE_ARCHETYPE: 'water',
            PARTICLE_SPAWN_MODE: 'velocity',
            PARTICLE_SPAWN_THRESHOLD: 0.2,
            PARTICLE_SPAWN_RATE: 520,
            PARTICLE_MAX_COUNT: 30000,
            PARTICLE_BLEND_MODE: 'alpha',
            PARTICLE_SIZE_MIN: 1,
            PARTICLE_SIZE_MAX: 5,
            PARTICLE_OPACITY: 0.66,
            PARTICLE_TURBULENCE: 0.72,
            PARTICLE_FLOW_RESPONSE: 1.8,
            PARTICLE_FIELD_COUPLING: 1.45,
            PARTICLE_ADAPTIVE: true,
            PARTICLE_BUDGET_SCALE: 0.85,
            PARTICLE_VELOCITY_STRETCH: 0.75,
            AUDIO_BINDING_MODE: 'balanced',
            AUDIO_GAIN: 0.9,
            AUDIO_FX_AMOUNT: 0.38
        },
        emitters: [
            { id: 'wave-left', type: 'line', label: 'Wave left', x: 0.08, y: 0.3, x2: 0.88, y2: 0.66, color: '#60d2ff', force: 0.1, radius: 0.31, particleConfig: { enabled: true, particleArchetype: 'water', particleSpawnRate: 360 } },
            { id: 'wave-right', type: 'line', label: 'Wave right', x: 0.92, y: 0.22, x2: 0.12, y2: 0.72, color: '#e6f7ff', force: 0.1, radius: 0.25, particleConfig: { enabled: true, particleArchetype: 'water', particleSpawnRate: 260 } }
        ],
        particles: {
            roles: {
                foam:   { enabled: true, style: 'foam-storm',  budget: 5000, spawnGain: 0.75 },
                spray:  { enabled: true, style: 'spray-water', budget: 3500, spawnGain: 0.6 },
                spark: { enabled: false }, mist: { enabled: false }, ember: { enabled: false }, bubble: { enabled: false }, dust: { enabled: false }, ribbon: { enabled: false }, debris: { enabled: false }
            }
        }
    },
    industrialSmoke: {
        schemaVersion: 3,
        label: 'Industrial Smoke',
        category: 'V3 Particles',
        description: 'Buoyant smoke wisps with muted particles and low bloom.',
        tags: ['smoke', 'temperature', 'particles'],
        performanceTier: 'medium',
        requires: { particles: true, temperature: true, audio: 'disabled' },
        config: {
            BACK_COLOR: { r: 4, g: 4, b: 5 },
            DISPLAY_STYLE: 'material',
            COLOR_MODE: 'age',
            TEMPERATURE_AMOUNT: 0.55,
            BUOYANCY_STRENGTH: 10,
            VISCOSITY: 1.2,
            BLOOM_INTENSITY: 0.18,
            SUNRAYS: false,
            PARTICLES_ENABLED: true,
            PARTICLE_ARCHETYPE: 'smoke',
            PARTICLE_SPAWN_MODE: 'density',
            PARTICLE_SPAWN_THRESHOLD: 0.12,
            PARTICLE_SPAWN_RATE: 140,
            PARTICLE_MAX_COUNT: 18000,
            PARTICLE_BLEND_MODE: 'alpha',
            PARTICLE_FLOW_RESPONSE: 0.58,
            PARTICLE_FIELD_COUPLING: 0.8,
            PARTICLE_ADAPTIVE: true,
            PARTICLE_BUDGET_SCALE: 0.75
        },
        emitters: [
            { id: 'stack-a', type: 'point', label: 'Stack A', x: 0.38, y: 0.16, color: '#8c8c92', force: 0.1, radius: 0.45, spread: 0.16, particleConfig: { enabled: true, particleArchetype: 'smoke', particleSpawnRate: 130 } },
            { id: 'stack-b', type: 'point', label: 'Stack B', x: 0.58, y: 0.14, color: '#b0a59b', force: 0.1, radius: 0.38, spread: 0.12, particleConfig: { enabled: true, particleArchetype: 'smoke', particleSpawnRate: 110 } }
        ]
    },
    cosmicDust: {
        schemaVersion: 3,
        label: 'Cosmic Dust',
        category: 'V3 Particles',
        description: 'Multi-stop nebula color with magic dust particles and cinematic grading.',
        tags: ['nebula', 'multi-stop', 'particles'],
        performanceTier: 'high',
        requires: { particles: true, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 0, g: 1, b: 8 },
            DISPLAY_STYLE: 'material',
            COLOR_MODE: 'multiStop',
            COLOR_STOPS: [
                { position: 0, color: { r: 0, g: 1, b: 8 } },
                { position: 0.2, color: { r: 31, g: 18, b: 82 } },
                { position: 0.42, color: { r: 132, g: 82, b: 255 } },
                { position: 0.62, color: { r: 48, g: 235, b: 205 } },
                { position: 0.82, color: { r: 255, g: 92, b: 190 } },
                { position: 1, color: { r: 255, g: 230, b: 145 } }
            ],
            COLOR_SOURCE_MIX: 0.22,
            MATERIAL_CONTRAST: 1.1,
            MATERIAL_SATURATION: 1.2,
            MATERIAL_EXPOSURE: 0.92,
            MATERIAL_ROUGHNESS: 0.36,
            MATERIAL_SPECULAR: 0.5,
            MATERIAL_EMISSIVE: 0.5,
            OUTPUT_GAIN: 1.04,
            VIGNETTE: 0.28,
            FILM_GRAIN: 0.05,
            TONE_MAPPING: 'aces',
            BLOOM_INTENSITY: 0.62,
            BLOOM_THRESHOLD: 0.76,
            SUNRAYS_WEIGHT: 0.44,
            ANAMORPHIC_BLOOM: 0.2,
            CURL: 38,
            TURBULENCE_AMOUNT: 14,
            TURBULENCE_SCALE: 5.2,
            PARTICLES_ENABLED: true,
            PARTICLE_ARCHETYPE: 'magic',
            PARTICLE_SPAWN_MODE: 'density',
            PARTICLE_SPAWN_THRESHOLD: 0.14,
            PARTICLE_SPAWN_RATE: 380,
            PARTICLE_MAX_COUNT: 26000,
            PARTICLE_SIZE_MIN: 1,
            PARTICLE_SIZE_MAX: 6,
            PARTICLE_OPACITY: 0.62,
            PARTICLE_TURBULENCE: 0.48,
            PARTICLE_JITTER: 0.28,
            PARTICLE_FLOW_RESPONSE: 1.15,
            PARTICLE_FIELD_COUPLING: 0.95,
            PARTICLE_ADAPTIVE: true,
            PARTICLE_BUDGET_SCALE: 0.8,
            PARTICLE_ROTATION_SPEED: 0.9,
            PARTICLE_VELOCITY_STRETCH: 0.24,
            AUDIO_BINDING_MODE: 'balanced',
            AUDIO_GAIN: 1.05,
            AUDIO_FX_AMOUNT: 0.42
        },
        emitters: [
            { id: 'dust-field', type: 'area', label: 'Dust field', x: 0.5, y: 0.5, width: 0.74, height: 0.34, segments: 18, color: '#8c5cff', force: 0.1, radius: 0.35, pulse: 0.14, particleConfig: { enabled: true, particleArchetype: 'magic', particleSpawnRate: 260 } },
            { id: 'stellar-seed', type: 'radial', label: 'Stellar seed', x: 0.54, y: 0.52, width: 0.24, segments: 20, color: '#34f5c5', force: 0.1, radius: 0.22, pulse: 0.18, particleConfig: { enabled: true, particleArchetype: 'magic', particleSpawnRate: 220 } }
        ]
    },

    // ---- v0.5 new curated presets (12) -----------------------------------
    'lava-flow': {
        schemaVersion: 3,
        label: 'Lava Flow',
        category: 'Realistic',
        description: 'Slow viscous lava with rising ember plumes and ash cooldown.',
        tags: ['fire', 'lava', 'thermal', 'slow'],
        performanceTier: 'medium',
        requires: { particles: true, temperature: true, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 6, g: 2, b: 0 },
            DISPLAY_STYLE: 'material', MATERIAL_STYLE: 'dye',
            PALETTE_A: { r: 18, g: 4, b: 2 }, PALETTE_B: { r: 255, g: 96, b: 18 }, PALETTE_C: { r: 255, g: 220, b: 80 },
            COLOR_MODE: 'gradient', GRADIENT_SCALE: 0.86,
            MATERIAL_CONTRAST: 1.16, MATERIAL_SATURATION: 1.08, MATERIAL_EXPOSURE: 0.88,
            BLOOM_INTENSITY: 0.7, BLOOM_THRESHOLD: 0.84, ANAMORPHIC_BLOOM: 0.18,
            CHROMATIC_ABERRATION: 0.32, LENS_DISTORTION: 0.02,
            CURL: 24, VISCOSITY: 1.4, TURBULENCE_AMOUNT: 8, TURBULENCE_SCALE: 6.5,
            ADVECTION_METHOD: 'maccormack', GRAVITY_Y: 12,
            TEMPERATURE_AMOUNT: 0.6, BUOYANCY_STRENGTH: 16, BUOYANCY_DIRECTION: 1.57,
            EMITTER_RATE: 7, EMITTER_INTENSITY: 0.5,
            PARTICLES_ENABLED: true, PARTICLE_ARCHETYPE: 'fire', PARTICLE_SPAWN_RATE: 320, PARTICLE_MAX_COUNT: 24000,
            PARTICLE_FLOW_RESPONSE: 1.05, PARTICLE_FIELD_COUPLING: 1.2, PARTICLE_ADAPTIVE: true,
            AUDIO_BINDING_MODE: 'off'
        },
        emitters: [
            { id: 'lava-vent', type: 'line', label: 'Lava vent', x: 0.28, y: 0.16, x2: 0.72, y2: 0.16, color: '#ff5a18', force: 0.1, radius: 0.45 },
            { id: 'plume', type: 'point', label: 'Plume',     x: 0.5, y: 0.22, color: '#ffd070', force: 0.1, radius: 0.32, spread: 0.35,
                particleConfig: { enabled: true, particleArchetype: 'fire', particleSpawnRate: 220 } }
        ]
    },

    rainstorm: {
        schemaVersion: 3,
        label: 'Rainstorm',
        category: 'Realistic',
        description: 'Driving rain with wind gusts and foam on impact zones.',
        tags: ['rain', 'water', 'storm'],
        performanceTier: 'high',
        requires: { particles: true, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 3, g: 7, b: 12 }, DISPLAY_STYLE: 'gradient',
            PALETTE_A: { r: 6, g: 18, b: 28 }, PALETTE_B: { r: 70, g: 110, b: 150 }, PALETTE_C: { r: 200, g: 220, b: 245 },
            COLOR_MODE: 'gradient', GRADIENT_SCALE: 0.74,
            MATERIAL_CONTRAST: 1.06, MATERIAL_SATURATION: 0.85,
            BLOOM_INTENSITY: 0.3, SUNRAYS_WEIGHT: 0.28, VIGNETTE: 0.25,
            CHROMATIC_ABERRATION: 0.18, FILM_GRAIN: 0.06, VELOCITY_DISTORTION: 0.55,
            CURL: 18, VISCOSITY: 0.2, TURBULENCE_AMOUNT: 22, TURBULENCE_SCALE: 4.2,
            ADVECTION_METHOD: 'maccormack', GRAVITY_Y: 32, WIND_X: -18,
            FOAM_AMOUNT: 0.5, FOAM_VELOCITY_THRESHOLD: 140,
            EMITTER_RATE: 18, EMITTER_INTENSITY: 0.35,
            PARTICLES_ENABLED: true, PARTICLE_ARCHETYPE: 'water', PARTICLE_SPAWN_RATE: 1100, PARTICLE_MAX_COUNT: 32000,
            PARTICLE_VELOCITY_STRETCH: 1.4, PARTICLE_GRAVITY: 3, PARTICLE_FLOW_RESPONSE: 0.6,
            AUDIO_BINDING_MODE: 'off'
        },
        emitters: [
            { id: 'rain-band', type: 'area', label: 'Rain band', x: 0.5, y: 0.92, width: 1, height: 0.08, segments: 30, direction: -1.57, color: '#cfe2f5', force: 0.1, radius: 0.2, pulse: 0.05 }
        ]
    },

    'volcanic-plume': {
        schemaVersion: 3,
        label: 'Volcanic Plume',
        category: 'Realistic',
        description: 'Heavy ash + ember column with strong upward buoyancy.',
        tags: ['fire', 'ash', 'smoke', 'volcano'],
        performanceTier: 'high',
        requires: { particles: true, temperature: true, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 4, g: 3, b: 4 }, DISPLAY_STYLE: 'material',
            PALETTE_A: { r: 12, g: 6, b: 4 }, PALETTE_B: { r: 170, g: 60, b: 14 }, PALETTE_C: { r: 240, g: 200, b: 150 },
            COLOR_MODE: 'gradient', GRADIENT_SCALE: 0.92,
            MATERIAL_CONTRAST: 1.18, MATERIAL_EXPOSURE: 0.82,
            BLOOM_INTENSITY: 0.62, ANAMORPHIC_BLOOM: 0.28,
            CHROMATIC_ABERRATION: 0.25, VIGNETTE: 0.18,
            CURL: 32, VISCOSITY: 0.6, TURBULENCE_AMOUNT: 26, TURBULENCE_SCALE: 5.2,
            ADVECTION_METHOD: 'maccormack', GRAVITY_Y: -8,
            TEMPERATURE_AMOUNT: 0.85, BUOYANCY_STRENGTH: 24, BUOYANCY_DIRECTION: 1.57,
            EMITTER_RATE: 9, EMITTER_INTENSITY: 0.55,
            PARTICLES_ENABLED: true, PARTICLE_ARCHETYPE: 'smoke', PARTICLE_SPAWN_RATE: 520, PARTICLE_MAX_COUNT: 28000,
            PARTICLE_BUOYANCY: 1.4, PARTICLE_FIELD_COUPLING: 1.3,
            AUDIO_BINDING_MODE: 'off'
        },
        emitters: [
            { id: 'caldera', type: 'radial', label: 'Caldera',   x: 0.5, y: 0.14, width: 0.22, segments: 35, color: '#ff5018', force: 0.1, radius: 0.31, pulse: 0.32 },
            { id: 'core',    type: 'point',  label: 'Hot core',  x: 0.5, y: 0.16, color: '#ffd070', force: 0.1, radius: 0.25, spread: 0.4,
                particleConfig: { enabled: true, particleArchetype: 'fire', particleSpawnRate: 260 } }
        ]
    },

    'underwater-currents': {
        schemaVersion: 3,
        label: 'Underwater Currents',
        category: 'Realistic',
        description: 'Slow blue currents with rising bubbles and soft caustic bloom.',
        tags: ['water', 'underwater', 'bubble', 'slow'],
        performanceTier: 'medium',
        requires: { particles: true, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 2, g: 8, b: 16 }, DISPLAY_STYLE: 'glass',
            PALETTE_A: { r: 4, g: 18, b: 38 }, PALETTE_B: { r: 36, g: 116, b: 186 }, PALETTE_C: { r: 160, g: 220, b: 240 },
            COLOR_MODE: 'gradient', GRADIENT_SCALE: 0.78,
            MATERIAL_CONTRAST: 1.05, MATERIAL_SATURATION: 1.1, MATERIAL_EXPOSURE: 0.94,
            MATERIAL_RIM: 0.42, FRESNEL_POWER: 2.1,
            BLOOM_INTENSITY: 0.48, BLOOM_THRESHOLD: 0.78, SUNRAYS_WEIGHT: 0.44,
            GOD_RAY_SOURCE: { x: 0.5, y: 0.85 },
            CHROMATIC_ABERRATION: 0.16, LENS_DISTORTION: 0.04,
            CURL: 22, VISCOSITY: 0.85, TURBULENCE_AMOUNT: 9, TURBULENCE_SCALE: 4.6,
            ADVECTION_METHOD: 'maccormack', GRAVITY_Y: -3, WIND_X: 4,
            EMITTER_RATE: 8, EMITTER_INTENSITY: 0.42,
            PARTICLES_ENABLED: true, PARTICLE_ARCHETYPE: 'water', PARTICLE_SPAWN_RATE: 280, PARTICLE_MAX_COUNT: 22000,
            PARTICLE_BUOYANCY: -0.6, PARTICLE_GRAVITY: -0.4, PARTICLE_OPACITY: 0.55,
            AUDIO_BINDING_MODE: 'off'
        },
        emitters: [
            { id: 'flow', type: 'spline', label: 'Current', x: 0.05, y: 0.55, x2: 0.32, y2: 0.66, x3: 0.66, y3: 0.42, x4: 0.95, y4: 0.58, segments: 25, color: '#3ea3d6', force: 0.1, radius: 0.31, spread: 0.18 },
            { id: 'rising-bubbles', type: 'area', label: 'Bubbles', x: 0.5, y: 0.1, width: 0.6, height: 0.08, segments: 15, direction: 1.57, color: '#a9def0', force: 0.1, radius: 0.22, pulse: 0.18,
                particleConfig: { enabled: true, particleArchetype: 'water', particleSpawnRate: 180 } }
        ]
    },

    'lofi-beat': {
        schemaVersion: 3,
        label: 'Lo-fi Beat',
        category: 'Audio Reactive',
        description: 'Warm grainy palette, mid-driven flow, gentle vignette.',
        tags: ['audio', 'lofi', 'warm', 'chill'],
        performanceTier: 'medium',
        requires: { particles: true, temperature: false, audio: 'required' },
        config: {
            BACK_COLOR: { r: 6, g: 5, b: 4 }, DISPLAY_STYLE: 'classic',
            PALETTE_A: { r: 10, g: 8, b: 6 }, PALETTE_B: { r: 196, g: 138, b: 90 }, PALETTE_C: { r: 240, g: 210, b: 168 },
            COLOR_MODE: 'gradient', GRADIENT_SCALE: 0.82, HUE_SHIFT: 18,
            MATERIAL_CONTRAST: 1.02, MATERIAL_SATURATION: 0.7, MATERIAL_EXPOSURE: 0.85,
            BLOOM_INTENSITY: 0.42, FILM_GRAIN: 0.18, FILM_GRAIN_SPEED: 0.6,
            VIGNETTE: 0.32, VIGNETTE_RADIUS: 0.78,
            TONE_MAPPING: 'aces',
            CURL: 18, VISCOSITY: 0.55, TURBULENCE_AMOUNT: 10, TURBULENCE_SCALE: 4,
            EMITTER_RATE: 7, EMITTER_INTENSITY: 0.36,
            PARTICLES_ENABLED: true, PARTICLE_ARCHETYPE: 'smoke', PARTICLE_SPAWN_RATE: 160, PARTICLE_MAX_COUNT: 18000,
            PARTICLE_OPACITY: 0.4,
            AUDIO_BINDING_MODE: 'lofi', AUDIO_GAIN: 1.1, AUDIO_FX_AMOUNT: 0.55
        },
        emitters: [
            { id: 'beat-spline', type: 'spline', label: 'Beat spline', x: 0.16, y: 0.34, x2: 0.42, y2: 0.66, x3: 0.62, y3: 0.36, x4: 0.86, y4: 0.6, segments: 20, color: '#c48a5a', force: 0.1, radius: 0.25, spread: 0.18 },
            { id: 'pad-area',    type: 'area',   label: 'Pad bed',     x: 0.5, y: 0.48, width: 0.78, height: 0.24, segments: 15, color: '#f0d2a8', force: 0.1, radius: 0.35, pulse: 0.08 }
        ]
    },

    'vocal-halo': {
        schemaVersion: 3,
        label: 'Vocal Halo',
        category: 'Audio Reactive',
        description: 'Bloom and sunrays breathe with vocal centroid + RMS.',
        tags: ['audio', 'vocal', 'cinematic'],
        performanceTier: 'medium',
        requires: { particles: false, temperature: false, audio: 'required' },
        config: {
            BACK_COLOR: { r: 2, g: 4, b: 10 }, DISPLAY_STYLE: 'glass',
            PALETTE_A: { r: 4, g: 8, b: 22 }, PALETTE_B: { r: 90, g: 180, b: 240 }, PALETTE_C: { r: 255, g: 225, b: 180 },
            COLOR_MODE: 'multiStop',
            COLOR_STOPS: [
                { position: 0, color: { r: 4, g: 10, b: 30 } },
                { position: 0.35, color: { r: 60, g: 160, b: 220 } },
                { position: 0.7, color: { r: 255, g: 200, b: 160 } },
                { position: 1, color: { r: 255, g: 240, b: 220 } }
            ],
            MATERIAL_CONTRAST: 1.04, MATERIAL_SATURATION: 1.06, MATERIAL_EXPOSURE: 0.92,
            BLOOM_INTENSITY: 0.55, BLOOM_THRESHOLD: 0.72, ANAMORPHIC_BLOOM: 0.32, ANAMORPHIC_RATIO: 5,
            SUNRAYS_WEIGHT: 0.55, GOD_RAY_SOURCE: { x: 0.5, y: 0.5 },
            CHROMATIC_ABERRATION: 0.28,
            CURL: 22, TURBULENCE_AMOUNT: 7,
            EMITTER_RATE: 6, EMITTER_INTENSITY: 0.42,
            AUDIO_BINDING_MODE: 'cinema', AUDIO_FX_AMOUNT: 0.55
        },
        emitters: [
            { id: 'halo-ring', type: 'radial', label: 'Halo ring', x: 0.5, y: 0.5, width: 0.4, segments: 30, color: '#6cb6f0', force: 0.1, radius: 0.25, pulse: 0.22 }
        ]
    },

    'strobe-floor': {
        schemaVersion: 3,
        label: 'Strobe Floor',
        category: 'Audio Reactive',
        description: 'Hard beat strobe with bloom and chromatic punch.',
        tags: ['audio', 'beat', 'rave', 'intense'],
        performanceTier: 'high',
        requires: { particles: true, temperature: false, audio: 'required' },
        config: {
            BACK_COLOR: { r: 0, g: 0, b: 0 }, DISPLAY_STYLE: 'neon',
            PALETTE_A: { r: 8, g: 0, b: 20 }, PALETTE_B: { r: 255, g: 0, b: 200 }, PALETTE_C: { r: 80, g: 255, b: 240 },
            COLOR_MODE: 'dual',
            SINGLE_COLOR: { r: 255, g: 60, b: 220 }, SECONDARY_COLOR: { r: 60, g: 240, b: 255 },
            MATERIAL_CONTRAST: 1.28, MATERIAL_SATURATION: 1.36, MATERIAL_EXPOSURE: 0.92,
            BLOOM_INTENSITY: 0.65, BLOOM_THRESHOLD: 0.6, ANAMORPHIC_BLOOM: 0.32,
            CHROMATIC_ABERRATION: 0.4, VELOCITY_DISTORTION: 0.45, MOTION_BLUR: 0.2,
            CURL: 36, TURBULENCE_AMOUNT: 18,
            EMITTER_RATE: 10, EMITTER_INTENSITY: 0.5,
            PARTICLES_ENABLED: true, PARTICLE_ARCHETYPE: 'magic', PARTICLE_SPAWN_RATE: 700, PARTICLE_MAX_COUNT: 28000,
            PARTICLE_FLOW_RESPONSE: 1.4,
            AUDIO_BINDING_MODE: 'rave-hard', AUDIO_GAIN: 1.2, AUDIO_FX_AMOUNT: 0.7
        },
        emitters: [
            { id: 'floor-line', type: 'line', label: 'Floor', x: 0.06, y: 0.18, x2: 0.94, y2: 0.18, color: '#ff3cb9', force: 0.1, radius: 0.45 },
            { id: 'top-arc',    type: 'spline', label: 'Top arc', x: 0.1, y: 0.86, x2: 0.32, y2: 0.74, x3: 0.68, y3: 0.92, x4: 0.9, y4: 0.78, segments: 20, color: '#3cfff4', force: 0.1, radius: 0.25, spread: 0.18 }
        ]
    },

    glitch: {
        schemaVersion: 3,
        label: 'Glitch',
        category: 'Abstract',
        description: 'Chromatic, film grain, sample-and-hold hue jumps.',
        tags: ['glitch', 'abstract', 'datamosh'],
        performanceTier: 'medium',
        requires: { particles: false, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 0, g: 0, b: 0 }, DISPLAY_STYLE: 'classic',
            PALETTE_A: { r: 0, g: 0, b: 0 }, PALETTE_B: { r: 255, g: 0, b: 90 }, PALETTE_C: { r: 0, g: 255, b: 180 },
            COLOR_MODE: 'rainbow', RAINBOW_SPEED: 0.42, RAINBOW_RANGE: 1, HUE_SHIFT: 220,
            MATERIAL_CONTRAST: 1.3, MATERIAL_SATURATION: 1.4,
            BLOOM_INTENSITY: 0.42, ANAMORPHIC_BLOOM: 0.18,
            CHROMATIC_ABERRATION: 1.6, LENS_DISTORTION: 0.06,
            FILM_GRAIN: 0.32, FILM_GRAIN_SPEED: 2.4, VIGNETTE: 0.18, MOTION_BLUR: 0.18,
            CURL: 28, TURBULENCE_AMOUNT: 16, TURBULENCE_SCALE: 5,
            EMITTER_RATE: 11, EMITTER_INTENSITY: 0.42,
            AUDIO_BINDING_MODE: 'pulse', AUDIO_FX_AMOUNT: 0.6
        },
        emitters: [
            { id: 'bar-1', type: 'line', label: 'Glitch bar 1', x: 0.1, y: 0.42, x2: 0.9, y2: 0.42, color: '#ff0066', force: 0.1, radius: 0.18 },
            { id: 'bar-2', type: 'line', label: 'Glitch bar 2', x: 0.1, y: 0.58, x2: 0.9, y2: 0.58, color: '#00ffc8', force: 0.1, radius: 0.18 }
        ]
    },

    'oil-painting': {
        schemaVersion: 3,
        label: 'Oil Painting',
        category: 'Abstract',
        description: 'High viscosity, painterly palette, dense brush stroke emitters.',
        tags: ['painterly', 'viscous', 'abstract'],
        performanceTier: 'medium',
        requires: { particles: false, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 20, g: 14, b: 8 }, DISPLAY_STYLE: 'watercolor',
            PALETTE_A: { r: 30, g: 20, b: 10 }, PALETTE_B: { r: 200, g: 140, b: 60 }, PALETTE_C: { r: 240, g: 100, b: 120 },
            COLOR_MODE: 'multiStop',
            COLOR_STOPS: [
                { position: 0, color: { r: 38, g: 24, b: 14 } },
                { position: 0.4, color: { r: 200, g: 130, b: 60 } },
                { position: 0.75, color: { r: 240, g: 90, b: 110 } },
                { position: 1, color: { r: 250, g: 220, b: 180 } }
            ],
            MATERIAL_CONTRAST: 1.12, MATERIAL_SATURATION: 1.18, MATERIAL_EXPOSURE: 0.9,
            BLOOM_INTENSITY: 0.32, BLOOM_THRESHOLD: 0.84,
            CHROMATIC_ABERRATION: 0.18, FILM_GRAIN: 0.1,
            CURL: 10, VISCOSITY: 4.6, TURBULENCE_AMOUNT: 4, ADVECTION_METHOD: 'bfecc',
            EMITTER_RATE: 4, EMITTER_INTENSITY: 0.55,
            AUDIO_BINDING_MODE: 'off'
        },
        emitters: [
            { id: 'stroke-1', type: 'brush', label: 'Brush stroke 1', color: '#d68a3c', force: 0.1, radius: 0.31, spread: 0.14, segments: 35, points: [
                { x: 0.15, y: 0.32 }, { x: 0.32, y: 0.5 }, { x: 0.55, y: 0.46 }, { x: 0.78, y: 0.6 }, { x: 0.92, y: 0.52 }
            ] },
            { id: 'stroke-2', type: 'brush', label: 'Brush stroke 2', color: '#e85070', force: 0.1, radius: 0.25, spread: 0.12, segments: 30, points: [
                { x: 0.1, y: 0.7 }, { x: 0.34, y: 0.62 }, { x: 0.6, y: 0.74 }, { x: 0.88, y: 0.66 }
            ] }
        ]
    },

    'plasma-field': {
        schemaVersion: 3,
        label: 'Plasma Field',
        category: 'Showcase',
        description: 'High curl + neon palette + heavy bloom + audio reactive.',
        tags: ['plasma', 'neon', 'intense', 'audio'],
        performanceTier: 'extreme',
        requires: { particles: true, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 0, g: 0, b: 0 }, DISPLAY_STYLE: 'neon',
            PALETTE_A: { r: 0, g: 6, b: 24 }, PALETTE_B: { r: 60, g: 220, b: 255 }, PALETTE_C: { r: 200, g: 60, b: 255 },
            COLOR_MODE: 'rainbow', RAINBOW_SPEED: 0.2, RAINBOW_RANGE: 0.95,
            MATERIAL_CONTRAST: 1.2, MATERIAL_SATURATION: 1.4, MATERIAL_EXPOSURE: 1.0,
            BLOOM_INTENSITY: 0.85, BLOOM_THRESHOLD: 0.62, ANAMORPHIC_BLOOM: 0.55,
            CHROMATIC_ABERRATION: 0.65, LENS_DISTORTION: 0.04, VELOCITY_DISTORTION: 0.4,
            SUNRAYS_WEIGHT: 0.42,
            CURL: 56, VISCOSITY: 0.2, TURBULENCE_AMOUNT: 36, TURBULENCE_SCALE: 6,
            EMITTER_RATE: 14, EMITTER_INTENSITY: 0.6,
            PARTICLES_ENABLED: true, PARTICLE_ARCHETYPE: 'magic', PARTICLE_SPAWN_RATE: 1500, PARTICLE_MAX_COUNT: 60000,
            PARTICLE_FLOW_RESPONSE: 1.8, PARTICLE_FIELD_COUPLING: 1.3,
            AUDIO_BINDING_MODE: 'pulse', AUDIO_FX_AMOUNT: 0.65
        },
        emitters: [
            { id: 'plasma-1', type: 'radial', label: 'Plasma A', x: 0.32, y: 0.5, width: 0.3, segments: 25, color: '#3cdcff', force: 0.1, radius: 0.28, pulse: 0.32 },
            { id: 'plasma-2', type: 'radial', label: 'Plasma B', x: 0.68, y: 0.5, width: 0.3, segments: 25, color: '#c83cff', force: 0.1, radius: 0.28, pulse: 0.32 },
            { id: 'plasma-c', type: 'point',  label: 'Plasma core', x: 0.5, y: 0.5, color: '#ffffff', force: 0.1, radius: 0.2, spread: 0.5,
                particleConfig: { enabled: true, particleArchetype: 'magic', particleSpawnRate: 540 } }
        ]
    },

    whisper: {
        schemaVersion: 3,
        label: 'Whisper',
        category: 'Minimal',
        description: 'Single soft radial emitter, pastel palette, gentle drift.',
        tags: ['minimal', 'soft', 'pastel', 'slow'],
        performanceTier: 'low',
        requires: { particles: false, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 12, g: 16, b: 24 }, DISPLAY_STYLE: 'gradient',
            PALETTE_A: { r: 20, g: 28, b: 42 }, PALETTE_B: { r: 200, g: 180, b: 220 }, PALETTE_C: { r: 240, g: 220, b: 220 },
            COLOR_MODE: 'gradient', GRADIENT_SCALE: 0.7,
            MATERIAL_CONTRAST: 0.96, MATERIAL_SATURATION: 0.78, MATERIAL_EXPOSURE: 0.86,
            BLOOM_INTENSITY: 0.3, BLOOM_THRESHOLD: 0.84,
            CHROMATIC_ABERRATION: 0.1, VIGNETTE: 0.22, FILM_GRAIN: 0.05,
            CURL: 12, VISCOSITY: 0.4, TURBULENCE_AMOUNT: 4,
            EMITTER_RATE: 3, EMITTER_INTENSITY: 0.25,
            AUDIO_BINDING_MODE: 'ambient', AUDIO_FX_AMOUNT: 0.4
        },
        emitters: [
            { id: 'whisper-center', type: 'radial', label: 'Whisper', x: 0.5, y: 0.52, width: 0.28, segments: 15, color: '#d0b0e0', force: 0.1, radius: 0.2, pulse: 0.1 }
        ]
    },

    'slow-drift': {
        schemaVersion: 3,
        label: 'Slow Drift',
        category: 'Minimal',
        description: 'Wind-only motion, painterly trails, no beat.',
        tags: ['minimal', 'painterly', 'wind', 'background'],
        performanceTier: 'low',
        requires: { particles: false, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 6, g: 10, b: 14 }, DISPLAY_STYLE: 'watercolor',
            PALETTE_A: { r: 8, g: 14, b: 22 }, PALETTE_B: { r: 80, g: 140, b: 180 }, PALETTE_C: { r: 220, g: 230, b: 240 },
            COLOR_MODE: 'gradient', GRADIENT_SCALE: 0.72,
            MATERIAL_CONTRAST: 1.0, MATERIAL_SATURATION: 0.92, MATERIAL_EXPOSURE: 0.88,
            BLOOM_INTENSITY: 0.28, MOTION_BLUR: 0.32,
            CHROMATIC_ABERRATION: 0.12, FILM_GRAIN: 0.04,
            CURL: 14, VISCOSITY: 0.6, TURBULENCE_AMOUNT: 5, TURBULENCE_SPEED: 0.3,
            WIND_X: 12, GRAVITY_Y: 0,
            EMITTER_RATE: 5, EMITTER_INTENSITY: 0.3,
            AUDIO_BINDING_MODE: 'ambient'
        },
        emitters: [
            { id: 'drift-line', type: 'line', label: 'Drift line', x: 0.05, y: 0.5, x2: 0.15, y2: 0.5, color: '#7ab0d0', force: 0.1, radius: 0.31 }
        ]
    },

    // ---- v0.5 Phase 2 — 18 more curated presets (toward the 58-target catalogue)

    'forest-mist': {
        schemaVersion: 3,
        label: 'Forest Mist', category: 'Realistic',
        description: 'Slow green-grey mist with painterly drift.',
        tags: ['smoke', 'green', 'slow', 'painterly'],
        performanceTier: 'low',
        requires: { particles: true, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 6, g: 12, b: 10 }, DISPLAY_STYLE: 'watercolor',
            PALETTE_A: { r: 12, g: 22, b: 18 }, PALETTE_B: { r: 76, g: 140, b: 96 }, PALETTE_C: { r: 200, g: 220, b: 180 },
            COLOR_MODE: 'gradient', GRADIENT_SCALE: 0.72,
            MATERIAL_CONTRAST: 1.0, MATERIAL_SATURATION: 0.84,
            BLOOM_INTENSITY: 0.24, MOTION_BLUR: 0.18, VIGNETTE: 0.26,
            CURL: 16, VISCOSITY: 0.8, TURBULENCE_AMOUNT: 6,
            WIND_X: 6, GRAVITY_Y: -2,
            EMITTER_RATE: 5, EMITTER_INTENSITY: 0.32,
            PARTICLES_ENABLED: true, PARTICLE_ARCHETYPE: 'smoke', PARTICLE_SPAWN_RATE: 120, PARTICLE_MAX_COUNT: 14000,
            PARTICLE_OPACITY: 0.32,
            AUDIO_BINDING_MODE: 'ambient'
        },
        emitters: [
            { id: 'mist-band', type: 'area', label: 'Mist band', x: 0.5, y: 0.42, width: 0.78, height: 0.2, segments: 15, color: '#4c8c60', force: 0.1, radius: 0.41, pulse: 0.06 }
        ]
    },

    'sunset-over-water': {
        schemaVersion: 3,
        label: 'Sunset Over Water', category: 'Realistic',
        description: 'Orange-teal gradient with foam highlights on the horizon.',
        tags: ['water', 'sunset', 'warm-cool'],
        performanceTier: 'medium',
        requires: { particles: true, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 8, g: 6, b: 10 }, DISPLAY_STYLE: 'glass',
            PALETTE_A: { r: 12, g: 18, b: 40 }, PALETTE_B: { r: 240, g: 130, b: 80 }, PALETTE_C: { r: 255, g: 220, b: 160 },
            COLOR_MODE: 'multiStop',
            COLOR_STOPS: [
                { position: 0, color: { r: 8, g: 16, b: 36 } },
                { position: 0.45, color: { r: 60, g: 120, b: 180 } },
                { position: 0.7, color: { r: 240, g: 130, b: 80 } },
                { position: 1, color: { r: 255, g: 220, b: 160 } }
            ],
            BLOOM_INTENSITY: 0.5, BLOOM_THRESHOLD: 0.74, SUNRAYS_WEIGHT: 0.48,
            GOD_RAY_SOURCE: { x: 0.5, y: 0.62 },
            CHROMATIC_ABERRATION: 0.18,
            CURL: 22, VISCOSITY: 0.4, TURBULENCE_AMOUNT: 7,
            FOAM_AMOUNT: 0.32, FOAM_VELOCITY_THRESHOLD: 180,
            WIND_X: 6, EMITTER_RATE: 8, EMITTER_INTENSITY: 0.4,
            PARTICLES_ENABLED: true, PARTICLE_ARCHETYPE: 'water', PARTICLE_SPAWN_RATE: 180, PARTICLE_MAX_COUNT: 18000,
            PARTICLE_OPACITY: 0.55,
            AUDIO_BINDING_MODE: 'off'
        },
        emitters: [
            { id: 'horizon', type: 'line', label: 'Horizon', x: 0.05, y: 0.55, x2: 0.95, y2: 0.55, color: '#f08250', force: 0.1, radius: 0.41 },
            { id: 'sun',     type: 'point', label: 'Sun', x: 0.5, y: 0.62, color: '#ffe0a0', force: 0.1, radius: 0.25, spread: 0.18 }
        ]
    },

    glacial: {
        schemaVersion: 3,
        label: 'Glacial', category: 'Realistic',
        description: 'Pale blues, low diffusion, ice-like ridges.',
        tags: ['ice', 'cold', 'minimal'],
        performanceTier: 'low',
        requires: { particles: true, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 6, g: 10, b: 16 }, DISPLAY_STYLE: 'material',
            PALETTE_A: { r: 12, g: 22, b: 36 }, PALETTE_B: { r: 140, g: 200, b: 240 }, PALETTE_C: { r: 230, g: 245, b: 255 },
            COLOR_MODE: 'gradient', GRADIENT_SCALE: 0.78,
            MATERIAL_CONTRAST: 1.04, MATERIAL_SATURATION: 0.78, MATERIAL_EXPOSURE: 0.92,
            BLOOM_INTENSITY: 0.36, BLOOM_THRESHOLD: 0.84, CHROMATIC_ABERRATION: 0.12,
            CURL: 14, VISCOSITY: 0.18, TURBULENCE_AMOUNT: 4,
            EMITTER_RATE: 6, EMITTER_INTENSITY: 0.36,
            PARTICLES_ENABLED: true, PARTICLE_ARCHETYPE: 'snow', PARTICLE_SPAWN_RATE: 200, PARTICLE_MAX_COUNT: 16000,
            AUDIO_BINDING_MODE: 'off'
        },
        emitters: [
            { id: 'crest', type: 'line', label: 'Ice crest', x: 0.18, y: 0.62, x2: 0.82, y2: 0.62, color: '#a8d6f0', force: 0.1, radius: 0.32 }
        ]
    },

    tornado: {
        schemaVersion: 3,
        label: 'Tornado', category: 'Realistic',
        description: 'High curl with concentrated grey vortex.',
        tags: ['storm', 'vortex', 'grey', 'high-curl'],
        performanceTier: 'high',
        requires: { particles: true, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 6, g: 8, b: 12 }, DISPLAY_STYLE: 'gradient',
            PALETTE_A: { r: 10, g: 12, b: 16 }, PALETTE_B: { r: 110, g: 110, b: 120 }, PALETTE_C: { r: 220, g: 220, b: 220 },
            COLOR_MODE: 'gradient', GRADIENT_SCALE: 0.62,
            MATERIAL_CONTRAST: 1.16, MATERIAL_SATURATION: 0.5,
            BLOOM_INTENSITY: 0.32, FILM_GRAIN: 0.12,
            CURL: 64, VISCOSITY: 0.2, TURBULENCE_AMOUNT: 32, TURBULENCE_SCALE: 5.4,
            ADVECTION_METHOD: 'maccormack', GRAVITY_Y: -10, WIND_X: 18,
            EMITTER_RATE: 12, EMITTER_INTENSITY: 0.48,
            PARTICLES_ENABLED: true, PARTICLE_ARCHETYPE: 'smoke', PARTICLE_SPAWN_RATE: 480, PARTICLE_MAX_COUNT: 28000,
            PARTICLE_CURL_COUPLING: 0.8,
            AUDIO_BINDING_MODE: 'off'
        },
        emitters: [
            { id: 'eye', type: 'radial', label: 'Tornado eye', x: 0.5, y: 0.4, width: 0.26, segments: 35, color: '#aab0b8', force: 0.1, radius: 0.31, pulse: 0.28 }
        ]
    },

    'smoke-plume': {
        schemaVersion: 3,
        label: 'Smoke Plume', category: 'Realistic',
        description: 'Slow rising chimney smoke with gentle wind drift.',
        tags: ['smoke', 'industrial', 'slow'],
        performanceTier: 'medium',
        requires: { particles: true, temperature: true, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 8, g: 10, b: 12 }, DISPLAY_STYLE: 'gradient',
            PALETTE_A: { r: 12, g: 14, b: 18 }, PALETTE_B: { r: 80, g: 90, b: 96 }, PALETTE_C: { r: 200, g: 200, b: 200 },
            COLOR_MODE: 'gradient', GRADIENT_SCALE: 0.7,
            BLOOM_INTENSITY: 0.22, VIGNETTE: 0.2,
            CURL: 28, VISCOSITY: 0.6, TURBULENCE_AMOUNT: 12, TURBULENCE_SCALE: 4.2,
            TEMPERATURE_AMOUNT: 0.4, BUOYANCY_STRENGTH: 18, BUOYANCY_DIRECTION: 1.57,
            WIND_X: 5, EMITTER_RATE: 8, EMITTER_INTENSITY: 0.42,
            PARTICLES_ENABLED: true, PARTICLE_ARCHETYPE: 'smoke', PARTICLE_SPAWN_RATE: 240, PARTICLE_MAX_COUNT: 20000,
            PARTICLE_BUOYANCY: 0.8,
            AUDIO_BINDING_MODE: 'off'
        },
        emitters: [
            { id: 'stack', type: 'point', label: 'Stack', x: 0.5, y: 0.12, color: '#c8c8c8', force: 0.1, radius: 0.25, spread: 0.18 }
        ]
    },

    'aurora-borealis-slow': {
        schemaVersion: 3,
        label: 'Aurora Borealis (Slow)', category: 'Cinematic',
        description: 'Slow violet-teal arcs drifting low across the sky.',
        tags: ['aurora', 'cinematic', 'slow', 'cool'],
        performanceTier: 'medium',
        requires: { particles: true, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 2, g: 4, b: 10 }, DISPLAY_STYLE: 'glass',
            PALETTE_A: { r: 4, g: 12, b: 28 }, PALETTE_B: { r: 50, g: 230, b: 200 }, PALETTE_C: { r: 130, g: 90, b: 220 },
            COLOR_MODE: 'multiStop',
            COLOR_STOPS: [
                { position: 0, color: { r: 4, g: 8, b: 22 } },
                { position: 0.4, color: { r: 50, g: 230, b: 180 } },
                { position: 0.8, color: { r: 140, g: 90, b: 220 } },
                { position: 1, color: { r: 240, g: 220, b: 240 } }
            ],
            BLOOM_INTENSITY: 0.46, BLOOM_THRESHOLD: 0.74, ANAMORPHIC_BLOOM: 0.22,
            SUNRAYS_WEIGHT: 0.36, MOTION_BLUR: 0.2, CHROMATIC_ABERRATION: 0.2,
            CURL: 18, VISCOSITY: 0.3, TURBULENCE_AMOUNT: 6,
            WIND_X: 8, EMITTER_RATE: 5, EMITTER_INTENSITY: 0.34,
            PARTICLES_ENABLED: true, PARTICLE_ARCHETYPE: 'magic', PARTICLE_SPAWN_RATE: 140, PARTICLE_MAX_COUNT: 16000,
            AUDIO_BINDING_MODE: 'cinema-slow', AUDIO_FX_AMOUNT: 0.45
        },
        emitters: [
            { id: 'arc-low',  type: 'spline', label: 'Low arc',  x: 0.08, y: 0.34, x2: 0.32, y2: 0.6,  x3: 0.66, y3: 0.34, x4: 0.92, y4: 0.5, segments: 20, color: '#34e6c0', force: 0.1, radius: 0.25, spread: 0.18 },
            { id: 'arc-high', type: 'spline', label: 'High arc', x: 0.1,  y: 0.62, x2: 0.36, y2: 0.4,  x3: 0.62, y3: 0.7,  x4: 0.9,  y4: 0.46, segments: 20, color: '#8a5ce0', force: 0.1, radius: 0.25, spread: 0.16 }
        ]
    },

    dnb: {
        schemaVersion: 3,
        label: 'DnB', category: 'Audio Reactive',
        description: 'Fast tempo sub-bass focus, frantic motion.',
        tags: ['audio', 'dnb', 'sub-bass', 'fast'],
        performanceTier: 'high',
        requires: { particles: true, temperature: false, audio: 'required' },
        config: {
            BACK_COLOR: { r: 0, g: 0, b: 6 }, DISPLAY_STYLE: 'neon',
            PALETTE_A: { r: 4, g: 0, b: 16 }, PALETTE_B: { r: 0, g: 220, b: 255 }, PALETTE_C: { r: 220, g: 0, b: 160 },
            COLOR_MODE: 'rainbow', RAINBOW_SPEED: 0.34, RAINBOW_RANGE: 0.9,
            BLOOM_INTENSITY: 0.7, BLOOM_THRESHOLD: 0.62, ANAMORPHIC_BLOOM: 0.4,
            CHROMATIC_ABERRATION: 1.0, VELOCITY_DISTORTION: 0.5, MOTION_BLUR: 0.18,
            CURL: 42, TURBULENCE_AMOUNT: 22,
            EMITTER_RATE: 14, EMITTER_INTENSITY: 0.55,
            PARTICLES_ENABLED: true, PARTICLE_ARCHETYPE: 'magic', PARTICLE_SPAWN_RATE: 1200, PARTICLE_MAX_COUNT: 36000,
            PARTICLE_FLOW_RESPONSE: 1.6,
            AUDIO_BINDING_MODE: 'rave-hard', AUDIO_GAIN: 1.2, AUDIO_FX_AMOUNT: 0.65
        },
        emitters: [
            { id: 'sub-l', type: 'point', label: 'Sub-L', x: 0.32, y: 0.5, color: '#00dcff', force: 0.1, radius: 0.31, spread: 0.32 },
            { id: 'sub-r', type: 'point', label: 'Sub-R', x: 0.68, y: 0.5, color: '#dc00a0', force: 0.1, radius: 0.31, spread: 0.32 }
        ]
    },

    'synth-lead': {
        schemaVersion: 3,
        label: 'Synth Lead', category: 'Audio Reactive',
        description: 'Bright neon ribbons with transient spark bursts.',
        tags: ['audio', 'synth', 'neon', 'bright'],
        performanceTier: 'medium',
        requires: { particles: true, temperature: false, audio: 'required' },
        config: {
            BACK_COLOR: { r: 0, g: 0, b: 4 }, DISPLAY_STYLE: 'neon',
            PALETTE_A: { r: 4, g: 0, b: 14 }, PALETTE_B: { r: 255, g: 240, b: 60 }, PALETTE_C: { r: 60, g: 200, b: 255 },
            COLOR_MODE: 'dual',
            SINGLE_COLOR: { r: 255, g: 240, b: 60 }, SECONDARY_COLOR: { r: 60, g: 200, b: 255 },
            BLOOM_INTENSITY: 0.62, ANAMORPHIC_BLOOM: 0.35,
            CHROMATIC_ABERRATION: 0.45, VELOCITY_DISTORTION: 0.3,
            CURL: 32, TURBULENCE_AMOUNT: 14,
            EMITTER_RATE: 9, EMITTER_INTENSITY: 0.48,
            PARTICLES_ENABLED: true, PARTICLE_ARCHETYPE: 'magic', PARTICLE_SPAWN_RATE: 600, PARTICLE_MAX_COUNT: 26000,
            AUDIO_BINDING_MODE: 'pulse', AUDIO_FX_AMOUNT: 0.55
        },
        emitters: [
            { id: 'ribbon', type: 'spline', label: 'Lead ribbon', x: 0.08, y: 0.45, x2: 0.32, y2: 0.7, x3: 0.66, y3: 0.3, x4: 0.92, y4: 0.55, segments: 25, color: '#fff03c', force: 0.1, radius: 0.25, spread: 0.18 }
        ]
    },

    'drums-only': {
        schemaVersion: 3,
        label: 'Drums Only', category: 'Audio Reactive',
        description: 'All percussive — heavy onsets drive everything.',
        tags: ['audio', 'drums', 'percussive'],
        performanceTier: 'medium',
        requires: { particles: true, temperature: false, audio: 'required' },
        config: {
            BACK_COLOR: { r: 6, g: 4, b: 4 }, DISPLAY_STYLE: 'classic',
            PALETTE_A: { r: 12, g: 6, b: 6 }, PALETTE_B: { r: 240, g: 80, b: 40 }, PALETTE_C: { r: 240, g: 220, b: 80 },
            COLOR_MODE: 'gradient', GRADIENT_SCALE: 0.88,
            MATERIAL_CONTRAST: 1.18, MATERIAL_SATURATION: 1.18,
            BLOOM_INTENSITY: 0.55, ANAMORPHIC_BLOOM: 0.18,
            CHROMATIC_ABERRATION: 0.55,
            CURL: 36, TURBULENCE_AMOUNT: 20,
            EMITTER_RATE: 10, EMITTER_INTENSITY: 0.55,
            PARTICLES_ENABLED: true, PARTICLE_ARCHETYPE: 'fire', PARTICLE_SPAWN_RATE: 480, PARTICLE_MAX_COUNT: 22000,
            AUDIO_BINDING_MODE: 'pulse', AUDIO_FX_AMOUNT: 0.65
        },
        emitters: [
            { id: 'kick',  type: 'point', label: 'Kick',  x: 0.5,  y: 0.5, color: '#f05028', force: 0.1, radius: 0.32, spread: 0.34,
                trigger: { mode: 'beat', subdivision: 'quarter', cooldownMs: 60, probability: 1, chokeGroup: 'kit' } },
            { id: 'snare', type: 'point', label: 'Snare', x: 0.35, y: 0.5, color: '#f0dc50', force: 0.1, radius: 0.25, spread: 0.4,
                trigger: { mode: 'beat', subdivision: 'eighth', cooldownMs: 80, probability: 0.5, chokeGroup: 'kit' } },
            { id: 'hat',   type: 'point', label: 'Hat',   x: 0.65, y: 0.5, color: '#80c8ff', force: 0.1, radius: 0.18, spread: 0.5,
                trigger: { mode: 'beat', subdivision: 'sixteenth', cooldownMs: 25, probability: 1, chokeGroup: '' } }
        ]
    },

    'ambient-pad': {
        schemaVersion: 3,
        label: 'Ambient Pad', category: 'Audio Reactive',
        description: 'Sustained drone smoke that breathes with RMS.',
        tags: ['audio', 'ambient', 'pad', 'slow'],
        performanceTier: 'medium',
        requires: { particles: true, temperature: false, audio: 'required' },
        config: {
            BACK_COLOR: { r: 4, g: 4, b: 12 }, DISPLAY_STYLE: 'glass',
            PALETTE_A: { r: 8, g: 10, b: 28 }, PALETTE_B: { r: 100, g: 100, b: 200 }, PALETTE_C: { r: 200, g: 180, b: 240 },
            COLOR_MODE: 'gradient', GRADIENT_SCALE: 0.74,
            BLOOM_INTENSITY: 0.42, BLOOM_THRESHOLD: 0.74, MOTION_BLUR: 0.32,
            CURL: 18, VISCOSITY: 0.5, TURBULENCE_AMOUNT: 6,
            EMITTER_RATE: 5, EMITTER_INTENSITY: 0.36,
            PARTICLES_ENABLED: true, PARTICLE_ARCHETYPE: 'smoke', PARTICLE_SPAWN_RATE: 220, PARTICLE_MAX_COUNT: 18000,
            PARTICLE_OPACITY: 0.34,
            AUDIO_BINDING_MODE: 'ambient', AUDIO_FX_AMOUNT: 0.55
        },
        emitters: [
            { id: 'pad-area', type: 'area', label: 'Pad area', x: 0.5, y: 0.5, width: 0.82, height: 0.4, segments: 15, color: '#a0a0e0', force: 0.1, radius: 0.41, pulse: 0.08 }
        ]
    },

    acapella: {
        schemaVersion: 3,
        label: 'Acapella', category: 'Audio Reactive',
        description: 'Vocal-friendly: bloom on loudness, palette on centroid.',
        tags: ['audio', 'vocal', 'cinematic'],
        performanceTier: 'medium',
        requires: { particles: false, temperature: false, audio: 'required' },
        config: {
            BACK_COLOR: { r: 4, g: 6, b: 16 }, DISPLAY_STYLE: 'gradient',
            PALETTE_A: { r: 8, g: 14, b: 36 }, PALETTE_B: { r: 200, g: 160, b: 240 }, PALETTE_C: { r: 255, g: 220, b: 200 },
            COLOR_MODE: 'multiStop',
            COLOR_STOPS: [
                { position: 0, color: { r: 8, g: 14, b: 36 } },
                { position: 0.5, color: { r: 200, g: 160, b: 240 } },
                { position: 1, color: { r: 255, g: 220, b: 200 } }
            ],
            BLOOM_INTENSITY: 0.5, BLOOM_THRESHOLD: 0.74, ANAMORPHIC_BLOOM: 0.32,
            SUNRAYS_WEIGHT: 0.5, GOD_RAY_SOURCE: { x: 0.5, y: 0.5 },
            CURL: 18, TURBULENCE_AMOUNT: 8,
            EMITTER_RATE: 5, EMITTER_INTENSITY: 0.4,
            AUDIO_BINDING_MODE: 'cinema-slow', AUDIO_FX_AMOUNT: 0.55
        },
        emitters: [
            { id: 'voice-halo', type: 'radial', label: 'Voice halo', x: 0.5, y: 0.5, width: 0.32, segments: 30, color: '#c8a0f0', force: 0.1, radius: 0.25, pulse: 0.22 }
        ]
    },

    piano: {
        schemaVersion: 3,
        label: 'Piano', category: 'Audio Reactive',
        description: 'Long sustain envelopes, soft pastels.',
        tags: ['audio', 'piano', 'soft', 'pastel'],
        performanceTier: 'low',
        requires: { particles: false, temperature: false, audio: 'required' },
        config: {
            BACK_COLOR: { r: 8, g: 8, b: 12 }, DISPLAY_STYLE: 'gradient',
            PALETTE_A: { r: 12, g: 16, b: 28 }, PALETTE_B: { r: 200, g: 200, b: 230 }, PALETTE_C: { r: 240, g: 220, b: 220 },
            COLOR_MODE: 'gradient', GRADIENT_SCALE: 0.7,
            MATERIAL_CONTRAST: 1.0, MATERIAL_SATURATION: 0.8,
            BLOOM_INTENSITY: 0.36, MOTION_BLUR: 0.22,
            CURL: 12, VISCOSITY: 0.45, TURBULENCE_AMOUNT: 4,
            EMITTER_RATE: 5, EMITTER_INTENSITY: 0.3,
            AUDIO_BINDING_MODE: 'ambient', AUDIO_FX_AMOUNT: 0.5
        },
        emitters: [
            { id: 'left-key',  type: 'point', label: 'Left key',  x: 0.35, y: 0.5, color: '#b0c0d8', force: 0.1, radius: 0.25, spread: 0.18 },
            { id: 'right-key', type: 'point', label: 'Right key', x: 0.65, y: 0.5, color: '#e8c8c8', force: 0.1, radius: 0.25, spread: 0.18 }
        ]
    },

    'voxel-storm': {
        schemaVersion: 3,
        label: 'Voxel Storm', category: 'Abstract',
        description: 'Low dye-res retro pixel look, intense palette.',
        tags: ['retro', 'pixel', 'abstract'],
        performanceTier: 'low',
        requires: { particles: false, temperature: false, audio: 'optional' },
        config: {
            DYE_RESOLUTION: 128, SIM_RESOLUTION: 64,
            BACK_COLOR: { r: 0, g: 0, b: 0 }, DISPLAY_STYLE: 'classic',
            PALETTE_A: { r: 20, g: 0, b: 40 }, PALETTE_B: { r: 255, g: 0, b: 160 }, PALETTE_C: { r: 0, g: 240, b: 200 },
            COLOR_MODE: 'dual',
            SINGLE_COLOR: { r: 255, g: 0, b: 160 }, SECONDARY_COLOR: { r: 0, g: 240, b: 200 },
            MATERIAL_CONTRAST: 1.32, MATERIAL_SATURATION: 1.5,
            BLOOM_INTENSITY: 0.55, ANAMORPHIC_BLOOM: 0.18,
            CHROMATIC_ABERRATION: 0.4,
            CURL: 28, TURBULENCE_AMOUNT: 12,
            EMITTER_RATE: 12, EMITTER_INTENSITY: 0.5,
            AUDIO_BINDING_MODE: 'pulse', AUDIO_FX_AMOUNT: 0.55
        },
        emitters: [
            { id: 'pixel-1', type: 'area', label: 'Pixel A', x: 0.32, y: 0.5, width: 0.18, height: 0.18, segments: 14, color: '#ff00a0', force: 0.1, radius: 0.15, pulse: 0.18 },
            { id: 'pixel-2', type: 'area', label: 'Pixel B', x: 0.68, y: 0.5, width: 0.18, height: 0.18, segments: 14, color: '#00f0c8', force: 0.1, radius: 0.15, pulse: 0.18 }
        ]
    },

    inkwash: {
        schemaVersion: 3,
        label: 'Inkwash', category: 'Abstract',
        description: 'Japanese ink on paper — minimal high-viscosity wash.',
        tags: ['ink', 'minimal', 'monochrome', 'painterly'],
        performanceTier: 'low',
        requires: { particles: false, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 232, g: 228, b: 220 }, DISPLAY_STYLE: 'watercolor',
            PALETTE_A: { r: 232, g: 228, b: 220 }, PALETTE_B: { r: 80, g: 70, b: 60 }, PALETTE_C: { r: 8, g: 6, b: 4 },
            COLOR_MODE: 'gradient', GRADIENT_SCALE: 0.6,
            MATERIAL_CONTRAST: 1.24, MATERIAL_SATURATION: 0.2, MATERIAL_EXPOSURE: 0.94,
            BLOOM_INTENSITY: 0, VIGNETTE: 0.32, FILM_GRAIN: 0.08,
            CURL: 6, VISCOSITY: 5.0, TURBULENCE_AMOUNT: 2, ADVECTION_METHOD: 'bfecc',
            EMITTER_RATE: 3, EMITTER_INTENSITY: 0.5,
            AUDIO_BINDING_MODE: 'off'
        },
        emitters: [
            { id: 'brush-1', type: 'brush', label: 'Ink brush', color: '#181410', force: 0.1, radius: 0.31, spread: 0.06, segments: 30, points: [
                { x: 0.18, y: 0.6 }, { x: 0.32, y: 0.46 }, { x: 0.52, y: 0.58 }, { x: 0.78, y: 0.44 }
            ] }
        ]
    },

    mandala: {
        schemaVersion: 3,
        label: 'Mandala', category: 'Abstract',
        description: 'Radial symmetry, intricate concentric rings.',
        tags: ['radial', 'symmetry', 'meditative'],
        performanceTier: 'medium',
        requires: { particles: false, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 6, g: 4, b: 12 }, DISPLAY_STYLE: 'classic',
            PALETTE_A: { r: 30, g: 8, b: 24 }, PALETTE_B: { r: 220, g: 80, b: 200 }, PALETTE_C: { r: 240, g: 220, b: 80 },
            COLOR_MODE: 'rainbow', RAINBOW_SPEED: 0.05, RAINBOW_RANGE: 0.7, HUE_SHIFT: 30,
            BLOOM_INTENSITY: 0.42, ANAMORPHIC_BLOOM: 0.15,
            CURL: 24, VISCOSITY: 0.4,
            EMITTER_RATE: 9, EMITTER_INTENSITY: 0.45,
            AUDIO_BINDING_MODE: 'ambient'
        },
        emitters: [
            { id: 'ring-1', type: 'radial', label: 'Ring 1', x: 0.5, y: 0.5, width: 0.14, segments: 20,  color: '#dc50c8', force: 0.1, radius: 0.15, pulse: 0.2 },
            { id: 'ring-2', type: 'radial', label: 'Ring 2', x: 0.5, y: 0.5, width: 0.3,  segments: 30, color: '#f0dc50', force: 0.1, radius: 0.15, pulse: 0.15 },
            { id: 'ring-3', type: 'radial', label: 'Ring 3', x: 0.5, y: 0.5, width: 0.5,  segments: 40, color: '#50c8f0', force: 0.1, radius: 0.15, pulse: 0.1 }
        ]
    },

    'bokeh-garden': {
        schemaVersion: 3,
        label: 'Bokeh Garden', category: 'Abstract',
        description: 'Large soft glowing bubbles with depth fade.',
        tags: ['bokeh', 'soft', 'pastel', 'background'],
        performanceTier: 'medium',
        requires: { particles: true, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 4, g: 6, b: 14 }, DISPLAY_STYLE: 'gradient',
            PALETTE_A: { r: 8, g: 10, b: 22 }, PALETTE_B: { r: 200, g: 160, b: 220 }, PALETTE_C: { r: 240, g: 220, b: 200 },
            COLOR_MODE: 'gradient', GRADIENT_SCALE: 0.7,
            BLOOM_INTENSITY: 0.62, BLOOM_THRESHOLD: 0.62, ANAMORPHIC_BLOOM: 0.18,
            CHROMATIC_ABERRATION: 0.18, MOTION_BLUR: 0.16,
            CURL: 14, TURBULENCE_AMOUNT: 5,
            EMITTER_RATE: 4, EMITTER_INTENSITY: 0.3,
            PARTICLES_ENABLED: true, PARTICLE_ARCHETYPE: 'water', PARTICLE_SPAWN_RATE: 100, PARTICLE_MAX_COUNT: 12000,
            PARTICLE_SIZE_MIN: 6, PARTICLE_SIZE_MAX: 22, PARTICLE_OPACITY: 0.55, PARTICLE_DEPTH_FADE: 0.6,
            AUDIO_BINDING_MODE: 'ambient'
        },
        emitters: [
            { id: 'bokeh-area', type: 'area', label: 'Bokeh area', x: 0.5, y: 0.5, width: 0.9, height: 0.7, segments: 15, color: '#c8a0e0', force: 0.1, radius: 0.41, pulse: 0.08,
                particleConfig: { enabled: true, particleArchetype: 'water', particleSpawnRate: 200 } }
        ]
    },

    'particle-storm': {
        schemaVersion: 3,
        label: 'Particle Storm', category: 'Showcase',
        description: '60k particles mixed archetypes — for benchmark + demo.',
        tags: ['showcase', 'intense', 'particles', 'benchmark'],
        performanceTier: 'extreme',
        requires: { particles: true, temperature: true, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 0, g: 0, b: 0 }, DISPLAY_STYLE: 'material',
            PALETTE_A: { r: 4, g: 0, b: 12 }, PALETTE_B: { r: 255, g: 90, b: 30 }, PALETTE_C: { r: 200, g: 60, b: 255 },
            COLOR_MODE: 'rainbow', RAINBOW_SPEED: 0.18,
            MATERIAL_CONTRAST: 1.2, MATERIAL_SATURATION: 1.3,
            BLOOM_INTENSITY: 0.7, ANAMORPHIC_BLOOM: 0.32,
            CHROMATIC_ABERRATION: 0.4, VELOCITY_DISTORTION: 0.3,
            CURL: 48, TURBULENCE_AMOUNT: 28,
            TEMPERATURE_AMOUNT: 0.6,
            EMITTER_RATE: 16, EMITTER_INTENSITY: 0.6,
            PARTICLES_ENABLED: true, PARTICLE_ARCHETYPE: 'magic', PARTICLE_SPAWN_RATE: 2200, PARTICLE_MAX_COUNT: 60000,
            PARTICLE_FLOW_RESPONSE: 1.6, PARTICLE_FIELD_COUPLING: 1.3,
            AUDIO_BINDING_MODE: 'pulse', AUDIO_FX_AMOUNT: 0.55
        },
        emitters: [
            { id: 'storm-a', type: 'radial', label: 'Storm A', x: 0.32, y: 0.5, width: 0.32, segments: 35, color: '#ff5a1e', force: 0.1, radius: 0.25, pulse: 0.32,
                particleConfig: { enabled: true, particleArchetype: 'fire',  particleSpawnRate: 800 } },
            { id: 'storm-b', type: 'radial', label: 'Storm B', x: 0.68, y: 0.5, width: 0.32, segments: 35, color: '#c83cff', force: 0.1, radius: 0.25, pulse: 0.32,
                particleConfig: { enabled: true, particleArchetype: 'magic', particleSpawnRate: 800 } },
            { id: 'core',    type: 'point', label: 'Core',    x: 0.5,  y: 0.5, color: '#ffffff', force: 0.1, radius: 0.2, spread: 0.5,
                particleConfig: { enabled: true, particleArchetype: 'smoke', particleSpawnRate: 600 } }
        ]
    },

    'liquid-metal-mirror': {
        schemaVersion: 3,
        label: 'Liquid Metal Mirror', category: 'Showcase',
        description: 'Highly reflective metallic surface with slow flow.',
        tags: ['metal', 'reflective', 'showcase'],
        performanceTier: 'high',
        requires: { particles: false, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 4, g: 4, b: 8 }, DISPLAY_STYLE: 'metallic',
            PALETTE_A: { r: 12, g: 14, b: 18 }, PALETTE_B: { r: 180, g: 190, b: 220 }, PALETTE_C: { r: 240, g: 240, b: 245 },
            COLOR_MODE: 'gradient', GRADIENT_SCALE: 0.7,
            MATERIAL_CONTRAST: 1.16, MATERIAL_SATURATION: 0.4, MATERIAL_EXPOSURE: 0.94,
            MATERIAL_ROUGHNESS: 0.06, MATERIAL_SPECULAR: 1.4, MATERIAL_RIM: 0.6,
            FRESNEL_POWER: 1.6, NORMAL_STRENGTH: 1.6, ENV_INTENSITY: 0.8,
            BLOOM_INTENSITY: 0.32, BLOOM_THRESHOLD: 0.86,
            CHROMATIC_ABERRATION: 0.16,
            CURL: 10, VISCOSITY: 2.0, TURBULENCE_AMOUNT: 3,
            EMITTER_RATE: 5, EMITTER_INTENSITY: 0.45,
            AUDIO_BINDING_MODE: 'cinema-slow', AUDIO_FX_AMOUNT: 0.4
        },
        emitters: [
            { id: 'metal-pool', type: 'area', label: 'Metal pool', x: 0.5, y: 0.5, width: 0.7, height: 0.4, segments: 15, color: '#b4c0dc', force: 0.1, radius: 0.41, pulse: 0.06 }
        ]
    },

    // ---- Final 6 presets to hit the 58-target catalogue ----------------

    'lava-crater': {
        schemaVersion: 3,
        label: 'Lava Crater', category: 'Realistic',
        description: 'Wide crater with concentric lava waves and ember rain.',
        tags: ['fire', 'lava', 'crater'],
        performanceTier: 'high',
        requires: { particles: true, temperature: true, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 8, g: 2, b: 0 }, DISPLAY_STYLE: 'material',
            PALETTE_A: { r: 20, g: 4, b: 2 }, PALETTE_B: { r: 255, g: 100, b: 30 }, PALETTE_C: { r: 255, g: 230, b: 100 },
            COLOR_MODE: 'gradient', GRADIENT_SCALE: 0.86,
            MATERIAL_CONTRAST: 1.18, MATERIAL_EXPOSURE: 0.86,
            BLOOM_INTENSITY: 0.74, ANAMORPHIC_BLOOM: 0.22,
            CHROMATIC_ABERRATION: 0.32,
            CURL: 30, VISCOSITY: 1.2, TURBULENCE_AMOUNT: 10,
            TEMPERATURE_AMOUNT: 0.7, BUOYANCY_STRENGTH: 14, BUOYANCY_DIRECTION: 1.57,
            EMITTER_RATE: 9, EMITTER_INTENSITY: 0.55,
            PARTICLES_ENABLED: true, PARTICLE_ARCHETYPE: 'fire', PARTICLE_SPAWN_RATE: 420, PARTICLE_MAX_COUNT: 28000,
            AUDIO_BINDING_MODE: 'off'
        },
        emitters: [
            { id: 'crater-rim', type: 'radial', label: 'Crater rim', x: 0.5, y: 0.36, width: 0.46, segments: 40, color: '#ff6420', force: 0.1, radius: 0.31, pulse: 0.3,
                particleConfig: { enabled: true, particleArchetype: 'fire', particleSpawnRate: 280 } },
            { id: 'ember-rain', type: 'area', label: 'Ember rain', x: 0.5, y: 0.85, width: 0.96, height: 0.1, segments: 20, direction: -1.57, color: '#ffe080', force: 0.1, radius: 0.15, pulse: 0.18 }
        ]
    },

    sandstorm: {
        schemaVersion: 3,
        label: 'Sandstorm', category: 'Realistic',
        description: 'Yellow-brown wind-driven dust storm with low visibility.',
        tags: ['storm', 'sand', 'wind', 'warm'],
        performanceTier: 'medium',
        requires: { particles: true, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 20, g: 14, b: 6 }, DISPLAY_STYLE: 'classic',
            PALETTE_A: { r: 32, g: 22, b: 10 }, PALETTE_B: { r: 200, g: 150, b: 70 }, PALETTE_C: { r: 240, g: 220, b: 160 },
            COLOR_MODE: 'gradient', GRADIENT_SCALE: 0.72,
            MATERIAL_CONTRAST: 1.04, MATERIAL_SATURATION: 0.74,
            BLOOM_INTENSITY: 0.18, FILM_GRAIN: 0.18, VIGNETTE: 0.32,
            CURL: 28, VISCOSITY: 0.3, TURBULENCE_AMOUNT: 26, TURBULENCE_SCALE: 5.2,
            WIND_X: 32, GRAVITY_Y: -2,
            EMITTER_RATE: 12, EMITTER_INTENSITY: 0.4,
            PARTICLES_ENABLED: true, PARTICLE_ARCHETYPE: 'smoke', PARTICLE_SPAWN_RATE: 580, PARTICLE_MAX_COUNT: 22000,
            PARTICLE_FLOW_RESPONSE: 0.85, PARTICLE_VELOCITY_STRETCH: 0.6,
            AUDIO_BINDING_MODE: 'off'
        },
        emitters: [
            { id: 'dust-front', type: 'area', label: 'Dust front', x: 0.1, y: 0.5, width: 0.18, height: 0.6, segments: 20, direction: 0, color: '#c89646', force: 0.1, radius: 0.31, pulse: 0.14 }
        ]
    },

    'solar-wind': {
        schemaVersion: 3,
        label: 'Solar Wind', category: 'Realistic',
        description: 'Streaming plasma sheets blown across the field.',
        tags: ['plasma', 'space', 'sun'],
        performanceTier: 'high',
        requires: { particles: true, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 0, g: 0, b: 6 }, DISPLAY_STYLE: 'neon',
            PALETTE_A: { r: 4, g: 0, b: 12 }, PALETTE_B: { r: 255, g: 200, b: 60 }, PALETTE_C: { r: 80, g: 200, b: 255 },
            COLOR_MODE: 'gradient', GRADIENT_SCALE: 0.84,
            BLOOM_INTENSITY: 0.66, ANAMORPHIC_BLOOM: 0.42, ANAMORPHIC_RATIO: 6,
            SUNRAYS_WEIGHT: 0.7, GOD_RAY_SOURCE: { x: 0.1, y: 0.5 },
            CHROMATIC_ABERRATION: 0.55, VELOCITY_DISTORTION: 0.5,
            CURL: 28, TURBULENCE_AMOUNT: 18,
            WIND_X: 26,
            EMITTER_RATE: 10, EMITTER_INTENSITY: 0.5,
            PARTICLES_ENABLED: true, PARTICLE_ARCHETYPE: 'magic', PARTICLE_SPAWN_RATE: 540, PARTICLE_MAX_COUNT: 26000,
            PARTICLE_FLOW_RESPONSE: 1.6, PARTICLE_VELOCITY_STRETCH: 1.0,
            AUDIO_BINDING_MODE: 'cinema', AUDIO_FX_AMOUNT: 0.4
        },
        emitters: [
            { id: 'sun-edge', type: 'line', label: 'Sun edge', x: 0.06, y: 0.3, x2: 0.06, y2: 0.7, color: '#ffc830', force: 0.1, radius: 0.35 },
            { id: 'plasma-stream', type: 'spline', label: 'Plasma stream', x: 0.1, y: 0.5, x2: 0.36, y2: 0.4, x3: 0.66, y3: 0.6, x4: 0.92, y4: 0.5, segments: 30, color: '#50c8ff', force: 0.1, radius: 0.25, spread: 0.18 }
        ]
    },

    vaporwave: {
        schemaVersion: 3,
        label: 'Vaporwave', category: 'Audio Reactive',
        description: 'Pink/teal grid aesthetic with slow breathing motion.',
        tags: ['retro', 'vaporwave', 'audio', 'pastel'],
        performanceTier: 'medium',
        requires: { particles: false, temperature: false, audio: 'required' },
        config: {
            BACK_COLOR: { r: 8, g: 4, b: 20 }, DISPLAY_STYLE: 'neon',
            PALETTE_A: { r: 12, g: 4, b: 32 }, PALETTE_B: { r: 255, g: 100, b: 200 }, PALETTE_C: { r: 80, g: 240, b: 240 },
            COLOR_MODE: 'multiStop',
            COLOR_STOPS: [
                { position: 0, color: { r: 16, g: 6, b: 40 } },
                { position: 0.45, color: { r: 255, g: 100, b: 200 } },
                { position: 0.9, color: { r: 80, g: 240, b: 240 } }
            ],
            MATERIAL_CONTRAST: 1.18, MATERIAL_SATURATION: 1.3,
            BLOOM_INTENSITY: 0.55, ANAMORPHIC_BLOOM: 0.32, ANAMORPHIC_RATIO: 5,
            CHROMATIC_ABERRATION: 0.45, FILM_GRAIN: 0.08,
            CURL: 16, TURBULENCE_AMOUNT: 7,
            EMITTER_RATE: 7, EMITTER_INTENSITY: 0.42,
            AUDIO_BINDING_MODE: 'lofi', AUDIO_GAIN: 1.1, AUDIO_FX_AMOUNT: 0.55
        },
        emitters: [
            { id: 'grid-h', type: 'line', label: 'Horizon',      x: 0.1, y: 0.4, x2: 0.9, y2: 0.4, color: '#ff64c8', force: 0.1, radius: 0.25 },
            { id: 'grid-v', type: 'line', label: 'Center beam',  x: 0.5, y: 0.1, x2: 0.5, y2: 0.9, color: '#50f0f0', force: 0.1, radius: 0.25 }
        ]
    },

    'holo-pulse': {
        schemaVersion: 3,
        label: 'Holo Pulse', category: 'Audio Reactive',
        description: 'Holographic radial pulses locked to beat.',
        tags: ['holo', 'beat', 'audio', 'showcase'],
        performanceTier: 'medium',
        requires: { particles: true, temperature: false, audio: 'required' },
        config: {
            BACK_COLOR: { r: 0, g: 4, b: 14 }, DISPLAY_STYLE: 'glass',
            PALETTE_A: { r: 0, g: 8, b: 28 }, PALETTE_B: { r: 80, g: 240, b: 255 }, PALETTE_C: { r: 200, g: 180, b: 255 },
            COLOR_MODE: 'rainbow', RAINBOW_SPEED: 0.12, RAINBOW_RANGE: 0.7,
            MATERIAL_RIM: 0.5, FRESNEL_POWER: 1.8,
            BLOOM_INTENSITY: 0.62, ANAMORPHIC_BLOOM: 0.34,
            CHROMATIC_ABERRATION: 0.45,
            CURL: 26, TURBULENCE_AMOUNT: 12,
            EMITTER_RATE: 8, EMITTER_INTENSITY: 0.48,
            PARTICLES_ENABLED: true, PARTICLE_ARCHETYPE: 'magic', PARTICLE_SPAWN_RATE: 460, PARTICLE_MAX_COUNT: 22000,
            AUDIO_BINDING_MODE: 'pulse', AUDIO_FX_AMOUNT: 0.65
        },
        emitters: [
            { id: 'holo-ring', type: 'radial', label: 'Holo ring', x: 0.5, y: 0.5, width: 0.36, segments: 35, color: '#50f0ff', force: 0.1, radius: 0.25, pulse: 0.32,
                trigger: { mode: 'beat', subdivision: 'quarter', cooldownMs: 60, probability: 1, chokeGroup: '' } },
            { id: 'holo-core', type: 'point', label: 'Holo core', x: 0.5, y: 0.5, color: '#c8b4ff', force: 0.1, radius: 0.2, spread: 0.4 }
        ]
    },

    origami: {
        schemaVersion: 3,
        label: 'Origami', category: 'Abstract',
        description: 'Folded paper aesthetic — sharp polygons + low saturation.',
        tags: ['origami', 'geometric', 'minimal', 'painterly'],
        performanceTier: 'low',
        requires: { particles: false, temperature: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 240, g: 234, b: 224 }, DISPLAY_STYLE: 'classic',
            PALETTE_A: { r: 240, g: 234, b: 224 }, PALETTE_B: { r: 60, g: 70, b: 90 }, PALETTE_C: { r: 220, g: 80, b: 100 },
            COLOR_MODE: 'gradient', GRADIENT_SCALE: 0.62,
            MATERIAL_CONTRAST: 1.16, MATERIAL_SATURATION: 0.55,
            BLOOM_INTENSITY: 0, VIGNETTE: 0.2, FILM_GRAIN: 0.04,
            CURL: 8, VISCOSITY: 2.2, TURBULENCE_AMOUNT: 3,
            ADVECTION_METHOD: 'bfecc',
            EMITTER_RATE: 4, EMITTER_INTENSITY: 0.4,
            AUDIO_BINDING_MODE: 'off'
        },
        emitters: [
            { id: 'fold-1', type: 'vector', label: 'Fold A', color: '#46506a', force: 0.1, radius: 0.25, segments: 15, points: [
                { x: 0.32, y: 0.5 }, { x: 0.42, y: 0.66 }, { x: 0.58, y: 0.62 }, { x: 0.5, y: 0.4 }
            ] },
            { id: 'fold-2', type: 'vector', label: 'Fold B', color: '#dc5064', force: 0.1, radius: 0.25, segments: 15, points: [
                { x: 0.55, y: 0.32 }, { x: 0.68, y: 0.42 }, { x: 0.72, y: 0.58 }, { x: 0.6, y: 0.5 }
            ] }
        ]
    },

    // V2 Demo — shows off the role-based particle pipeline. Best loaded with
    // ?particlesV2 — falls back to legacy archetype pipeline if V2 disabled.
    fluidPlay: {
        schemaVersion: 3,
        label: 'Fluid Play (V2 Demo)',
        category: 'V3 Particles',
        description: 'Showcases role-based particles: foam at splat edges, spray from curl spikes, sparks on temperature peaks, ember drift.',
        tags: ['v2', 'showcase', 'foam', 'spray', 'spark', 'ember'],
        performanceTier: 'high',
        requires: { particles: true, temperature: true, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 1, g: 2, b: 6 },
            DISPLAY_STYLE: 'glass',
            COLOR_MODE: 'gradient',
            PALETTE_A: { r: 18, g: 40, b: 88 },
            PALETTE_B: { r: 86, g: 220, b: 240 },
            PALETTE_C: { r: 235, g: 120, b: 78 },
            GRADIENT_SCALE: 0.86,
            MATERIAL_CONTRAST: 1.08,
            MATERIAL_SATURATION: 1.18,
            MATERIAL_EXPOSURE: 0.95,
            MATERIAL_ROUGHNESS: 0.18,
            MATERIAL_SPECULAR: 0.5,
            MATERIAL_RIM: 0.32,
            OUTPUT_GAIN: 1.06,
            TONE_MAPPING: 'aces',
            BLOOM_INTENSITY: 0.68,
            BLOOM_THRESHOLD: 0.72,
            ANAMORPHIC_BLOOM: 0.22,
            SUNRAYS_WEIGHT: 0.42,
            CHROMATIC_ABERRATION: 0.38,
            VELOCITY_DISTORTION: 0.36,
            CURL: 38,
            VISCOSITY: 0.12,
            TURBULENCE_AMOUNT: 16,
            TURBULENCE_SCALE: 5.0,
            FOAM_AMOUNT: 0.6,
            FOAM_VELOCITY_THRESHOLD: 95,
            TEMPERATURE_AMOUNT: 0.55,
            BUOYANCY_STRENGTH: 14,
            ADVECTION_METHOD: 'maccormack',
            WIND_X: 4,
            WIND_Y: 0,
            EMITTER_RATE: 9,
            EMITTER_INTENSITY: 0.48,
            EMITTER_AUDIO_REACTIVITY: 0.5,
            PARTICLES_ENABLED: true,
            PARTICLES_V2: true,
            PARTICLE_MAX_COUNT: 60000,
            // Legacy mirror — used by V1 fallback if V2 flag isn't on the URL.
            PARTICLE_ARCHETYPE: 'water-foam',
            PARTICLE_SPAWN_MODE: 'velocity',
            PARTICLE_SPAWN_THRESHOLD: 0.18,
            PARTICLE_SPAWN_RATE: 540,
            PARTICLE_OPACITY: 0.78,
            PARTICLE_TURBULENCE: 0.5,
            PARTICLE_FLOW_RESPONSE: 1.5,
            PARTICLE_FIELD_COUPLING: 1.2,
            PARTICLE_ADAPTIVE: true,
            PARTICLE_BUDGET_SCALE: 0.9,
            PARTICLE_FEEDBACK_ENABLED: true,
            PARTICLE_FEEDBACK_VELOCITY: 0.25,
            PARTICLE_FEEDBACK_DYE: 0.05,
            PARTICLE_FEEDBACK_FOAM: 0.5,
            AUDIO_BINDING_MODE: 'pulse',
            AUDIO_GAIN: 1.0,
            AUDIO_FX_AMOUNT: 0.42
        },
        emitters: [
            { id: 'ocean-line', type: 'line', label: 'Ocean wave',
              x: 0.08, y: 0.34, x2: 0.92, y2: 0.66,
              color: '#5acff0', force: 0.1, radius: 0.35,
              particleConfig: { enabled: true, particleArchetype: 'water-foam', particleSpawnRate: 320 } },
            { id: 'hot-mouth', type: 'heat', label: 'Hot mouth',
              x: 0.5, y: 0.86, color: '#ff8a3d', force: 0.1, radius: 0.31, spread: 0.4,
              particleConfig: { enabled: true, particleArchetype: 'fire', particleSpawnRate: 220 } },
            { id: 'vortex', type: 'attractor', label: 'Vortex',
              x: 0.78, y: 0.2, color: '#c14cff', force: 0.1, radius: 0.41, spread: 0.5,
              direction: 0.6 }
        ],
        particles: {
            roles: {
                // Sparkles and foam at the edges of every splat. Subtle.
                foam:   { enabled: true, style: 'foam-soft',     budget: 4000, spawnGain: 0.6 },
                spark:  { enabled: true, style: 'spark-impact',  budget: 1500, spawnGain: 0.35 },
                mist:   { enabled: true, style: 'mist-fog',      budget: 1500, spawnGain: 0.25 },
                spray: { enabled: false }, ember: { enabled: false }, bubble: { enabled: false }, dust: { enabled: false }, ribbon: { enabled: false }, debris: { enabled: false }
            }
        }
    },

    splashScene: {
        schemaVersion: 3,
        label: 'Splash Scene (V2)',
        category: 'V3 Particles',
        description: 'Water impact — spray droplets, foam at edges, rising bubbles. Click & drag to splash.',
        tags: ['v2', 'water', 'splash', 'foam', 'bubble'],
        performanceTier: 'high',
        requires: { particles: true, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 1, g: 8, b: 22 },
            DISPLAY_STYLE: 'glass',
            COLOR_MODE: 'velocity',
            VELOCITY_COLOR_LOW: { r: 4, g: 20, b: 54 },
            VELOCITY_COLOR_MID: { r: 70, g: 200, b: 240 },
            VELOCITY_COLOR_HIGH: { r: 220, g: 245, b: 255 },
            MATERIAL_ROUGHNESS: 0.1,
            MATERIAL_SPECULAR: 0.78,
            FRESNEL_POWER: 1.4,
            REFRACTION_RATIO: 1.06,
            OUTPUT_GAIN: 1.0,
            TONE_MAPPING: 'aces',
            BLOOM_INTENSITY: 0.5,
            BLOOM_THRESHOLD: 0.78,
            SUNRAYS_WEIGHT: 0.36,
            CHROMATIC_ABERRATION: 0.42,
            VELOCITY_DISTORTION: 0.5,
            CURL: 42,
            VISCOSITY: 0.1,
            FOAM_AMOUNT: 0.78,
            FOAM_VELOCITY_THRESHOLD: 80,
            TURBULENCE_AMOUNT: 12,
            TURBULENCE_SCALE: 6.5,
            ADVECTION_METHOD: 'maccormack',
            GRAVITY_Y: -4,
            EMITTER_RATE: 8,
            EMITTER_INTENSITY: 0.5,
            PARTICLES_ENABLED: true,
            PARTICLES_V2: true,
            PARTICLE_MAX_COUNT: 60000,
            PARTICLE_ARCHETYPE: 'water-spray',
            PARTICLE_SPAWN_MODE: 'velocity',
            PARTICLE_FEEDBACK_ENABLED: true,
            PARTICLE_FEEDBACK_VELOCITY: 0.35,
            PARTICLE_FEEDBACK_FOAM: 0.6,
            AUDIO_BINDING_MODE: 'pulse',
            AUDIO_FX_AMOUNT: 0.42
        },
        emitters: [
            { id: 'water-floor', type: 'line', label: 'Floor',
              x: 0.04, y: 0.78, x2: 0.96, y2: 0.78,
              color: '#5acff0', force: 0.1, radius: 0.41,
              particleConfig: { enabled: true, particleArchetype: 'water-spray', particleSpawnRate: 380 } },
            { id: 'top-drip', type: 'point', label: 'Top drip',
              x: 0.5, y: 0.08, color: '#9ed7ff', force: 0.1, radius: 0.25, spread: 0.4,
              direction: 1.57,
              particleConfig: { enabled: true, particleArchetype: 'water-foam', particleSpawnRate: 240 } }
        ],
        particles: {
            roles: {
                // Water splash kit: foam on the spray edge, spray droplets riding the splat's velocity.
                foam:   { enabled: true, style: 'foam-storm',    budget: 5000, spawnGain: 0.7 },
                spray:  { enabled: true, style: 'spray-water',   budget: 3000, spawnGain: 0.55 },
                mist:   { enabled: true, style: 'mist-fog',      budget: 2000, spawnGain: 0.3 },
                bubble: { enabled: false }, spark: { enabled: false }, ember: { enabled: false }, dust: { enabled: false }, ribbon: { enabled: false }, debris: { enabled: false }
            }
        }
    },

    thermalRise: {
        schemaVersion: 3,
        label: 'Thermal Rise (V2)',
        category: 'V3 Particles',
        description: 'Hot plume rising from below — embers, sparks at peaks, drifting mist halo.',
        tags: ['v2', 'heat', 'ember', 'spark', 'rising'],
        performanceTier: 'high',
        requires: { particles: true, temperature: true, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 4, g: 1, b: 0 },
            DISPLAY_STYLE: 'gradient',
            COLOR_MODE: 'temperature',
            TEMP_COLOR_COLD: { r: 22, g: 8, b: 0 },
            TEMP_COLOR_HOT:  { r: 255, g: 160, b: 60 },
            MATERIAL_EMISSIVE: 0.78,
            OUTPUT_GAIN: 1.1,
            TONE_MAPPING: 'aces',
            BLOOM_INTENSITY: 0.86,
            BLOOM_THRESHOLD: 0.62,
            ANAMORPHIC_BLOOM: 0.35,
            ANAMORPHIC_RATIO: 6.5,
            SUNRAYS_WEIGHT: 0.5,
            GOD_RAY_SOURCE: { x: 0.5, y: 0.18 },
            CHROMATIC_ABERRATION: 0.62,
            CURL: 28,
            VISCOSITY: 0.06,
            TEMPERATURE_AMOUNT: 0.95,
            BUOYANCY_STRENGTH: 22,
            BUOYANCY_DIRECTION: -1.57,    // upward
            TURBULENCE_AMOUNT: 22,
            TURBULENCE_SCALE: 4.8,
            ADVECTION_METHOD: 'maccormack',
            EMITTER_RATE: 10,
            EMITTER_INTENSITY: 0.6,
            PARTICLES_ENABLED: true,
            PARTICLES_V2: true,
            PARTICLE_MAX_COUNT: 50000,
            PARTICLE_ARCHETYPE: 'ember',
            PARTICLE_SPAWN_MODE: 'temperature',
            AUDIO_BINDING_MODE: 'cinema',
            AUDIO_FX_AMOUNT: 0.46
        },
        emitters: [
            { id: 'hot-base', type: 'heat', label: 'Hot base',
              x: 0.5, y: 0.92, color: '#ff7a30', force: 0.1, radius: 0.45, spread: 0.6,
              particleConfig: { enabled: true, particleArchetype: 'ember', particleSpawnRate: 420 } },
            { id: 'side-vent', type: 'heat', label: 'Side vent',
              x: 0.25, y: 0.88, color: '#ffaa50', force: 0.1, radius: 0.31, spread: 0.35 }
        ],
        particles: {
            roles: {
                // Hot kit: embers and sparks at the heat splats; warm mist around them.
                ember:  { enabled: true, style: 'ember-volcano', budget: 4000, spawnGain: 0.7 },
                spark:  { enabled: true, style: 'spark-impact',  budget: 1800, spawnGain: 0.4 },
                mist:   { enabled: true, style: 'mist-warm',     budget: 1800, spawnGain: 0.3 },
                foam: { enabled: false }, spray: { enabled: false }, bubble: { enabled: false }, dust: { enabled: false }, ribbon: { enabled: false }, debris: { enabled: false }
            }
        }
    },

    auroraVeil: {
        schemaVersion: 3,
        label: 'Aurora Veil (V2)',
        category: 'V3 Particles',
        description: 'Streamline ribbons trace the curl field; gentle mist below, sparkle on accents.',
        tags: ['v2', 'aurora', 'ribbon', 'ambient'],
        performanceTier: 'medium',
        requires: { particles: true, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 1, g: 3, b: 8 },
            DISPLAY_STYLE: 'glass',
            COLOR_MODE: 'multiStop',
            PALETTE_A: { r: 6, g: 20, b: 50 },
            PALETTE_B: { r: 60, g: 240, b: 200 },
            PALETTE_C: { r: 160, g: 110, b: 255 },
            COLOR_STOPS: [
                { position: 0, color: { r: 4, g: 12, b: 36 } },
                { position: 0.3, color: { r: 32, g: 220, b: 200 } },
                { position: 0.6, color: { r: 92, g: 108, b: 240 } },
                { position: 1, color: { r: 255, g: 120, b: 220 } }
            ],
            GRADIENT_SCALE: 0.78,
            MATERIAL_CONTRAST: 1.0,
            MATERIAL_SATURATION: 1.18,
            MATERIAL_EXPOSURE: 0.92,
            OUTPUT_GAIN: 1.04,
            TONE_MAPPING: 'aces',
            BLOOM_INTENSITY: 0.7,
            BLOOM_THRESHOLD: 0.7,
            ANAMORPHIC_BLOOM: 0.3,
            CHROMATIC_ABERRATION: 0.5,
            VELOCITY_DISTORTION: 0.32,
            CURL: 38,
            VISCOSITY: 0.18,
            TURBULENCE_AMOUNT: 9,
            TURBULENCE_SCALE: 5.0,
            ADVECTION_METHOD: 'maccormack',
            WIND_X: 8, WIND_Y: 0,
            EMITTER_RATE: 7,
            EMITTER_INTENSITY: 0.4,
            PARTICLES_ENABLED: true,
            PARTICLES_V2: true,
            PARTICLE_MAX_COUNT: 40000,
            PARTICLE_ARCHETYPE: 'magic',
            AUDIO_BINDING_MODE: 'ambient',
            AUDIO_FX_AMOUNT: 0.34
        },
        emitters: [
            { id: 'curl-l', type: 'spline', label: 'Curl L',
              x: 0.05, y: 0.32, x2: 0.32, y2: 0.78, x3: 0.6, y3: 0.18, x4: 0.95, y4: 0.66,
              segments: 30, color: '#2ce6c0', force: 0.1, radius: 0.25, spread: 0.32, pulse: 0.16 },
            { id: 'curl-r', type: 'spline', label: 'Curl R',
              x: 0.95, y: 0.68, x2: 0.62, y2: 0.22, x3: 0.32, y3: 0.84, x4: 0.05, y4: 0.36,
              segments: 30, color: '#9c70ff', force: 0.1, radius: 0.22, spread: 0.28, pulse: 0.12 }
        ],

    }
});

// --- Upgrade showcase presets (white-water, smoke, ocean) -----------------
Object.assign(presets, {
    breakingWave: {
        schemaVersion: 3,
        label: 'Breaking Wave',
        category: 'White-water',
        description: 'Advected foam, spray + bubble particles, splash bursts and crest sparkle.',
        tags: ['foam', 'spray', 'particles', 'whitewater'],
        performanceTier: 'high',
        requires: { particles: true, audio: 'optional' },
        // Clone of the proven full-frame 'aurora' look (verified to render),
        // with the velocity-coupled white-water foam + particle layer added.
        // The "breaking wave" identity comes from the foam/spray/sparkle, not a
        // recolor (recoloring triggered an elusive thin-dye visibility issue).
        config: {
            BACK_COLOR: { r: 1, g: 4, b: 9 },
            DISPLAY_STYLE: 'glass',
            COLOR_MODE: 'multiStop',
            PALETTE_A: { r: 5, g: 12, b: 34 },
            PALETTE_B: { r: 52, g: 245, b: 197 },
            PALETTE_C: { r: 140, g: 92, b: 255 },
            COLOR_STOPS: [
                { position: 0, color: { r: 5, g: 12, b: 34 } },
                { position: 0.22, color: { r: 28, g: 224, b: 196 } },
                { position: 0.48, color: { r: 96, g: 108, b: 255 } },
                { position: 0.76, color: { r: 255, g: 92, b: 210 } },
                { position: 1, color: { r: 255, g: 235, b: 166 } }
            ],
            COLOR_SOURCE_MIX: 0.34,
            GRADIENT_SCALE: 0.82,
            MATERIAL_CONTRAST: 1.05,
            MATERIAL_SATURATION: 1.12,
            MATERIAL_EXPOSURE: 0.72,
            MATERIAL_ROUGHNESS: 0.22,
            MATERIAL_SPECULAR: 0.58,
            MATERIAL_RIM: 0.36,
            FRESNEL_POWER: 1.9,
            OUTPUT_GAIN: 0.58,
            TONE_MAPPING: 'aces',
            CHROMATIC_ABERRATION: 0.4,
            LENS_DISTORTION: 0.03,
            VELOCITY_DISTORTION: 0.32,
            BLOOM: true,
            BLOOM_INTENSITY: 0.3,
            BLOOM_THRESHOLD: 0.85,
            ANAMORPHIC_BLOOM: 0.2,
            ANAMORPHIC_RATIO: 5.8,
            SUNRAYS: false,
            VIGNETTE: 0.22,
            FILM_GRAIN: 0.02,
            CURL: 38,
            VISCOSITY: 0.1,
            TURBULENCE_AMOUNT: 10,
            TURBULENCE_SCALE: 4.8,
            ADVECTION_METHOD: 'maccormack',
            WIND_X: 9,
            DENSITY_DISSIPATION: 0.6,
            FOAM_AMOUNT: 0.85,
            FOAM_ADVECTION: true,
            FOAM_VELOCITY_THRESHOLD: 140,
            FOAM_VORTICITY_WEIGHT: 1.2,
            FOAM_CURVATURE_WEIGHT: 0.8,
            FOAM_BUOYANCY: 18,
            SPLASH_THRESHOLD: 3000,
            SPLASH_FOAM: 0.8,
            SPARKLE_AMOUNT: 0.35,
            SPARKLE_SCALE: 110,
            PARTICLES_ENABLED: true,
            PARTICLE_FLOW: 1.0,
            PARTICLE_BRIGHTNESS: 1.3,
            PARTICLE_DENSITY: 20,
            PARTICLE_AMBIENT: 9000,
            PARTICLE_LIFETIME: 3.5,
            PARTICLE_GRAVITY: 0.06,
            PARTICLE_FOAM: 2,
            PARTICLE_SPRAY: 2,
            PARTICLE_BUBBLE: 0,
            PARTICLE_SPARK: 0,
            PARTICLE_SPLASH_BURST: 36,
            EMITTER_RATE: 12,
            EMITTER_INTENSITY: 0.5
        },
        emitters: [
            { id: 'left-wave', type: 'line', label: 'Left wave', x: 0.12, y: 0.22, x2: 0.18, y2: 0.78, color: '#34f5c5', force: 0.1, radius: 0.41 },
            { id: 'right-wave', type: 'line', label: 'Right wave', x: 0.88, y: 0.78, x2: 0.82, y2: 0.22, color: '#5cc8ff', force: 0.1, radius: 0.41 },
            { id: 'crown', type: 'radial', label: 'Crown', x: 0.5, y: 0.52, width: 0.34, segments: 15, color: '#bfeaff', force: 0.1, radius: 0.25, pulse: 0.25 }
        ]
    },
    campfireSmoke: {
        schemaVersion: 3,
        label: 'Campfire Smoke',
        category: 'Smoke',
        description: 'Buoyant, self-shadowed grey smoke rising from a warm base with drifting embers.',
        tags: ['smoke', 'temperature', 'particles'],
        performanceTier: 'medium',
        requires: { temperature: true, particles: true, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 4, g: 4, b: 6 },
            DISPLAY_STYLE: 'classic',
            BLOOM: true,
            BLOOM_INTENSITY: 0.35,
            BLOOM_THRESHOLD: 0.8,
            SUNRAYS: false,
            CURL: 26,
            VISCOSITY: 0.2,
            ADVECTION_METHOD: 'maccormack',
            TURBULENCE_MODE: 'curl',
            CURL_NOISE_AMOUNT: 600,
            CURL_NOISE_SCALE: 4,
            CURL_NOISE_SPEED: 0.4,
            TEMPERATURE_AMOUNT: 0.6,
            TEMPERATURE_SPLAT: 1.4,
            BUOYANCY_STRENGTH: 16,
            BUOYANCY_DIRECTION: 1.57,
            SMOKE_ENABLED: true,
            SMOKE_SPLAT: 1.0,
            SMOKE_DISSIPATION: 0.04,
            SMOKE_BUOYANCY: 70,
            SMOKE_SHADOW: 0.85,
            SMOKE_AMOUNT: 1.4,
            SMOKE_COLOR: { r: 200, g: 198, b: 205 },
            SMOKE_LIGHT: { x: -0.4, y: 0.7 },
            PARTICLES_ENABLED: true,
            PARTICLE_SIZE: 1.0,
            PARTICLE_LIFETIME: 1.8,
            PARTICLE_GRAVITY: 0.08,
            PARTICLE_FOAM: 0,
            PARTICLE_SPRAY: 0,
            PARTICLE_BUBBLE: 0,
            PARTICLE_SPARK: 2,
            PARTICLE_SPLASH_BURST: 0,
            EMITTER_RATE: 14,
            EMITTER_INTENSITY: 0.5
        },
        emitters: [
            { id: 'fire', type: 'area', label: 'Fire base', x: 0.5, y: 0.18, width: 0.16, height: 0.06, segments: 20, direction: 1.57, color: '#ff8a3c', force: 0.1, radius: 0.25, pulse: 0.5 }
        ]
    },
    openOcean: {
        schemaVersion: 3,
        label: 'Open Ocean',
        category: 'Ocean',
        description: 'Gerstner water surface with sky reflection, caustics and crest foam; drag to make wakes.',
        tags: ['ocean', 'water', 'surface'],
        performanceTier: 'high',
        requires: { particles: false, audio: 'optional' },
        config: {
            RENDER_MODE: 'ocean',
            BACK_COLOR: { r: 6, g: 20, b: 36 },
            CURL: 30,
            VISCOSITY: 0.3,
            ADVECTION_METHOD: 'maccormack',
            PRESSURE_SOLVER: 'multigrid',
            FOAM_AMOUNT: 0.9,
            FOAM_ADVECTION: true,
            FOAM_VELOCITY_THRESHOLD: 90,
            OCEAN_WAVE_SCALE: 2.6,
            OCEAN_STEEPNESS: 1.0,
            OCEAN_CHOPPINESS: 0.55,
            OCEAN_FLOW: 0.7,
            OCEAN_WATER_COLOR: { r: 16, g: 84, b: 124 },
            OCEAN_DEEP_COLOR: { r: 3, g: 16, b: 34 },
            OCEAN_SKY_COLOR: { r: 150, g: 192, b: 236 },
            OCEAN_SUN: { x: -0.4, y: 0.55 },
            OCEAN_FRESNEL: 2.6,
            OCEAN_CAUSTICS: 0.4,
            OCEAN_FOAM: 0.9,
            EMITTER_RATE: 5,
            EMITTER_INTENSITY: 0.4
        },
        emitters: [
            { id: 'swell', type: 'line', label: 'Swell', x: 0.15, y: 0.4, x2: 0.85, y2: 0.6, color: '#7fc8ff', force: 0.1, radius: 0.41, spread: 0.5 }
        ]
    },
    grayScottCoral: {
        schemaVersion: 3,
        label: 'Gray-Scott Coral',
        category: 'Reaction-Diffusion',
        description: 'Self-organising coral / labyrinth chemistry, embossed and flowing with the fluid. Drag to seed reactant.',
        tags: ['reaction-diffusion', 'chemistry', 'pattern'],
        performanceTier: 'high',
        requires: { particles: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 2, g: 6, b: 14 },
            DISPLAY_STYLE: 'classic',
            DENSITY_DISSIPATION: 1.4,
            CURL: 12,
            BLOOM: true,
            BLOOM_INTENSITY: 0.4,
            RD_ENABLED: true,
            RD_MODEL: 'grayScott',
            RD_FEED: 0.055,
            RD_KILL: 0.062,
            RD_DU: 0.16,
            RD_DV: 0.08,
            RD_SUBSTEPS: 14,
            RD_REACTION_RATE: 1,
            RD_FLOW_COUPLING: 0.35,
            RD_COUPLE: 1.0,
            RD_DISSOLVE: 1.4,
            RD_TINT: 0.9,
            RD_OVERLAY: false,
            RD_COLOR_A: { r: 6, g: 16, b: 38 },
            RD_COLOR_B: { r: 90, g: 220, b: 255 },
            EMITTER_RATE: 6,
            EMITTER_INTENSITY: 0.5
        },
        emitters: [
            { id: 'stir', type: 'radial', label: 'Stir', x: 0.5, y: 0.5, width: 0.3, segments: 14, color: '#5cc8ff', force: 0.1, radius: 0.31, pulse: 0.3 }
        ]
    },
    dissolvingInk: {
        schemaVersion: 3,
        label: 'Dissolving Ink',
        category: 'Dissolution',
        description: 'Coloured ink that diffuses, mixes with the turbulence, sinks and fades — the full dissolution stack.',
        tags: ['dissolution', 'diffusion', 'mixing', 'ink'],
        performanceTier: 'medium',
        requires: { particles: false, audio: 'optional' },
        config: {
            BACK_COLOR: { r: 4, g: 6, b: 12 },
            DISPLAY_STYLE: 'watercolor',
            COLOR_MODE: 'multiStop',
            ADVECTION_METHOD: 'maccormack',
            CURL: 24,
            VISCOSITY: 0.2,
            DENSITY_DISSIPATION: 0.4,
            BLOOM: true,
            BLOOM_INTENSITY: 0.35,
            DISSOLVE_ENABLED: true,
            DISSOLVE_DECAY: 0.25,
            DISSOLVE_DIFFUSE: 2.5,
            DISSOLVE_MIX: 3.5,
            DISSOLVE_EVAPORATE: 0.02,
            DISSOLVE_SETTLE: 0.6,
            ABSORPTION: 0.6,
            ABSORPTION_EXTINCTION: { x: 0.2, y: 0.5, z: 0.9 },
            EMITTER_RATE: 6,
            EMITTER_INTENSITY: 0.5
        },
        emitters: [
            { id: 'drip-a', type: 'point', label: 'Ink drip A', x: 0.4, y: 0.7, color: '#3aa0ff', force: 0.1, radius: 0.31, pulse: 0.4 },
            { id: 'drip-b', type: 'point', label: 'Ink drip B', x: 0.62, y: 0.66, color: '#ff5cbe', force: 0.1, radius: 0.31, pulse: 0.5 }
        ]
    }
});

export class PresetManager {
    constructor(config, emitterSystem) {
        this.config = config;
        this.emitterSystem = emitterSystem;
        this.particleSystem = null;
        this.defaults = structuredCloneConfig(config);
    }

    apply(id, { resize } = {}) {
        const preset = migratePresetToV3(presets[id] || presets.aurora);
        const warnings = validatePreset(preset);
        publishPresetWarnings(warnings);
        Object.entries(this.defaults).forEach(([key, value]) => {
            this.config[key] = cloneConfigValue(value);
        });
        Object.entries(preset.config).forEach(([key, value]) => {
            this.config[key] = cloneConfigValue(value);
        });
        this.config.ACTIVE_PRESET = id;
        this.emitterSystem.setEmitters(preset.emitters);
        this.emitterSystem.setGroups?.(preset.emitterGroups || []);   // E8
        resize?.(true);
        document.documentElement.dataset.fluidPreset = id;
        document.documentElement.dataset.fluidPresetCategory = preset.category || 'Uncategorized';
        document.documentElement.dataset.fluidPresetTier = preset.performanceTier || 'unknown';
    }

    snapshot(name = 'Custom') {
        return {
            schemaVersion: 3,
            name,
            category: 'Custom',
            tags: [],
            performanceTier: this.config.QUALITY_PROFILE || 'custom',
            requires: {
                temperature: this.config.TEMPERATURE_AMOUNT > 0,
                audio: this.config.AUDIO_ENABLED ? 'optional' : 'disabled'
            },
            config: structuredCloneConfig(this.config),
            emitters: this.emitterSystem.emitters.map(serializeEmitter),
            emitterGroups: this.emitterSystem.serializeGroups?.() || []   // E8
        };
    }

    applySnapshot(snapshot, { resize } = {}) {
        if (!snapshot || !Array.isArray(snapshot.emitters) || !snapshot.config) {
            throw new Error('Invalid preset snapshot.');
        }

        const migrated = migratePresetToV3(snapshot);

        Object.entries(migrated.config).forEach(([key, value]) => {
            if (Object.hasOwn(this.config, key)) {
                this.config[key] = cloneConfigValue(value);
            }
        });
        this.config.ACTIVE_PRESET = 'custom';
        this.emitterSystem.setEmitters(migrated.emitters);
        this.emitterSystem.setGroups?.(migrated.emitterGroups || snapshot.emitterGroups || []);   // E8
        resize?.(true);
        document.documentElement.dataset.fluidPreset = 'custom';
        publishPresetWarnings(validatePreset(snapshot));
    }

    applyVisualSafety({ resize } = {}) {
        Object.assign(this.config, {
            ACTIVE_PRESET: 'custom',
            DISPLAY_STYLE: 'gradient',
            GRADIENT_SCALE: 0.58,
            GRADIENT_OFFSET: -0.04,
            MATERIAL_CONTRAST: 0.95,
            MATERIAL_SATURATION: 0.78,
            MATERIAL_EXPOSURE: 0.72,
            OUTPUT_GAIN: 0.88,
            CHROMATIC_ABERRATION: 0.2,
            LENS_DISTORTION: 0.02,
            VELOCITY_DISTORTION: 0.2,
            BLOOM: true,
            BLOOM_INTENSITY: 0.42,
            BLOOM_THRESHOLD: 0.82,
            SUNRAYS: true,
            SUNRAYS_WEIGHT: 0.32,
            EMITTER_RATE: 7,
            EMITTER_INTENSITY: 0.36,
            EMITTER_AUDIO_REACTIVITY: 0.28
        });
        resize?.(true);
        document.documentElement.dataset.fluidPreset = 'safe-visual';
    }
}

export function validatePreset(preset) {
    const warnings = [];

    if (!preset.schemaVersion && !preset.version) {
        warnings.push('missing schemaVersion');
    }

    if (!preset.label && !preset.name) {
        warnings.push('missing label');
    }

    if (!Array.isArray(preset.emitters) || preset.emitters.length === 0) {
        warnings.push('missing emitters');
    }

    if (!preset.config || typeof preset.config !== 'object') {
        warnings.push('missing config');
    }

    if ((preset.schemaVersion || preset.version || 0) < 3) {
        warnings.push('legacy schema migrated to v3');
    }


    (preset.emitters || []).forEach((emitter, index) => {
        if (!emitter.type) {
            warnings.push(`emitter ${index + 1} missing type`);
        }

        if (emitter.radius !== undefined && (emitter.radius <= 0 || emitter.radius > 1)) {
            warnings.push(`${emitter.label || emitter.id || `emitter ${index + 1}`} radius out of range`);
        }

        if (emitter.type === 'brush' && (!Array.isArray(emitter.points) || emitter.points.length < 2)) {
            warnings.push(`${emitter.label || emitter.id || `emitter ${index + 1}`} brush path needs at least two points`);
        }

        if (emitter.type === 'vector' && (!Array.isArray(emitter.points) || emitter.points.length < 3)) {
            warnings.push(`${emitter.label || emitter.id || `emitter ${index + 1}`} vector shape needs at least three vertices`);
        }

        if (emitter.type === 'svg' && (!Array.isArray(emitter.points) || emitter.points.length < 2)) {
            warnings.push(`${emitter.label || emitter.id || `emitter ${index + 1}`} SVG path needs at least two nodes`);
        }

        if (emitter.type === 'text' && !String(emitter.text || '').trim()) {
            warnings.push(`${emitter.label || emitter.id || `emitter ${index + 1}`} text emitter needs text`);
        }
    });

    return warnings;
}

function publishPresetWarnings(warnings) {
    document.documentElement.dataset.fluidPresetWarnings = warnings.join('|');
}

function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function structuredCloneConfig(config) {
    return Object.fromEntries(
        Object.entries(config).map(([key, value]) => [
            key,
            cloneConfigValue(value)
        ])
    );
}

export function migratePresetToV3(preset) {
    const migrated = {
        ...preset,
        schemaVersion: 3,
        config: structuredCloneConfig(preset.config || {}),
        emitters: (preset.emitters || []).map((emitter) => ({ ...emitter }))
    };

    migrated.requires = {
        temperature: Boolean((migrated.config.TEMPERATURE_AMOUNT || 0) > 0 || migrated.requires?.temperature),
        audio: migrated.requires?.audio || 'optional'
    };

    return migrated;
}



function cloneConfigValue(value) {
    if (Array.isArray(value)) {
        return value.map((entry) => cloneConfigValue(entry));
    }

    if (isPlainObject(value)) {
        return Object.fromEntries(
            Object.entries(value).map(([key, child]) => [key, cloneConfigValue(child)])
        );
    }

    return value;
}

function serializeEmitter(emitter) {
    // Strip transient runtime fields (underscore-prefixed by convention, e.g.
    // _audioEnv, _imageHandle) so they never leak into saved snapshots/presets.
    const persistable = Object.fromEntries(
        Object.entries(emitter).filter(([key]) => !key.startsWith('_'))
    );
    return {
        ...persistable,
        color: typeof emitter.color?.getHexString === 'function'
            ? `#${emitter.color.getHexString()}`
            : emitter.color
    };
}
