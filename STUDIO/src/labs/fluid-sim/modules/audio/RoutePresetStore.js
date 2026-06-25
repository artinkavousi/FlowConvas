// RoutePresetStore — localStorage-backed user library for matrix route sets.
//
// Mirrors UserPresetStore but for routes only. Each entry is a named array
// of route objects identical in shape to those in routePresets.js. The user
// can save the current matrix routes by name, then re-apply later via the
// AudioPanel Mode dropdown (the dropdown is auto-extended with user entries).
//
// Storage key: 'fluid-user-route-presets-v1'
//   { [id]: { name, savedAt, routes } }

const LS_KEY = 'fluid-user-route-presets-v1';

export class RoutePresetStore {
    constructor() {
        this.store = this._load();
    }

    _load() {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (error) {
            console.warn('[RoutePresetStore] load failed:', error);
            return {};
        }
    }

    _persist() {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(this.store));
        } catch (error) {
            console.error('[RoutePresetStore] persist failed:', error);
            alert(`Could not save route preset — ${error.message || error}`);
        }
    }

    /** Returns [{ id, name, savedAt, routes }] newest first. */
    list() {
        return Object.entries(this.store)
            .map(([id, entry]) => ({ id, ...entry }))
            .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    }

    has(id) { return Object.hasOwn(this.store, id); }
    get(id) { return this.store[id] || null; }

    save(name, routes) {
        const cleanName = String(name || 'Untitled').trim() || 'Untitled';
        const id = `user-${slug(cleanName)}-${Date.now().toString(36)}`;
        this.store[id] = {
            name: cleanName,
            savedAt: Date.now(),
            // Strip route follower references — they're per-route runtime state.
            routes: routes.map((r) => ({
                id: r.id,
                label: r.label,
                source: r.source,
                target: r.target,
                mode: r.mode,
                range: Array.isArray(r.range) ? [...r.range] : [0, 1],
                curve: r.curve ? { ...r.curve } : { type: 'linear' },
                attack: r.attack, release: r.release,
                gate: r.gate, polarity: r.polarity,
                enabled: r.enabled, mute: r.mute, solo: r.solo
            }))
        };
        this._persist();
        return id;
    }

    remove(id) {
        if (!Object.hasOwn(this.store, id)) return false;
        delete this.store[id];
        this._persist();
        return true;
    }

    rename(id, newName) {
        if (!this.store[id]) return false;
        this.store[id].name = String(newName).trim() || this.store[id].name;
        this._persist();
        return true;
    }

    /**
     * Produce options object suitable for Tweakpane dropdown.
     * Returns { 'User · My Bass': 'user-…', ... }
     */
    asDropdownOptions(prefix = 'User · ') {
        const out = {};
        for (const { id, name } of this.list()) {
            out[`${prefix}${name}`] = id;
        }
        return out;
    }
}

function slug(name) {
    return String(name).toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 32) || 'preset';
}
