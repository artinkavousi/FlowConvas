// MacroStore — user-defined linear combinations of audio sources.
//
// A macro is a tiny formula evaluated per-frame against the AudioFrame.
// Each macro produces a single 0..1 scalar exposed as a matrix source via
// path `macro.<id>` (e.g. `macro.drop`). Routes can target these like any
// built-in source.
//
// Shape:
//   { id: 'drop',
//     name: 'Drop',
//     terms: [
//       { source: 'bands.bass', weight: 0.7 },
//       { source: 'bands.sub',  weight: 0.5 },
//       { source: 'bands.air',  weight: -0.2 }
//     ],
//     bias: 0,           // additive
//     clamp: true        // clamp result to 0..1
//   }
//
// Persisted under 'fluid-user-macros-v1' = { [id]: macro }.

const LS_KEY = 'fluid-user-macros-v1';

export class MacroStore {
    constructor() {
        this.store = this._load();
        this._cache = new Map();
    }
    _load() {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (_) { return {}; }
    }
    _persist() {
        try { localStorage.setItem(LS_KEY, JSON.stringify(this.store)); } catch (_) {}
    }

    list() {
        return Object.values(this.store).sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
    }
    has(id) { return Object.hasOwn(this.store, id); }
    get(id) { return this.store[id] || null; }

    save(macro) {
        if (!macro?.id) throw new Error('Macro requires an id');
        this.store[macro.id] = {
            id: macro.id,
            name: macro.name || macro.id,
            terms: Array.isArray(macro.terms) ? macro.terms.map((t) => ({
                source: String(t.source || ''),
                weight: Number.isFinite(t.weight) ? t.weight : 0
            })) : [],
            bias: Number.isFinite(macro.bias) ? macro.bias : 0,
            clamp: macro.clamp !== false
        };
        this._persist();
        return macro.id;
    }
    remove(id) {
        if (!Object.hasOwn(this.store, id)) return false;
        delete this.store[id];
        this._persist();
        return true;
    }

    /**
     * Evaluate every macro for the current AudioFrame, populating
     * frame.macro = { id: value, ... } so the matrix dot-path resolver
     * sees `macro.drop` and produces the live value.
     */
    evaluateInto(frame) {
        if (!frame) return;
        const out = {};
        for (const macro of Object.values(this.store)) {
            let acc = macro.bias || 0;
            for (const term of macro.terms || []) {
                const v = resolveSourceValue(frame, term.source);
                acc += v * (term.weight || 0);
            }
            if (macro.clamp) acc = acc < 0 ? 0 : acc > 1 ? 1 : acc;
            out[macro.id] = acc;
        }
        frame.macro = out;
    }
}

function resolveSourceValue(frame, path) {
    if (!path) return 0;
    if (path === 'beat.pulse') return frame.beat?.pulse || 0;
    if (path === 'beat.edge')  return frame.beat?.edge ? 1 : 0;
    const parts = path.split('.');
    let node = frame;
    for (const p of parts) {
        if (node == null) return 0;
        node = node[p];
    }
    if (typeof node === 'boolean') return node ? 1 : 0;
    return Number.isFinite(node) ? node : 0;
}
