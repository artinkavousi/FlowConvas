// Reaction-diffusion model registry.
//
// The transport half of every model (Laplacian diffusion + advection by the
// fluid velocity) is shared, implemented once in `createReactionDiffusionPass`
// in ../passes.js. Only the *reaction term* differs per model, selected at
// render time by the integer `model` uniform. This registry supplies the
// JS-side metadata: the model index the shader switches on, a label for the
// GUI, sensible default parameters (interpreted per-model — see below), and a
// default colour pair for the composite render.
//
// Add a new family by (1) adding an entry here, (2) adding a `select()` branch
// in createReactionDiffusionPass keyed on the same index. One concept, two
// touch points — the EmitterTypes/ registry pattern.

export const REACTION_MODELS = {
    grayScott: {
        index: 0,
        label: 'Gray-Scott (coral / worms)',
        // feed/kill are the classic F/k; Du/Dv the diffusion rates.
        defaults: { RD_FEED: 0.055, RD_KILL: 0.062, RD_DU: 0.16, RD_DV: 0.08 },
        // V display range — maps the V channel to a 0..1 pattern signal so the
        // dye coupling reads the structure regardless of the model's absolute
        // value range.
        vRange: [0.08, 0.35],
        colorA: { r: 6, g: 16, b: 38 },
        colorB: { r: 90, g: 220, b: 255 }
    },
    giererMeinhardt: {
        index: 1,
        label: 'Gierer-Meinhardt (spots / skin)',
        // feed -> source rho, kill -> decay mu. Steady state U≈(feed+1)/kill,
        // so kill≈1 keeps the activator in range while Dv≫Du drives Turing spots.
        defaults: { RD_FEED: 0.02, RD_KILL: 1.0, RD_DU: 0.04, RD_DV: 0.18 },
        vRange: [0.4, 1.8],
        colorA: { r: 30, g: 6, b: 4 },
        colorB: { r: 255, g: 196, b: 90 }
    },
    fitzHughNagumo: {
        index: 2,
        label: 'FitzHugh-Nagumo (excitable pulses)',
        // feed -> stimulus I, kill -> recovery coupling b.
        defaults: { RD_FEED: 0.0, RD_KILL: 0.8, RD_DU: 0.18, RD_DV: 0.09 },
        vRange: [-0.1, 0.5],
        colorA: { r: 4, g: 8, b: 30 },
        colorB: { r: 120, g: 255, b: 170 }
    },
    brusselator: {
        index: 3,
        label: 'Brusselator (oscillating targets)',
        // feed -> A, kill -> B. Oscillatory just above the Hopf threshold
        // (B > 1+A²=2); B=2.1 stays bounded while still forming wave structure.
        defaults: { RD_FEED: 1.0, RD_KILL: 2.1, RD_DU: 0.06, RD_DV: 0.16 },
        vRange: [1.95, 2.25],
        colorA: { r: 30, g: 4, b: 24 },
        colorB: { r: 255, g: 120, b: 210 }
    },
    schnakenberg: {
        index: 4,
        label: 'Schnakenberg (spots / stripes)',
        // feed -> a, kill -> b.
        defaults: { RD_FEED: 0.1, RD_KILL: 0.9, RD_DU: 0.05, RD_DV: 0.2 },
        vRange: [0.85, 1.5],
        colorA: { r: 6, g: 22, b: 14 },
        colorB: { r: 150, g: 255, b: 120 }
    },
    ginzburgLandau: {
        index: 5,
        label: 'Ginzburg-Landau (spiral turbulence)',
        // feed -> dispersion b, kill -> nonlinear phase c. Du scales the
        // complex Laplacian (Dv unused).
        defaults: { RD_FEED: 1.5, RD_KILL: 1.2, RD_DU: 0.2, RD_DV: 0.2 },
        vRange: [-0.3, 0.6],
        colorA: { r: 8, g: 6, b: 30 },
        colorB: { r: 180, g: 160, b: 255 }
    }
};

export const DEFAULT_REACTION_MODEL = 'grayScott';

export function getReactionModelIndex(id) {
    return REACTION_MODELS[id]?.index ?? 0;
}

// [lo, hi] mapping the V channel to a 0..1 pattern signal for the dye coupling.
export function getReactionModelRange(id) {
    return REACTION_MODELS[id]?.vRange ?? [0.08, 0.35];
}

// { label: id } map for the Tweakpane dropdown.
export function createReactionModelOptions() {
    const options = {};
    for (const [id, model] of Object.entries(REACTION_MODELS)) {
        options[model.label] = id;
    }
    return options;
}
