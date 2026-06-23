// Emitter type registry — single source of truth for "what types exist".
//
// Each entry registered via registerType({ id, label, defaults, sampleSplats }):
//   id         - string, matches emitter.type ('point', 'line', etc.)
//   label      - display name for the UI
//   defaults   - object merged into newly-created emitters of this type
//                (read by EmitterSystem.addEmitter)
//   sampleSplats(emitter, intensity, phase, audio) -> Array<splat>
//                produces the splats this emitter emits for one frame step
//
// Optional:
//   normalize(definition) - extra post-normalize hook called by the orchestrator
//
// Adding a new type = create one file under EmitterTypes/, call registerType
// at module load, and ensure it's imported from EmitterTypes/index.js.

const TYPES = new Map();

export function registerType(spec) {
    if (!spec?.id || typeof spec.sampleSplats !== 'function') {
        throw new Error('[EmitterTypes] registerType requires { id, sampleSplats }');
    }
    TYPES.set(spec.id, spec);
}

export function getType(id) { return TYPES.get(id) || null; }
export function hasType(id) { return TYPES.has(id); }
export function getAllTypes() { return [...TYPES.values()]; }
export function getTypeIds() { return [...TYPES.keys()]; }

export function getTypeOptions() {
    // Suitable for a Tweakpane dropdown: { Label: 'id', ... }
    const out = {};
    for (const t of TYPES.values()) out[t.label] = t.id;
    return out;
}
