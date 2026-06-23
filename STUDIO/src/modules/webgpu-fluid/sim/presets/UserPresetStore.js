// UserPresetStore — localStorage-backed user preset library.
//
// Stores snapshots produced by PresetManager.snapshot(name) keyed by a
// stable id (slug of the name + timestamp). Survives reloads. Independent
// of the built-in `presets` dict; built-ins remain read-only.
//
// API
//   const store = new UserPresetStore();
//   store.list();                           -> [{ id, snapshot }]
//   store.save(snapshot);                   -> id
//   store.apply(id, presetManager, opts);   -> applies via PresetManager.applySnapshot
//   store.remove(id);                       -> boolean
//   store.setDefault(id);                   -> persists default id
//   store.getDefault();                     -> id|null
//   store.exportAll();                      -> Blob (entire library, JSON)
//
// Storage key:   'fluid-user-presets-v1' = { [id]: snapshot, ... }
// Default key:   'fluid-default-preset-v1' = id | ''

const LS_KEY = 'fluid-user-presets-v1';
const LS_DEFAULT = 'fluid-default-preset-v1';

export class UserPresetStore {
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
            console.warn('[UserPresetStore] load failed:', error);
            return {};
        }
    }

    _persist() {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(this.store));
        } catch (error) {
            console.error('[UserPresetStore] persist failed:', error);
            alert(`Could not save preset — localStorage error: ${error.message || error}`);
        }
    }

    list() {
        return Object.entries(this.store)
            .map(([id, snapshot]) => ({ id, snapshot }))
            .sort((a, b) => (b.snapshot.savedAt || 0) - (a.snapshot.savedAt || 0));
    }

    has(id) {
        return Object.hasOwn(this.store, id);
    }

    get(id) {
        return this.store[id] || null;
    }

    save(snapshot, opts = {}) {
        if (!snapshot || typeof snapshot !== 'object') {
            throw new Error('snapshot must be an object');
        }
        const id = opts.id || generateId(snapshot.name || 'preset');
        this.store[id] = {
            ...snapshot,
            savedAt: Date.now()
        };
        this._persist();
        return id;
    }

    apply(id, presetManager, opts = {}) {
        const snapshot = this.get(id);
        if (!snapshot) throw new Error(`User preset not found: ${id}`);
        if (typeof presetManager?.applySnapshot !== 'function') {
            throw new Error('PresetManager.applySnapshot is required to apply user presets');
        }
        presetManager.applySnapshot(snapshot, opts);
        if (presetManager.config) presetManager.config.ACTIVE_PRESET = id;
    }

    remove(id) {
        if (!Object.hasOwn(this.store, id)) return false;
        delete this.store[id];
        this._persist();
        if (this.getDefault() === id) this.setDefault('');
        return true;
    }

    rename(id, newName) {
        const snapshot = this.store[id];
        if (!snapshot) return false;
        snapshot.name = newName;
        snapshot.savedAt = Date.now();
        this._persist();
        return true;
    }

    setDefault(id) {
        try {
            if (id) localStorage.setItem(LS_DEFAULT, id);
            else    localStorage.removeItem(LS_DEFAULT);
        } catch (error) {
            console.warn('[UserPresetStore] setDefault failed:', error);
        }
    }

    getDefault() {
        try {
            return localStorage.getItem(LS_DEFAULT) || '';
        } catch (_) {
            return '';
        }
    }

    exportAll() {
        const payload = {
            schemaVersion: 1,
            exportedAt: new Date().toISOString(),
            presets: this.store
        };
        return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    }

    importAll(parsed, { replace = false } = {}) {
        if (!parsed || typeof parsed !== 'object') throw new Error('Invalid import payload');
        const incoming = parsed.presets && typeof parsed.presets === 'object' ? parsed.presets : parsed;
        if (replace) this.store = {};
        let count = 0;
        for (const [id, snapshot] of Object.entries(incoming)) {
            if (!snapshot || typeof snapshot !== 'object') continue;
            this.store[id] = snapshot;
            count += 1;
        }
        this._persist();
        return count;
    }
}

function generateId(name) {
    const slug = String(name).toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 32) || 'preset';
    return `${slug}-${Date.now().toString(36)}`;
}
